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

Array.prototype.move = function (old_index, new_index) {
    while (old_index < 0) {
        old_index += this.length;
    }
    while (new_index < 0) {
        new_index += this.length;
    }
    if (new_index >= this.length) {
        var k = new_index - this.length;
        while ((k--) + 1) {
            this.push(undefined);
        }
    }
    this.splice(new_index, 0, this.splice(old_index, 1)[0]);
    return this; // for testing purposes
};

var fs=require('fs');
var fsextra = require('fs.extra');
var path = require('path');
var http = require('http');
var httpfr = require('follow-redirects').http;
var extract = require('extract-zip');
var os = require("os");
var exec = require('child_process').exec;
var osu = require('./osuPlaylist.js');
var spider = require('./osuspider.js');
//var nodetaglib = require('nodetaglib');

var Remote = require('electron').remote;
var Shell = require('electron').shell
const { dialog } = require('electron').remote

var OssPlayer = {
	version: 2.0,
	remote: Remote,
	window: Remote.getCurrentWindow(),
	basePath: Remote.app.getAppPath(),
	userDataPath: Remote.app.getPath('userData'),
	UI: {}
};

var debug = true;
var version = 2.0;
var branch = "master";

var cachesongs = {};

var playlists = {
	main : []
}
var current_playlist_playing = "main";
var current_playlist = "main";

var audio = new AudioPlayer();

//source.playbackRate.value = 2;

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

try{
	var st = fs.statSync("bgcache");
	if(!st.isDirectory()){
		alert("bgcache is not a directory, please delete bgcache and restart oss player");
	}
}catch(e){
	fs.mkdirSync("bgcache");
}

var settings = {};
var windowState = {};
var tabs = {};
var thumbnailQueue = {};

/*--Settings--*/
//Directorio de usuario
settings.userdir=(process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE)+"/";
settings.usecache = (typeof localStorage['usecache'] != "undefined")? strtobool(localStorage['usecache']) : true;
settings.findtitle = (typeof localStorage['findtitle'] != "undefined")? strtobool(localStorage['findtitle']) : true;
settings.findartist = (typeof localStorage['findartist'] != "undefined")? strtobool(localStorage['findartist']) : true;
settings.findcreator = (typeof localStorage['findcreator'] != "undefined")? strtobool(localStorage['findcreator']) : false;
audio.SetVolume( (typeof localStorage['volume'] != "undefined")? parseFloat(localStorage['volume']) : 1 );
//Main window
windowState.maximized=false;

keyh={};
keyh.shift=false;
keyh.ctrl=false;
keyh.altk=false;

ui = {};

var dscroll = 0;
var scrollflag = false;

var soundmv = false;
var trackmv = false;

