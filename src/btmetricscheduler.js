var manager = require("./manager");
var schedule = require('node-schedule');
var childProcess = require('child_process');
var config = require('../config.json');
var log4js = require('log4js');
var log = log4js.getLogger("btmetrics");

var calclog = function(message) {
	console.log(message);
};

var close = function(){
	manager.close();
};

process.on('message', function(msg) {
	exec();
});

var exec = function(){
	var minSchedule = parseInt(config.bt_schedule);
	var rule = new schedule.RecurrenceRule();
	rule.minute = new schedule.Range(0, 59, minSchedule);
	
	run();
	
	var j = schedule.scheduleJob(rule, function() {
		log.info(new Date().toUTCString()+ " : btmetrics scheduled job .."); 
		run();
	});
}

var run = function(){
	manager.processBTSnapshots();
	manager.cleanUpBTSnapshots();
}

process.on('uncaughtException', function(err) {
	log.error("btmetrics :"+err.message + "\n" + err.stack);
});


