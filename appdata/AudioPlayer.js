function AudioPlayer(webaudio){
	this.webaudio = (typeof webaudio == "boolean" )? webaudio:false;

	this.audioElement = new Audio();
	if(this.webaudio){
		this.audioContext = new AudioContext();
		this.gainNode = this.audioContext.createGain();
		this.gainNode.connect(this.audioContext.destination);
		this.bufferSource = this.audioContext.createBufferSource();
		this.buffer = null;
		this._webaudio_ready = false;
	}else{
		this._webaudio_ready = true;
	}

	this._htmlaudio_ready = false;

	this.onReady = function(){
		if(this.playonload && !this.playing){
			this.Play();
		}
	};

	this.playing = false;
	this.paused = false;

	this.preservePitch = true;
	this.volume = 1;
	this.playonload = false;
	this._onloadcallback = function(){}

	this.playbackRate = 1;
	this.currentFile = "";
}

AudioPlayer.prototype.Load = function(f,autoplay,callback) {
	this._onloadcallback = callback;
	this.playing = false;
	this.paused = false;
	this.playonload = (typeof autoplay == "boolean")? autoplay:false;
	this.audioElement.oncanplaythrough = function(){
		this._SetHTMLAudioReady();
	}.bind(this);
	this.audioElement.src = "file://"+f;
	if(this.webaudio){
		this.buffer = null;
		var bf = fs.readFileSync(f);
		var ab = bf.buffer.slice(bf.byteOffset, bf.byteOffset + bf.byteLength);
		this.audioContext.decodeAudioData(ab, function(buffer) {
			this.currentFile = f;
			this.buffer = buffer;
			this._SetWebAudioReady();
			console.log(this)
		}.bind(this),function(e){
			console.log("Error with decoding audio data" + e.err);
		});
	}
};

AudioPlayer.prototype.Play = function() {
	if(!this.playing){
		if(this.webaudio){
			this._AssignBuffer();
		}
		this._AdjustVolume();
		this.SetPlaybackRate(this.playbackRate);
		this.audioElement.play();
		if(this.webaudio){
			this.bufferSource.start(0,this.audioElement.currentTime);
		}
		this.playing = true;
		this.paused = false;
	}
};

AudioPlayer.prototype._AssignBuffer = function() {
	console.log(this.buffer)
	if(this.bufferSource != null){
		this.bufferSource.disconnect();
	}
	this.bufferSource = this.audioContext.createBufferSource();
	this.bufferSource.buffer = this.buffer;
	this.bufferSource.connect(this.gainNode);
};

AudioPlayer.prototype.Pause = function() {
	this.audioElement.pause();
	if(this.webaudio){
		this.bufferSource.stop();
	}
	this.playing = false;
	this.paused = true;
};

AudioPlayer.prototype.Stop = function() {
	if(this.playing && this.bufferSource != null){
		this.audioElement.pause();
		if(this.webaudio){
			this.bufferSource.stop();
		}
		this.audioElement.currentTime = 0;
		this.playing = false;
		this.paused = false;
	}
};

AudioPlayer.prototype.Seek = function(pos) {
	if(!isNaN(pos)){
		this.Pause();
		this.audioElement.currentTime = pos;
		this.Play();
	}
};

AudioPlayer.prototype.GetCurrentTime = function() {
	return this.audioElement.currentTime;
};

AudioPlayer.prototype.SetVolume = function(v) {
	this.volume = v;
	this._AdjustVolume();
};

AudioPlayer.prototype.GetDuration = function() {
	return this.audioElement.duration;
};

AudioPlayer.prototype.PreservePitch = function(b) {
	this.preservePitch = b;
	this._AdjustVolume();
};
AudioPlayer.prototype._AdjustVolume = function() {
	if(this.webaudio){
		if(this.preservePitch){
			this.gainNode.gain.value = 0;
			this.audioElement.volume = this.volume;
		}else{
			this.gainNode.gain.value = this.volume;
			this.audioElement.volume = 0;
		}
	}else{
		this.audioElement.volume = this.volume;
	}
};

AudioPlayer.prototype.SetPlaybackRate = function(r) {
	this.playbackRate = r;
	if(this.webaudio){
		this.bufferSource.playbackRate.value = this.playbackRate;
	}
	this.audioElement.playbackRate = this.playbackRate;
};

AudioPlayer.prototype._SetHTMLAudioReady = function() {
	//console.log("HTMLAudio Media loaded");
	this._htmlaudio_ready = true;
	if(this._webaudio_ready == true){this.onReady();this._onloadcallback();}
};

AudioPlayer.prototype._SetWebAudioReady = function() {
	//console.log("WebAudio Media loaded");
	this._webaudio_ready = true;
	if(this._htmlaudio_ready == true){this.onReady();this._onloadcallback();}
};

AudioPlayer.prototype.IsReady = function() {
	return (this._webaudio_ready && this._htmlaudio_ready);
};
var a = null;
function TestAudio(){
	a = new AudioPlayer()
	a.Load("/home/rurigk/.wine/drive_c/users/rurigk/Local Settings/Application Data/osu!/Songs/306591 HoneyWorks - Miraizu featAida Miou(CV-Toyosaki Aki)/14.Miraizu.mp3")
	a.onReady = function(){
		console.log("Ready");
		a.Play();
		
		/*setTimeout(function(){
			a.SetPlaybackRate(1.5);
			console.log("Playback rate 1.5");
		},3000);
		setTimeout(function(){
			a.PreservePitch(false);
			console.log("Chipmunk");
		},6000);
		setTimeout(function(){
			a.PreservePitch(true);
			console.log("NormalVoice");
		},9000);
		setTimeout(function(){
			a.SetPlaybackRate(1);
			console.log("Playback rate 1");
		},12000);
		setTimeout(function(){
			a.SetPlaybackRate(1.5);
			console.log("Playback rate 1.5");
		},15000);
		setTimeout(function(){
			a.PreservePitch(false);
			console.log("Chipmunk");
		},18000);*/
	}
}