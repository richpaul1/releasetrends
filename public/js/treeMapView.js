
define(function(require, exports, module) {
  var d3            = require('d3/d3');
  var View          = require('famous/core/View');
  var Surface       = require('famous/core/Surface');
  var Transform     = require('famous/core/Transform');
  var StateModifier = require('famous/modifiers/StateModifier');
  var Easing        = require('famous/transitions/Easing');
  var Modifier      = require('famous/core/Modifier');
  
  var treeMapView = function (viewSize, data) {
    var tooltip  = { w: 150, h: 60 };
    var margins  = {t: 50, r: 100, b: 20, l: 200};
    var view = new View({size: viewSize});
    var counter = 0;
    var format = d3.format(",")

    var dim1 = viewSize[0] - margins.l - margins.r;
    var dim2 = viewSize[1] - margins.t - margins.b;
    var diameter = dim1 < dim2 ? dim1: dim2;
    var color = d3.scale.ordinal().range(['#4C5355','#E2BF7A','#36211C','#4C838A','#723E0F','#586C97','#AA8439']);

    var bubble = d3.layout.pack()
        .sort(function (d) { return d.comb })
        .size([diameter,diameter])
        .padding(2)

    for (var i = 0; i < data.length; i++) {
      //data[i].value  = data[i].yavg;
      data[i].value  = 500;
      data[i].name   = data[i].tiername;
    }

    var root = {children:[]};
    
    var blacklist = ['FQA1'];
    
    var apps = _.unique(_.pluck(data, 'appname'));
    apps.forEach(function (app) {
      if(blacklist.indexOf(app)<0){	
	      var appData = data.filter(function (metric) {
	        return metric.appname === app;
	      });
	      
	      var value = 0;
	      appData.forEach(function(metric){
	    	  //value += metric.value;
	    	  value += 500;
	      });
	
	      //*1.5 so that the inner circle does not fill up the outer circle
	      root.children.push({"name":app,"value":(value),"children":appData});
      }
    });
    
    bubble.nodes(root);
    console.log(root);

    var background = new Surface({
      size: viewSize,
      properties: {
        backgroundColor: '#fff',
        border: '1px solid #6E7577',
        borderRadius: '8px'
      }
    });

    var titleSurface = new Surface({
      size: [viewSize[1],margins.t],
      classes: ['title'],
      content: 'Trending Exceptions: ',
      properties: {
        zIndex: 5,
        fontSize: '20px',
        textAlign: 'left',
        color: 'black',
      }
    });

    var titleModifier = new StateModifier({
      origin: [0.10, 0]
    });

    var tooltipSurface = new Surface({
      size: [tooltip.w, tooltip.h],
      classes: ['tooltip']
    });

    var tooltipModifier = new StateModifier({
      origin: [0, 0]
    });

    var getColor = function (d) {
        return color(d.color);
    }

    var getBubble = function (d) {
      var factor = 2;    	
      var bubble = new Surface({
        size: [d.r * factor, d.r * factor],
        content: d.name,
        properties: {
          fontSize: '20px',
          borderRadius: '50%',
          textAlign: 'center',
          color: 'white',
          border: '1px solid '+getColor(d),
          backgroundColor: getColor(d)
        }
      });

      bubble.on('mouseover', function (e) {
        var newX, newY;
        if (d.depth > 1) {
          tooltipSurface.setProperties({display: 'inline'});

          var text = d.appname + " "+d.tiername;
          tooltipSurface.setContent(text);

          newX = d.x + margins.l - (tooltip.w / 2) + d.r;
          newY = d.y + margins.t - tooltip.h - 20;

          tooltipModifier.setTransform(
            Transform.translate(newX, newY, 10),
            { duration : 50, curve: Easing.outCirc }
          );

          this.setProperties({
            backgroundColor: '#C0B5B2'
          });
        }
      });

      bubble.on('mouseout', function() {
        tooltipSurface.setProperties({display: 'none'});
        this.setProperties({
          backgroundColor: getColor(d)
        });
      });

      return bubble;
    };

    var getBubbleModifier = function (d, i) {
      var modifier = new StateModifier({
        align: [0, 0],
        origin: [0.5, 0.5]
      });

      modifier.setTransform(
        Transform.translate(d.x + 2000, d.y + margins.t, d.depth + 2),
        { duration : 0 , curve: Easing.inOutElastic }
      );
      modifier.setTransform(
        Transform.translate(d.x + margins.l, d.y + margins.t, d.depth + 2),
        { duration : i * 30 + 30, curve: Easing.inOutElastic }
      );

      return modifier;
    };

    var recurseBubbles = function (node) {
    	var children = node.children;
    	for (var i = 0; i < children.length; i++) {
    		var node = children[i];
    		node.color = i;
    		view.add(getBubbleModifier(node,i)).add(getBubble(node));
    		if(node.children){
    			recurseBubbles(node);
    		}
    	}
    };

    view.add(background);
    view.add(tooltipModifier).add(tooltipSurface);
    view.add(titleModifier).add(titleSurface);

    recurseBubbles(root);

    return view;
  };
  
  module.exports = treeMapView;
});