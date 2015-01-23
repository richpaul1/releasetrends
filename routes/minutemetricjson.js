var express = require('express');
var router = express.Router();

router.get('/:appid/:tierid', function(req, res) {
	req.manager.getMinuteMetrics(parseInt(req.params.appid),parseInt(req.params.tierid)).then(function (data) {
		res.json(data);
	},console.error);
	
});

module.exports = router;
