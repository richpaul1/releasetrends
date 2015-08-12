var log4js = require('log4js');
var log = log4js.getLogger("trendmanager");
var config = require('../config.json');
var restManager = require('./restmanager');
var weeklyTrendManager = require('./weeklytrendcalculator.js');
var dateHelper = require('./datehelper.js');

var Q = require('q');

exports.getWeeklyMetrics = function(metricId,date,week){
	var metricToTrend = exports.findMetricById(metricId);
	var dateRange = dateHelper.getWeekStartAndWeekEndDate(new Date(date));
	return exports.fetchGraphMetrics(metricToTrend.appid, metricToTrend.metricPath, dateRange.startDate.getTime(), dateRange.endDate.getTime());
}

exports.findMetricById = function(id){
	var metricsToTrend = exports.getMetricsToTrend();
	var metricToTrend = metricsToTrend.filter(function(item) {
	    return item.id == id;
	});
	return metricToTrend[0];
}

exports.fetchGraphMetrics = function(appID, metricPath,startTime, endTime){
	
	var app = {};
	app.controller = config.controller;
	
	var metricUrl = buildMetricPath(appID,metricPath,startTime,endTime);
	
	var trendData = {};
	trendData.metricUrl = metricUrl;
	trendData.metricName = metricPath;
	
	var deferred = Q.defer();
	exports.fetchMetrics(app, metricUrl, trendData, function(result){
		trendData.metricData = JSON.parse(result);
		weeklyTrendManager.calculateTrend(trendData,function(metricValues){
			deferred.resolve(trendData);
		});
	});
	return deferred.promise;
}

exports.fetchMetrics = function(app,metricUrl,trendData,callback){
	restManager.fetchMetrics(app,metricUrl,function(response){
		callback(response);
	}); 
}

buildMetricPath= function(appID,metricPath,startTime,endTime){
	metricPath = escape(metricPath);
	return  "/controller/rest/applications/"+appID+"/metric-data?metric-path="+metricPath +"&time-range-type=BETWEEN_TIMES&start-time="+startTime+"&end-time="+endTime+"&rollup=false&output=JSON";
}

exports.getMetricsToTrend = function(){
	return config.metricsToTrend;
}