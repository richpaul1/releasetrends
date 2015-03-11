var log4js = require('log4js');
log4js.configure('log4js.json');
var log = log4js.getLogger("metricanalyzer");
var manager = require("./manager");
var schedule = require('node-schedule');
var path = require('path');
var phantomjs = require('phantomjs');
var childProcess = require('child_process');
var binPath = phantomjs.path;
var fs = require('fs');
var config = require('../config.json');
var trend = require("./trend");

var workingDir;
var average = function(values) {
	var sum = 0;
	var count = 0;
	values.forEach(function(val) {
		sum += val;
		count++;
	});

	return sum / count;
}

var calclog = function(message) {
	//log.debug(message);
}


var loginfo = function(message) {
	log.info(message);
}

var close = function(){
	manager.close();
}

process.on('message', function(msg) {
	exec();
})

function metricWrapper (record) {
    this.record = record;
    
    metricWrapper.prototype.getMinuteMetrics = function(){
    	return this.record.minmetrics[0].metricValues;
    }
    
    metricWrapper.prototype.getWeeklyAverage = function(){
    	return this.record.weekmetric[0].metricValues[0].value;
    }
    
    metricWrapper.prototype.getMetricRecord = function(){
    	return this.record;
    }
}

var exec = function(){
	
	var rule = new schedule.RecurrenceRule();
	var minSchedule = config.fetch_data_every_number_of_mins;
	rule.minute = new schedule.Range(0, 59, minSchedule);

	var j = schedule.scheduleJob(rule, function() {
		log.info(new Date()+ " : scheduled job .."); 
		manager.updateMinMetrics();
		manager.updateWeekMetrics();
		manager.fetchDbTierMetrics().then(
				function(data) {
					log.info(new Date().toUTCString()
							+ " : metric analyzer firing ...[" + data.length
							+ "]");
					data.forEach(function(metric) {
						trend.calculateTrend(new metricWrapper(metric),function(metric){
							manager.updateDBTierMinMetric(metric);
							if (metric.trend =="T") {
								var dir = config.images;
								log.info("Trending "+metric.appid+" "+metric.id);
								var childArgs = [ path.join(__dirname, 'screencapture.js'),dir,config.baseUrl,metric.appid,metric.id];
								//log.info("childArgs "+JSON.stringify(childArgs));
								childProcess.execFile(binPath, childArgs,function(err, stdout, stderr) {
									if(err){
										log.error("problem executing phantom ",err);
									}
									if(stderr){
										log.error("problem executing phantom ",stderr);
									}
									
								});
							}
						});
					});
				});
	});
}

process.on('uncaughtException', function(err) {
	log.error("metricanalyzer :"+err.message + "\n" + err.stack);
})

//var generateTestImage = function(appid, tierid){
//	var childArgs = [ path.join(__dirname, 'screencapture.js'),appid,tierid];
//	childProcess.execFile(binPath, childArgs,
//			function(err, stdout, stderr) {
//	})
//}


