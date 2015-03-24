define(function(require, exports, module) {
  'use strict';
  var d3            = require('d3/d3');
  var Engine        = require('famous/core/Engine');
  var Surface       = require('famous/core/Surface');
  var Transform     = require('famous/core/Transform');
  var Scrollview    = require('famous/views/Scrollview');
  var StateModifier = require('famous/modifiers/StateModifier');
  var ViewSequence  = require('famous/core/ViewSequence');
  var treeMapView   = require('treeMapBubbleView');
  var EventHandler = require('famous/core/EventHandler');

  var el = document.getElementById("charts");
  var profile = document.getElementById("profile").value;
  var mainContext = Engine.createContext(el);
  mainContext.setPerspective(500);

  var viewSize = [800, 600];
  
  var metrics;
  var view;
  var eventHandler = new EventHandler();
  
  var url = '/trendingjson';
  if(profile){
	  url = url+"?profile="+profile;
  }
  
  d3.json(url, function (err, data) {
	metrics = data;
	view = treeMapView(viewSize,data,eventHandler)
    mainContext.add(view);
	
	var interval = 60000;
	
	var mainInterval = setInterval(function () {
		console.log("interval reached");
		clearInterval(interval);
		location.reload(); 
	 }, interval);
  });
  
});