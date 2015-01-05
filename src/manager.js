var config = require('../config.json');
var restManager = require('./restmanager');
var monk = require('monk');
var Q = require('Q');
var db = monk(config.dbhost+":"+config.dbport+'/'+config.dbname);
var dbApps = db.get('apps');
var dbTiers = db.get('tiers');
var dbTierMetric = db.get('tierminmetric');
var dbTierWeekMetric = db.get('tierweekmetric');

 

exports.initApplications = function(){
	restManager.getAppJson(function(response){
		japps = JSON.parse(response);
		japps.forEach(function(app)  {
			var appRecord = { id:app.id, name : app.name} ;
			dbApps.find({"id":app.id}, function(err, docs){
				var doc = docs[0];
				if(!doc){
					dbApps.insert(appRecord);
				}else{
					dbApps.update({ _id: doc._id }, { $set: { name: app.name } });
				}
			});
		});
	});
}

exports.fetchApps = function(callback){
	var search = dbApps.find();
	search.each(function (doc) {
		callback(doc);
	});
}

exports.fetchTiers = function(callback){
	var search = dbTiers.find();
	search.each(function (doc) {
		callback(doc);
	});
}


exports.initTiers = function(){
	exports.fetchApps(function(app){
		restManager.getTiersJson(app,function(response){
			jtiers = JSON.parse(response);
			jtiers.forEach(function(tier)  {
				var tierRecord = { "appid":app.id,"id":tier.id, "name": tier.name, "appname":app.name} ;
				dbTiers.find({"appid":app.id,"id":tier.id}, function(err, tiers){
					var tier = tiers[0];
					if(!tier){
						dbTiers.insert(tierRecord);
					}else{
						dbTiers.update({ _id: tier._id }, { $set: { "name": tier.name,"appname":app.name } });
					}
				});
			});
		});
	});
}

exports.fetchMetrics = function(callback){
	var search = dbTierMetric.find();
	search.each(function (doc) {
		callback(doc);
	});
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
	console.log("updating "+exports.toString(dbTierMinMetric));
	dbTierMetric.update({_id: dbTierMinMetric._id},{$set : dbTierMinMetric});
}

exports.getTrendingMetrics = function(callback){
	var deferred = Q.defer();
	dbTierMetric.find({"trend": "T"}, function (err, metrics) {
		if(err){
			deferred.reject(err);
		}else{
			deferred.resolve(metrics);
		}
	});
	return deferred.promise;
}

exports.updateMinMetrics = function(callback){
	console.log("fetching minute metrics");
	exports.fetchTiers(function(tier){
		//get metrics for last 15 mins
		restManager.getTierMinMetric(tier,function(response){
			if(response) {
				var data = JSON.parse(response);
				
				if(data && data[0] && data[0].metricValues && data[0].metricValues.length > 0 ){
					var tierMetric = {"appid": tier.appid, "id": tier.id, "minmetrics": data, "appname":tier.appname,"tiername":tier.name};
					dbTierMetric.find({"appid": tier.appid, "id": tier.id}, function (err, metrics) {
						var metric = metrics[0];
						if (!metric) {
							dbTierMetric.insert(tierMetric);
							//console.log("inserting :"+tierMetric)
						} else {
							//console.log("updating minmetrics :"+exports.toString(tierMetric));
							dbTierMetric.update({_id: metric._id}, {$set: {"minmetrics": data,"appname":tier.appname,"tiername":tier.name}});
							//get avg for 1 week
							restManager.getTierWeekMetricRollup(tier,function(response){
								if(response) {
									var data = JSON.parse(response);
									//console.log("updating weekmetric :"+exports.toString(tierMetric));
									dbTierMetric.update({_id: metric._id}, {$set: {"weekmetric": data}});
								}
							});
						}
					});
				}
			}else{
				dbTierMetric.remove({"appid": tier.appid, "id": tier.id});
			}
		});
	});
}

exports.updateWeekMetrics = function(callback){
	console.log("fetching week metrics");
	exports.fetchTiers(function(tier){
		//get metrics for last 15 mins
		restManager.getTierWeekMetric(tier,function(response){
			if(response) {
				var data = JSON.parse(response);
				if(data && data[0] && data[0].metricValues && data[0].metricValues.length > 0 ){
					var tierMetric = {"appid": tier.appid, "id": tier.id, "weekmetrics": data};
					dbTierWeekMetric.find({"appid": tier.appid, "id": tier.id}, function (err, metrics) {
						var metric = metrics[0];
						if (!metric) {
							dbTierWeekMetric.insert(tierMetric);
							console.log("inserting weekmetric:"+exports.toString(tierMetric))
						} else {
							dbTierWeekMetric.update({_id: metric._id}, {$set: {"weekmetrics": data}});
							console.log("updating weekmetrics :"+exports.toString(tierMetric));
						}
					});
				}
			}
		});
	});
}



// Returns all the bugs
exports.getAll = function(req, res) {
	collection.find({}, function(err, bugs){
		if (err) res.json(500, err);
		else res.json(bugs);
	});
};
 
// Creates a bug
exports.create = function(req, res) {
	var body = req.body;
	collection.insert(body, function(err, bug){
		if (err) res.json(500, err);
		else res.json(201, bug);
	});
};
 
// Get a bug
exports.get = function(req, res) {
	var id = req.params.id;
	collection.findById(id, function(err, bug){
		if (err) res.json(500, err);
		else if (bug) res.json(bug);
		else res.json(404);
	});
};
 
// Updates a bug
exports.update = function(req, res) {
	var id = req.params.id;
	var body = req.body;
	delete body._id;
	collection.findAndModify({_id: id}, {$set: body}, {multi:false}, function(err, bug){
		if (err) res.json(500, err);
		else if (bug) res.json(bug);
		else res.json(404);
	});
};
 
// Deletes a bug
exports.del = function(req, res) {
	var id = req.params.id;
	collection.remove({_id: id}, function(err){
		if (err) res.json(500, err);
		else res.json(204);
	});
};