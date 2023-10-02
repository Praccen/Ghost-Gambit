import Button from "../../Engine/GUI/Button";
import Checkbox from "../../Engine/GUI/Checkbox";
import Slider from "../../Engine/GUI/Slider";
import { options } from "../GameMachine";
import State, { StatesEnum } from "../../Engine/State";
import { StateAccessible } from "../GameMachine";
import { OverlayRendering } from "../../Engine/Rendering/OverlayRendering";

export default class OptionsMenu extends State {
	private overlayRendering: OverlayRendering;

	private backButton: Button;
	private crtCB: Checkbox;
	private bloomCB: Checkbox;
	private fpsDisplayCB: Checkbox;
	private controlsButton: Button;
	private musicVolume: Slider;
	private effectVolume: Slider;
	private state: StateAccessible;

	constructor(sa: StateAccessible) {
		super();
		this.state = sa;
		this.overlayRendering = new OverlayRendering();

		this.crtCB = this.overlayRendering.getNewCheckbox();
		this.crtCB.position.x = 0.4;
		this.crtCB.position.y = 0.25;
		this.crtCB.textString = "CRT-effect ";
		this.crtCB.getElement().style.color = "cyan";
		this.crtCB.getInputElement().style.accentColor = "red";
		this.crtCB.getInputElement().checked = options.useCrt;

		this.bloomCB = this.overlayRendering.getNewCheckbox();
		this.bloomCB.position.x = 0.4;
		this.bloomCB.position.y = 0.3;
		this.bloomCB.textString = "Bloom-effect ";
		this.bloomCB.getElement().style.color = "cyan";
		this.bloomCB.getInputElement().style.accentColor = "red";
		this.bloomCB.getInputElement().checked = options.useBloom;

		this.fpsDisplayCB = this.overlayRendering.getNewCheckbox();
		this.fpsDisplayCB.position.x = 0.4;
		this.fpsDisplayCB.position.y = 0.35;
		this.fpsDisplayCB.textString = "Fps counter ";
		this.fpsDisplayCB.getElement().style.color = "cyan";
		this.fpsDisplayCB.getInputElement().style.accentColor = "red";
		this.fpsDisplayCB.getInputElement().checked = options.showFps;

		this.controlsButton = this.overlayRendering.getNewButton();
		this.controlsButton.position.x = 0.5;
		this.controlsButton.position.y = 0.75;
		this.controlsButton.center = true;

		this.controlsButton.textString = "Controls";

		let self = this;
		this.controlsButton.onClick(function () {
			self.gotoState = StatesEnum.CONTROLS;
		});

		this.backButton = this.overlayRendering.getNewButton();
		this.backButton.position.x = 0.5;
		this.backButton.position.y = 0.85;
		this.backButton.center = true;
		this.backButton.textString = "Back to main menu";

		this.backButton.onClick(function () {
			self.gotoState = StatesEnum.MAINMENU;
		});

		this.musicVolume = this.overlayRendering.getNewSlider();
		this.musicVolume.position.x = 0.4;
		this.musicVolume.position.y = 0.4;
		this.musicVolume.textString = "Music volume";
		this.musicVolume.getElement().style.color = "cyan";
		this.musicVolume.getInputElement().style.accentColor = "red";
		this.musicVolume.getInputElement().min = "0";
		this.musicVolume.getInputElement().max = "100";
		this.musicVolume.getInputElement().value = options.musicVolume * 250 + "";

		this.effectVolume = this.overlayRendering.getNewSlider();
		this.effectVolume.position.x = 0.4;
		this.effectVolume.position.y = 0.45;
		this.effectVolume.textString = "Effects volume";
		this.effectVolume.getElement().style.color = "cyan";
		this.effectVolume.getInputElement().style.accentColor = "red";
		this.effectVolume.getInputElement().min = "0";
		this.effectVolume.getInputElement().max = "100";
		this.effectVolume.getInputElement().value = options.effectVolume * 250 + "";
	}

	async init() {
		super.init();
		this.overlayRendering.show();
	}

	reset() {
		super.reset();
		this.overlayRendering.hide();
	}

	update(dt: number) {
		options.useCrt = this.crtCB.getChecked();
		options.useBloom = this.bloomCB.getChecked();
		options.showFps = this.fpsDisplayCB.getChecked();
		options.musicVolume = this.musicVolume.getValue() * 0.004;
		this.state.audioPlayer.setMusicVolume(options.musicVolume);
		options.effectVolume = this.effectVolume.getValue() * 0.004;
		this.state.audioPlayer.setSoundEffectVolume(options.effectVolume);
	}

	draw() {
		this.overlayRendering.draw();
	}
}
