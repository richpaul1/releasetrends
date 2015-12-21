var async = require("async");
var log4js = require('log4js');
var log = log4js.getLogger("restmanager");
var https = require("https");
var http = require("http");
var querystring = require('querystring');
var request = require("request");

http.globalAgent.maxSockets = 20;
var config = require('../config.json');

var weekDuration = parseInt(config.trending_use_number_of_weeks) * (7*24*60);
var minDuration = parseInt(config.trending_use_number_of_mins);
var btMinDuration = config.bt_use_last_mins;
var errorCodeSnapshotsDuration = config.error_code_fetch_snapshots;

var auth =  'Basic '+ new Buffer(config.restuser +":"+ config.restpasswrd).toString('base64');

var fetch = function(controller,url, parentCallBack){
	var str = "";
	
	var options = {
		host : controller,
		method : "GET",
		path : url,
		headers : {
			"Authorization" : auth,
		}
	};

	
	var callback = function(response) {
		response.on('data', function(chunk) {
			str += chunk;
		});

		response.on('error', function(err) {
			log.error("Error : " + err);
		})

		response.on('end', function() {
			log.debug("url :"+url);
			log.debug("response :"+str);
			parentCallBack(str);
		});
	}.bind(this)

	if(config.https){
		var req = https.request(options, callback).end();
	}else{
		var req = http.request(options, callback).end();
	}
}

var post = function(controller,postUrl,postData,parentCallBack) {
	
	var url = "";
	if(config.https){
		url = "https://";
	}else{
		url = "http://";
	}
	var options = {
		  uri: url + controller + postUrl,
		  method: 'POST',
		  form : postData,
		  headers:{
			  'Content-Type': 'application/json',
			  "Authorization" : auth
		  }
	};
	log.debug(options);
	request(options, function(error, response, body) {
			log.debug(error);
			log.debug(response);
			log.debug(body);
	      if(error){
	    	  parentCallBack(error);
	      }
	      if(response){
	    	  parentCallBack(response);
	      }
	});
}

exports.getAppJson = function(controller,callback) {
	var url = "/controller/rest/applications?output=JSON";
	fetch(controller,url,callback);
}

exports.getTiersJson = function(app,callback) {
	var url = "/controller/rest/applications/"+app.id+"/tiers?output=JSON";
	fetch(app.controller,url,callback);
}

exports.getTierMinMetric = function (tier,callback){
	var url = "/controller/rest/applications/"+tier.appid+"/metric-data?metric-path=Overall%20Application%20Performance%7C"+tier.name+"%7CExceptions%20per%20Minute&time-range-type=BEFORE_NOW&duration-in-mins="+minDuration+"&output=JSON&rollup=false";
	fetch(tier.controller,url,callback);
}

exports.getTierWeekMetric = function (tier,callback){
	var url = "/controller/rest/applications/"+tier.appid+"/metric-data?metric-path=Overall%20Application%20Performance%7C"+tier.name+"%7CExceptions%20per%20Minute&time-range-type=BEFORE_NOW&duration-in-mins="+weekDuration+"&output=JSON&rollup=false";
	fetch(tier.controller,url,callback);
}

exports.getTierWeekMetricRollup = function (tier,callback){
	var url = "/controller/rest/applications/"+tier.appid+"/metric-data?metric-path=Overall%20Application%20Performance%7C"+tier.name+"%7CExceptions%20per%20Minute&time-range-type=BEFORE_NOW&duration-in-mins="+weekDuration+"&output=JSON&rollup=true";
	fetch(tier.controller,url,callback);
}

exports.getTierWeekMetricRollup = function (tier,callback){
	var url = "/controller/rest/applications/"+tier.appid+"/metric-data?metric-path=Overall%20Application%20Performance%7C"+tier.name+"%7CExceptions%20per%20Minute&time-range-type=BEFORE_NOW&duration-in-mins="+weekDuration+"&output=JSON&rollup=true";
	fetch(tier.controller,url,callback);
}

exports.fetchErrorCodeSnapshots = function (controller,appid,callback){
	var url = "/controller/rest/applications/"+appid+"/request-snapshots?time-range-type=BEFORE_NOW&duration-in-mins="+errorCodeSnapshotsDuration+"&data-collector-name=ErrorId&output=JSON&user-experience=ERROR&need-props=true";
	fetch(controller,url,callback);
}

exports.fetchBusinessTransactions = function (app,callback){
	var url = "/controller/rest/applications/"+app.id+"/business-transactions?output=JSON";
	fetch(app.controller,url,callback);
}

exports.fetchExceptions = function(app,tier,callback){
	var url = "/controller/rest/applications/"+app.id+"/metrics?metric-path=Errors|"+tier.name+"&output=JSON";
	fetch(app.controller,url,callback);
}

exports.fetchExceptionMinMetric = function(app,tier,exception,callback){
	var url = "/controller/rest/applications/"+app.id+"/metric-data?metric-path=Errors|"+tier.name+"|"+exception.name+"|Errors%20per%20Minute&time-range-type=BEFORE_NOW&duration-in-mins=15&output=JSON&rollup=false";
	fetch(app.controller,url,callback);
}

