var log4js = require('log4js');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var config = require('./config.json');
var manager = require('./src/manager.js');
var trending = require('./routes/trendingjson');
var errorcodescounts = require('./routes/errorcodesjson');
var errorsummaries = require('./routes/errorsummaryjson');
var exceptionstatsjson = require('./routes/exceptionstatsjson.js');
var exceptionlogicjson = require('./routes/exceptionlogicjson.js');
var minutemetricjson = require('./routes/minutemetricjson');
var chart = require('./routes/chart');
var weeklymetricjson = require('./routes/weeklymetricjson');
var schedule = require('node-schedule');
var childProcess = require("child_process");
var fs = require('fs');
var config = require("./config.json");
var moment = require("moment");

var log = log4js.getLogger("app");
var app = express();
var metricanalyzer;
var errorcodeanalyzer;
var cleanup;
var btmetricscheduler;


var init = function(){
	manager.initApplications();
	manager.initTiers();
	manager.initBusinessTransactions();
	metricanalyzer = childProcess.fork("./src/metricanalyzer");
	metricanalyzer.send({"name":"metricanalyzer"});
	errorcodeanalyzer = childProcess.fork("./src/errorcodeanalyzer");
	errorcodeanalyzer.send({"name":"errorcodeanalyzer"});
	
//	cleanup = childProcess.fork("./src/cleanup");
//	cleanup.send({"name":"cleanup"});
//	btmetricscheduler = childProcess.fork("./src/btmetricscheduler");
//	btmetricscheduler.send({"name":"btmetricscheduler"})
	
}()

//app.use(log4js.connectLogger(log4js.getLogger("http"), { level: 'auto' }));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.get('/public/images/*', function (req,res)
{
    res.sendFile (__dirname+req.url);
});

app.use(express.static(__dirname + '/public/images'));


//Make our db accessible to our router
app.use(function(req,res,next){
    req.manager = manager;
    next();
});

app.use('/', routes);
app.use('/trendingjson',trending);
app.use('/errorcodesjson',errorcodescounts);
app.use('/minutemetricjson',minutemetricjson);
app.use('/weeklymetricjson',weeklymetricjson);
app.use('/errorsummaryjson',errorsummaries);
app.use('/exceptionstatsjson',exceptionstatsjson);
app.use('/exceptionlogicjson',exceptionlogicjson);

app.get('/dashhelp.html', function(req, res) {
	res.render('dashhelp');
});

app.get('/chart.html', function(req, res) {
	var appid = parseInt(req.query.appid);
	var tierid = parseInt(req.query.tierid);
	req.manager.getMinuteMetrics(appid,tierid).then(function (data) {
		res.render('chart',{"appid":appid,"tierid":tierid,"metricRec":data,"LastMinutes":config.trending_use_number_of_mins,"LastWeeks":config.trending_use_number_of_weeks,"FutureMinutes":config.trending_use_future_number_of_mins});
	},log.error);
});

app.get('/dashboard.html',function(req,res){
	var profile = req.query.profile;
	if(!profile){
		profile = "";
	}
	res.render('exceptiondashboard',{"profile":profile});
});

app.get('/bubbleDashboard.html',function(req,res){
	var profile = req.query.profile;
	if(!profile){
		profile = "";
	}
	res.render('exceptionbubbles',{"profile":profile});
});

app.get('/errorcodes.html',function(req,res){
	var date = req.query.date;
	if(!date){
		date = moment().format("MM-DD-YYYY");
	}
	res.render('errorcodes',{"date":date});
});

app.get('/errorsummary.html',function(req,res){
	var controller;
	if(config.https){
		controller= "https://"+config.controller;
	}else{
		controller = "http://"+config.controller;
	}
	var errorcode = parseInt(req.query.errorcode);
	var date = req.query.date;
	res.render('errorsummary',{"errorcode":errorcode,"date":date,"controller":controller});
});

app.get('/tierdetails.html',function(req,res){
	var appid = req.query.appid;
	var tierid=req.query.tierid;
	req.manager.fetchApp(appid).then(function(app){
		var url = app.controller_url+"/controller/#/location=APP_COMPONENT_MANAGER&timeRange=last_15_minutes&application="+appid+"&component="+tierid;
		res.render('tierdetails',{"url":url,"appid":appid,"tierid":tierid,"week":config.trending_use_number_of_weeks,"lastminutes":config.trending_use_number_of_mins});
	},log.error);
});


// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
    	log.error("Something went wrong:", err);
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
	log.error("Something went wrong:", err);
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


process.on('exit', function() {
	  console.log("shutting down");
	  manager.close();
	  errorcodeanalyzer.close();
	  metricanalyzer.close();
	  cleanup.close();
	  btmetricscheduler.close();
	  
});

module.exports = app;
