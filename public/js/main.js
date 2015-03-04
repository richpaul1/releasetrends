define(function(require, exports, module) {
  'use strict';
  var d3            = require('d3/d3');
  var Engine        = require('famous/core/Engine');
  var Surface       = require('famous/core/Surface');
  var Transform     = require('famous/core/Transform');
  var Scrollview    = require('famous/views/Scrollview');
  var StateModifier = require('famous/modifiers/StateModifier');
  var ViewSequence  = require('famous/core/ViewSequence');
  var treeMapView   = require('treeMapView');
  var EventHandler = require('famous/core/EventHandler');

  var el = document.getElementById("charts");
  var profile = document.getElementById("profile").value;
  var mainContext = Engine.createContext(el);
  mainContext.setPerspective(500);

  var viewSize = [500, 500];
  
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
	
	var index = 0;
	var length = metrics.length;
	var interval = 10000;
	if(length > 20)
		interval = 7000;
	if(length > 30)
		interval = 5000;

	var firstInterval = setInterval(function () {
		if(index==0){
		    var graph = metrics[index++];
		    if(graph){
		    	console.log(graph.name+" "+graph.appid+" "+graph.id);
		    	var graphdata = {"graph":graph.appid+"_"+graph.id};
		    	eventHandler.emit("showGraph",graphdata);
		    }
		}
	 }, 50);
	
	var mainInterval = setInterval(function () {
		clearInterval(firstInterval);
		if(index > length){
			clearInterval(mainInterval);
			location.reload(); 
		}
	    var graph = metrics[index++];
	    if(graph){
	    	console.log(graph.name+" "+graph.appid+" "+graph.id);
	    	var graphdata = {"graph":graph.appid+"_"+graph.id};
	    	eventHandler.emit("showGraph",graphdata);
	    }
	 }, interval);
  });
  
});