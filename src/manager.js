var config = require('../config.json');
var log4js = require('log4js');
var log = log4js.getLogger("manager");
var restManager = require('./restmanager');
var trend = require('./trend');
var monk = require('monk');
var Q = require('q');
require('q-foreach')(Q);

var moment = require('moment');
var db = monk(config.dbhost+":"+config.dbport+'/'+config.dbname);

var dbApps = db.get('apps');
dbApps.index({'id':1});

var dbTiers = db.get('tiers');
dbTiers.index({'appid':1,'id':1});

var dbTierMetric = db.get('tierminmetric');
dbTierMetric.index({'trend':1,'factor':-1});
dbTierMetric.index({'appid':1,'id':1});

var dbTierWeekMetric = db.get('tierweekmetric');
dbTierWeekMetric.index({'appid':1,'id':1});

var dbErrorCodes = db.get('errorcodes');
dbErrorCodes.index({'appid':1,'guid':1,'threadid':1});
dbErrorCodes.index({'code':1,'date':1});

var dbErrorSummary = db.get('errorsummary');
dbErrorSummary.index({'appid':1,'guid':1,'threadid':1});
dbErrorSummary.index({'code':1});

var dbBTs = db.get("bts");
var dbBTErrorIDException = db.get("bterroridexceptions");
var dbBTErrors = db.get('bterrors');
dbBTErrors.index("btid errorid", { unique: true });
var dbBTErrorSummary = db.get('bterrorsummary');
dbBTErrorSummary.index("btid errorid guid", { unique: true });

var exception_min_average_lower_limit = config.exception_min_average_suspects_must_be_greater_than;

exports.close = function(){
	monk.close();
} 

exports.initApplications = function(){
	var whitelist = config.whitelist;
	var controller = config.controller;
	restManager.getAppJson(controller,function(response){
		var controllerUrl;
		if(config.https){
			controllerUrl = "https://"+controller;
		}else{
			controllerUrl = "http://"+controller;
		}
		
		japps = JSON.parse(response);
		japps.forEach(function(app)  {
			if(!whitelist || whitelist.length==0 || whitelist.indexOf(app.name) > -1){
				log.info("tracking app :"+app.name);
				var appRecord = { id:app.id, name : app.name,controller : controller,controller_url : controllerUrl} ;
				dbApps.find({"id":app.id}, function(err, docs){
					var doc = docs[0];
					if(!doc){
						dbApps.insert(appRecord);
					}else{
						dbApps.update({ _id: doc._id }, { $set: { name: app.name} });
					}
				});
			}
		});
	});
}

exports.fetchApps = function(callback){
	var search = dbApps.find();
	search.each(function (doc) {
		callback(doc);
	});
}

exports.fetchApp = function(appid){
	var deferred = Q.defer();
	dbApps.find({"id":parseInt(appid)}, function (err, apps) {
		if(err){
			deferred.reject(err);
		}else{
			deferred.resolve(apps[0]);
		}
	});
	return deferred.promise;
}

exports.fetchTiers = function(callback){
	var search = dbTiers.find();
	search.each(function (doc) {
		callback(doc);
	});
}

exports.fetchTier = function(appid,tierid){
	log.info("fetchTier "+appid+" "+tierid);
	var deferred = Q.defer();
	dbTiers.find({ "appid":appid,"id":tierid}, function (err, tiers) {
		if(err){
			deferred.reject(err);
		}else{
			log.info("resolving :"+JSON.stringify(tiers[0]));
			deferred.resolve(tiers[0]);
		}
	});
	return deferred.promise;
}



exports.initTiers = function(){
	exports.fetchApps(function(app){
		restManager.getTiersJson(app,function(response){
			jtiers = JSON.parse(response);
			jtiers.forEach(function(tier)  {
				var tierRecord = { "appid":app.id,"id":tier.id, "name": tier.name, "appname":app.name,"controller":app.controller,"controller_url":app.controller_url} ;
				dbTiers.find({"appid":app.id,"id":tier.id}, function(err, tiers){
					var tier = tiers[0];
					if(!tier){
						log.info("inserted tier :"+app.name+" : "+JSON.stringify(tierRecord));
						dbTiers.insert(tierRecord);
					}else{
						dbTiers.update({ _id: tier._id }, { $set: { "name": tier.name,"appname":app.name} });
					}
				});
			});
		});
	});
}

