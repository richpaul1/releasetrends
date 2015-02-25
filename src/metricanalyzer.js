var log4js = require('log4js');
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

var totalRefreshCount = -1; // This is way of refreshing the non trending tiers every 10 calls.

var calclog = function(message) {
	//log.debug(message);
}


var loginfo = function(message) {
	//log.debug(message);
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
	
	if(totalRefreshCount > 10){
		totalRefreshCount = 0;
	}else{
		totalRefreshCount++;
	}
	
	var rule = new schedule.RecurrenceRule();
	var minSchedule = parseInt(config.fetch_data_every_number_of_mins);
	rule.minute = new schedule.Range(0, 59, minSchedule);

	var j = schedule.scheduleJob(rule, function() {
		log.info(new Date().toUTCString()+ " : scheduled job .."); 
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
								loginfo("capture graph for "+metric.appid+" "+metric.id+" "+dir);
								loginfo("metric record :"+JSON.stringify(metric));
								var childArgs = [ path.join(__dirname, 'screencapture.js'),dir,config.baseUrl,metric.appid,metric.id];
								childProcess.execFile(binPath, childArgs,
										function(err, stdout, stderr) {
									console.log(err);
								});
							}
						});
					});
				}, console.error);
	});
}

process.on('uncaughtException', function(err) {
	log.info("metricanalyzer :"+err.message + "\n" + err.stack);
})

var generateTestImage = function(appid, tierid){
	var childArgs = [ path.join(__dirname, 'screencapture.js'),appid,tierid];
	childProcess.execFile(binPath, childArgs,
			function(err, stdout, stderr) {
	})
}

var analyze = function(dbTierMinMetric) {
	var x = [];
	var y = [];
	var count = 1;
	dbTierMinMetric.minmetrics[0].metricValues.forEach(function(minmetric) {
		x.push(count++);
		y.push(minmetric.value);
	});

	calclog("x = " + x);
	calclog("y = " + y);

	var xavg = average(x);
	var yavg = average(y);
	
	var weeklyAverage = dbTierMinMetric.weekmetric[0].metricValues[0].value;
	if (!weeklyAverage) {
		weeklyAverage = 1;
	}else if(yavg <= weeklyAverage){
		//it is not trending
		dbTierMinMetric.trend = "F";
		manager.updateDBTierMinMetric(dbTierMinMetric);
		return;
	}
	

	calclog("xavg = " + xavg);
	calclog("yavg = " + yavg);

	var XIminusX = [];
	var XIminusXSquared = [];
	var YIminusY = [];
	count = 1;
	var sumXIYI = 0
	var sumXIXISquared = 0;
	calclog("check 1");

	calclog("data :"
			+ JSON.stringify(dbTierMinMetric.minmetrics[0].metricValues));
	x.forEach(function(xval, index) {
		var xix = x[index] - xavg;
		XIminusX.push(xix);
		var xixsquared = xix * xix;
		XIminusXSquared.push(xixsquared);
		sumXIXISquared += xixsquared;
		var yiy = y[index] - yavg;
		YIminusY.push(yiy)
		sumXIYI += xix * yiy;
	});

	calclog("XIminusX = " + XIminusX);
	calclog("YIminusY = " + YIminusY);
	calclog("SUM XI * YI =" + sumXIYI);
	calclog("XIminusX Squared =" + XIminusXSquared);
	calclog("SUM XIminusX Squared =" + sumXIXISquared);

	var b1 = sumXIYI / sumXIXISquared;
	var b0 = yavg - (b1 * xavg);
	calclog("b0  = " + b0);
	calclog("b1  = " + b1);

	// 15 minute future value of y
	var minute_duration = parseInt(config.trending_use_number_of_mins);
	var future_minute_duration = parseInt(config.trending_use_future_number_of_mins);
	
	var futureOneMinuteMark = b1 * (minute_duration+1) + b0;
	var futureMinuteMark = b1 * (minute_duration+future_minute_duration) + b0;
	calclog("future15 : " + futureMinuteMark);
	
	// generate some factor
	var factor = futureMinuteMark / weeklyAverage;
	calclog("factor : " + factor);

	dbTierMinMetric.b1 = b1;
	dbTierMinMetric.b0 = b0;
	dbTierMinMetric.future15 = futureMinuteMark;
	dbTierMinMetric.future1 = futureOneMinuteMark;
	dbTierMinMetric.yavg = yavg;
	dbTierMinMetric.weekavg = weeklyAverage;
	dbTierMinMetric.factor = factor;
	dbTierMinMetric.evaltime = new Date().getMilliseconds();
	var trend = false;
	if (factor > parseInt(config.trending_factor) && futureMinuteMark > futureOneMinuteMark) {
		dbTierMinMetric.trend = "T";
		trend = true;
	} else {
		dbTierMinMetric.trend = "F";
	}
	manager.updateDBTierMinMetric(dbTierMinMetric);
	if (trend) {
		var dir = config.images;
		log.info("capture graph for "+dbTierMinMetric.appid+" "+dbTierMinMetric.id+" "+dir);
		var childArgs = [ path.join(__dirname, 'screencapture.js'),dir,config.baseUrl,dbTierMinMetric.appid,dbTierMinMetric.id];
		childProcess.execFile(binPath, childArgs,
				function(err, stdout, stderr) {
		});
	}
}
