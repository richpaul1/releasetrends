var express = require('express');
var router = express.Router();

router.get('/:appid/:tierid', function(req, res) {
	req.manager.buildExceptionStats(parseInt(req.params.appid),parseInt(req.params.tierid));
});

module.exports = router;
