var http = require("http");
var spider = {}

spider.getUserData = function(user,callback){
	var image_regex = /<div class="avatar-holder"><img src="\/\/a\.ppy\.sh\/(.+)" alt="User avatar"\/><\/div>/g;
	var name_regex = /<div class="profile-username" (?:title="(?:.+)")?>\n?(.+)\n?<\/div>/g;
	var country_regex = /<img class='flag' title='(.+)'/g;
	spider.webrequest("osu.ppy.sh","/u/"+user,80,function(dt){
		try{
			var userimage = image_regex.exec(dt)[1];
			var username = name_regex.exec(dt)[1];
			var usercountry = country_regex.exec(dt)[1];
		}catch(e){
			console.log(dt);
			console.log(e);
			var userimage = "img/avatar-guest.png";
			var username = "";
			var usercountry = "";
		}
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

	var req = http.request(options, function(response) {
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