var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
	var metrics = req.trendmanager.getMetricsToTrend();
	res.json(metrics);
});

module.exports = router;
