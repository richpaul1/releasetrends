var async = require("async");
var https = require("https");
var config = require('../config.json');

var fetch = function(url, parentCallBack){
	var str = "";
	var auth = 'Basic '
			+ new Buffer(config.restuser +":"+ config.restpasswrd)
					.toString('base64');
	
	var options = {
		host : config.controller,
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
			console.log("getAppJson Error : " + err);
		})

		response.on('end', function() {
			parentCallBack(str);
		});
	}.bind(this)

	var req = https.request(options, callback).end();
}



exports.getAppJson = function(callback) {
	var url = "/controller/rest/applications?output=JSON";
	fetch(url,callback);
}

exports.getTiersJson = function(app,callback) {
	var url = "/controller/rest/applications/"+app.id+"/tiers?output=JSON";
	fetch(url,callback);
}

exports.getTierMinMetric = function (tier,callback){
	var url = "/controller/rest/applications/"+tier.appid+"/metric-data?metric-path=Overall%20Application%20Performance%7C"+tier.name+"%7CExceptions%20per%20Minute&time-range-type=BEFORE_NOW&duration-in-mins=15&output=JSON&rollup=false";
	fetch(url,callback);
}

exports.getTierWeekMetric = function (tier,callback){
	var url = "/controller/rest/applications/"+tier.appid+"/metric-data?metric-path=Overall%20Application%20Performance%7C"+tier.name+"%7CExceptions%20per%20Minute&time-range-type=BEFORE_NOW&duration-in-mins=10080&output=JSON&rollup=false";
	fetch(url,callback);
}

exports.getTierWeekMetricRollup = function (tier,callback){
	var url = "/controller/rest/applications/"+tier.appid+"/metric-data?metric-path=Overall%20Application%20Performance%7C"+tier.name+"%7CExceptions%20per%20Minute&time-range-type=BEFORE_NOW&duration-in-mins=10080&output=JSON&rollup=true";
	fetch(url,callback);
}


