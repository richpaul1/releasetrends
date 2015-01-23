var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
	req.manager.getTrendingMetrics(req.query.profile).then(function (data) {
		res.json(data);
	},console.error);
	
});

module.exports = router;
