import State, { StatesEnum } from "../../Engine/State";
import { input, options, StateAccessible } from "../GameMachine";
import Game from "./Game";
import Vec2 from "../../Engine/Maths/Vec2";
import Vec3 from "../../Engine/Maths/Vec3";
import { MousePicking } from "../../Engine/Maths/MousePicking";
import DebugMenu from "./DebugMenu";
import { WebUtils } from "../../Engine/Utils/WebUtils";

export default class SpectateMode extends State {
	private game: Game;
	private lastMousePos: Vec2;

	constructor(game: Game) {
		super();
		this.game = game;

		this.lastMousePos = new Vec2([
			input.mousePosition.x,
			input.mousePosition.y,
		]);
	}

	async init() {
		super.init();
		this.game.rendering.camera.setPosition(0, 0, 0);
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

		if (input.keys[" "]) {
			moveVec.add(new Vec3([0.0, 1.0, 0.0]));
			move = true;
		}

		if (input.keys["SHIFT"]) {
			moveVec.subtract(new Vec3([0.0, 1.0, 0.0]));
			move = true;
		}

		if (move) {
			moveVec.normalize();
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
		input.drawTouchControls();
	}
}
