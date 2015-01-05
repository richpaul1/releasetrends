var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
	console.log("trending ...");
	req.manager.getTrendingMetrics().then(function (data) {
		res.json(data);
	},console.error);
	
});

module.exports = router;