exports.initBusinessTransactions = function(){
	exports.fetchApps(function(app){
		restManager.fetchBusinessTransactions(app,function(response){
			bts = JSON.parse(response);
			bts.forEach(function(bt)  {
				var btRecord = { "appid":app.id,"id":bt.id, "name": bt.name} ;
				dbBTs.find({"appid":app.id,"id":bt.id}, function(err, results){
					var btRec = results[0];
					if(!btRec){
						dbBTs.insert(btRecord);
					}else{
						dbBTs.update({ _id: btRec._id }, { $set: { "name": bt.name} });
					}
				});
			});
		});
	});
}

exports.fetchBusinessTransaction = function(appid,id){
	var deferred = Q.defer();
	dbBTs.find({"appid":parseInt(appid),"id":parseInt(id)}, function (err, bts) {
		if(err){
			deferred.reject(err);
		}else{
			deferred.resolve(bts[0]);
		}
	});
	return deferred.promise;
}

exports.fetchDbTierMetrics = function(){
	var deferred = Q.defer();
	dbTierMetric.find({}, function (err, metrics) {
		if(err){
			deferred.reject(err);
		}else{
			deferred.resolve(metrics);
		}
	});
	return deferred.promise;
}

exports.deleteMetricRecord = function(metric){
	dbTierMetric.remove({"appid": metric.appid, "id": metric.id});
}

exports.getMinMetrics = function(dbTierMetric){
	return dbTierMetric.minmetrics[0].metricValues;
}

exports.getWeekMetrics = function(dbTierMetric){
	return dbTierMetric.weekmetrics[0].metricValues;
}

exports.getWeekMetricsRollupValue = function(dbTierMetric){
	return dbTierMetric.weekmetric[0].metricValues[0].value;
}

exports.toString = function(Obj){
	return JSON.stringify(Obj);
}

exports.updateDBTierMinMetric = function(dbTierMinMetric){
	//log.info("updating "+exports.toString(dbTierMinMetric));
	dbTierMetric.update({_id: dbTierMinMetric._id},{$set : dbTierMinMetric});
}

exports.getTrendingMetrics = function(profile){
	var deferred = Q.defer();
	
	var query = {"trend":"T"};
	if(profile){
		var appIDs = [];
		profile.split(',').forEach(function(appid){
			appIDs.push(parseInt(appid));
		});
		query = { trend:"T",appid:{ $in:appIDs} }; 
	}
	
	dbTierMetric.find(query, function (err, metrics) {
		if(err){
			deferred.reject(err);
		}else{
			deferred.resolve(metrics);
		}
	});
	return deferred.promise;
}

exports.getMinuteMetricsValues = function(appid, tierid, callback){
	var deferred = Q.defer();
	dbTierMetric.find({"appid": appid,"id":tierid}, function (err, metrics) {
		if(err){
			deferred.reject(err);
		}else{
			deferred.resolve(metrics[0].minmetrics[0].metricValues);
		}
	});
	return deferred.promise;
}

exports.getDBTierMetric = function(appid, tierid, callback){
	var deferred = Q.defer();
	dbTierMetric.find({"appid": appid,"id":tierid}, function (err, data) {
		if(err){
			deferred.reject(err);
		}else{
			deferred.resolve(data[0]);
		}
	});
	return deferred.promise;
}


exports.getMinuteMetrics = function(appid, tierid, callback){
	var deferred = Q.defer();
	dbTierMetric.find({"appid": appid,"id":tierid}, function (err, metrics) {
		if(err){
			deferred.reject(err);
		}else{
			deferred.resolve(metrics[0]);
		}
	});
	return deferred.promise;
}

exports.getWeeklyMetrics = function(appid, tierid, callback){
	var deferred = Q.defer();
	dbTierWeekMetric.find({"appid": appid,"id":tierid}, function (err, metrics) {
		if(err){
			deferred.reject(err);
		}else{
			deferred.resolve(metrics[0]);
		}
	});
	return deferred.promise;
}

