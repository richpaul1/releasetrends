var manager = require("./manager");
var schedule = require('node-schedule');
var childProcess = require('child_process');
var config = require('../config.json');

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
	var rule = new schedule.RecurrenceRule();
	rule.minute = new schedule.Range(0, 59, 30);

	var j = schedule.scheduleJob(rule, function() {
		console.log(new Date().toUTCString()+ " : cleanup scheduled job .."); 
		manager.cleanupErrorData();
	});
}

process.on('uncaughtException', function(err) {
	console.log("cleanup :"+err.message + "\n" + err.stack);
});


