
var config = require('../config.json');

var number_of_days_to_factor_for_trend = config.number_of_days_to_factor_for_trend;
var Friday = 5;

exports.getWeekStartAndWeekEndDate =  function(selectedDate){
	//first find the very next Friday
	var endDate = new Date(selectedDate.getTime());
	endDate.setDate(selectedDate.getDate() + ((Friday + 7 - endDate.getDay()) % 7) );

	//find the starting Monday based on the number of days to account for
	var startDate = new Date(endDate.getTime());
	startDate.setDate(endDate.getDate() - number_of_days_to_factor_for_trend);
	startDate.setHours(0);
	startDate.setMinutes(0);
	startDate.setSeconds(0);

	//set end date to be end of the day.
	endDate.setMinutes(59);
	endDate.setHours(23);
	endDate.setSeconds(59);
	
	
	var dateResult = {};
	dateResult.endDate = endDate;
	dateResult.startDate = startDate;
	
	return dateResult;
} 