function is(w,m){if(m.substr(0,1) == "#"){if(m.substr(1,m.length-1) == w.target.id){return true;}else{return false;}}else if(m.substr(0,1) == "."){fl=w.target.classList.length;for (var i = 0; i < fl; i++){if(w.target.classList[i] == m.substr(1,m.length-1)){return true;break;}else if(i==w.target.classList.length){return false;}};}}
function closest(w,m) {tar=w.target;while (tar.tagName != "HTML") {if(m.substr(0,1) == "#"){if(m.substr(1,m.length-1) == tar.id){return tar;}}else if(m.substr(0,1) == "."){fl=tar.classList.length;for (var i = 0; i < fl; i++){if(tar.classList[i] == m.substr(1,m.length-1)){return tar;break;}};}tar = tar.parentNode;}return null;}
function isclosest(w,m) {tar=w.target;while (tar.tagName != "HTML") {if(m.substr(0,1) == "#"){if(m.substr(1,m.length-1) == tar.id){return true;}}else if(m.substr(0,1) == "."){fl=tar.classList.length;for (var i = 0; i < fl; i++){if(tar.classList[i] == m.substr(1,m.length-1)){return true;break;}};}tar = tar.parentNode;if(tar == null){return false;}}return false;}
function booltoint(w){if(w){return 1;}else{return 0;}}
function strtobool(w){if(w == "true"){return true;}else{return false;}}
function getID(w){return document.getElementById(w);}
function getClass(w){return document.getElementsByClassName(w);}
function show(e){e.style.display='block'};function hide(e){e.style.display='none'};ajax=[];
function str2hex(str){response="";for (var i = 0; i < str.length; i++) {hex=str.charCodeAt(i).toString(16);response+=("000"+hex).slice(-4);};return response;}
function hex2str(str){response="";hexes=str.match(/.{1,4}/g) || [];for (var i = 0; i < hexes.length; i++) {response+=String.fromCharCode(parseInt(hexes[i],16));};return response;}
function btoaU(str) {
	return window.btoa(unescape(encodeURIComponent(str)));
}

function atobU(str) {
	return decodeURIComponent(escape(window.atob(str)));
}

var fs=require('fs');
var path = require('path');
var http = require('http');
var gui = require('nw.gui');
var osu = require('./osuPlaylist.js');

var debug = true;

var cachesongs = {};

var playlists = {
	main : [],
	playlist : []
}
var current_playlist_playing = "main";
var current_playlist = "main";

var audio = new Audio();

path.split=function(w){
	w=w.split('/');
	w[0]='/';
	if(w[w.length-1] == ""){w.splice(w.length-1,1);}
	return w;
};

function fileExists(w){
	try{
		fs.statSync(w);
		return true;
	}catch(e){
		return false;
	}
}

var settings = {};
var main_window = {};
var tabs = {};

/*--Settings--*/
//Directorio de usuario
settings.userdir=(process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE)+"/";
settings.usecache = (typeof localStorage['usecache'] != "undefined")? strtobool(localStorage['usecache']) : true;
settings.findtitle = (typeof localStorage['findtitle'] != "undefined")? strtobool(localStorage['findtitle']) : true;
settings.findartist = (typeof localStorage['findartist'] != "undefined")? strtobool(localStorage['findartist']) : true;
settings.findcreator = (typeof localStorage['findcreator'] != "undefined")? strtobool(localStorage['findcreator']) : false;
audio.volume = (typeof localStorage['volume'] != "undefined")? parseFloat(localStorage['volume']) : 1;
//Main window
main_window=gui.Window.get(0);
main_window.maximized=false;
main_window.on('maximize',function(){
	main_window.maximized=true;
	//resizeWEvent();
})
main_window.on('unmaximize',function(){
	main_window.maximized=false;
	//resizeWEvent();
})
main_window.on('resize',function(){
	//resizeWEvent();
})

keyh={};
keyh.shift=false;
keyh.ctrl=false;
keyh.altk=false;

ui = {};

var dscroll = 0;
var scrollflag = false;

