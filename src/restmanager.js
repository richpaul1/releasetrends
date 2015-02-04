var async = require("async");
var https = require("https");
var http = require("http");
http.globalAgent.maxSockets = 20;
var config = require('../config.json');
var debug = require('debug')('monk:*');

var weekDuration = parseInt(config.trending_use_number_of_weeks) * (7*24*60);
var minDuration = parseInt(config.trending_use_number_of_mins);

var fetch = function(controller,url, parentCallBack){
	var str = "";
	var auth = 'Basic '
			+ new Buffer(config.restuser +":"+ config.restpasswrd)
					.toString('base64');
	
	var options = {
		host : controller,
		method : "GET",
		path : url,
		headers : {
			"Authorization" : auth
		}
	};
	
	var callback = function(response) {
		response.on('data', function(chunk) {
			str += chunk;
		});

		response.on('error', function(err) {
			console.log("Error : " + err);
		})

		response.on('end', function() {
			parentCallBack(str);
		});
	}.bind(this)

	if(config.https){
		var req = https.request(options, callback).end();
	}else{
		var req = http.request(options, callback).end();
	}
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
	var url = "/controller/rest/applications/"+appid+"/request-snapshots?time-range-type=BEFORE_NOW&duration-in-mins=10&data-collector-name=ErrorId&output=JSON&user-experience=ERROR&need-props=true";
	fetch(controller,url,callback);
}

exports.fetchBusinessTransactions = function (app,callback){
	var url = "/controller/rest/applications/"+app.id+"/business-transactions?output=JSON";
	fetch(app.controller,url,callback);
}

exports.fetchExceptions = function(app,tier,callback){
	var url = "/controller/rest/applications/"+app.id+"/metrics?metric-path=Errors|"+tier.name+"&output=JSON";
	//console.log("fetchExceptions "+url);
	fetch(app.controller,url,callback);
}

exports.fetchExceptionMinMetric = function(app,tier,exception,callback){
	var url = "/controller/rest/applications/"+app.id+"/metric-data?metric-path=Errors|"+tier.name+"|"+exception.name+"|Errors%20per%20Minute&time-range-type=BEFORE_NOW&duration-in-mins=15&output=JSON&rollup=false";
	//console.log("fetchExceptionMinMetric "+url);
	fetch(app.controller,url,callback);
}

exports.fetchExceptionWeekMetric = function(app,tier,exception,callback){
	var url = "/controller/rest/applications/"+app.id+"/metric-data?metric-path=Errors|"+tier.name+"|"+exception.name+"|Errors%20per%20Minute&time-range-type=BEFORE_NOW&duration-in-mins="+weekDuration+"&output=JSON&rollup=true";
	fetch(app.controller,url,callback);
}
