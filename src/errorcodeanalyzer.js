var manager = require("./manager");
var schedule = require('node-schedule');
var childProcess = require('child_process');
var config = require('../config.json');

var close = function(){
	manager.close();
};

process.on('message', function(msg) {
	exec();
});

var exec = function(){
	var rule = new schedule.RecurrenceRule();
	var minSchedule = config.error_code_fetch_snapshots;
	rule.minute = new schedule.Range(0, 59, minSchedule);

	var j = schedule.scheduleJob(rule, function() {
		console.log(new Date().toUTCString()+ " : errorcodeanalyzer scheduled job .."); 
		manager.fetchErrorCodeSnapshots();
	});
}

process.on('uncaughtException', function(err) {
	console.log("errorcodeanalyzer :"+err.message + "\n" + err.stack);
});