var soundmv = false;
var trackmv = false;
window.addEventListener('load',function(){
	loadElements();
	installLogOnServer();
	loadSongs();
	window.oncontextmenu = function(e){
		e.preventDefault();
		clickManager(e);
		return false;
	}
	window.addEventListener("click",function(e){
		//e.preventDefault();
		clickManager(e);
	})
	window.addEventListener("mousedown",function(e){
		if(is(e,"#trackbar") && !isNaN(audio.duration)){
			trackmv = true;
			trackbar_width = parseInt(getComputedStyle(ui.trackbar, null).width);
			var time = 100*(e.layerX/trackbar_width);
			audio.currentTime = ((audio.duration / 100) * time);
		}
		if(is(e,'#soundbar')){
			soundmv = true;
			var ts = e.layerY-10;
			if(ts < 0){ts = 0;}
			if(ts > 100){ts = 100;}
			tsv = 100-ts;
			ui.soundbar.style.backgroundSize = "11px "+tsv+"px";
			ui.soundbar.style.backgroundPosition = "9px "+(ts+10)+"px";
			audio.volume = tsv/100;
			localStorage['volume'] = audio.volume;
		}
	})
	window.addEventListener('mouseup',function(e){
		soundmv = false;
		trackmv = false;
	})
	ui.trackbar.addEventListener('mousemove',function(e){
		if(trackmv){
			trackbar_width = parseInt(getComputedStyle(ui.trackbar, null).width);
			var time = 100*(e.layerX/trackbar_width);
			audio.currentTime = ((audio.duration / 100) * time);
		}
	})
	ui.soundbar.addEventListener('mousemove',function(e){
		if(soundmv){
			var ts = e.layerY-10;
			if(ts < 0){ts = 0;}
			if(ts > 100){ts = 100;}
			tsv = 100-ts;
			ui.soundbar.style.backgroundSize = "11px "+tsv+"px";
			ui.soundbar.style.backgroundPosition = "9px "+(ts+10)+"px";
			audio.volume = tsv/100;
			localStorage['volume'] = audio.volume;
		}
	})
	window.addEventListener('keydown', function(e){
		if(e.keyIdentifier === 'F5' && debug){window.location.reload();}
		if(e.keyIdentifier === 'F12' && debug){main_window.showDevTools();}
		if(e.keyCode == 16){keyh.shift=true;}
		if(e.keyCode == 17){keyh.ctrl=true;}
		if(e.keyCode == 18){keyh.altk=true;}
	});
	window.addEventListener('keyup', function(e){
		if(e.keyCode == 16){keyh.shift=false;}
		if(e.keyCode == 17){keyh.ctrl=false;}
		if(e.keyCode == 18){keyh.altk=false;}
	});
	window.addEventListener('keypress',function(e){
		if(e.keyCode == 32){
			if(audio.src != ''){
				if(audio.paused){
					audio.play();
					setPlayerState(true);
				}else{
					audio.pause();
					setPlayerState(false);
				}
			}
		}
	})
	ui.songslist.addEventListener('scroll',updateThumbnails);
	playerUi();
});

function updateThumbnails(){
	ui.pldialog.style.display = 'none';
	var scroll = ui.songslist.scrollTop;
	var hview = parseInt(getComputedStyle(ui.songslist, null).height);
	for (var i = 0; i < ui.songslist.childNodes.length; i++) {
		var offset = ui.songslist.childNodes[i].offsetTop;
		var child = ui.songslist.childNodes[i].querySelector('.bgimg');
		if(offset > scroll - 500 && offset < scroll+hview+500){
			child.style.backgroundImage = "url(\""+child.getAttribute('imgurl')+"\")";
		}else{
			child.style.backgroundImage = "";
		}
	};
}

