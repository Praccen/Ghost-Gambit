import State, { StatesEnum } from "../../Engine/State";
import { StateAccessible, input } from "../GameMachine";
import Game from "./Game";
import Vec2 from "../../Engine/Maths/Vec2";
import Vec3 from "../../Engine/Maths/Vec3";
import { OverlayRendering } from "../../Engine/Rendering/OverlayRendering";
import { gl } from "../../main";

export default class SpectateMode extends State {
	private game: Game;
	private sa: StateAccessible;
	private overlay: OverlayRendering;
	private lastMousePos: Vec2;

	constructor(stateAccessible: StateAccessible, game: Game) {
		super();
		this.game = game;
		this.sa = stateAccessible;

		this.lastMousePos = new Vec2([
			input.mousePosition.x,
			input.mousePosition.y,
		]);

		this.overlay = new OverlayRendering();

		let menubutton = this.overlay.getNewButton();
		menubutton.position.x = 0.9;
		menubutton.position.y = 0.0;
		menubutton.textSize = 40;
		menubutton.getInputElement().style.backgroundColor = "transparent";
		menubutton.getInputElement().style.borderColor = "transparent";
		menubutton.textString = "Menu";

		let self = this;
		menubutton.onClick(function () {
			self.gotoState = StatesEnum.MAINMENU;
		});
	}

	async init() {
		super.init();
		this.game.rendering.camera.setPosition(0, 0, 0);
		this.overlay.show();
		this.sa.audioPlayer.stopAll();
		this.sa.audioPlayer.playAudio("credits_theme_1", true);
	}

	reset() {
		super.reset();
		this.overlay.hide();
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT);
		input.touchUsed = false;
		input.drawTouchControls();
		if (this.sa.audioPlayer != undefined) {
			this.sa.audioPlayer.stopAll();
		}
	}

	update(dt: number) {
		let moveVec: Vec3 = new Vec3();
		let move = false;
		if (input.keys["W"]) {
			moveVec.add(this.game.rendering.camera.getDir());
			move = true;
		}

		if (input.keys["S"]) {
			moveVec.subtract(this.game.rendering.camera.getDir());
			move = true;
		}

		if (input.keys["A"]) {
			moveVec.subtract(this.game.rendering.camera.getRight());
			move = true;
		}

		if (input.keys["D"]) {
			moveVec.add(this.game.rendering.camera.getRight());
			move = true;
		}

		if (input.joystickLeftDirection.length2() > 0.0) {
			let joyDir = input.joystickLeftDirection;
			moveVec
				.setValues(0.0, 0.0, 0.0)
				.add(new Vec3(this.game.rendering.camera.getRight()).multiply(joyDir.x))
				.add(new Vec3(this.game.rendering.camera.getDir()).multiply(-joyDir.y));
			move = true;
		}

		if (input.keys[" "]) {
			moveVec.add(new Vec3([0.0, 1.0, 0.0]));
			move = true;
		}

		if (input.keys["SHIFT"]) {
			moveVec.subtract(new Vec3([0.0, 1.0, 0.0]));
			move = true;
		}

		if (move) {
			moveVec.multiply(15.0 * dt); // Speed

			this.game.rendering.camera.translate(moveVec.x, moveVec.y, moveVec.z);
		}

		let rotVec: Vec2 = new Vec2([0.0, 0.0]);
		let rotate = false;

		if (
			input.mouseRightClicked &&
			(input.mousePosition.x != input.mousePosition.previousX ||
				input.mousePosition.y != input.mousePosition.previousY)
		) {
			rotVec.setValues(
				(input.mousePosition.previousY - input.mousePosition.y) * 0.2,
				(input.mousePosition.previousX - input.mousePosition.x) * 0.2
			);

			rotate = true;
		}

		if (input.joystickRightDirection.length2() > 0.0) {
			rotVec.setValues(
				-input.joystickRightDirection.y,
				-input.joystickRightDirection.x
			);
			rotate = true;
		}

		if (rotate) {
			let rotMatrix = new Matrix4(null);
			let rotAmount: number = 90.0;
			let rightVec: Vec3 = new Vec3(this.game.rendering.camera.getRight());
			if (rotVec.y) {
				rotMatrix.rotate(rotAmount * rotVec.y * dt, 0.0, 1.0, 0.0);
			}
			if (rotVec.x) {
				rotMatrix.rotate(
					rotAmount * rotVec.x * dt,
					rightVec.x,
					rightVec.y,
					rightVec.z
				);
			}
			let oldDir = new Vector3(this.game.rendering.camera.getDir());
			let newDir = rotMatrix.multiplyVector3(oldDir);
			this.game.rendering.camera.setDir(
				newDir.elements[0],
				newDir.elements[1],
				newDir.elements[2]
			);
		}

		this.lastMousePos.deepAssign([
			input.mousePosition.x,
			input.mousePosition.y,
		]);

		this.game.ecsManager.update(dt);
		this.game.ecsManager.updateRenderingSystems(dt, false);
	}

	prepareDraw(dt: number): void {}

	draw() {
		this.game.rendering.draw();
		this.overlay.draw();
		input.drawTouchControls();
	}
}
