var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');
var scanner = require('./src/exceptionscanner.js');
var config = require('./config.json');
var manager = require('./src/manager.js');
var trending = require('./routes/trending');

var app = express();

var childProcess = require("child_process"),
	_finalizedData = null,
	_httpRequestArray = [
	    "http://w1.weather.gov/xml/current_obs/KAEJ.xml",
	    "http://w1.weather.gov/xml/current_obs/KDEN.xml",
	    "http://w1.weather.gov/xml/current_obs/KLMO.xml",
	    "http://w1.weather.gov/xml/current_obs/KMYP.xml"];

var data = {
		"start":true,
		"interval": 5000,/* Change this after testing. Recommend 60 * 60 * 1000 */
		"content": _httpRequestArray,
		"config" : config
}

var init = function(){
	
	//init the db.
	manager.initApplications();
	manager.initTiers();
	
	//manager.updateMinMetrics();
	//manager.updateWeekMetrics();

	//manager.fetchMetrics(function(metric){
	//	console.log("typeof : "+typeof(metric.metrics[0].metricValues));
	//});
	//
//	var metricupdater = childProcess.fork("./src/minmetricupdater");
//	metricupdater.send({"name":"metricupdater","interval":6000});

//	var metricupdater = childProcess.fork("./src/weekmetricupdater");
//	metricupdater.send({"name":"metricupdater","interval":60000});

	
//	var metricanalyzer = childProcess.fork("./src/metricanalyzer");
//	metricanalyzer.send({"name":"metricanalyzer","interval":1000});
	
}()



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//Make our db accessible to our router
app.use(function(req,res,next){
    req.manager = manager;
    next();
});

app.use('/', routes);
app.use('/users', users);
app.use('/trending',trending);

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
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
