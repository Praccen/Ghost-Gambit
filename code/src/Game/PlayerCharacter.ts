import TextureStore from "../Engine/AssetHandling/TextureStore";
import AudioPlayer from "../Engine/Audio/AudioPlayer";
import BoundingBoxComponent from "../Engine/ECS/Components/BoundingBoxComponent";
import CameraFocusComponent from "../Engine/ECS/Components/CameraFocusCompontent";
import CollisionComponent from "../Engine/ECS/Components/CollisionComponent";
import { ComponentTypeEnum } from "../Engine/ECS/Components/Component";
import GraphicsComponent from "../Engine/ECS/Components/GraphicsComponent";
import MovementComponent from "../Engine/ECS/Components/MovementComponent";
import ParticleSpawnerComponent from "../Engine/ECS/Components/ParticleSpawnerComponent";
import PointLightComponent from "../Engine/ECS/Components/PointLightComponent";
import PositionComponent from "../Engine/ECS/Components/PositionComponent";
import PositionParentComponent from "../Engine/ECS/Components/PositionParentComponent";
import ECSManager from "../Engine/ECS/ECSManager";
import Entity from "../Engine/ECS/Entity";
import Vec3 from "../Engine/Maths/Vec3";
import GraphicsBundle from "../Engine/Objects/GraphicsBundle";
import Rendering from "../Engine/Rendering/Rendering";
import Scene from "../Engine/Rendering/Scene";
import { input } from "./GameMachine";
import Game from "./States/Game";

export default class PlayerCharacter {
	private rendering: Rendering;
	private ecsManager: ECSManager;
	private audioPlayer: AudioPlayer;

	private bodyEntity: Entity;

	private groupPositionComp: PositionParentComponent;
	private movComp: MovementComponent;
	private cameraFocusComp: CameraFocusComponent;
	private bodyMesh: GraphicsBundle;

	private lastAnimation: Function;
	private currentAnimation: Function;

	private offGroundTimer;

	private timer: number;
	constructor(
		rendering: Rendering,
		ecsManager: ECSManager,
		audioPlayer: AudioPlayer
	) {
		this.rendering = rendering;
		this.ecsManager = ecsManager;
		this.audioPlayer = audioPlayer;

		this.timer = 0.0;
		this.lastAnimation = this.resetAnimation;
		this.currentAnimation = this.resetAnimation;
		this.offGroundTimer = 0.0;
	}

	async init() {
		this.bodyEntity = Game.getInstanceNoSa().objectPlacer.placeObject(
			"Ghost Character",
			new Vec3(),
			new Vec3([0.25, 0.25, 0.25]),
			new Vec3(),
			false
		);

		this.cameraFocusComp = new CameraFocusComponent();
		this.cameraFocusComp.offset.setValues(0.0, 1.5, -3.0);
		this.cameraFocusComp.focusPoint.setValues(0.0, 1.5, 0.0);
		this.ecsManager.addComponent(this.bodyEntity, this.cameraFocusComp);
	}

	respawn() {
		if (this.groupPositionComp == undefined) {
			this.groupPositionComp = <PositionParentComponent>(
				this.bodyEntity.getComponent(ComponentTypeEnum.POSITIONPARENT)
			);
		}
		if (this.movComp == undefined) {
			this.movComp = <MovementComponent>(
				this.bodyEntity.getComponent(ComponentTypeEnum.MOVEMENT)
			);
		}

		if (this.groupPositionComp != undefined) {
			this.groupPositionComp.position.setValues(0.0, -1.5, 0.0);
		}

		if (this.movComp != undefined) {
			this.movComp.velocity.setValues(0.0, 0.0, 0.0);
		}
	}

	getPosition(): Vec3 {
		return this.groupPositionComp.position;
	}

	getVelocity(): Vec3 {
		return this.movComp.velocity;
	}

