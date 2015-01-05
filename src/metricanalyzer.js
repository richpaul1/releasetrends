var manager = require("./manager"),
timers = require("timers"),
async = require("async"),
http = require("https"),
math = require("mathjs"),
___backgroundTimer;


var average = function(values){
	var sum = 0;
	var count = 0;
	values.forEach(function(val){
		sum += val;
		count++;
	});
			
	return sum/count;
}

process.on('message',function(msg){
	
	
	this._longRunningTask = function(){
		console.log(msg.name+" running ...")
		
		manager.fetchMetrics(function(dbTierMinMetric){
			var x = [];
			var y = [];
			
			var count = 1;
			manager.getMinMetrics(dbTierMinMetric).forEach(function(minmetric){
				x.push(count++);
				y.push(minmetric.value);
			});
			
			console.log("x = "+x);
			console.log("y = "+y);
			
			var xavg = average(x);
			var yavg = average(y);
			
			console.log("xavg = "+xavg);
			console.log("yavg = "+yavg);
			
			var XIminusX = [];
			var XIminusXSquared = [];
			var YIminusY = [];
			count = 1;
			var sumXIYI = 0
			var sumXIXISquared = 0;
			manager.getMinMetrics(dbTierMinMetric).forEach(function(minmetric){
				var xix = count - xavg;
				XIminusX.push(xix);
				var xixsquared = xix*xix;
				XIminusXSquared.push(xixsquared);
				sumXIXISquared+= xixsquared;
				var yiy = minmetric.value - yavg;
				YIminusY.push(yiy)
				count++;
				sumXIYI += xix * yiy;
			});
			
			console.log("XIminusX = "+XIminusX);
			console.log("YIminusY = "+YIminusY);
			console.log("SUM XI * YI ="+sumXIYI);
			console.log("XIminusX Squared ="+XIminusXSquared);
			console.log("SUM XIminusX Squared ="+sumXIXISquared);
			
			var b1 = sumXIYI / sumXIXISquared;
			var b0 = yavg - (b1 * xavg);
			
			//15 minute future value of y
			var future15 = b1*30 + b0;
			var weeklyAverage = manager.getWeekMetricsRollupValue(dbTierMinMetric);
			if(!weeklyAverage){
				weeklyAverage = 1;
			}
			//generate some factor
			var factor = future15/weeklyAverage;			
						
			dbTierMinMetric.b1 = b1;
			dbTierMinMetric.b0 = b0;
			dbTierMinMetric.future15 = future15;
			dbTierMinMetric.yavg = yavg;
			dbTierMinMetric.weekavg = weeklyAverage;
			dbTierMinMetric.factor  = factor
			dbTierMinMetric.evaltime = new Date().getMilliseconds();
			if(factor > 2){
				dbTierMinMetric.trend = "T";
			}else{
				dbTierMinMetric.trend = "F";
			}
			manager.updateDBTierMinMetric(dbTierMinMetric);
		})
		
    }.bind(this)()

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
    console.log("metricanalyzer: " + err.message + "\n" + err.stack + "\n Stopping background timer");
    clearInterval(___backgroundTimer);
})