exports.fetchAllExceptionsMinMetric = function(app,tier,callback){
	var url = "/controller/rest/applications/"+app.id+"/metric-data?metric-path=Errors|"+tier.name+"|*|Errors%20per%20Minute&time-range-type=BEFORE_NOW&duration-in-mins=20&output=JSON&rollup=true";
	fetch(app.controller,url,callback);
}

exports.fetchExceptionWeekMetric = function(app,tier,exception,callback){
	var url = "/controller/rest/applications/"+app.id+"/metric-data?metric-path=Errors|"+tier.name+"|"+exception.name+"|Errors%20per%20Minute&time-range-type=BEFORE_NOW&duration-in-mins="+weekDuration+"&output=JSON&rollup=true";
	fetch(app.controller,url,callback);
}

exports.fetchExceptionWeekMetricNoRollUp = function(app,tiername,metricPath,callback){
	var url = encodeURI("/controller/rest/applications/"+app.id+"/metric-data?metric-path="+metricPath+"&time-range-type=BEFORE_NOW&duration-in-mins="+weekDuration+"&output=JSON&rollup=false");
	fetch(app.controller,url,callback);
}

exports.fetchBTMinuteAverageResponseTimes = function(app,callback){
	var url = "/controller/rest/applications/production/metric-data?metric-path=Business%20Transaction%20Performance%7CBusiness%20Transactions%7C"+app.tier+"%7C"+app.bt+"%7CAverage%20Response%20Time%20%28ms%29&time-range-type=BEFORE_NOW&duration-in-mins=60";
	fetch(app.controller,url,callback);
}
exports.fetchBTWeeklyAverageResponseTimes = function(app,callback){
	var url = "/controller/rest/applications/production/metric-data?metric-path=Business%20Transaction%20Performance%7CBusiness%20Transactions%7C"+app.tier+"%7C"+app.bt+"%7CAverage%20Response%20Time%20%28ms%29&time-range-type=BEFORE_NOW&duration-in-mins="+weekDuration;
	fetch(app.controller,url,callback);
}

exports.fetchBTMinuteAverageErrors = function(app,callback){
	var url = "/controller/rest/applications/production/metric-data?metric-path=Business%20Transaction%20Performance%7CBusiness%20Transactions%7C"+app.tier+"%7C"+app.bt+"%7CErrors%20per%20Minute&time-range-type=BEFORE_NOW&duration-in-mins=60";
	fetch(app.controller,url,callback);
}

exports.fetchBTWeeklyAverageErrors = function(app,callback){
	var url = "/controller/rest/applications/production/metric-data?metric-path=Business%20Transaction%20Performance%7CBusiness%20Transactions%7C"+app.tier+"%7C"+app.bt+"%7CErrors%20per%20Minute&time-range-type=BEFORE_NOW&duration-in-mins="+weekDuration;
	fetch(app.controller,url,callback);
}

exports.fetchBTErrorCodeSnapshots = function (app,callback){
	var url = "/controller/rest/applications/"+app.id+"/request-snapshots?business-transaction-ids="+app.btid+"&time-range-type=BEFORE_NOW&duration-in-mins=15&output=JSON&user-experience=ERROR&need-props=true&first-in-chain=false";
	fetch(app.controller,url,callback);
}

exports.fetchErrorsAndExceptionsWeeklyAverage = function (app,callback){
	var url = "/controller/rest/applications/"+app.id+"/metric-data?metric-path=Errors|"+app.tier+"|*|Errors%20per%20Minute&time-range-type=BEFORE_NOW&duration-in-mins="+weekDuration+"&output=JSON&rollup=true";
	fetch(app.controller,url,callback);
}

exports.fetchErrorsAndExceptionsMinuteAverage = function (app,callback){
	var url = "/controller/rest/applications/"+app.id+"/metric-data?metric-path=Errors|"+app.tier+"|*|Errors%20per%20Minute&time-range-type=BEFORE_NOW&duration-in-mins="+btMinDuration+"&output=JSON&rollup=false";
	fetch(app.controller,url,callback);
}

exports.fetchMetrics = function (app,url,callback){
	fetch(app.controller,url,callback);
}

/**
 * API for custom event : https://docs.appdynamics.com/display/PRO41/Use+the+AppDynamics+REST+API#UsetheAppDynamicsRESTAPI-CreateEvents
 * 
 */
exports.postEvent = function (app,metric,dataRecord,callback){
	var postData = {};
	postData.summary = "Metric "+ metric.metricName +" is Trending. Trend Factor is "+dataRecord.factor+" Trend Threshold is "+config.factor_threshold;
	postData.eventtype = "CUSTOM";
	postData.customeventtype = "TREND";
	postData.severity = "ERROR";
	postData.comment = "Metric Path "+metric.metricPath;
	var url = "/controller/rest/applications/"+metric.appid+"/events";
	post(app.controller,url,postData,callback);
}





