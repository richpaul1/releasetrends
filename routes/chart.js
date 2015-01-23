var express = require('express');
var router = express.Router();

module.exports.index = function(req, res){ 
	res.index('chart');
};

module.exports = router;
