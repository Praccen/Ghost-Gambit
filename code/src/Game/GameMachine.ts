import AudioPlayer from "../Engine/Audio/AudioPlayer";
import TextObject2D from "../Engine/GUI/Text/TextObject2D";
import Input from "../Engine/Input/Input";
import MeshStore from "../Engine/AssetHandling/MeshStore";
import { StatesEnum } from "../Engine/State";
import StateMachine from "../Engine/StateMachine";
import TextureStore from "../Engine/AssetHandling/TextureStore";
import ControlsMenu from "./States/ControlsMenu";
import DebugMode from "./States/DebugMode";
import SpectateMode from "./States/SpectateMode";
import Game from "./States/Game";
import LoadingScreen from "./States/LoadingScreen";
import Menu from "./States/Menu";
import OptionsMenu from "./States/OptionsMenu";
import { WebUtils } from "../Engine/Utils/WebUtils";
import { OverlayRendering } from "../Engine/Rendering/OverlayRendering";
import { Client } from "../Engine/Client/Client";
import LobbyState from "./States/LobbyState";
import PreLobbyState from "./States/PreLobbyState";
import ScoreState from "./States/ScoreState";

// Globals
export let input = new Input();
export let options = {
	useCrt: false,
	useBloom: false,
	showFps: true,
	musicVolume: 0.05,
	effectVolume: 0.05,
};

/**
 * These are the variables available to all the states
 */
export class StateAccessible {
	textureStore: TextureStore;
	meshStore: MeshStore;
	audioPlayer: AudioPlayer;
	restartGame: boolean;
	localGame: boolean;
}

export default class GameMachine extends StateMachine {
	stateAccessible: StateAccessible;

	private overlayRendering: OverlayRendering;
	private fpsDisplay: TextObject2D;

	constructor() {
		super(StatesEnum.LOADINGSCREEN);
		this.initializeOptions();
		this.stateAccessible = {
			textureStore: new TextureStore(),
			meshStore: new MeshStore(),
			// fpsDisplay: null,
			audioPlayer: new AudioPlayer(),
			restartGame: false,
			localGame: true,
		};
		this.stateAccessible.audioPlayer.setMusicVolume(options.musicVolume);
		this.stateAccessible.audioPlayer.setSoundEffectVolume(options.effectVolume);

		let game = Game.getInstance(this.stateAccessible);

		// Add states
		this.addState(
			StatesEnum.LOADINGSCREEN,
			LoadingScreen,
			1 / 60.0,
			new LoadingScreen(this.stateAccessible)
		);
		this.addState(
			StatesEnum.MAINMENU,
			Menu,
			1.0 / 60.0,
			new Menu(this.stateAccessible)
		);
		this.addState(
			StatesEnum.PRELOBBY,
			PreLobbyState,
			1.0 / 60.0,
			new PreLobbyState(this.stateAccessible)
		);
		this.addState(
			StatesEnum.LOBBY,
			LobbyState,
			1.0 / 60.0,
			new LobbyState(this.stateAccessible)
		);
		this.addState(
			StatesEnum.OPTIONS,
			OptionsMenu,
			1.0 / 60.0,
			new OptionsMenu(this.stateAccessible)
		);
		this.addState(
			StatesEnum.CONTROLS,
			ControlsMenu,
			1.0 / 60.0,
			new ControlsMenu(this.stateAccessible)
		);
		this.addState(StatesEnum.GAME, Game, 1.0 / 144.0, game);
		this.addState(
			StatesEnum.SPECTATEMODE,
			SpectateMode,
			1.0 / 144.0,
			new SpectateMode(this.stateAccessible, game)
		);
		this.stateAccessible.restartGame = true;

		// game.load();
		this.addState(
			StatesEnum.DEBUGMODE,
			DebugMode,
			1.0 / 144.0,
			new DebugMode(this.stateAccessible, game)
		);

		this.addState(
			StatesEnum.SCOREMODE,
			ScoreState,
			1.0 / 144.0,
			new ScoreState(this.stateAccessible)
		);

		this.overlayRendering = new OverlayRendering();
		this.fpsDisplay = this.overlayRendering.getNew2DText();
		this.fpsDisplay.position.x = 0.01;
		this.fpsDisplay.position.y = 0.01;
		this.fpsDisplay.size = 18;
		this.fpsDisplay.scaleWithWindow = false;
		this.fpsDisplay.getElement().style.color = "lime";
	}

	onExit(e: BeforeUnloadEvent) {
		WebUtils.SetCookie("showFps", options.showFps.valueOf().toString());
		WebUtils.SetCookie("useCrt", options.useCrt.valueOf().toString());
		WebUtils.SetCookie("useBloom", options.useBloom.valueOf().toString());
		WebUtils.SetCookie("volume", options.musicVolume.toString());
		WebUtils.SetCookie("effectVolume", options.effectVolume.toString());

		for (let s of this.states) {
			s[1].state.onExit(e);
		}
	}

	initializeOptions() {
		options.showFps = !(WebUtils.GetCookie("showFps") == "false");
		options.useCrt = WebUtils.GetCookie("useCrt") == "true";
		options.useBloom = WebUtils.GetCookie("useBloom") == "true";
		let volumeCookie = WebUtils.GetCookie("volume");
		if (volumeCookie != "") {
			options.musicVolume = parseFloat(volumeCookie);
		}
		let effectVolumeCookie = WebUtils.GetCookie("effectVolume");
		if (effectVolumeCookie != "") {
			options.effectVolume = parseFloat(effectVolumeCookie);
		}
	}

	async runCurrentState() {
		this.fpsDisplay.setHidden(!options.showFps);
		this.fpsDisplay.textString = Math.round(this.fps) + "";
		this.overlayRendering.draw();
		super.runCurrentState();
	}
}
