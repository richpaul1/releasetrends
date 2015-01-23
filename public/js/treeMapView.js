
define(function(require, exports, module) {
  var d3            = require('d3/d3');
  var View          = require('famous/core/View');
  var Surface       = require('famous/core/Surface');
  var ImageSurface = require("famous/surfaces/ImageSurface");
  var Transform     = require('famous/core/Transform');
  var StateModifier = require('famous/modifiers/StateModifier');
  var Easing        = require('famous/transitions/Easing');
  var Modifier      = require('famous/core/Modifier');
  var EventHandler = require('famous/core/EventHandler');
  
  var mouseActivity = false;
  
  var treeMapView = function (viewSize, data,eventHandler) {
    var margins  = {t: 5, r: 5, b: 5, l: 5};
    var view = new View({size: viewSize});
    var counter = 0;
    var format = d3.format(",")

    var dim1 = viewSize[0] - margins.l - margins.r;
    var dim2 = viewSize[1] - margins.t - margins.b;
    var diameter = dim1 < dim2 ? dim1: dim2;
    var colorapps = ['#42647f'];
    var colortiers = ['#c8c8c8','#89be44','#00aa00','#f2d007','#ffaa00','#ff5500','#ff0000','#aa0000'];
    var colorblocks = ['#c8c8c8','#f2d007','#aa0000'];

    var bubble = d3.layout.pack()
        .sort(function (d) { return d.comb })
        .size([500,600])
        .padding(4)

    for (var i = 0; i < data.length; i++) {
      data[i].value  = 500;
      data[i].name   = data[i].tiername;
    }

    var root = {children:[]};
    
    var apps = _.unique(_.pluck(data, 'appname'));
    
    console.log("apps :"+JSON.stringify(apps));
    
    
    
    apps.forEach(function (app) {
      var appData = data.filter(function (metric) {
        return metric.appname === app;
      });
      
      var value = 0;
      var appid;
      appData.forEach(function(metric){
    	  value += metric.value + 500;
    	  appid = metric.appid;
      });

      //*1.5 so that the inner circle does not fill up the outer circle
      root.children.push({"name":app,"value":(value),"appid":appid,"children":appData});
    });
    
    console.log("")
    bubble.nodes(root);

    var background = new Surface({
      size: viewSize,
      properties: {
        backgroundColor: '#fff',
      }
    });

    var titleSurface = new Surface({
      size: [200,10],
      classes: ['title'],
      content: 'Trending Exceptions: ',
      properties: {
        fontSize: '12px',
        textAlign: 'left',
        color: 'black',
        padding:'5px'
      }
    });

    var titleModifier = new StateModifier({
      origin: [0, 0]
    });

    var tooltipSurface = new ImageSurface({
      size: [675, 700], //width and height
      classes: ['tooltip']
    });

    var tooltipModifier = new StateModifier({
      origin: [0, 0]
    });

    var getColorOld = function (d) {
    	if(d.depth == 1)
    		return colorapps[0];
    	else{
    		var factor = parseInt(d.factor / 10);
    		if(factor > 7){
    			factor = 7;
    		}
    		//console.log(d.name+" d.factor "+d.factor +" "+factor+ " colortiers(factor) : "+colortiers[factor]);
    		return colortiers[factor];
    	}
    }
    
    var getColor = function (d) {
    	if(d.depth == 1)
    		return colorapps[0];
    	else{
    		var factor = parseInt(d.factor);
    		if(factor <= 10){
    			return colorblocks[0];
    		}
    		if(factor >10 && factor <= 50){
    			return colorblocks[1];
    		}
    		if(factor > 50){
    			return colorblocks[2];
    		}
    	}
    }

    var getBubble = function (d) {
      var factor = 2;   
      
      var textDiv;
      if(d.depth == 1){
    	  d.textDiv = "<div class=\"apptitle\">["+d.appid+"] "+d.name+"</div>"
      }else{
    	  //d.textDiv = "<div class=\"exception\"><font class=\"factor\">"+parseInt(d.factor)+"</font> <a href=\""+d.controller_url+"/controller/#/location=APP_COMPONENT_MANAGER&timeRange=last_15_minutes&application="+d.appid+"&component="+d.id+"\">"+d.name+"</a></div>";
    	  d.textDiv = "<div class=\"exception\"><font class=\"factor\">"+parseInt(d.factor)+"</font>"+d.name+"</div>";
      }
      
      var bubble = new Surface({
        size: [d.r * factor, d.r * factor],
        content:d.textDiv,
        properties: {
          fontSize: '20px',
          borderRadius: '50%',
          textAlign: 'center',
          verticalAlign:'middle',
          color: 'white',
          border: '1px solid '+getColor(d),
          backgroundColor: getColor(d),
          dapp: d.appid,
          dtier:d.id,
          originalContent : textDiv
        }
      });
      
      bubble.on('click',function(e){
    	  //var url = d.controller_url+"/controller/#/location=APP_COMPONENT_MANAGER&timeRange=last_15_minutes&application="+d.appid+"&component="+d.id;
    	  var url = "/tierdetails.html?appid="+d.appid+"&tierid="+d.id;
    	  window.open(url,'_blank');
      });

      bubble.on('mouseover', function (e) {
    	  mouseActivity = true;
    	  
    	  var newX, newY;
          if (d.depth > 1) {
        	this.setProperties({borderRadius:'0%',zIndex:'5',backgroundColor: 'white'});
        	
            tooltipSurface.setProperties({display: 'inline',position:'relative',zIndex:'55'});
            tooltipSurface.setContent("/public/images/"+d.appid+"_"+d.id+".png");

            newX = 510;
            newY = 0;

            tooltipModifier.setTransform(
              Transform.translate(newX, newY, 10),
              { duration : 50, curve: Easing.outCirc }
            );
            
          }
        });
      
      bubble.on('mouseout', function() {
    	  mouseActivity = false;
    	  if (d.depth > 1) {
    		  this.setProperties({borderRadius:'50%',zIndex:'5'});
    		  this.setContent(d.textDiv);
    	  }
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

    var appscount = 0;
    var recurseBubbles = function (apps) {
    	if(apps){
	    	for (var i = 0; i < apps.length; i++) {
	    		var app = apps[i];
		    	if(app.children && app.children.length ==1){
		    		var node = app.children[0];
		    		node.color = node.debth;
		    		node.name = node.appname+" > "+node.tiername;
					view.add(getBubbleModifier(node,i)).add(getBubble(node));
		    	}else{
		    		app.color = appscount++;
		    		view.add(getBubbleModifier(app,i)).add(getBubble(app));
		    		recurseBubbles(app.children);
		    	}
	    	}
    	}
    };
   
    view.add(background);
    view.add(titleModifier).add(titleSurface);
    recurseBubbles(root.children);
    view.add(tooltipModifier).add(tooltipSurface);
    
    eventHandler.on("showGraph",function(data){
    	
    	if(mouseActivity){
    		return;
    	}
		var newX, newY;
		tooltipSurface.setProperties({display: 'inline',position:'relative',zIndex:'5'});
		tooltipSurface.setContent("/public/images/"+data.graph+".png");
		
		newX = 510;
		newY = 0;
		
		tooltipModifier.setTransform(
		   Transform.translate(newX, newY, 10),
		    { duration : 50, curve: Easing.outCirc }
		);
    });
    
    
    return view;
  };
  
  module.exports = treeMapView;
});