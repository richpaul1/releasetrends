var manager = require("./manager"),
timers = require("timers"),
async = require("async"),
http = require("https"),
___backgroundTimer;

process.on('message',function(msg){
		
	this._longRunningTask = function(){
		console.log(msg.name+" running ...")
		manager.updateMetrics();
    }

	this._startTimer = function(){
        var count = 0;

        ___backgroundTimer = timers.setInterval(function(){

            try{
                var date = new Date();
                console.log(msg.name+": datetime tick: " + date.toUTCString());
                this._longRunningTask();
            }
            catch(err){
                count++;
                if(count == 3){
                    console.log(msg.name+": shutdown timer...too many errors. " + err.message);
                    clearInterval(___backgroundTimer);
                    process.disconnect();
                }
                else{
                    console.log(msg.name+": " + err.message + "\n" + err.stack);
                }
            }
        }.bind(this),msg.interval);
    }
	
	 this._init = function(){
           this._startTimer();
     }.bind(this)()
});

process.on('uncaughtException',function(err){
    console.log("metricupdater: " + err.message + "\n" + err.stack + "\n Stopping background timer");
    clearInterval(___backgroundTimer);
})