var manager = require("./manager");
var schedule = require('node-schedule');
var childProcess = require('child_process');
var config = require('../config.json');
var fs = require('fs');

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
	var minSchedule = parseInt(config.fetch_data_every_number_of_mins);
	var rule = new schedule.RecurrenceRule();
	rule.minute = new schedule.Range(0, 59, minSchedule);
	
	fs.changeWorkingDirectory(fs.workingDirectory+"/public/images");

	var j = schedule.scheduleJob(rule, function() {
		console.log(new Date().toUTCString()+ " : gengraphs scheduled job .."); 
		req.manager.getTrendingMetrics().then(function (data) {
			console.log(JSON.stringify(data));
		},console.error);
	});
}

process.on('uncaughtException', function(err) {
	console.log("gengraphs :"+err.message + "\n" + err.stack);
});