exports.updateMinMetrics = function(callback){
	log.info("fetching minute metrics");
	exports.fetchTiers(function(tier){
		//get metrics for last configured mins
		restManager.getTierMinMetric(tier,function(response){
			if(response) {
				log.info(" response :"+JSON.stringify(response));
				var data = JSON.parse(response);
				if(data && data[0] && data[0].metricValues && data[0].metricValues.length > 0 ){
					//log.info("app :"+tier.appid+" tier :"+tier.id);
					var tierMetric = {"appid": tier.appid, "id": tier.id, "minmetrics": data, "appname":tier.appname,"tiername":tier.name,"controller_url":tier.controller_url};
					dbTierMetric.find({"appid": tier.appid, "id": tier.id}, function (err, metrics) {
						var metric = metrics[0];
						if (!metric) {
							dbTierMetric.insert(tierMetric);
							//log.info("inserting :"+tierMetric)
						} else {
							//log.info("updating minmetrics :"+exports.toString(tierMetric));
							dbTierMetric.update({_id: metric._id}, {$set: {"minmetrics": data,"appname":tier.appname,"tiername":tier.name}});
							//get avg for configured week
							restManager.getTierWeekMetricRollup(tier,function(response){
								if(response) {
									var data = JSON.parse(response);
									//log.info("updating weekmetric :"+exports.toString(tierMetric));
									dbTierMetric.update({_id: metric._id}, {$set: {"weekmetric": data}});
								}
							});
						}
					});
				}else{
					dbTierMetric.remove({"appid": tier.appid, "id": tier.id});
				}
			}		
		});
	});
}



exports.updateWeekMetrics = function(callback){
	log.info("fetching week metrics");
	exports.fetchTiers(function(tier){
		//get metrics for last configured weeks
		restManager.getTierWeekMetric(tier,function(response){
			if(response) {
				var data = JSON.parse(response);
				if(data && data[0] && data[0].metricValues && data[0].metricValues.length > 0 ){
					var tierMetric = {"appid": tier.appid, "id": tier.id, "weekmetrics": data};
					dbTierWeekMetric.find({"appid": tier.appid, "id": tier.id}, function (err, metrics) {
						var metric = metrics[0];
						if (!metric) {
							dbTierWeekMetric.insert(tierMetric);
						} else {
							dbTierWeekMetric.update({_id: metric._id}, {$set: {"weekmetrics": data}});
						}
					});
				}
			}
		});
	});
}

exports.fetchErrorCodeSnapshots = function(callback){
	log.info("fetching error code snapshots");
	var apps = config.error_code_apps;
	apps.forEach(function(app){
		restManager.fetchErrorCodeSnapshots(config.controller,app.id,function(response){
			var data = JSON.parse(response);
			log.info("Error Snapshots Found :"+data.length);
			var codescount =0;
			var summarycount =0;
			data.forEach(function(record){
				//log.info("ErrorSnapShot :"+JSON.stringify(record));
				if(record.businessData && record.businessData.length >0){
					var codeString = getCodeString(record.businessData);
					if(codeString) {
						codeString = codeString.replace('[','').replace(']','');
						var date = moment(record.serverStartTime).format('MM-DD-YYYY');
						exports.fetchBusinessTransaction(app.id,record.businessTransactionId).then(function (bt) {
							dbErrorCodes.find({"appid":app.id,"guid":record.requestGUID,"threadid":record.threadID},function(err,codes){
								var code = codes[0];	
								if(!code){
									dbErrorCodes.insert({appid:app.id,appname:app.name,guid:record.requestGUID,threadid:record.threadID,code:codeString,raw:JSON.stringify(record.businessData),date:date,time:record.serverStartTime,businessTransactionId: record.businessTransactionId,businessTransactionName:bt.name});
								}
							});
							dbErrorSummary.find({"appid":app.id,"guid":record.requestGUID,"threadid":record.threadID,},function(err,summaries){
								var summary = summaries[0];	
								if(!summary && isValidSummary(record.summary)){
									dbErrorSummary.insert({code:codeString,appname:app.name,appid:app.id,guid:record.requestGUID,threadid:record.threadID,summary:record.summary,date:date,time:record.serverStartTime,details:record.errorDetails,httpSessionID:record.httpSessionID,businessTransactionId: record.businessTransactionId,businessTransactionName:bt.name});
								}
							});
						},log.error);
					}
				}
			});
		});
	});
}

getCodeString = function(businessData){
	var value;
	businessData.forEach(function(bData){
		if(bData.name == "ErrorId"){
			value =  bData.value;
		}
	});
	return value;
}


formatErrorCode = function(errorCode){
	return errorCode.replace('[','').replace(']','');
}

isValidSummary = function(summmary){
	if(summmary.length < 100){
		return false;
	}
	return true;
}

