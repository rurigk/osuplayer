var http = require("http");
var httpfr = require('follow-redirects').http;

var spider = {}
spider.getUserData = function(user,callback){
	var userObjRegex = /<script id="json-user" type="application\/json">\n(.+)/g;
	spider.webrequest("osu.ppy.sh","/users/"+user,80,function(dt){
		try{
			var profile = JSON.parse(userObjRegex.exec(dt)[1]);
			console.log(profile.avatar_url)
			var userimage = profile.avatar_url;
			var username = profile.username;
			//var usercountry = country_regex.exec(dt)[1];
		}catch(e){
			console.log(e.stack);
			var userimage = "img/avatar-guest.png";
			var username = "";
			var usercountry = "";
		}
		var username = "";
		var usercountry = "";
		this.callback({
			image : userimage,
			name : username,
			country : usercountry
		})
	}.bind({callback:callback}))
}

spider.webrequest = function(host,path,port,callback){
	var options = {
		host: host,
		path: path,
		port: port
	};

	var req = httpfr.request(options, function(response) {
		response.setEncoding('utf8');
		var str = '';
		response.on('data', function (chunk) {
			str += chunk;
		});

		response.on('end', function () {
			callback(str);
		});
		response.on('error', function (e) {
			console.log(error.message);
		});
	});
	req.write("");
	req.end();
}
module.exports = spider;