var searchTimer = null;
window.addEventListener('load',function(){
	loadElements();
	installLogOnServer();
	checkUpdates();
	loadSongs();
	window.oncontextmenu = function(e){
		e.preventDefault();
		//clickManager(e);
		return false;
	}
	window.addEventListener("click",function(e){
		//e.preventDefault();
		clickManager(e);
	})
	window.addEventListener("mousedown",function(e){
		if(is(e,"#trackbar") && !isNaN(audio.GetDuration())){
			trackmv = true;
			trackbar_width = parseInt(getComputedStyle(ui.trackbar, null).width);
			var time = 100*(e.layerX/trackbar_width);
			audio.Seek( ((audio.GetDuration() / 100) * time) );
		}
		if(is(e,'#soundbar')){
			soundmv = true;
			var ts = e.layerY-10;
			if(ts < 0){ts = 0;}
			if(ts > 100){ts = 100;}
			tsv = 100-ts;
			ui.soundbar.style.backgroundSize = "11px "+tsv+"px";
			ui.soundbar.style.backgroundPosition = "9px "+(ts+10)+"px";
			audio.SetVolume(tsv/100);
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
			audio.Seek( ((audio.GetDuration() / 100) * time) );
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
			audio.SetVolume( tsv/100 );
			localStorage['volume'] = audio.volume;
		}
	})
	window.addEventListener('keydown', function(e){
		if(e.key === 'F5' && debug){window.location.reload();}
		//if(e.key === 'F12' && debug){main_window.showDevTools();}
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
		if(e.keyCode == 32 && document.activeElement.nodeName != "INPUT"){
			if(audio.IsReady()){
				if(audio.paused){
					audio.Play();
					setPlayerState(true);
				}else{
					audio.Pause();
					setPlayerState(false);
				}
			}
			e.preventDefault();
		}
	})
	ui.songslist.addEventListener('scroll',updateThumbnails);
	playerUi();
});
var globalMediakeyPlay = {
	key : "MediaPlayPause"
};
var globalMediaNextTrack = {
	key : "MediaNextTrack"
};
var globalMediaPrevTrack = {
	key : "MediaPrevTrack"
};
/*
var PlayPauseShortcut = new gui.Shortcut(globalMediakeyPlay);
var NextTrackShortcut = new gui.Shortcut(globalMediaNextTrack);
var PrevTrackShortcut = new gui.Shortcut(globalMediaPrevTrack);

PlayPauseShortcut.on('active', function() {
	if(audio.IsReady()){
		if(audio.paused){
			audio.Play();
			setPlayerState(true);
		}else{
			audio.Pause();
			setPlayerState(false);
		}
	}
});
NextTrackShortcut.on('active', function() {
	nextTrack();
});

PrevTrackShortcut.on('active', function() {
	prevTrack();
});

PlayPauseShortcut.on('failed', function(msg) {
	console.log(msg);
});
NextTrackShortcut.on('failed', function(msg) {
	console.log(msg);
});
PrevTrackShortcut.on('failed', function(msg) {
	console.log(msg);
});

gui.App.registerGlobalHotKey(PlayPauseShortcut);
gui.App.registerGlobalHotKey(NextTrackShortcut);
gui.App.registerGlobalHotKey(PrevTrackShortcut);
*/

function updateThumbnails(){
	ui.pldialog.style.display = 'none';
	ui.snoptions.style.display = 'none';
	var scroll = ui.songslist.scrollTop;
	var hview = parseInt(getComputedStyle(ui.songslist, null).height);
	for (var i = 0; i < ui.songslist.childNodes.length; i++) {
		var offset = ui.songslist.childNodes[i].offsetTop;
		var child = ui.songslist.childNodes[i].querySelector('.bgimg');
		if(offset > scroll - 500 && offset < scroll+hview+500){
			var bgpath = atobU(child.getAttribute('imgurl'));
			child.style.backgroundImage = "url(\""+bgpath+"\")";
		}else{
			child.style.backgroundImage = "";
		}
	};
}