exports.getErrorCodesCounts = function(matchDate){
	log.info("getErrorCodesCounts date : "+matchDate);
	var deferred = Q.defer();
	dbErrorCodes.col.aggregate(
	    [
	     { $match : { date : matchDate } },
	     { $group: {
	          _id: "$code",
	          count: { $sum: 1 }
	       }}
	    ],
	    function(err,result) {
	    	if(err){
	    		deferred.reject(err);
			}else{
				deferred.resolve(result);
			}
	    }
	  );
	return deferred.promise;
}

exports.getErrorCodeSummaries = function(errorCode,date){
	var deferred = Q.defer();
	dbErrorSummary.find({"code": errorCode,"date":date},{ sort : { time : 1 }}, function (err, summaries) {
		if(err){
			deferred.reject(err);
		}else{
			deferred.resolve(summaries);
		}
	});
	return deferred.promise;
}

exports.cleanupErrorData = function(){
	var retention = parseInt(config.error_code_retention_days);
	var date = moment().subtract(retention, 'days');
	var millis = date.valueOf();
	dbErrorCodes.col.remove({"time": {"$lte": millis}},function(err, removed){
	    log.info("dbErrorCodes :"+removed);
	});
	dbErrorSummary.col.remove({"time": {"$lte": millis}},function(err, removed){
		log.info("dbErrorSummary :"+removed);
	});
}

exports.fetchExceptions = function (app,tier){
	var deferred = Q.defer();
	restManager.fetchExceptions(app,tier,function(response){
		deferred.resolve(response);
	});
	return deferred.promise;
}

exports.fetchExceptionMinMetric = function (app,tier,exception){
	var deferred = Q.defer();
	restManager.fetchExceptionMinMetric(app,tier,exception,function(response){
		deferred.resolve(response);
	});
	return deferred.promise;
}

exports.fetchExceptionWeekMetric = function (app,tier,exception){
	var deferred = Q.defer();
	restManager.fetchExceptionWeekMetric(app,tier,exception,function(response){
		deferred.resolve(response);
	});
	return deferred.promise;
}

exports.processException = function(app,tier,exception){
	var deferred = Q.defer();
	exports.fetchExceptionMinMetric(app,tier,exception).then(function(response){
		var id;
		var minavg  = 0;
		var weekavg = 0;
		var diff    = 0;
		if(response){
			var exceptionMins = JSON.parse(response)[0];
//			log.info("Exception metrics :"+JSON.stringify(exceptionMins));
			
			var max = 0;
			var average = 0;
			var value = 0;
			var count = 0;
			exceptionMins.metricValues.forEach(function(exceptionMetric){
				value = exceptionMetric.value;
				average = average + value;
				count++;
				if(value > max){
					max = value;
				}
			});
			average = average/count;
			
			if( max > average){
				log.info("appid :"+app.id+" tierid :"+tier.id+" exception :"+JSON.stringify(exception));
				id = getErrorIdFromMetricName(exceptionMins.metricName);
				var excRec = {"appid":app.id,"tierid":tier.id,"errorid":id,"name":exception.name,"url":getExceptionUrl(app,id),"minavg":parseInt(average),"max":max};
				deferred.resolve(excRec);
			}else{
				deferred.resolve();
			}
		}else{
			deferred.resolve();
		}
	});
	return deferred.promise;
}

exports.buildExceptionStats_deprecated = function(appid,tierid){
	var deferred = Q.defer();
		exports.fetchApp(appid).then(function (app) {
			log.info(" app :"+app.id);
			exports.fetchTier(appid,tierid).then(function(tier){
				//log.info(" tier :"+tier.id);
				exports.fetchExceptions(app,tier).then(function(response){
					var exceptions = JSON.parse(response)
					//log.info(" exceptions :"+JSON.stringify(exceptions));
					
					Q.forEach(exceptions, function (exception) {
						log.info("processing exception :"+JSON.stringify(exception))  
						return exports.processException(app,tier,exception);
					}).then(function (resolutions)
					{
					  var data = [];
					  resolutions.forEach(function(exception){
						  if(exception){
							  data.push(exception);
						  }
					  });
					  
					  //sort data 
					  data.sort(function(a,b) { return parseInt(b.max) - parseInt(a.max) } );
					  //log.info("Exception Data :"+JSON.stringify(data));
					  deferred.resolve(data);
					});
				});
			});
		});
	return deferred.promise;
}

