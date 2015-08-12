var log4js = require('log4js');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var config = require('./config.json');

var metricstotrendjson 	= require('./routes/metricstotrendjson');
var weeklytrenddata		= require('./routes/weeklytrenddatajson');
var trendManager = require("./src/trendmanager.js");

var schedule = require('node-schedule');
var childProcess = require("child_process");
var fs = require('fs');
var config = require("./config.json");
var moment = require("moment");

var log = log4js.getLogger("app");
var app = express();


var init = function(){
	
	
}()


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
    req.trendmanager = trendManager;
    next();
});

app.use('/', routes);

app.get('/sop.html', function(req, res) {
	res.render('sop');
});


//weekly trend

app.get('/weeklytrend.html',function(req,res){
	res.render('weeklytrend');
});

app.get('/weeklytrendview.html',function(req,res){
	var metricId  = req.query.metricId;
	var date =req.query.date;
	res.render('weeklytrendchart',{"metricid":metricId,"date":date});
});

app.use('/metricstotrendjson',metricstotrendjson);
app.use('/weeklytrenddata',weeklytrenddata);



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
