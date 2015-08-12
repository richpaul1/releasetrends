var log4js 			= require('log4js');
var log 			= log4js.getLogger("trendmanagertest");
var assert    		= require("chai").assert;
var trendManager 	= require("../src/trendmanager.js");
var sinon      		= require('sinon');
var metricdata1     = require('./metricdata1.json');

//https://berkley.saas.appdynamics.com/controller/rest/applications/GenesysProd%20CWG/metric-data?metric-path=Service%20End%20Points%7CCWG-PST%7CEJB%20Advanced%20Copy%7CAverage%20Response%20Time%20%28ms%29&time-range-type=BETWEEN_TIMES&start-time=1436550540000&end-time=1437162540000

var metricPath = "Service End Points|CWG-PST|EJB Advanced Copy|Average Response Time (ms)";
sinon.stub(trendManager, "fetchMetrics").yields(JSON.stringify(metricdata1));

//calculate average
var sum = 0;
var count = 0;
metricdata1[0].metricValues.forEach(function(minmetric) {
	count++;
	sum += minmetric.value;
});
var average = sum/count;

describe("In This Scenario we are testing if the metricPath and metricName are set.", function() {
	var returnedData;
	trendManager.fetchGraphMetrics("49",metricPath,"1436550540000","1437162540000").then(function(trendData){
		returnedData = trendData;
		done();
	});
	
	it('should have metricUrl set', function(){
		assert.equal(returnedData.metricUrl,"/controller/rest/applications/49/metric-data?metric-path=Service%20End%20Points%7CCWG-PST%7CEJB%20Advanced%20Copy%7CAverage%20Response%20Time%20%28ms%29&time-range-type=BETWEEN_TIMES&start-time=1436550540000&end-time=1437162540000&rollup=false&output=JSON");
	});

	it('should have metricName set', function(){
		assert.equal(returnedData.metricName,metricPath);
	});
	
	it('should have the metric data set', function(){
		assert.equal(JSON.stringify(returnedData.metricData),JSON.stringify(metricdata1));
	});	
	
	it('should have the average value set', function(){
		assert.equal(average,returnedData.avgvalue);
	});
	
});

describe("Test Metrics To Trend", function() {
	var returnedData = trendManager.getMetricsToTrend();
	it('Test Config', function(){
		assert.equal(returnedData[0].appid,44);
		assert.equal(returnedData[0].id,1);
	});
});


describe("findMetricById", function() {
	var metricConfig = trendManager.findMetricById(1);
	log.debug(metricConfig);
	it('Compare Values', function(){
		assert.equal(metricConfig.id,1);
		assert.equal(metricConfig.appid,44);
	});
});





