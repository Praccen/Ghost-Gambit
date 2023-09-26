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
	private grassCB: Checkbox;
	private grassDensitySlider: Slider;
	private fpsDisplayCB: Checkbox;
	private controlsButton: Button;

	constructor(sa: StateAccessible) {
		super();
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

		this.grassCB = this.overlayRendering.getNewCheckbox();
		this.grassCB.position.x = 0.4;
		this.grassCB.position.y = 0.35;
		this.grassCB.textString = "Foldable grass ";
		this.grassCB.getElement().style.color = "cyan";
		this.grassCB.getInputElement().style.accentColor = "red";
		this.grassCB.getInputElement().checked = options.foldableGrass;

		this.grassDensitySlider = this.overlayRendering.getNewSlider();
		this.grassDensitySlider.position.x = 0.4;
		this.grassDensitySlider.position.y = 0.4;
		this.grassDensitySlider.textString = "Grass density \r\n(requires restart)";
		this.grassDensitySlider.getElement().style.color = "cyan";
		this.grassDensitySlider.getInputElement().style.accentColor = "red";
		this.grassDensitySlider.getInputElement().min = "1000";
		this.grassDensitySlider.getInputElement().max = "100000";
		this.grassDensitySlider.getInputElement().value = options.grassDensity + "";

		this.fpsDisplayCB = this.overlayRendering.getNewCheckbox();
		this.fpsDisplayCB.position.x = 0.4;
		this.fpsDisplayCB.position.y = 0.5;
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
		options.foldableGrass = this.grassCB.getChecked();
		options.showFps = this.fpsDisplayCB.getChecked();
		options.grassDensity = this.grassDensitySlider.getValue();
	}

	draw() {
		this.overlayRendering.draw();
	}
}
