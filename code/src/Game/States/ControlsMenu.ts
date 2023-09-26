import Button from "../../Engine/GUI/Button";
import State, { StatesEnum } from "../../Engine/State";
import { input, StateAccessible } from "../GameMachine";
import { OverlayRendering } from "../../Engine/Rendering/OverlayRendering";

export default class ControlsMenu extends State {
	private overlayRendering: OverlayRendering;

	private backButton: Button;

	constructor(sa: StateAccessible) {
		super();
		this.overlayRendering = new OverlayRendering();

		this.backButton = this.overlayRendering.getNewButton();
		this.backButton.position.x = 0.5;
		this.backButton.position.y = 0.1;
		this.backButton.center = true;
		this.backButton.textSize = 30;
		this.backButton.textString = "Back";

		let self = this;
		this.backButton.onClick(function () {
			self.gotoState = StatesEnum.OPTIONS;
		});
	}

	async init() {
		super.init();
		this.overlayRendering.show();
		input.touchUsed = true;
		input.simulateTouchBasedOnMouse = true;
		input.repositionTouchControls = true;
	}

	reset() {
		super.reset();
		this.overlayRendering.hide();
		input.touchUsed = false;
		input.simulateTouchBasedOnMouse = false;
		input.repositionTouchControls = false;
		input.drawTouchControls();
	}

	update(dt: number) {}

	draw() {
		this.overlayRendering.draw();
		input.drawTouchControls();
	}
}
