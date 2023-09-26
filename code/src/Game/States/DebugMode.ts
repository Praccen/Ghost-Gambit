import State, { StatesEnum } from "../../Engine/State";
import { input, options, StateAccessible } from "../GameMachine";
import Game from "./Game";
import Vec2 from "../../Engine/Maths/Vec2";
import Vec3 from "../../Engine/Maths/Vec3";
import { MousePicking } from "../../Engine/Maths/MousePicking";
import DebugMenu from "./DebugMenu";
import { WebUtils } from "../../Engine/Utils/WebUtils";

export default class DebugMode extends State {
	private game: Game;
	private stateAccessible: StateAccessible;
	private debugMenu: DebugMenu;
	private mouseWasPressed: boolean;
	private cWasPressed: boolean;
	private lastMousePos: Vec2;
	private checkpointNeeded: boolean;
	private actionString: string;
	private oWasPressed: boolean;

	constructor(sa: StateAccessible, game: Game) {
		super();
		this.stateAccessible = sa;
		this.game = game;
		this.debugMenu = new DebugMenu(this.stateAccessible, this.game);

		this.lastMousePos = new Vec2([
			input.mousePosition.x,
			input.mousePosition.y,
		]);

		this.oWasPressed = true;
		this.mouseWasPressed = false;
		this.cWasPressed = false;
		this.checkpointNeeded = true;
		this.actionString = "";
	}

	async init() {
		super.init();
		this.debugMenu.init();
		let posCookie = WebUtils.GetCookie("debugPos");
		if (posCookie != "") {
			let coords = posCookie.split(",");
			if (coords.length == 3) {
				this.game.rendering.camera.setPosition(parseFloat(coords[0]), parseFloat(coords[1]), parseFloat(coords[2]));
			}
		}

		let dirCookie = WebUtils.GetCookie("debugDir");
		if (dirCookie != "") {
			let coords = dirCookie.split(",");
			if (coords.length == 3) {
				this.game.rendering.camera.setDir(parseFloat(coords[0]), parseFloat(coords[1]), parseFloat(coords[2]));
			}
		}

		this.oWasPressed = true;
	}

	reset() {
		super.reset();
		this.debugMenu.reset();
	}

	update(dt: number) {
		let checkpointTriggeredThisFrame = false;

		if (input.keys["O"]) {
			if (!this.oWasPressed) {
				WebUtils.SetCookie("debug", "false");
				this.gotoState = StatesEnum.GAME;
			}
			this.oWasPressed = true;
		}
		else {
			this.oWasPressed = false;
		}
		

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

		if (input.mouseRightClicked && !this.debugMenu.mouseOverGuiElement && (input.mousePosition.x != input.mousePosition.previousX || input.mousePosition.y != input.mousePosition.previousY)) {
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

		if (input.mouseClicked && !this.debugMenu.mouseOverGuiElement) {
			// Holding mousebutton
			let rotChange = 0.0;
			let newPosition = null;
			let scaleChange = 0.0;
			let edited = false;
			if (input.keys["R"]) {
				rotChange = input.mousePosition.x - this.lastMousePos.x;
				edited = true;
				this.actionString = "Rotating";
			}
			if (input.keys["T"] || input.keys["G"]) {
				let ray = MousePicking.GetRay(this.game.rendering.camera);
				let dist: number = Infinity;
				
				if (input.keys["T"]) {
					dist = this.game.doRayCast(ray);
				}

				if (input.keys["G"]) {
					dist = this.game.objectPlacer.rayCastToNonSelectedObjects(ray);
				}

				if (dist >= 0.0 && dist < Infinity) {
					newPosition = new Vec3(this.game.rendering.camera.getPosition()).add(
						new Vec3(ray.getDir()).multiply(dist));
					edited = true;
				}
				this.actionString = "Moving";
			}
			if (input.keys["Y"]) {
				scaleChange =
				(this.lastMousePos.y - input.mousePosition.y) * 0.001;
				edited = true;
				this.actionString = "Scaling";
			}

			if (edited) {
				this.game.objectPlacer.updateCurrentlyEditingObject(
					rotChange,
					scaleChange,
					newPosition
				);
				// this.debugMenu.updateEntityBoxComponents(this.game.objectPlacer.currentlyEditingEntityId);
				checkpointTriggeredThisFrame = true;
				this.checkpointNeeded = true;
			}
			else if (!this.mouseWasPressed) { // If we clicked the mouse button this frame
				// Try to select a new object to edit
				let ray = MousePicking.GetRay(this.game.rendering.camera);
				this.game.objectPlacer.rayCastToSelectNewObject(ray);
				this.actionString = "Selected ";
			}

			this.mouseWasPressed = true;
		} else {
			this.mouseWasPressed = false;
			this.actionString = "Currently selected:"
		}

		if (input.keys["DELETE"]) {
			this.game.objectPlacer.deleteCurrentObject();
			this.actionString = "Deleted object";
			checkpointTriggeredThisFrame = true;
			this.checkpointNeeded = true;
		}

		if (input.keys["C"]) {
			if (!this.cWasPressed) {
				this.game.objectPlacer.duplicateCurrentObject();
				this.actionString = "Duplicated object";
				checkpointTriggeredThisFrame = true;
				this.checkpointNeeded = true;
			}
			this.cWasPressed = true;
		}
		else {
			this.cWasPressed = false;
		}

		this.lastMousePos.deepAssign([
			input.mousePosition.x,
			input.mousePosition.y,
		]);

		let camPos = this.game.rendering.camera.getPosition();
		WebUtils.SetCookie("debugPos", camPos.x + "," + camPos.y + "," + camPos.z);
		let camDir = this.game.rendering.camera.getDir();
		WebUtils.SetCookie("debugDir", camDir.x + "," + camDir.y + "," + camDir.z);

		this.game.grassHandler.update(dt);

		this.debugMenu.actionText.textString = this.actionString + " " + this.game.objectPlacer.getCurrentObjectName();

		this.debugMenu.update(dt);
		
		this.game.ecsManager.update(0.0);

		if (this.checkpointNeeded && !checkpointTriggeredThisFrame) {
			this.game.objectPlacer.makeCheckpoint();
		}
	}

	prepareDraw(dt: number): void {}

	draw() {
		this.game.rendering.draw();
		this.debugMenu.draw();
		input.drawTouchControls();
	}
}