function clickManager(e){
	if(is(e,'.closewindow')){window.close();}
	if(is(e,'.maxwindow')){if(!main_window.maximized){main_window.maximize();}else{main_window.maximized=false;main_window.unmaximize();}}
	if(is(e,'.minwindow')){main_window.minimize();}
	if(is(e,'.maplink')){
		gui.Shell.openExternal("https://osu.ppy.sh/s/"+e.target.getAttribute('mapid'))
	}
	if(is(e,'.bgimg')){
		var name = atobU(e.target.getAttribute('hash'));
		playTrack(name);
		current_playlist_playing = current_playlist;
	}
	if(is(e,'.opendir')){
		ui.opendir.click();
	}
	if(is(e,'#shuffle')){
		if(e.target.getAttribute('actived') == "true"){
			player.shuffle = false;
		}else{
			player.shuffle = true;
		}
		localStorage["shuffle"] = player.shuffle;
		playerUi();
	}
	if(is(e,'#repeat')){
		if(e.target.getAttribute('actived') == "true"){
			player.repeat = false;
		}else{
			player.repeat = true;
		}
		localStorage["repeat"] = player.repeat;
		playerUi();
	}
	if(is(e,'#play')){
		if(audio.src != ""){
			audio.play();
			setPlayerState(true);
		}
	}
	if(is(e,'#pause')){
			audio.pause();
			setPlayerState(false);
	}
	if(is(e,'#prev')){
		prevTrack();
	}
	if(is(e,'#next')){
		nextTrack();
	}
	if(is(e,'.settingsop')){
		ui.settingsbox.style.display = 'flex';
	}
	if(is(e,'.closesettings')){
		ui.settingsbox.style.display = 'none';
	}
	if(is(e,'#savelocation')){
		localStorage['location'] = ui.locationbox.value;
		ui.settingsbox.style.display = 'none';
		loadSongs();
	}
	if(is(e,'.reloadlib')){
		ui.songslist.innerHTML = '';
		loadSongs(true);
	}
	if(is(e,'#usecache')){
		if(ui.usecache.checked == true){
			localStorage['usecache'] = true;
		}else{
			localStorage['usecache'] = false;
		}
	}
	if(is(e,'#findtitle')){
		if(ui.findtitle.checked == true){
			settings.findtitle = true;
			localStorage['findtitle'] = true;
		}else{
			localStorage['findtitle'] = false;
		}
		search(ui.searchbox.value);
	}
	if(is(e,'#findartist')){
		if(ui.findartist.checked == true){
			settings.findartist = true;
			localStorage['findartist'] = true;
		}else{
			settings.findartist = false;
			localStorage['findartist'] = false;
		}
		search(ui.searchbox.value);
	}
	if(is(e,'#findcreator')){
		if(ui.findcreator.checked == true){
			settings.findcreator = true;
			localStorage['findcreator'] = true;
		}else{
			settings.findcreator = false;
			localStorage['findcreator'] = false;
		}
		search(ui.searchbox.value);
	}
	if(is(e,'#sound')){
		if(ui.soundbar.getAttribute('sw') == "true"){
			ui.soundbar.setAttribute('sw','false');
		}else{
			ui.soundbar.setAttribute('sw','true');
		}
	}
	if(is(e,'#gosong') && player.currentTrack != ""){
		var hash = btoaU(player.currentTrack);
		for (var i = 0; i < ui.songslist.childNodes.length; i++) {
			if(ui.songslist.childNodes[i].getAttribute('hash') == hash && ui.songslist.childNodes[i].style.display != 'none'){
				ui.songslist.scrollTop = ui.songslist.childNodes[i].offsetTop;
			}
		}
	}
	if(is(e,'.addtoplaylist')){
		updatePlaylistDialog();
		var fpos = ((e.target.offsetTop+90)-ui.songslist.scrollTop);
		var wdpos = parseInt(getComputedStyle(ui.songslist, null).height);
		if(fpos+200 > wdpos+90){
			fpos -= 170;
		}
		ui.pldialog.style.top = fpos+"px";
		ui.pldialog.style.right = "120px";
		ui.pldialog.style.display = 'block';
	}else{
		ui.pldialog.style.display = 'none';
	}
	if(is(e,'.mainlistsh')){
		current_playlist = 'main';
		showPlaylist('main');
	}
	if(is(e,'.playlistsh')){
		showPlaylists()
		ui.songslist.style.display = 'none';
		ui.playlists.style.display = 'block';
	}
	if(isclosest(e,'.playlist-info')){
		var el = closest(e,'.playlist-info');
		current_playlist = el.getAttribute('plname');
		showPlaylist(current_playlist);
	}
}

