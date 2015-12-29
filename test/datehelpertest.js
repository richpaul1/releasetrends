var log4js 			= require('log4js');
var log 			= log4js.getLogger("datehelpertest");
var assert    		= require("chai").assert;
var dateHelper 		= require("../src/datehelper.js");
var sinon      		= require('sinon');

describe("Test Date Helper Function", function() {
	it('Test Start Date is Set Correctly', function () {
		var date = new Date(2015, 11, 24);
		var dateRange = dateHelper.getWeekStartAndWeekEndDate(date);
		
		var endDate = dateRange.endDate;
		assert.equal(endDate.getMonth(), 11,"Should be December");
		assert.equal(endDate.getDate(), 25,"Should be the 25th of December");
		assert.equal(endDate.getHours(), 23,"Should be 23 hours");
		assert.equal(endDate.getMinutes(), 59,"Should be 59 minutes");
		assert.equal(endDate.getSeconds(), 59,"Should be 59 seconds");
		
		var startDate = dateRange.startDate;
		assert.equal(startDate.getMonth(), 11,"Should be December");
		assert.equal(startDate.getDate(), 1,"Should be the 1st of December, because we are using 24 days");
		assert.equal(startDate.getHours(), 0,"Should be 0 hours");
		assert.equal(startDate.getMinutes(), 0,"Should be 0 minutes");
		assert.equal(startDate.getSeconds(), 0,"Should be 0 seconds");
		
		
    });
});