exports.fetchAllExceptionsMinMetric = function (app,tier){
	var deferred = Q.defer();
	restManager.fetchAllExceptionsMinMetric(app,tier,function(response){
		deferred.resolve(response);
	});
	return deferred.promise;
}

exports.buildExceptionStats = function(appid,tierid){
	var deferred = Q.defer();
		exports.fetchApp(appid).then(function (app) {
			log.info(" app :"+app.id);
			exports.fetchTier(appid,tierid).then(function(tier){
				log.info(" tier :"+tier.id);
				exports.getDBTierMetric(appid,tierid).then(function(dbTierMetric){
					//log.info("dbTierMetric :"+JSON.stringify(dbTierMetric));
					exports.fetchAllExceptionsMinMetric(app,tier).then(function(response){
						var exceptions = JSON.parse(response);
						//log.info("exceptions :"+JSON.stringify(exceptions));
						var data = [];
						exceptions.forEach(function(exception){
							log.info("...");
							log.info("exception :"+JSON.stringify(exception));
							if(exception.metricValues.length > 0){
								var avg  = exception.metricValues[0].value;
								log.info("average :"+avg);
								if(avg > 0){
									var id = getErrorIdFromMetricName(exception.metricName);
									var name = getExceptionNameFromMetric(exception.metricPath);
									var execRec = {"appid":app.id,"tierid":tier.id,"errorid":id,"name":name,"url":getExceptionUrl(app,id),"avg":avg};
									log.info("execRec :"+JSON.stringify(execRec));
									data.push(execRec);
								}
							}
							log.info("... ...");
						});
						data.sort(function(a,b) { return parseInt(b.avg) - parseInt(a.avg) } );
						deferred.resolve(data);
					});
				})
			});
		});
	return deferred.promise;
}


getErrorIdFromMetricName = function(name){
	//format of name : "metricName":"BTM|Application Diagnostic Data|Error:209813|Errors per Minute"
	var splits = name.split(":");
	if(splits[1]){
		return splits[1].split("|")[0];
	}
	return splits[1];
}

getExceptionUrl = function(app,exceptionId){
	//https://orbitz-app.saas.appdynamics.com/controller/#/location=APP_ERROR_DASHBOARD&timeRange=last_15_minutes.BEFORE_NOW.-1.-1.15&application=19&error=209813
	return app.controller_url+"/controller/#/location=APP_ERROR_DASHBOARD&timeRange=last_15_minutes.BEFORE_NOW.-1.-1.15&application="+app.id+"&error="+exceptionId;
}

//Availability Metrics
exports.buildBTMetrics = function(){
	var apps = config.availability_apps;
	apps.forEach(function(app){
		processBT(app);
	});
}

exports.fetchBTMinuteAverageResponseTimes = function (app){
	var deferred = Q.defer();
	restManager.fetchBTMinuteAverageResponseTimes(app,function(response){
		deferred.resolve(response);
	});
	return deferred.promise;
}

exports.fetchBTWeeklyAverageResponseTimes = function (app){
	var deferred = Q.defer();
	restManager.fetchBTMinuteAverageResponseTimes(app,function(response){
		deferred.resolve(response);
	});
	return deferred.promise;
}

exports.fetchBTMinuteAverageErrors = function (app){
	var deferred = Q.defer();
	restManager.fetchBTMinuteAverageErrors(app,function(response){
		deferred.resolve(response);
	});
	return deferred.promise;
}

exports.fetchBTWeeklyAverageErrors = function (app){
	var deferred = Q.defer();
	restManager.fetchBTWeeklyAverageErrors(app,function(response){
		deferred.resolve(response);
	});
	return deferred.promise;
}

processBT = function(app){
	exports.fetchBTMinuteAverageResponseTimes(app).then(function(minAvgResponse){
		exports.fetchBTWeeklyAverageResponseTimes(app).then(function(weekAvgResponse){
			exports.fetchBTMinuteAverageErrors(app).then(function(minErrorsPerMin){
				exports.fetchBTWeeklyAverageErrors(app).then(function(weekErrorsPerMin){
					var btmetrics = {"appid":app.id,"tier":app.tier,"bt":app.bt,"btid":app.btid,"minavgresponse":minAvgResponse,"weekavgresponse":weekAvgResponse,"minerrorspermin":minErrorsPerMin,"weekerrorspermin":weekErrorsPerMin};
					dbBTs.find({"appid":app.id,"btid":app.bt}, function(err, results){
						var btRec = results[0];
						if(!btRec){
							dbBTs.insert(btRecord);
						}else{
							dbBTs.update({ _id: btRec._id }, { $set: { "minavgresponse":minAvgResponse,"weekavgresponse":weekAvgResponse,"minerrorspermin":minErrorsPerMin,"weekerrorspermin":weekErrorsPerMin} });
						}
					});
				});
			});
		});
	});
}