audio.addEventListener('ended',function(){
	if(player.shuffle){
		randomSong();
		return;
	}
	if(playlists[current_playlist_playing].indexOf(player.currentTrack) != playlists[current_playlist_playing].length-1){
		var nextTrack = playlists[current_playlist_playing][playlists[current_playlist_playing].indexOf(player.currentTrack)+1];
		playTrack(nextTrack);
	}else{
		setPlayerState(false);
		ui.trackbar.style.backgroundSize = "0% 100%";
		if(player.repeat){
			var firstTrack = playlists[current_playlist_playing][0];
			playTrack(firstTrack);
		}
	}
})
audio.addEventListener('timeupdate',function(){
	ui.trackbar.style.backgroundSize = (100 * (audio.currentTime / audio.duration))+"% 100%";
})

function loadElements(){
	ui.songslist = document.getElementById('songslist');
	ui.playlists = document.getElementById('playlists');
	ui.songtitle = document.getElementById('songtitle');
	ui.songauthor = document.getElementById('songauthor');
	ui.trackbar = document.getElementById('trackbar');
	ui.opendir = document.getElementById('opendir');
	ui.settingsbox = document.getElementById('settings');
	ui.locationbox = document.getElementById('osupath');
	ui.usecache = document.getElementById('usecache');
	ui.usecache.checked = settings.usecache;
	ui.findtitle = document.getElementById('findtitle');
	ui.findtitle.checked = settings.findtitle;
	ui.findartist = document.getElementById('findartist');
	ui.findartist.checked = settings.findartist;
	ui.findcreator = document.getElementById('findcreator');
	ui.findcreator.checked = settings.findcreator;

	//Player
	ui.play = document.getElementById('play');
	ui.pause = document.getElementById('pause');
	ui.prev = document.getElementById('prev');
	ui.next = document.getElementById('next');
	ui.shuffle = document.getElementById('shuffle');
	ui.repeat = document.getElementById('repeat');
	ui.soundbar = document.getElementById('soundbar');
	ui.soundbar.style.backgroundSize = "11px "+(audio.volume*100)+"px";
	ui.soundbar.style.backgroundPosition = "9px "+(100-((audio.volume*100)-10))+"px";

	ui.searchbox = document.getElementById('searchbox');
	ui.searchbox.addEventListener('input',function(){
		search(ui.searchbox.value);
	})

	ui.loadbox = document.getElementById('loadbox');

	ui.pldialog = document.getElementById('addtopl');
	ui.pldialoglist = document.getElementById('plist-db');
}
function loadSongs(fr){
	ui.loadbox.style.display = 'flex';
	setTimeout(function(){
		loadSongsx(fr||false);
	},500);
}
function loadSongsx(fr){
	var fr = fr || false;
	var usecache = false;
	try{
		fs.statSync('songs.cache');
		if(settings.usecache && !fr){
			var usecache = true;
		}
	}catch(e){}
	try{
		fs.statSync(localStorage['location']);
		ui.locationbox.value = localStorage['location'];
		if(debug){
			ui.locationbox.value = "/home/rurigk/.wine/drive_c/users/rurigk/Local Settings/Application Data/osu!/Songs";
		}
	}catch(e){
		ui.loadbox.style.display = 'none';
		ui.settingsbox.style.display = 'flex';
		if(!debug){
			ui.locationbox.value = '';
		}
		return false;
	}
	var cod = "";
	if(!usecache){
		var songsu = osu.getMedia(localStorage['location']);
		var songs = {};
		Object.keys(songsu).sort().forEach(function(key) {
			songs[key] = songsu[key];
		});
		cachesongs = songs;
		fs.writeFile('songs.cache', JSON.stringify(cachesongs), 'utf8');
	}else{
		var songs = JSON.parse(fs.readFileSync('songs.cache',{encoding:'utf8'}));
		cachesongs = songs;
	}
	for(song in songs){
		playlists.main[playlists.main.length] = song;
		showPlaylist(current_playlist);	
	}
	playlists.playlist = playlists.main.slice(0,2);
	setTimeout(function(){
		ui.loadbox.style.display = 'none';
	},150)
}
function showPlaylist(name){
	var cod = '';
	for (var i = 0; i < playlists[name].length; i++) {
		var songname = playlists[name][i];
		if(cachesongs[songname].backgrounds.length > 0){
			var basepath = cachesongs[songname].path;
			var bgpath = path.join(basepath,cachesongs[songname].backgrounds[0]);
			try{
				fs.statSync(bgpath);
				bgpath = bgpath.replace(/&/g, '&amp;');
				bgpath = bgpath.replace(/"/g, '&quot;');
				bgpath = bgpath.replace(/'/g, '&apos;');
				bgpath = bgpath.replace(/#/g, '%23');
				bgpath = bgpath.replace(/\\/g, '/');
			}catch(e){
				var bgpath = "img/osulogo-gray.svg";
			}
		}else{
			var bgpath = "img/osulogo-gray.svg";
		}
		var cca =
		"<div class='song nosel' hash='"+btoaU(songname)+"' titlesong='"+btoaU(cachesongs[songname].title)+"' artistsong='"+btoaU(cachesongs[songname].artist)+"' creatorsong='"+btoaU(cachesongs[songname].creator)+"'>"+
		"	<div class='bgimg l' imgurl='"+bgpath+"' hash='"+btoaU(songname)+"'></div>"+
		"	<div class='songinfo l'>"+
		"		<div class='songtitle'>"+cachesongs[songname].title+"</div>"+
		"		<div class='songartist'>"+cachesongs[songname].artist+"</div>"+
		"		<div class='songmapper'>"+cachesongs[songname].creator+"</div>"+
		"	</div>"+
		"	<div class='r songoptions'>"+
		"		<div class='addtoplaylist' mapid='"+cachesongs[songname].mapid+"'>&#xF067;</div>"+
		"		<div class='maplink' mapid='"+cachesongs[songname].mapid+"'></div>"+
		"	</div>"+
		"</div>";
		cod += cca;
	}
	ui.songslist.innerHTML = cod;
	ui.playlists.style.display = 'none';
	ui.songslist.style.display = 'block';
	updateThumbnails();
}
function showPlaylists(){
	var list = '';
	for(name in playlists){
		if(name != 'main'){
			list += 
			"<div class='playlist nosel' plname='"+name+"'>"+
			"	<div class='bgimg l'></div>"+
			"	<div class='playlist-info l' plname='"+name+"'>"+
			"		<div class='playlist-name'>"+name+"</div>"+
			"		<div class='playlist-tracks'>"+playlists[name].length+" tracks</div>"+
			"		<div class='playlist-other'></div>"+
			"	</div>"+
			"	<div class='r playlist-options'>"+
			"		<div class='editplaylist' plname='"+name+"'>&#xF040;</div>"+
			"		<div class='removeplaylist' plname='"+name+"'>&#xF00D;</div>"+
			"	</div>"+
			"</div>"
		}
	}
	ui.playlists.innerHTML = list;
}
var player = {
	shuffle : (typeof localStorage["shuffle"] == "undefined") ? false:strtobool(localStorage["shuffle"]),
	repeat : (typeof localStorage["repeat"] == "undefined") ? false:strtobool(localStorage["repeat"]),
	currentTrack : ""
}

function playTrack(name){
	player.currentTrack = name;
	ui.songtitle.innerHTML = cachesongs[name].title;
	ui.songauthor.innerHTML = cachesongs[name].artist;
	var songpath = path.join(cachesongs[name].path,cachesongs[name].file);
	if(!fileExists(songpath)){
		var files = fs.readdirSync(path.dirname(songpath));
		var songnameLC = path.basename(songpath).toLowerCase();
		for (var i = 0; i < files.length; i++) {
			if(files[i].toLowerCase() == songnameLC){
				songpath = path.join(path.dirname(songpath),files[i]);
			}
		};
	}
	audio.src = songpath;
	audio.play();
	setPlayerState(true);
}

function nextTrack(){
	if(player.shuffle){
		randomSong();
		return;
	}
	if(playlists[current_playlist_playing].indexOf(player.currentTrack) != playlists[current_playlist_playing].length-1){
		var nextTrack = playlists[current_playlist_playing][playlists[current_playlist_playing].indexOf(player.currentTrack)+1];
		playTrack(nextTrack);
	}else{
		var nextTrack = playlists[current_playlist_playing][0];
		playTrack(nextTrack);
	}
}
function prevTrack(){
	if(player.shuffle){
		randomSong();
		return;
	}
	if(playlists[current_playlist_playing].indexOf(player.currentTrack) != 0){
		var prevTrack = playlists[current_playlist_playing][playlists[current_playlist_playing].indexOf(player.currentTrack)-1];
		playTrack(prevTrack);
	}else{
		var prevTrack = playlists[current_playlist_playing][playlists[current_playlist_playing].length-1];
		playTrack(prevTrack);
	}
}

function randomSong(){
	var randomTrack = playlists[current_playlist_playing][parseInt(Math.random() * playlists[current_playlist_playing].length)];
	playTrack(randomTrack);
}

function playerUi(){
	if(player.shuffle){
		ui.shuffle.setAttribute('actived','true');
	}else{
		ui.shuffle.setAttribute('actived','false');
	}
	if(player.repeat){
		ui.repeat.setAttribute('actived','true');
	}else{
		ui.repeat.setAttribute('actived','false');
	}
}
function setPlayerState(st){
	if(st){
		ui.play.style.display = 'none';
		ui.pause.style.display = 'flex';
	}else{
		ui.pause.style.display = 'none';
		ui.play.style.display = 'flex';
	}
}

function updatePlaylistDialog(){
	var list = '';
	for(name in playlists){
		if(name != 'main'){
			list += "<div class='playlist-item' playlist = '"+name+"'>"+name+"</div>";
		}
	}
	ui.pldialoglist.innerHTML = list;
}

function search(w){
	if(w != '' && !scrollflag){
		dscroll = ui.songslist.scrollTop;
		scrollflag = true;
	}
	if(w != ""){
		for (var i = 0; i < ui.songslist.childNodes.length; i++) {
			var regext=new RegExp('(\b)?'+w+'(\b)?','gi');
			var regexa=new RegExp('(\b)?'+w+'(\b)?','gi');
			var regexc=new RegExp('(\b)?'+w+'(\b)?','gi');
			var title = atobU(ui.songslist.childNodes[i].getAttribute('titlesong'));
			var artist = atobU(ui.songslist.childNodes[i].getAttribute('artistsong'));
			var creator = atobU(ui.songslist.childNodes[i].getAttribute('creatorsong'));
			if(settings.findtitle && regext.exec(title) != null){
				ui.songslist.childNodes[i].style.display = 'block';
			}else{
				if(settings.findartist && regexa.exec(artist) != null){
					ui.songslist.childNodes[i].style.display = 'block';
				}else{
					if(settings.findcreator && regexc.exec(creator) != null ){
						ui.songslist.childNodes[i].style.display = 'block';
					}else{
						ui.songslist.childNodes[i].style.display = 'none';
					}
				}
			}
		}
	}else{
		for (var i = 0; i < ui.songslist.childNodes.length; i++) {
			ui.songslist.childNodes[i].style.display = 'block';
		}
	}
	if(ui.searchbox.value == '' && scrollflag){
		ui.songslist.scrollTop = dscroll;
		scrollflag = false;
	}
	updateThumbnails();
}

function saveCache(){}
function loadCache(){}

function installLogOnServer(){
	/*
		Envia una señal anonima para registrar nuevas instalaciones para saber el alcance de usuarios
		Send an anonymous signal to register new installation to know the reach of users
	*/
	try{
		fs.statSync('id0_2.ns');
	}catch(e){
		var options = {
			host: 'maquivol.com',
			path: '/',
			port: '59150',
			method: 'POST',
			headers: {'newuser': '0.2','debug':'true'}
		};

		var req = http.request(options, function(response) {
			response.setEncoding('utf8');
			var str = '';
			response.on('data', function (chunk) {
				str += chunk;
			});

			response.on('end', function () {
				if(str == "reg"){
					fs.writeFile('id0_2.ns', 
						'This file is created after install to know if is new installation, please no delete this file.'+
						'Este archivo se crea después de la instalación para saber si es nueva instalación, por favor, no elimine este archivo'
						, 'utf8');
				}
			});
		});
		//This is the data we are posting, it needs to be a string or a buffer
		req.write('');
		req.end();
	}
}