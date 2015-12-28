var log4js = require('log4js');
log4js.configure('log4js.json');
var log = log4js.getLogger("trendanalyzer");
var schedule = require('node-schedule');
var childProcess = require('child_process');
var config = require('../config.json');
var trendManager = require("./trendmanager");
var dateHelper = require("./datehelper");


var factorThreshold = config.factor_threshold;

var debug = function(message) {
	//log.debug(message);
}

process.on('message', function(msg) {
	exec();
})

var exec = function(){
	debug("trend analyzer ..."); 
	var rule = new schedule.RecurrenceRule();
	rule.minute = 0;
	rule.hour   = 12;
	rule.dayOfWeek    = 1;

	var j = schedule.scheduleJob(rule, function() {
		log.info(new Date()+ " : scheduled job .."); 
		analyze();
	});
}

var analyze = function(){
	var metrics = trendManager.getMetricsToTrend();
	debug("metrics :"+JSON.stringify(metrics));
	var dateRange = getLastWeekDateRange();
	debug("dateRange :"+JSON.stringify(dateRange));
	metrics.forEach(function(metric)  {
		log.debug("metric :"+metric.appid);
		trendManager.fetchGraphMetricsUsingMetricAndDateRange(metric,dateRange).then(function (trendDataRecord) {
			debug("DateRange :"+dateRange);
			debug("Metric :"+metric);
			debug("Trend Factor :"+trendDataRecord.factor);
			debug("Trend Threshold :"+factorThreshold);
			
			if(trendDataRecord.factor > factorThreshold){
				debug("Sending Event ...");
				trendManager.postEvent(metric,trendDataRecord);
			}
		},log.error);
	});
}

/**
 * if we are running every monday, then set the date to last week's Monday
 */
var getLastWeekDateRange = function(){
	var date = new Date();
	date.setDate(date.getDate()-7);
	return dateHelper.getWeekStartAndWeekEndDate(date);
}

process.on('uncaughtException', function(err) {
	log.error("trendanalyzer :"+err.message + "\n" + err.stack);
})

