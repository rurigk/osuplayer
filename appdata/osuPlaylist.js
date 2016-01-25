var fs = require("fs");
var path = require("path");

var osuFiles = [];
var media = {};

function errorLog(w){
	fs.appendFileSync('error.log', w, 'utf8');
}

function btoaU(str) {
	return window.btoa(unescape(encodeURIComponent(str)));
}

function atobU(str) {
	return decodeURIComponent(escape(window.atob(str)));
}

function getMedia(osuPath){
	osuFiles = [];
	media = {};
	var folders = fs.readdirSync(osuPath);
	for (var i = 0; i < folders.length; i++) {
		osuFiles = osuFiles.concat(getOsuFiles(path.join(osuPath,folders[i])));
	};

	osuFiles = osuFiles.slice(0,50); //Debug mode ===================================
	
	for (var i = 0; i < osuFiles.length; i++) {
		var ofd = getOsuFileData(osuFiles[i]);
		if(ofd != null){
			if(media[ofd.title+ofd.mapid] == undefined){
				media[ofd.title+ofd.mapid]=ofd;
			}else{
				if(ofd.backgrounds.length > 0 && media[ofd.title+ofd.mapid].backgrounds.indexOf(ofd.backgrounds[0]) < 0){
					media[ofd.title+ofd.mapid].backgrounds[media[ofd.title+ofd.mapid].backgrounds.length] = ofd.backgrounds[0];
				}
			}
		}
	};
	return media;
}

function getOsuFiles(fpath){
	try{
		var files = fs.readdirSync(fpath);
		for (var i = files.length - 1; i >= 0; i--) {
			if(path.extname(files[i]) != '.osu'){
				files.splice(i,1);
			}else{
				files[i] = path.join(fpath,files[i]);
			}
		};
	}catch(e){
		errorLog("listing .osu files Error : "+e.message);
		console.log(e);
		var files=[];
	}
	return files;
}
function getOsuFileData(fpath){
	var dataIni = fs.readFileSync(fpath,{encoding:'utf8'});
	var mapid = path.basename(path.dirname(fpath));
	mapid = mapid.substr(0,mapid.indexOf(" "))
	var nameRegex = /AudioFilename: ?(.+)/;
	var titleRegex = /Title:(?: ?(.+))?/;
	var titleRegexU = /TitleUnicode:(?: ?(.+))?/;
	var artistRegex = /Artist:(?: ?(.+))?/;
	var artistRegexU = /ArtistUnicode:(?: ?(.+))?/;
	var creatorRegex = /Creator:(?: ?(.+))?/;
	var bgRegex = /0,0,"(.+)"/;
	var bgx = bgRegex.exec(dataIni);
	var title = titleRegex.exec(dataIni);
	var titleU = titleRegexU.exec(dataIni);
	var artist = artistRegex.exec(dataIni);
	var artistU = artistRegexU.exec(dataIni);
	if(title == null || typeof title[1] == "undefined"){title = false;}
	if(titleU == null || typeof titleU[1] == "undefined"){titleU = false;}
	if(artist == null || typeof artist[1] == "undefined"){artist = false;}
	if(artistU == null || typeof artistU[1] == "undefined"){artistU = false;}
	try{
		var data = {
			path : path.dirname(fpath),
			file : nameRegex.exec(dataIni)[1],
			title : title[1] || "",
			titleUnicode : titleU[1] || "",
			artist : artist[1] || "",
			artistUnicode : artistU[1] || "",
			creator : creatorRegex.exec(dataIni)[1] || "",
			backgrounds : (bgx != null)? [bgx[1]]:[],
			mapid : mapid
		};
	}catch(e){
		console.log(e)
		errorLog(".osu Error : "+e.message+"\n"+fpath);
		var data = null
	}
	return data;
}

module.exports = {
	getMedia : getMedia
}