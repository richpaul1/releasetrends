var system = require('system');
var fs = require('fs');

var dir     = system.args[1];
var url     = system.args[2];
var appid 	= system.args[3];
var tierid 	= system.args[4];

fs.changeWorkingDirectory(dir);

console.log("system args :"+system);

var page = require('webpage').create();
page.settings.userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36"	
page.open(url+"/chart.html?appid="+appid+"&tierid="+tierid, function() {
	
//page.zoomFactor = 1;
	
page.onInitialized = function () {
    page.evaluate(function () {
    	window.screen = {
            width: 550,
            height: 550
        }
    });
};

page.viewportSize = {
  width: 550,
  height: 550
};

window.setTimeout(function () {
        page.render(appid+"_"+tierid+'.png');
		phantom.exit(0);
		phantom._phantom.kill('SIGTERM');
    }, 5000); 
});

