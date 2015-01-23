var express = require('express');
var router = express.Router();

router.get('/:errorcode/:date', function(req, res) {
	req.manager.getErrorCodeSummaries(req.params.errorcode,req.params.date).then(function (data) {
		res.json(data);
	},console.error);
	
});

module.exports = router;
