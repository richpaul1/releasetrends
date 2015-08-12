
var Friday = 5;

exports.getWeekStartAndWeekEndDate =  function(selectedDate){
	//first find the next Friday
	var endDate = new Date(selectedDate.getTime());
	endDate.setDate(selectedDate.getDate() + (Friday + 7 - endDate.getDay()) % 7);

	//find the previous Monday
	var startDate = new Date(endDate.getTime());
	startDate.setDate(endDate.getDate() - 16);

	//set end date to be end of the day.
	endDate.setMinutes(59);
	endDate.setHours(23);
	endDate.setSeconds(59);
	
	
	var dateResult = {};
	dateResult.endDate = endDate;
	dateResult.startDate = startDate;
	
	return dateResult;
} 