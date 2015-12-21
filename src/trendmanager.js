var log4js = require('log4js');
var log = log4js.getLogger("trendmanager");
var config = require('../config.json');
var restManager = require('./restmanager');
var weeklyTrendCalculator = require('./weeklytrendcalculator.js');
var dateHelper = require('./datehelper.js');

var Q = require('q');

var host = {};
host.controller = config.controller;

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

exports.fetchGraphMetricsUsingMetricAndDateRange = function(metric,dateRange){
	//log.debug("fetchGraphMetrics :"+metric);
	return exports.fetchGraphMetrics(metric.appid, metric["metricPath"], dateRange["startDate"].getTime(), dateRange["endDate"].getTime());
}

exports.fetchGraphMetrics = function(appID, metricPath,startTime, endTime){
	
	//log.debug("appID :"+appID);
	//log.debug("metricPath :"+metricPath);
	//log.debug("startTime :"+startTime);
	//log.debug("endTime :"+endTime);
	
	
	var metricUrl = buildMetricPath(appID,metricPath,startTime,endTime);
	//log.debug("metricUrl : "+metricUrl);
	
	var trendData = {};
	trendData.metricUrl = metricUrl;
	trendData.metricName = metricPath;
	
	var deferred = Q.defer();
	exports.fetchMetrics(host, metricUrl, trendData, function(result){
		trendData.metricData = JSON.parse(result);
		weeklyTrendCalculator.calculateTrend(trendData,function(metricValues){
			deferred.resolve(trendData);
		});
	});
	return deferred.promise;
}

exports.fetchMetrics = function(host,metricUrl,trendData,callback){
	restManager.fetchMetrics(host,metricUrl,function(response){
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

exports.postEvent = function(metric,trendDataRecord,callback){
	restManager.postEvent(host,metric,trendDataRecord,function(response){
		callback(response);
	});
}