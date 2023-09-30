export default class AudioPlayer {
	sounds: object;
	active: boolean; //set to true when user has interacted with document

	constructor() {
		this.sounds = {
			// bell: new Audio("Assets/Audio/Effects/bell.m4a"), //https://opengameart.org/content/100-cc0-sfx
			theme: new Audio("Assets/Audio/Songs/theme_1.mp3"), //https://pixabay.com/music/scary-childrens-tunes-dark-ambient-horror-cinematic-halloween-atmosphere-scary-118585/
			failure: new Audio("Assets/Audio/Effects/failure_1.mp3"), //https://pixabay.com/sound-effects/piano-suspense-shock-95515/
			ghost_sound_1: new Audio("Assets/Audio/Effects/ghost_sound_1.mp3"), //https://pixabay.com/sound-effects/classic-ghost-sound-95773/
			ghost_sound_2: new Audio("Assets/Audio/Effects/ghost_sound_2.mp3"), //https://pixabay.com/sound-effects/classic-ghost-sound-95773/
		};
		this.active = false;

		for (let sound in this.sounds) {
			this.sounds[sound].preload = "auto";
		}

		// this.setVolume("bell", 0.3);
		this.setVolume("theme", 0.5);
		this.setVolume("failure", 0.5);
		this.setVolume("ghost_sound_1", 0.5);
		this.setVolume("ghost_sound_2", 0.5);
	}

	playSound(key, loop) {
		this.sounds[key].loop = loop;
		this.active && this.sounds[key].play();
	}

	stopSound(key) {
		if (this.sounds[key].paused === false) {
			this.sounds[key].pause();
			this.sounds[key].currentTime = 0;
		}
	}

	setVolume(key, volume) {
		this.sounds[key].volume = volume;
	}

	setTime(key, time) {
		this.sounds[key].currentTime = time;
	}

	pauseSound(key) {
		this.sounds[key].pause();
	}

	stopAll() {
		// for(const s of Object.values(this.sounds)) {
		//     const playPromise = s.play();
		//     playPromise.then(() => {
		//         s.pause();
		//         s.currentTime = 0.0;
		//     })
		// }
	}
}
