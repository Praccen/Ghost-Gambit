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
import Rendering from "../Engine/Rendering/Rendering";
import Scene from "../Engine/Rendering/Scene";
import { input } from "./GameMachine";

export default class PlayerCharacter {
	private scene: Scene;
	private rendering: Rendering;
	private ecsManager: ECSManager;

	private bodyEntity: Entity;
	private fireEntity: Entity;

	private groupPositionComp: PositionParentComponent;
	private movComp: MovementComponent;
	private cameraFocusComp: CameraFocusComponent;

	private lastAnimation: Function;
	private currentAnimation: Function;

	private offGroundTimer;

	private timer: number;
	constructor(scene: Scene, rendering: Rendering, ecsManager: ECSManager) {
		this.scene = scene;
		this.rendering = rendering;
		this.ecsManager = ecsManager;

		this.timer = 0.0;
		this.lastAnimation = this.resetAnimation;
		this.currentAnimation = this.resetAnimation;
		this.offGroundTimer = 0.0;
	}

	async init() {
		let bodyMesh = await this.scene.getNewMesh(
			"Assets/objs/CharacterGhost.obj",
			"Assets/textures/white.png",
			"Assets/textures/black.png"
		);

		this.groupPositionComp = new PositionParentComponent();

		this.groupPositionComp.scale.setValues(0.25, 0.25, 0.25);

		this.bodyEntity = this.ecsManager.createEntity();
		this.ecsManager.addComponent(
			this.bodyEntity,
			new GraphicsComponent(bodyMesh)
		);
		let posComp = new PositionComponent();
		posComp.rotation.y = 90.0;
		this.ecsManager.addComponent(this.bodyEntity, posComp);
		this.ecsManager.addComponent(this.bodyEntity, this.groupPositionComp);
		this.cameraFocusComp = new CameraFocusComponent();
		this.cameraFocusComp.offset.setValues(0.0, 1.5, -3.0);
		this.cameraFocusComp.focusPoint.setValues(0.0, 1.5, 0.0);
		this.ecsManager.addComponent(this.bodyEntity, this.cameraFocusComp);

		let boundingBoxComp = new BoundingBoxComponent();
		boundingBoxComp.setup(bodyMesh.graphicsObject);
		boundingBoxComp.updateTransformMatrix(this.groupPositionComp.matrix);
		this.ecsManager.addComponent(this.bodyEntity, boundingBoxComp);
		this.ecsManager.addComponent(this.bodyEntity, new CollisionComponent());
		this.movComp = new MovementComponent();
		this.movComp.acceleration = 20.0;
		this.movComp.drag = 10.0;
		this.ecsManager.addComponent(this.bodyEntity, this.movComp);

		// Fire
		this.fireEntity = this.ecsManager.createEntity();
		let nrOfFireParticles = 3;
		let fireParticles = this.scene.getNewParticleSpawner(
			"Assets/textures/fire.png",
			nrOfFireParticles
		);
		for (let i = 0; i < nrOfFireParticles; i++) {
			let dir = new Vec3([
				Math.random() * 2.0 - 1.0,
				1.0,
				Math.random() * 2.0 - 1.0,
			]);
			fireParticles.setParticleData(
				i,
				new Vec3(),
				0.15,
				dir,
				new Vec3(dir)
					.flip()
					.multiply(0.65)
					.setValues(null, 0.0, null)
					.add(new Vec3([0.0, 0.5, 0.0]))
			);
		}
		fireParticles.sizeChangePerSecond = -0.3;
		fireParticles.fadePerSecond = 0.7;

		let fireParticleComp = new ParticleSpawnerComponent(fireParticles);
		fireParticleComp.lifeTime = 0.5;
		this.fireEntity.addComponent(fireParticleComp);

		let firePosComp = new PositionComponent();
		firePosComp.origin.y = -1.15 * 4.0;
		this.fireEntity.addComponent(firePosComp);
		this.fireEntity.addComponent(this.groupPositionComp);

		let pointLightComp = new PointLightComponent(this.scene.getNewPointLight());
		pointLightComp.pointLight.colour.setValues(0.2, 0.06, 0.0);
		this.fireEntity.addComponent(pointLightComp);

		this.respawn();
	}

	respawn() {
		this.groupPositionComp.position.setValues(0.0, -1.5, 0.0);
		this.movComp.velocity.setValues(0.0, 0.0, 0.0);
	}

	getPosition(): Vec3 {
		return this.groupPositionComp.position;
	}

	getVelocity(): Vec3 {
		return this.movComp.velocity;
	}

	update(dt: number) {
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
