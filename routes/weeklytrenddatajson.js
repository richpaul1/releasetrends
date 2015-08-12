var express = require('express');
var router = express.Router();

router.get('/:metricid/:date/:week', function(req, res) {
	req.trendmanager.getWeeklyMetrics(parseInt(req.params.metricid),req.params.date,req.params.week).then(function (data) {
		res.json(data);
	},console.error);
});

module.exports = router;