	update(dt: number) {
		if (this.groupPositionComp == undefined) {
			this.groupPositionComp = <PositionParentComponent>(
				this.bodyEntity.getComponent(ComponentTypeEnum.POSITIONPARENT)
			);
		}
		if (this.movComp == undefined) {
			this.movComp = <MovementComponent>(
				this.bodyEntity.getComponent(ComponentTypeEnum.MOVEMENT)
			);
		}
		if (this.bodyMesh == undefined) {
			let graphicsComp = <GraphicsComponent>(
				this.bodyEntity.getComponent(ComponentTypeEnum.GRAPHICS)
			);
			if (graphicsComp != undefined) {
				this.bodyMesh = graphicsComp.object;
			}
		}

		if (
			this.groupPositionComp == undefined ||
			this.movComp == undefined ||
			this.bodyMesh == undefined
		) {
			return;
		}

		this.timer += dt;

		let accVec = new Vec3();

		// Movement input
		let forward = new Vec3(this.rendering.camera.getDir());
		forward.y = 0.0;
		forward.normalize();

		let right = new Vec3(this.rendering.camera.getRight());
		right.y = 0.0;
		right.normalize();

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

		if (accVec.length2() > 0.001) {
			// Handle rotation
			let targetRotation =
				90 - Math.atan2(accVec.z, accVec.x) * (180 / Math.PI);
			let diff = targetRotation - this.groupPositionComp.rotation.y;
			if (diff > 180) {
				diff -= 360;
			} else if (diff < -180) {
				diff += 360;
			}

			this.groupPositionComp.rotation.y =
				(this.groupPositionComp.rotation.y + diff * 0.04) % 360;

			let acceleration = accVec.len();

			this.movComp.accelerationDirection.x =
				Math.cos((90 - this.groupPositionComp.rotation.y) * (Math.PI / 180)) *
				Math.min(acceleration, 1.0);
			this.movComp.accelerationDirection.z =
				Math.sin((90 - this.groupPositionComp.rotation.y) * (Math.PI / 180)) *
				Math.min(acceleration, 1.0);

			// Walk/run animation based on velocity
			let vel = this.movComp.velocity.len();

			this.currentAnimation = this.walkAnimation;

			if (vel > 5.0) {
				this.currentAnimation = this.runAnimation;
			}
		} else {
			// No acceleration, stand still
			this.currentAnimation = this.resetAnimation;
		}

		// Jumping
		if (input.keys[" "] || input.buttons.get("A")) {
			this.movComp.jumpRequested = true;
			this.offGroundTimer = 0.5;
			this.audioPlayer.pauseAudio("ghost_sound_2");
			this.audioPlayer.playAudio("ghost_sound_2", false);
		} else {
			this.movComp.jumpRequested = false;
		}

		if (!this.movComp.onGround || this.movComp.jumpRequested) {
			this.offGroundTimer += dt;
			if (this.offGroundTimer >= 0.5) {
				this.currentAnimation = this.jumpAnimation;
			}
		} else {
			this.offGroundTimer = 0.0;
		}

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
		// -------------------------------------

		// Update drag based on velocity
		let xzVelocity = new Vec3(this.movComp.velocity);
		xzVelocity.y = 0.0;
		this.movComp.drag = 10.0 + xzVelocity.len();

		// Reset animation timer if animation has changed since last frame
		if (this.currentAnimation != this.lastAnimation) {
			this.timer = 0.0;
		}
		this.currentAnimation();
		this.lastAnimation = this.currentAnimation;

		let currentTime = Date.now() * 0.001;
		this.bodyMesh.emissionColor.setValues(
			Math.cos(currentTime),
			Math.sin(currentTime * 0.66),
			Math.sin(currentTime * 0.33)
		);
		this.bodyMesh.emissionColor.setValues(
			Math.cos(currentTime),
			Math.sin(currentTime * 0.66),
			Math.sin(currentTime * 0.33)
		);

		// let animations = [
		//     this.walkAnimation.bind(this),
		//     this.runAnimation.bind(this),
		//     this.sitAnimation.bind(this),
		//     this.jumpAnimation.bind(this)
		// ]

		// for (let i = 0; i < animations.length; i++) {
		//     if ((this.timer % (animations.length * 2.0)) < (i + 1) * 2.0) {
		//         animations[i]();
		//         break;
		//     }
		// }
	}

	private resetAnimation() {}

	private walkAnimation(animationSpeed: number = 7.5) {
		this.resetAnimation();

		// let bodyPosComp = this.bodyEntity.getComponent(
		// 	ComponentTypeEnum.POSITION
		// ) as PositionComponent;
		// if (bodyPosComp) {
		// 	bodyPosComp.rotation.setValues(
		// 		Math.sin(this.timer * animationSpeed * 2.0) * 1.0,
		// 		0.0,
		// 		Math.sin(this.timer * animationSpeed) * 6.0
		// 	);
		// }
	}

	private runAnimation(animationSpeed: number = 12.0) {
		this.resetAnimation();

		// let bodyPosComp = this.bodyEntity.getComponent(
		// 	ComponentTypeEnum.POSITION
		// ) as PositionComponent;
		// if (bodyPosComp) {
		// 	bodyPosComp.rotation.setValues(
		// 		Math.sin(this.timer * animationSpeed) * 3.0,
		// 		0.0,
		// 		Math.sin(this.timer * animationSpeed) * 5.0
		// 	);
		// }
	}

	private jumpAnimation(animationSpeed: number = 1.0) {
		this.resetAnimation();

		// let bodyPosComp = this.bodyEntity.getComponent(
		// 	ComponentTypeEnum.POSITION
		// ) as PositionComponent;
		// if (bodyPosComp) {
		// 	bodyPosComp.rotation.setValues(
		// 		Math.sin((Math.min(this.timer, 1.4) + 1.1) * animationSpeed) * 5.0,
		// 		0.0,
		// 		0.0
		// 	);
		// }
	}
}
