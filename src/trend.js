var log4js = require('log4js');
var log = log4js.getLogger("trend");
var config = require('../config.json');

var calclog = function(message) {
	log.debug(message);
}

var average = function(values) {
	var sum = 0;
	var count = 0;
	values.forEach(function(val) {
		sum += val;
		count++;
	});

	return sum / count;
}

exports.calculateTrend = function(record,callback) {
	var x = [];
	var y = [];
	var count = 1;
	record.getMinuteMetrics().forEach(function(minmetric) {
		x.push(count++);
		y.push(minmetric.value);
	});

	calclog("x = " + x);
	calclog("y = " + y);

	var xavg = average(x);
	var yavg = average(y);
	
	var weeklyAverage = record.getWeeklyAverage();
	
	if (!weeklyAverage) {
		weeklyAverage = 1;
	}else if(yavg <= weeklyAverage){
		//it is not trending
		record.getMetricRecord().trend = "F";
		callback(record.getMetricRecord());
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
			+ JSON.stringify(record.getMinuteMetrics()));
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

	var metricRecord = record.getMetricRecord();
	metricRecord.b1 = b1;
	metricRecord.b0 = b0;
	metricRecord.future15 = futureMinuteMark;
	metricRecord.future1 = futureOneMinuteMark;
	metricRecord.yavg = yavg;
	metricRecord.weekavg = weeklyAverage;
	metricRecord.factor = factor;
	metricRecord.evaltime = new Date().getMilliseconds();
	var trend = false;
	if (factor > parseInt(config.trending_factor) && futureMinuteMark > futureOneMinuteMark) {
		metricRecord.trend = "T";
		trend = true;
	} else {
		metricRecord.trend = "F";
	}
	callback(metricRecord);
	
}