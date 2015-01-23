var express = require('express');
var router = express.Router();

router.get('/:appid/:tierid', function(req, res) {
	console.log("fetching Exception Data ...");
	var appid = parseInt(req.params.appid);
	var tierid = parseInt(req.params.tierid);
	
	req.manager.buildExceptionStats(appid,tierid).then(function (data) {
		req.manager.fetchExceptionData(appid,tierid).then(function (data) {
			console.log("response :"+JSON.stringify(data));
			res.json(data);
		},console.error);
	},console.error);
	
});

module.exports = router;
