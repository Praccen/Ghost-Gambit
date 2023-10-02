export default class AudioPlayer {
	sound_effects: object;
	sound_effects_volume_multilpliers: object;
	songs: object;
	songs_volume_multilpliers: object;
	active: boolean; //set to true when user has interacted with document
	sound_effects_dir: string;
	songs_dir: string;

	constructor() {
		this.sound_effects_dir = "Assets/Audio/Effects";
		this.songs_dir = "Assets/Audio/Music";

		this.sound_effects = {};
		this.songs = {};
		this.sound_effects_volume_multilpliers = {};
		this.songs_volume_multilpliers = {};

		this.active = false;

		const sound_effect_files = [
			"failure_1.mp3", //https://pixabay.com/sound-effects/piano-suspense-shock-95515/
			"ghost_sound_1.mp3", //https://pixabay.com/sound-effects/classic-ghost-sound-95773/
			"ghost_sound_2.mp3", //https://pixabay.com/sound-effects/classic-ghost-sound-95773/
			"ghost_sound_3.mp3", //https://pixabay.com/sound-effects/classic-ghost-sound-95773/
			"extinguish.mp3", //https://pixabay.com/sound-effects/blowing-out-candlewav-14441/
			"light_up.mp3", //https://pixabay.com/sound-effects/match-lighting-candle-81020/
			"fire.mp3", //https://pixabay.com/sound-effects/small-artisanal-oven-at-night-23698/
			"success_1.mp3", //https://pixabay.com/sound-effects/ahhhh-37191/
			"credits_theme_1.mp3", //https://pixabay.com/music/modern-classical-simple-piano-melody-9834/
		];
		const sound_effect_volume_multilpliers_list = [
			0.5, 0.5, 1, 1, 0.5, 0.5, 1, 1, 0.5,
		];
		let count = 0;
		for (const file of sound_effect_files) {
			this.sound_effects[file.split(".")[0]] = new Audio(
				this.sound_effects_dir + "/" + file
			);
			this.sound_effects_volume_multilpliers[file.split(".")[0]] =
				sound_effect_volume_multilpliers_list[count];
			count++;
		}

		const song_files = ["theme_1.mp3"]; //https://pixabay.com/music/scary-childrens-tunes-dark-ambient-horror-cinematic-halloween-atmosphere-scary-118585/
		const song_files_volume_multilpliers_list = [0.5];
		count = 0;
		for (const file of song_files) {
			this.songs[file.split(".")[0]] = new Audio(this.songs_dir + "/" + file);
			this.songs_volume_multilpliers[file.split(".")[0]] =
				song_files_volume_multilpliers_list[count];
			count++;
		}

		for (let sound in this.sound_effects) {
			this.sound_effects[sound].preload = "auto";
		}
		for (let sound in this.songs) {
			this.songs[sound].preload = "auto";
		}

		this.setMusicVolume(1.0);
		this.setSoundEffectVolume(1.0);
	}

	playAudio(key, loop, volumeMultiplier?) {
		if (!volumeMultiplier) {
			volumeMultiplier = 1;
		}
		if (this.sound_effects[key]) {
			this.sound_effects[key].loop = loop;
			this.active && this.sound_effects[key].play();
		} else if (this.songs[key]) {
			this.songs[key].loop = loop;
			this.active && this.songs[key].play();
		}
	}

	setAudioVolume(key, volume) {
		if (
			this.sound_effects[key] &&
			this.sound_effects_volume_multilpliers[key]
		) {
			this.sound_effects[key].volume = Math.min(
				volume * this.sound_effects_volume_multilpliers[key],
				1
			);
		} else if (this.songs[key] && this.songs_volume_multilpliers[key]) {
			this.songs[key].volume = Math.min(
				volume * this.songs_volume_multilpliers[key],
				1
			);
		}
	}

	setMusicVolume(volume: number) {
		Object.keys(this.songs).forEach((key) => {
			this.songs[key].volume = Math.min(
				volume * this.songs_volume_multilpliers[key],
				1
			);
		});
	}

	setSoundEffectVolume(volume: number) {
		Object.keys(this.sound_effects).forEach((key) => {
			this.sound_effects[key].volume = Math.min(
				volume * this.sound_effects_volume_multilpliers[key],
				1
			);
		});
	}

	setAudioTime(key, time) {
		if (this.sound_effects[key]) {
			this.sound_effects[key].currentTime = time;
		} else if (this.songs[key]) {
			this.songs[key].currentTime = time;
		}
	}

	pauseAudio(key) {
		if (this.sound_effects[key]) {
			this.sound_effects[key].pause();
		} else if (this.songs[key]) {
			this.songs[key].pause();
		}
	}

	stopAll() {
		Object.keys(this.songs).forEach((key) => {
			this.songs[key].pause();
			this.songs[key].currentTime = 0;
		});

		Object.keys(this.sound_effects).forEach((key) => {
			this.sound_effects[key].pause();
			this.sound_effects[key].currentTime = 0;
		});
	}
}