exports.processBTSnapshots = function(){
	var apps = config.bt_apps;
	apps.forEach(function(app){
		processBT(app);
		processBTErrorSnapshots(app);
		weeklyAverageErrorIDExceptions(app);
		minuteAverageErrorIDExceptions(app);
	});
}

exports.cleanUpBTSnapshots = function(){
	//todo	
}

processBTErrorSnapshots = function(app){
	restManager.fetchBTErrorCodeSnapshots(app,function(response){
		var errors = JSON.parse(response);
		var count = 0;
		errors.forEach(function(record){

			record.errorIDs.forEach(function(errorid){
				var errorRecord = {"time":record.serverStartTime,"errorid":errorid,"btid":app.btid,"bt":app.bt,"appid":app.id,"app":app.app};
				
				dbBTErrors.find({"btid":app.btid,"errorid":errorid}, function(err, docs){
					var doc = docs[0];
					if(!doc){
						dbBTErrors.insert(errorRecord);
					}else{
						dbBTErrors.update({_id:doc._id},{$set:{"time":record.serverStartTime}});
					}
				});
				
				var errorRecordSummary = {"time":record.serverStartTime,"errorid":errorid,"summary":record.summary,"btid":app.btid,"bt":app.bt,"appid":app.id,"app":app.app,"guid":record.requestGUID,"url":record.URL,"node":record.applicationComponentNodeId,"properties":record.transactionProperties};
				dbBTErrorSummary.insert(errorRecordSummary);
			})
		});
	});
}

weeklyAverageErrorIDExceptions = function(app){
	restManager.fetchErrorsAndExceptionsWeeklyAverage(app,function(response){
		var metrics = JSON.parse(response);
		metrics.forEach(function(metric){
			var errorID = getErrorIdFromMetricName(metric.metricName);
			var exceptionName = getExceptionNameFromMetric(metric.metricPath)
			var average = 0;
			if(metric.metricValues[0]){
				average = metric.metricValues[0].value;
			}
			if(errorID && exceptionName){
				dbBTErrors.find({"btid":app.btid,"errorid":parseInt(errorID)}, function(err, docs){
					var doc = docs[0];
					if(doc){
						dbBTErrors.update({ _id: doc._id }, { $set: { "weeklyaverage":average, "exception":exceptionName,"metrics":"W"} });
					}
				});
			}
		});
	})
}

function metricWrapper (record) {
    this.record = record;
    
    metricWrapper.prototype.getMinuteMetrics = function(){
    	return this.record.minmetrics;
    }
    
    metricWrapper.prototype.getWeeklyAverage = function(){
    	return this.record.weeklyaverage;
    }
    
    metricWrapper.prototype.getMetricRecord = function(){
    	return this.record;
    }
}

minuteAverageErrorIDExceptions = function(app){
	restManager.fetchErrorsAndExceptionsMinuteAverage(app,function(response){
		var metrics = JSON.parse(response);
		metrics.forEach(function(metric){
			var errorID = getErrorIdFromMetricName(metric.metricName);
			if(errorID){
				dbBTErrors.find({"btid":app.btid,"errorid":parseInt(errorID),"metrics":"W"}, function(err, docs){
					var doc = docs[0];
					if(doc){
						doc.minmetrics = metric.metricValues;
						doc.metrics = "M";
						doc.metricpath = metric.metricPath;
						trend.calculateTrend(new metricWrapper(doc),function(docmetric){
							restManager.fetchExceptionWeekMetricNoRollUp(app,app.tier,docmetric.metricpath,function(response){
								var weeklymetrics = JSON.parse(response);
								docmetric.weekmetrics = weeklymetrics[0].metricValues;	
								dbBTErrors.update({_id: docmetric._id},{$set : docmetric});
							});
						});
					}
				});
			}
		});z
	})
}

getExceptionNameFromMetric = function(path){
	return path.split("|")[2];
}
