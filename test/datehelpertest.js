var log4js 			= require('log4js');
var log 			= log4js.getLogger("datehelpertest");
var assert    		= require("chai").assert;
var dateHelper      = require("../src/datehelper.js")

describe("Get the week start date and week end date based on a selected date", function() {

	var selectedDate = new Date("07/23/2015");
	var dateResult = dateHelper.getWeekStartAndWeekEndDate(selectedDate);

	it('check start date', function(){
		assert.equal(20,dateResult.startDate.getDate());
		assert.equal(6,dateResult.startDate.getMonth());
		assert.equal(2015,dateResult.startDate.getFullYear());
		assert.equal(0,dateResult.startDate.getHours());
		assert.equal(0,dateResult.startDate.getMinutes());
		assert.equal(0,dateResult.startDate.getSeconds());
	});

	it('check end date', function(){
		assert.equal(24,dateResult.endDate.getDate());
		assert.equal(6,dateResult.endDate.getMonth());
		assert.equal(2015,dateResult.endDate.getFullYear());
		assert.equal(23,dateResult.endDate.getHours());
		assert.equal(59,dateResult.endDate.getMinutes());
		assert.equal(59,dateResult.endDate.getSeconds());
	});

	
});

describe("What if we selected a Friday, it should stay the same Friday", function() {

	var selectedDate = new Date("07/24/2015");
	var dateResult = dateHelper.getWeekStartAndWeekEndDate(selectedDate);

	it('check start date', function(){
		assert.equal(20,dateResult.startDate.getDate());
	});

	it('check end date', function(){
		assert.equal(24,dateResult.endDate.getDate());
	});
	
});


describe("What if we selected a Monday, it should stay the same Friday", function() {

	var selectedDate = new Date("07/20/2015");
	var dateResult = dateHelper.getWeekStartAndWeekEndDate(selectedDate);

	it('check start date', function(){
		assert.equal(20,dateResult.startDate.getDate());
	});

	it('check end date', function(){
		assert.equal(24,dateResult.endDate.getDate());
	});
	
});

describe("Different Format of the date", function() {

	var selectedDate = new Date("07-20-2015");
	var dateResult = dateHelper.getWeekStartAndWeekEndDate(selectedDate);

	it('check start date', function(){
		assert.equal(20,dateResult.startDate.getDate());
	});

	it('check end date', function(){
		assert.equal(24,dateResult.endDate.getDate());
	});
	
});



