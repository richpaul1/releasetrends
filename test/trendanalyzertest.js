var log4js 			= require('log4js');
var log 			= log4js.getLogger("trendmanagertest");
var assert    		= require("chai").assert;
var trendManager 	= require("../src/trendmanager.js");
var sinon      		= require('sinon');
var childProcess 	= require("child_process");
var config 			= require('../config.json');
var request 		= require("request");

//describe("Functional Testing the sending of custom events", function() {
//	it('Test Trend Analyzer', function (done) {

	var metric = {};
	metric.appid = 14;
	metric.metricName="Metric 1";
	metric.metricPath = "/Config/Metric/Path";
	var trendDataRecord = {};
	trendDataRecord.factor = 10;
	trendManager.postEvent(metric,trendDataRecord,function(response){
		callback(response);
	});
	
	
//    });
//});
