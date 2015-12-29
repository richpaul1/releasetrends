var log4js = require('log4js');
var log = log4js.getLogger("trendcalculator");
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
	calclog(JSON.stringify(record));
	
	record.metricData[0].metricValues.forEach(function(minmetric) {
		if(minmetric.value > 0){
			x.push(count++);
			y.push(minmetric.value);
		}
	});

	calclog("x = " + x);
	calclog("y = " + y);

	var xavg = average(x);
	var yavg = average(y);
	
	record.avgvalue = yavg;

	var XIminusX = [];
	var XIminusXSquared = [];
	var YIminusY = [];
	count = 1;
	var sumXIYI = 0
	var sumXIXISquared = 0;

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

	// Future value
	var number_of_days_to_factor_for_trend = config.number_of_days_to_factor_for_trend;
	var future_duration = (parseInt(config.trending_use_future_number_of_days) * 24) + (number_of_days_to_factor_for_trend*24);
	
	var futureMark = (b1 * future_duration) + b0;
	calclog("future15 : " + futureMark);
	
	// generate some factor
	var factor = futureMark / yavg;
	calclog("factor : " + factor);

	record.b1 = b1;
	record.b0 = b0;
	record.future15 = futureMark;
	record.future1 = 0;
	record.yavg = yavg;
	record.factor = factor;
	record.evaltime = new Date().getMilliseconds();
	var trend = false;
	if (factor > parseInt(config.trending_factor)) {
		record.trend = "T";
		trend = true;
	} else {
		record.trend = "F";
	}
	callback(record);
}