OssPlayer.window.on('maximize',function(){
	windowState.maximized=true;
})
OssPlayer.window.on('unmaximize',function(){
	windowState.maximized=false;
})
function clickManager(e){

	if(is(e,'.closewindow'))
	{
		OssPlayer.window.close();
	}
	if(is(e,'.maxwindow')){
		if(!windowState.maximized)
		{
			OssPlayer.window.maximize();
		}else{
			windowState.maximized=false;
			OssPlayer.window.unmaximize();
		}
	}
	if(is(e,'.minwindow'))
	{
		OssPlayer.window.minimize();
	}
	if(is(e,'.maplink')){
		Shell.openExternal("https://osu.ppy.sh/s/"+e.target.getAttribute('mapid'))
	}
	if(is(e,'.bgimg')){
		var name = atobU(e.target.getAttribute('hash'));
		playTrack(name);
		current_playlist_playing = current_playlist;
		if(current_playlist_playing == 'main'){
			ui.currplbnt.style.display = 'none';
		}else{
			ui.currplbnt.style.display = 'block';
		}
		ui.currplbnt.innerHTML = current_playlist_playing;
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
		if(audio.IsReady()){
			audio.Play();
			setPlayerState(true);
		}
	}
	if(is(e,'#pause')){
			audio.Pause();
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
	}else{
		ui.soundbar.setAttribute('sw','false');
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
		ui.pldialog.style.left = (e.target.offsetLeft-190)+"px";
		ui.pldialog.style.display = 'block';
		ui.pldialoglist.setAttribute('hash',closest(e,'.song').getAttribute('hash'));
	}else{
		ui.pldialog.style.display = 'none';
	}
	if(is(e,'.showinexplorer')){
		var fpath = cachesongs[atobU(closest(e,'.song').getAttribute('hash'))].path;
		switch(os.platform()){
			case "linux":
				exec('xdg-open "'+fpath+'"',function(err){
					if(err){
						console.log(err);
					}
				});
			break;
			case "win32":
				exec('start "" "'+fpath.replace(/\//g,"\\")+'"',function(err){
					if(err){
						console.log(err);
					}
				});
			break;
			case "darwin":
				exec('open "'+fpath+'"',function(err){
					if(err){
						console.log(err);
					}
				});
			break;
			default:
				alert("Not support for your system");
			break;
		}
	}
	if(is(e,'.snoptions')){
		var fpos = ((e.target.offsetTop+90)-ui.songslist.scrollTop);
		var wdpos = parseInt(getComputedStyle(ui.songslist, null).height);
		if(fpos+86 > wdpos+90){
			fpos -= 56;
		}
		ui.snoptions.style.top = fpos+"px";
		ui.snoptions.style.left = (e.target.offsetLeft-190)+"px";
		ui.snoptions.style.display = 'block';
		ui.snoptions.setAttribute('hash',closest(e,'.song').getAttribute('hash'));
	}else{
		ui.snoptions.style.display = 'none';
	}
	if(is(e,'.mainlistsh')){
		//current_playlist = 'main';
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
	if(is(e,'.playlist-item')){
		addToPlaylist(e.target.getAttribute('playlist'),atobU(ui.pldialoglist.getAttribute('hash')));
	}
	if(is(e,'.createplaylistsh')){
		ui.newpl.style.display = 'flex';
	}
	if(is(e,'.closenpl')){
		ui.newpl.style.display = 'none';
	}
	if(is(e,'.closeepl')){
		ui.editpl.style.display = 'none';
	}
	if(is(e,'.closerpl')){
		ui.removepl.style.display = 'none';
	}
	if(is(e,'.closenews')){
		ui.news.style.display = 'none';
	}
	if(is(e,'#createpl')){
		if(ui.newplinput.value != '' && ui.newplinput.value != 'main'){
			newPlaylist(ui.newplinput.value);
			ui.newpl.style.display = 'none';
			savePlaylists();
			showPlaylists();
		}
	}
	if(is(e,'#savepl')){
		if(ui.editplinput.value != '' && ui.editplinput.value != 'main' && typeof playlists[ui.editplinput.value] == 'undefined'){
			renamePlaylist(ui.editplinput.getAttribute('plname'),ui.editplinput.value);
			if(ui.editplinput.getAttribute('plname') == current_playlist_playing){
				current_playlist_playing = ui.editplinput.value;
				ui.currplbnt.innerHTML = current_playlist_playing;
			}
			ui.editpl.style.display = 'none';
			savePlaylists();
			showPlaylists();
		}
	}
	if(is(e,'#removeplb')){
		removePlaylist(ui.removeplb.getAttribute('plname'));
		if(ui.removeplb.getAttribute('plname') == current_playlist_playing){
			current_playlist_playing = 'main';
			ui.currplbnt.style.display = 'none';
		}
		ui.removepl.style.display = 'none';
		savePlaylists();
		showPlaylists();
	}
	if(is(e,'#cplaylistsh')){
		current_playlist = current_playlist_playing;
		showPlaylist(current_playlist_playing);
	}
	if(is(e,'.bgimgpl')){
		var plname = closest(e,'.playlist').getAttribute('plname')
		if(playlists[plname].length > 0){
			current_playlist_playing = plname;
			if(current_playlist_playing == 'main'){
				ui.currplbnt.style.display = 'none';
			}else{
				ui.currplbnt.style.display = 'block';
			}
			ui.currplbnt.innerHTML = current_playlist_playing;
			playTrack(playlists[current_playlist_playing][0]);
		}
	}
	if(is(e,'.removefrompl')){
		removeFromPlaylist( current_playlist,atobU(ui.snoptions.getAttribute('hash')) );
	}
	if(is(e,'.editplaylist')){
		ui.editplinput.setAttribute('plname',e.target.getAttribute('plname'));
		ui.editplinput.value = e.target.getAttribute('plname');
		ui.editpl.style.display = 'flex';
	}
	if(is(e,'.removeplaylist')){
		ui.removeplb.setAttribute('plname',e.target.getAttribute('plname'));
		ui.removepl.style.display = 'flex';
	}
	if(is(e,'.moveup')){
		moveSongUp( current_playlist,atobU(ui.snoptions.getAttribute('hash')) );
	}
	if(is(e,'.movedown')){
		moveSongDown( current_playlist,atobU(ui.snoptions.getAttribute('hash')) );
	}
	if(is(e,'.htab')){
		var othertabs = document.querySelectorAll('.htab');
		for (var i = 0; i < othertabs.length; i++) {
			othertabs[i].setAttribute('sel','false');
		};
		e.target.setAttribute('sel','true');
	}
	if(is(e,'.updatenow')){
		downloadAndUpdate();
	}
	if(is(e,'.nr-time')){
		audio.SetPlaybackRate(1);
		audio.PreservePitch(true);
	}
	if(is(e,'.ht-time')){
		audio.SetPlaybackRate(0.75);
		audio.PreservePitch(true);
	}
	if(is(e,'.dt-time')){
		audio.SetPlaybackRate(1.5);
		audio.PreservePitch(true);
	}
	if(is(e,'.nc-time')){
		audio.SetPlaybackRate(1.5);
		audio.PreservePitch(false);
	}
	if(is(e,'#songimg')){
		if(e.target.getAttribute('username') != ""){
			Shell.openExternal("https://osu.ppy.sh/u/"+e.target.getAttribute('username'));
		}
	}
	if(is(e,'#saveuser')){
		localStorage['user'] = document.getElementById("osuname").value;
		if(typeof localStorage['user'] != "undefined" && localStorage['user'] != ""){
			spider.getUserData(localStorage['user'],function(data){
				ui.songimg.src = data.image;
				ui.songimg.setAttribute('username',localStorage['user']);
			});
		}else{
			ui.songimg.src = "img/avatar-guest.png";
			ui.songimg.setAttribute('username','');
		}
	}
	if(is(e,'#openrepo')){
		Shell.openExternal("https://github.com/rurigk/osuplayer");
	}

	if(is(e,'#pickpath')){
		PickPath();
	}
}

audio.audioElement.addEventListener('ended',function(){
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
audio.audioElement.addEventListener('timeupdate',function(){
	ui.trackbar.style.backgroundSize = (100 * (audio.GetCurrentTime() / audio.GetDuration()))+"% 100%";
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
	ui.userbox = document.getElementById('osuname');
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
		if(ui.searchbox.value != ""){
			if(searchTimer != null){
				clearTimeout(searchTimer);
				searchTimer = setTimeout(function(){
					search(ui.searchbox.value);
				},400);
			}else{
				searchTimer = setTimeout(function(){
					search(ui.searchbox.value);
				},400);
			}
		}else{
			if(searchTimer != null){clearTimeout(searchTimer);}
			search(ui.searchbox.value);
		}
	})

	ui.loadbox = document.getElementById('loadbox');

	ui.pldialog = document.getElementById('addtopl');
	ui.pldialoglist = document.getElementById('plist-db');

	ui.snoptions = document.getElementById('sn-options');

	ui.newpl = document.getElementById('newpl');
	ui.newplinput = document.getElementById('newplname');

	ui.editpl = document.getElementById('editpl');
	ui.editplinput = document.getElementById('editplname');

	ui.removepl = document.getElementById('removepl');
	ui.removeplb = document.getElementById('removeplb');

	ui.currplbnt = document.getElementById('cplaylistsh');

	//update dialogs
	ui.uptodate = document.getElementById('opud');
	ui.updatech = document.getElementById('chfu');
	ui.updatedl = document.getElementById('chfd');
	ui.updateav = document.getElementById('unow');

	ui.news = document.getElementById('news');

	ui.songimg = document.getElementById('songimg');

	ui.userbox.value = (typeof localStorage['user'] != "undefined")? localStorage['user']:"";
	if(typeof localStorage['user'] != "undefined" && localStorage['user'] != ""){
		spider.getUserData(localStorage['user'],function(data){
			ui.songimg.src = data.image;
			ui.songimg.setAttribute('username',localStorage['user']);
		});
	}else{
		ui.songimg.setAttribute('username','');
	}
}

function PickPath()
{
	var dirPaths = dialog.showOpenDialog({ properties: ['openDirectory'] });
	if(typeof dirPaths != 'undefined')
	{
		if(path.win32.basename(dirPaths[0]) == "Songs"){
			ui.locationbox.value = dirPaths[0];
			localStorage['location'] = ui.locationbox.value;
			ui.settingsbox.style.display = 'none';
			loadSongs();
		}else{
			alert(dirPaths[0]+"\nis invalid Songs path\n\nPlease select the 'Songs' directory inside of your installation of osu!");
		}
	}
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
		//ui.pathpicker.value = localStorage['location'];
	}catch(e){
		ui.loadbox.style.display = 'none';
		ui.settingsbox.style.display = 'flex';
		if(!debug){
			ui.locationbox.value = '';
			//ui.pathpicker.value = '';
		}
		return false;
	}
	var cod = "";
	if(!usecache){
		var songsu = osu.getMedia(localStorage['location']);
		if(songsu == null){
			alert("Path must be a directory");
			localStorage['location'] == "";
			ui.locationbox.value == "";
		}
		var songs = {};
		Object.keys(songsu).sort().forEach(function(key) {
			songs[key] = songsu[key];
		});
		cachesongs = songs;
		fs.writeFileSync('songs.cache', JSON.stringify(cachesongs), 'utf8');
	}else{
		var songs = JSON.parse(fs.readFileSync('songs.cache',{encoding:'utf8'}));
		cachesongs = songs;
	}
	playlists.main = [];
	for(song in songs){
		playlists.main[playlists.main.length] = song;
	}
	loadPlaylists();
	showPlaylist(current_playlist);
	setTimeout(function(){
		ui.loadbox.style.display = 'none';
	},150)
}
function showPlaylist(name){
	var cod = '';
	//Se quitan los maps eliminadas de la playlist 
	for (var i = playlists[name].length - 1; i >= 0; i--) {
		var songname = playlists[name][i];
		if(typeof cachesongs[songname] == "undefined"){
			removeFromPlaylist(name,songname,true);
		}
	};
	//Se debe llamar explicitamente para guardar los cambios
	savePlaylists();

	//Se listan las canciones y se convierten en html para mostrar
	for (var i = 0; i < playlists[name].length; i++) {
		var songname = playlists[name][i];
		if(cachesongs[songname].backgrounds.length > 0){
			var basepath = cachesongs[songname].path;
			var bgfilename = cachesongs[songname].backgrounds[0];
			var bgfile = path.join(basepath,bgfilename);
			var bgpath = path.join(basepath,bgfilename.replace(/%/g, '%25'));
			var bgcachepath = path.join(OssPlayer.basePath,"bgcache",cachesongs[songname].mapid+".jpg");
			try{
				fs.statSync(bgcachepath);
				bgpath = bgcachepath;
				bgpath = bgpath.replace(/#/g, '%23');
				bgpath = bgpath.replace(/\\/g, '/');
			}catch(e){
				try{
					fs.statSync(bgfile);
					bgpath = bgpath.replace(/#/g, '%23');
					thumbnailQueue[cachesongs[songname].mapid]={
						imgpath:bgpath,
						mapid:cachesongs[songname].mapid
					}
					bgpath = bgPathEncoded;
					bgpath = bgpath.replace(/\\/g, '/');
				}catch(e){
					var bgpath = path.join(OssPlayer.basePath, "/player/img/osulogo-gray.svg");
					bgpath = bgpath.replace(/\\/g, '/');
				}
			}
		}else{
			var bgpath = path.join(OssPlayer.basePath, "/player/img/osulogo-gray.svg");
			bgpath = bgpath.replace(/\\/g, '/');
		}

		var cca =
		"<div class='song nosel' hash='"+btoaU(songname)+"' titlesong='"+btoaU(cachesongs[songname].title)+"' artistsong='"+btoaU(cachesongs[songname].artist)+"' creatorsong='"+btoaU(cachesongs[songname].creator)+"'>"+
		"	<div class='bgimg l' imgurl='"+btoaU(bgpath)+"' hash='"+btoaU(songname)+"'></div>"+
		"	<div class='songinfo l "+(current_playlist != 'main' ? 'specialsn':'')+"'>"+
		"		<div class='songtitle'>"+escapeHtml(cachesongs[songname].title)+"</div>"+
		"		<div class='songartist'>"+escapeHtml(cachesongs[songname].artist)+"</div>"+
		"		<div class='songmapper'>"+escapeHtml(cachesongs[songname].creator)+"</div>"+
		"	</div>"+
		"	<div class='r songoptions'>"+
		"		<div class='showinexplorer'>&#xF07B;</div>"+
		"		<div class='addtoplaylist'>&#xF067;</div>"+
		(name == 'main'? '':"		<div class='snoptions'>&#xF0C9;</div>")+
		"		<div class='maplink' mapid='"+cachesongs[songname].mapid+"'></div>"+
		"	</div>"+
		"</div>";
		cod += cca;
	}
	ui.songslist.innerHTML = cod;
	ui.playlists.style.display = 'none';
	ui.songslist.style.display = 'block';
	updateThumbnails();
	genthumbnails();
}
function getSongBg(songname){
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
	return bgpath;
}
function showPlaylists(){
	var list = '';
	for(name in playlists){
		if(name != 'main'){
			if(playlists[name].length == 2){
				var bg_f = getSongBg(playlists[name][0]);
				var bg_s = getSongBg(playlists[name][1]);
				var exn = "bgimgpl2";
				var bgquery = "url(\""+bg_f+"\"),url(\""+bg_s+"\")";
			}else if(playlists[name].length > 2){
				var bg_f = getSongBg(playlists[name][0]);
				var bg_s = getSongBg(playlists[name][1]);
				var bg_t = getSongBg(playlists[name][2]);
				var exn = "bgimgpl3";
				var bgquery = "url(\""+bg_f+"\"),url(\""+bg_s+"\"),url(\""+bg_t+"\")";
			}else if(playlists[name].length > 0){
				var bg_f = getSongBg(playlists[name][0]);
				var exn = ""
				var bgquery = "url(\""+bg_f+"\")";
			}else{
				var exn = ""
				var bgquery = "url(\"img/osulogo-gray.svg\")";
			}
			list += 
			"<div class='playlist nosel' plname='"+name+"'>"+
			"	<div class='bgimgpl "+exn+" l' style='background-image:"+bgquery+";'></div>"+
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
	audio.Stop();
	audio.Load(songpath, false,function(){
		audio.Play();
		setPlayerState(true);
	});
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

function addToPlaylist(pl,song){
	if(playlists[pl].indexOf(song) < 0){
		playlists[pl].push(song);
	}
	savePlaylists();
}

function removeFromPlaylist(pl,song,noui){
	playlists[pl].splice(playlists[pl].indexOf(song),1);
	if(typeof noui != "undefined" && noui == true){return true;}
	savePlaylists();
	showPlaylist(current_playlist);
}
function moveSongUp(pl,song){
	var index = playlists[pl].indexOf(song);
	if(index > 0){
		playlists[pl].move(index,index-1);
	}
	savePlaylists();
	showPlaylist(current_playlist);
}
function moveSongDown(pl,song){
	var index = playlists[pl].indexOf(song);
	if(index < playlists[pl].length-1){
		playlists[pl].move(index,index+1);
	}
	savePlaylists();
	showPlaylist(current_playlist);
}

function sortPlaylists(){
	var curr = JSON.parse(JSON.stringify(playlists));
	playlists = {};
	Object.keys(curr).sort(sortAlphaNum).forEach(function(key) {
		playlists[key] = curr[key];
	});
}
function newPlaylist(name){
	playlists[name] = [];
	sortPlaylists();
}

function renamePlaylist(cpl,npl){
	newPlaylist(npl);
	playlists[npl] = playlists[cpl].slice(0,playlists[cpl].length);
	delete playlists[cpl];
	sortPlaylists();
}
function removePlaylist(name){
	delete playlists[name];
}
function loadPlaylists(){
	try{
		var jsload = fs.readFileSync('playlists',{encoding:'utf8'});
		var plloaded = JSON.parse(jsload);
		for (var attrname in plloaded) { playlists[attrname] = plloaded[attrname]; }
		sortPlaylists();
	}catch(e){
		console.log(e);
	}
}
function savePlaylists(){
	var plc = JSON.parse(JSON.stringify(playlists));
	delete plc.main;
	var ts = JSON.stringify(plc);
	fs.writeFileSync('playlists', ts, 'utf8');
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
	if(debug){
		return false;
	}
	/*
		Envia una señal anonima para registrar nuevas instalaciones para saber el alcance de usuarios
		Send an anonymous signal to register new installation to know the reach of users
	*/
	try{
		fs.statSync('id0_7.ns');
	}catch(e){
		var options = {
			host: 'osumexico.com',
			path: '/',
			port: '59150',
			method: 'POST',
			headers: {'newuser': version.toString(),'debug':debug.toString()}
		};

		var req = http.request(options, function(response) {
			response.setEncoding('utf8');
			var str = '';
			response.on('data', function (chunk) {
				str += chunk;
			});

			response.on('end', function () {
				if(str == "reg"){
					fs.writeFile('id0_7.ns', 
						'This file is created after install to know if is new installation, please no delete this file.'+
						'Este archivo se crea después de la instalación para saber si es nueva instalación, por favor, no elimine este archivo'
						, 'utf8');
					showNews();
				}
			});
		});
		//This is the data we are posting, it needs to be a string or a buffer
		req.write('');
		req.end();
	}
}

function checkUpdates(){
	ui.uptodate.style.display = 'none';
	ui.updatech.style.display = 'none';
	ui.updateav.style.display = 'block';
	if(debug){
		return false;
	}
	/*
		Consulta al servidor de nueva version
	*/
		/*var options = {
			host: 'osumexico.com',
			path: '/',
			port: '59150',
			method: 'POST',
			headers: {'getupdate': version.toString()}
		};

		var req = http.request(options, function(response) {
			response.setEncoding('utf8');
			var str = '';
			response.on('data', function (chunk) {
				str += chunk;
			});

			response.on('end', function () {
				ui.updatech.style.display = 'none';
				if(str == "up"){
					ui.updateav.style.display = 'block';
				}else if(str == "cr"){
					ui.uptodate.style.display = 'block';
				}
			});
		});
		//This is the data we are posting, it needs to be a string or a buffer
		req.write('');
		req.end();*/
}
function downloadAndUpdate(){
	var fileurl = 'http://github.com/rurigk/osuplayer/archive/'+branch+'.zip';
	ui.updateav.style.display = 'none';
	ui.uptodate.style.display = 'none';
	ui.updatech.style.display = 'none';
	ui.updatedl.style.display = 'block';
	download(fileurl,'update.zip',function(err){
		if(!err){
			extractAndReload()
		}else{
			console.log(err)
		}
	},function(prog){
		ui.updatedl.innerHTML = "Downloading "+prog+"%";
	})
}
function extractAndReload(){
	extract('update.zip', {dir: './'}, function (err) {
		moveFilesUp('osuplayer-'+branch);
	})
}
function moveFilesUp(dr){
	fsextra.rmrfSync('appdata');
	fsextra.rmrfSync('node_modules');
	fsextra.rmrfSync('package.json');
	try{
		if(fs.statSync("osuplayer-"+branch+"/ffmpegsumo.dll")){
			fs.unlink("ffmpegsumo.dll");
		}
		if(fs.statSync("osuplayer-"+branch+"/ffmpegsumo.so")){
			fs.unlink("ffmpegsumo.so");
		}
		if(fs.statSync("osuplayer-"+branch+"/libffmpegsumo.so")){
			fs.unlink("libffmpegsumo.so");
		}
	}catch(e){
		console.log(e);
	}
	var files = fs.readdirSync(dr);
	for (var i = 0; i < files.length; i++) {
		fsextra.move(path.join(dr,files[i]), files[i], function (err) {
			if (!err) {
				console.log('movingerror');
				console.log(err);
			}
			if(this.endxf){
				fsextra.rmrfSync('osuplayer-'+branch);
				fs.unlink('update.zip');
				//this.main_window.reloadDev();
			}
		}.bind({endxf:(i == files.length-1)}));
	};
}

//Download function with progress
function download(url,dest,callback,onprog){
	try{
		if(fs.statSync(dest)){
			fs.unlink(dest);
		}
	}catch(e){}
	var file = fs.createWriteStream(dest);
	var request = httpfr.get(url, function (response) {
		var len = parseInt(response.headers['content-length'], 10);
		var cur = 0;
		response.pipe(file);
		response.on("data", function(chunk) {
			cur += parseFloat(chunk.length);
			if(onprog){
				onprog(parseFloat((100.0 * (parseFloat(cur) / parseFloat(len))).toFixed(2)) || 0);
			}
		});
		file.on('finish', function () {
			file.close(callback); // close() is async, call callback after close completes.
		});
		file.on('error', function (err) {
			fs.unlink(dest); // Delete the file async. (But we don't check the result)
			if (callback)
				callback(err.message);
		});
	});
}

var reA = /[^a-zA-Z]/g;
var reN = /[^0-9]/g;
function sortAlphaNum(a,b) {
	a=a.toLowerCase();
	b=b.toLowerCase();
	var AInt = parseInt(a, 10);
	var BInt = parseInt(b, 10);

	if(isNaN(AInt) && isNaN(BInt)){
		var aA = a.replace(reA, "");
		var bA = b.replace(reA, "");
		if(aA === bA) {
			var aN = parseInt(a.replace(reN, ""), 10);
			var bN = parseInt(b.replace(reN, ""), 10);
			return aN === bN ? 0 : aN > bN ? 1 : -1;
		} else {
			return aA > bA ? 1 : -1;
		}
	}else if(isNaN(AInt)){
		return 1;
	}else if(isNaN(BInt)){
		return -1;
	}else{
		return AInt > BInt ? 1 : -1;
	}
}

function showNews(){
	ui.news.style.display = 'flex';
}

function createThumbnail(imagedd,mapid){
		var image = document.createElement("img");
		image.src = "file://"+imagedd;
		image.onload = function(){
			var canvas = document.createElement('canvas');
			var context = canvas.getContext('2d');
			var canvas2 = document.createElement('canvas');
			var context2 = canvas2.getContext('2d');
			var steps = getSteps(image.width, image.height, 160, 120);
			canvas.width = image.width;
			canvas.height = image.height;
			context.drawImage(image, 0, 0, canvas.width, canvas.height);
			for (var i = 0; i < steps-1; i++) {
				canvas2.width = canvas.width/2;
				canvas2.height = canvas.height/2;
				context2.drawImage(canvas, 0, 0, canvas2.width, canvas2.height);
				canvas.width = canvas2.width;
				canvas.height = canvas2.height;
				context.drawImage(canvas2, 0, 0, canvas.width, canvas.height);
			};
			var srcBase64 = canvas.toDataURL("image/jpeg", 1.0);
			saveThumbnail(srcBase64,mapid);
		}
}
function saveThumbnail(base64,mapid){
	var base64Data = base64.replace(/^data:[A-Za-z-+\/]+;base64,/, "");
		fs.writeFile("bgcache/"+mapid+".jpg", base64Data, {
			encoding : 'base64',
			mode : 0666
		}, function(err) {
			if(err != null){
			}else{
				fs.chmodSync("bgcache/"+mapid+".jpg", '666');
			}
			genthumbnails();
		});
}
function getSteps(w1, h1, w2, h2){
	if(w1 >= h1){
		var steps = Math.ceil(Math.log(w1 / w2) / Math.log(2));
	}else{
		var steps = Math.ceil(Math.log(h1 / h2) / Math.log(2));
	}
	return steps;
}

function genthumbnails(){
	var keys = Object.keys(thumbnailQueue);
	if(keys.length > 0){
		var image = thumbnailQueue[keys[0]].imgpath;
		var mapid = thumbnailQueue[keys[0]].mapid;
		createThumbnail(image,mapid);
		delete thumbnailQueue[keys[0]];
	}
}

function escapeHtml(unsafe) {
	return unsafe
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}
