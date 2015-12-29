var log4js 			= require('log4js');
var log 			= log4js.getLogger("weeklytrendcalculatortest");
var assert    		= require("chai").assert;
var calculator 		= require("../src/weeklytrendcalculator.js");
var sinon      		= require('sinon');
var metricdata1 	= require('./metricdata1.json');
var request 		= require("request");

var trendData = {};
trendData.metricUrl = "/someUrl";
trendData.metricName = "/somePath";
trendData.metricData = metricdata1;


//{ metricUrl: '/someUrl',
//	  metricName: '/somePath',
//	  metricData: 
//	   [ { frequency: 'SIXTY_MIN',
//	       metricId: 195230,
//	       metricName: 'BTM|Application Diagnostic Data|SEP:58109|Average Response Time (ms)',
//	       metricPath: 'Service End Points|CWG-PST|EJB Advanced Copy|Average Response Time (ms)',
//	       metricValues: [Object] } ],
//	  avgvalue: 21061.367965367965,
//	  b1: -8.164646897330556,
//	  b0: 22008.467005458308,
//	  future15: 15933.969713844373,
//	  future1: 0,
//	  yavg: 21061.367965367965,
//	  factor: 0.756549609695117,
//	  evaltime: 282,
//	  trend: 'F' }


describe("Test the calculation", function() {
	it('Test calculation', function (done) {
		calculator.calculateTrend(trendData,function(results){
			log.debug(results);
			assert.equal(results.future15, 15933.969713844373,"compare future value");
			done();
		});	
    });
});
