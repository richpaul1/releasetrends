var timers = require("timers"),
    parseString = require("xml2js").parseString,
    async = require("async"),
    http = require("https"),
    ___backgroundTimer;

var AppDict = {};





process.on('message',function(msg){

	this._getAppJson = function(url,parentCallBack) {
		
		var str = "";
		var auth = 'Basic ' + new Buffer(msg.config.restuser+msg.config.restpasswrd).toString('base64');
              
		console.log ("options url : "+url);
		console.log ("auth : "+auth);
        var options = {
        	    host: 'orbitz-app.saas.appdynamics.com',
        	    method:"GET",
        	    path: url,
        	    headers:{
                    "Authorization": auth
                } 
       	};

		 var callback = function(response) {
			 
			 console.log("inside callback :");
		        response.on('data', function (chunk) {
		        	str += chunk;
		        });
		        
		        response.on('error',function(err){
	                console.log("getAppJson Error : " + err);
	            })

		        response.on('end', function () {
		        	parentCallBack(str).bind(this);
		        });
		  }.bind(this)

		  var req = http.request(options, callback).end();
	}

	
	this._getFeed = function(url,type,callback){

        var result = null;
        var timeout = 30000;
        
        var auth = 'Basic ' + new Buffer("restapi@orbitz-app:restpass001").toString('base64');
                
        console.log ("options url : "+url);
        var options = {
        	    host: 'orbitz-app.saas.appdynamics.com',
        	    method:"GET",
        	    path: url,
        	    headers:{
                    "Authorization": auth
                } 
        	};

        var request = http.get(options,function(response){
            console.log("Fetch URL :  " + url);

            var final = "";

            response.setEncoding('utf8');
            response.setTimeout(timeout,function(err){
                console.log("request timed out");
                callback(null,"Request timed out");
            })
            response.on('error',function(err){
                console.log("_getFeed ERROR " + err);
                callback("ERROR",err);
            })

            response.on('data',function(data){
                console.log("data : "+data);
                final = final + data;
            })

            response.on('end',function(){
                callback(final);
            })

        })
        
        request.end();
    }
	
	
    var  ___wxArray = [];

    this._longRunningTask = function(data){

        ___wxArray = [];

        
        Object.keys(data).forEach(function(url){
            var station = data[url]
            var stationAsyncConstructor = function(callback){
                console.log("push " + station)
                this._getFeed(station,null,function(results){

                    parseString(results,function(err, json){
//                        if(err)console.log("Parsing parseString(): " + err);
                        callback(null,JSON.stringify(json));
                    })
                })
            }.bind(this)
            console.log("outside "  + station);
            ___wxArray.push(stationAsyncConstructor);
        }.bind(this))
    }

    

    /**
     * Asynchronous background task for loading weather station data
     * Utilizes: https://github.com/caolan/async#parallel
     * @param data An array of functions that include the GET requests
     * @private
     */
    this._async = function(/* Array */ data){

        try{
            async.parallel(data,function(err,results){
                console.log("Station data retrieved! COUNT = " + results.length);

                try{
                    var data = {
                        "content":results
                    }
                    process.send(data);
                }
                catch(err){
                    console.log("retriever.js: " + err.message + "\n" + err.stack);
                }

            })
        }
        catch(err){
            console.log("_async() " +  err.message + ", " + err.stack);
        }
    }

    this._startTimer = function(){
        var count = 0;

        ___backgroundTimer = timers.setInterval(function(){

            try{
                var date = new Date();
                console.log("retriever.js: datetime tick: " + date.toUTCString());
                this._longRunningTask(msg.content);
                this._async(___wxArray);
            }
            catch(err){
                count++;
                if(count == 3){
                    console.log("retriever.js: shutdown timer...too many errors. " + err.message);
                    clearInterval(___backgroundTimer);
                    process.disconnect();
                }
                else{
                    console.log("timer.js: " + err.message + "\n" + err.stack);
                }
            }
        }.bind(this),msg.interval);
    }

    this._init = function(){
        if(msg.content != null || msg.content != "" && msg.start == true){
            //this._longRunningTask(msg.content);
            //this._async(___wxArray);
            //this._startTimer();
        }
        else{
            console.log("retriever.js: content empty. Unable to start timer.");
        }
    }.bind(this)()

})

process.on('uncaughtException',function(err){
    console.log("retriever.js: " + err.message + "\n" + err.stack + "\n Stopping background timer");
    clearInterval(___backgroundTimer);
})