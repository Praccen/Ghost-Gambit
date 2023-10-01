import CameraFocusComponent from "../Engine/ECS/Components/CameraFocusCompontent";
import Vec3 from "../Engine/Maths/Vec3";
import { input } from "./GameMachine";
import Game from "./States/Game";
import Character from "./Character";

export default class PlayerCharacter extends Character {
	async init() {
		super.init();

		this.cameraFocusComp = new CameraFocusComponent();
		this.cameraFocusComp.offset.setValues(0.0, 1.5, -3.0);
		this.cameraFocusComp.focusPoint.setValues(0.0, 1.5, 0.0);
		this.ecsManager.addComponent(this.bodyEntity, this.cameraFocusComp);
	}

	extinguish_audio_operations() {
		this.audioPlayer.playAudio("extinguish", false);
		this.audioPlayer.pauseAudio("fire");
	}

	light_up_audio_operations() {
		this.audioPlayer.playAudio("light_up", false);
		this.audioPlayer.playAudio("fire", true);
	}

	get_forward_and_right(): [Vec3, Vec3] {
		let forward = new Vec3(this.rendering.camera.getDir());
		forward.y = 0.0;
		forward.normalize();

		let right = new Vec3(this.rendering.camera.getRight());
		right.y = 0.0;
		right.normalize();

		return [forward, right];
	}

	update_client() {
		const client = Game.getInstanceNoSa().client;
		if (client.connected) {
			client.send(
				JSON.stringify({
					type: "MOV",
					x: this.groupPositionComp.position.x,
					y: this.groupPositionComp.position.y,
					z: this.groupPositionComp.position.z,
				}),
				0
			);
		}
	}

	modify_acc_vec(accVec: Vec3): Vec3 {
		// Movement input
		let [forward, right] = this.get_forward_and_right();

		// Touch / joystick control
		input.updateGamepad();
		if (input.joystickLeftDirection.length2() > 0.001) {
			accVec.add(new Vec3(right).multiply(input.joystickLeftDirection.x * 2.0));
			accVec.subtract(
				new Vec3(forward).multiply(input.joystickLeftDirection.y * 2.0)
			);
		}
		// Keyboard control
		else {
			if (input.keys["W"]) {
				accVec.add(forward);
			}

			if (input.keys["S"]) {
				accVec.subtract(forward);
			}

			if (input.keys["A"]) {
				accVec.subtract(right);
			}

			if (input.keys["D"]) {
				accVec.add(right);
			}
		}
		return accVec;
	}

	jump_controll() {
		if (input.keys[" "] || input.buttons.get("A")) {
			this.movComp.jumpRequested = true;
			this.offGroundTimer = 0.5;
			this.audioPlayer.pauseAudio("ghost_sound_2");
			this.audioPlayer.playAudio("ghost_sound_2", false);
		} else {
			this.movComp.jumpRequested = false;
		}
	}

	character_specific_controll() {
		if (input.keys["K"]) {
			this.light_up();
		}

		if (input.keys["L"]) {
			this.extinguish();
		}
	}

	camera_operations(dt: number) {
		// Update camera
		if (input.keys["ARROWLEFT"]) {
			this.cameraFocusComp.offset.add(
				new Vec3(this.rendering.camera.getRight()).multiply(dt * 8.0)
			);
		} else if (input.keys["ARROWRIGHT"]) {
			this.cameraFocusComp.offset.subtract(
				new Vec3(this.rendering.camera.getRight()).multiply(dt * 8.0)
			);
		} else if (input.joystickRightDirection.length2() > 0.0) {
			this.cameraFocusComp.offset.add(
				new Vec3(this.rendering.camera.getRight()).multiply(
					dt * 8.0 * input.joystickRightDirection.x
				)
			);
		} else if (this.movComp) {
			this.cameraFocusComp.offset.subtract(
				new Vec3(this.movComp.velocity).multiply(dt * 3.0)
			);
		}

		// ---- Keep a good camera distance ----
		let disiredDistance = 2.0;

		this.cameraFocusComp.offset.multiply(
			Math.pow(disiredDistance / this.cameraFocusComp.offset.len(), 0.1)
		);
		this.cameraFocusComp.offset.y = Math.max(
			this.cameraFocusComp.offset.y,
			0.5
		);

		let offsetXZ = new Vec3([
			this.cameraFocusComp.offset.x,
			0.0,
			this.cameraFocusComp.offset.z,
		]);
		let len2 = offsetXZ.length2();
		if (len2 < 1.0 && len2 > 0.001) {
			offsetXZ.normalize();
			this.cameraFocusComp.offset.x = offsetXZ.x;
			this.cameraFocusComp.offset.z = offsetXZ.z;
		}
	}
}
