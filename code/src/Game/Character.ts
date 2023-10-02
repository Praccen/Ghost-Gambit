import AudioPlayer from "../Engine/Audio/AudioPlayer";
import CameraFocusComponent from "../Engine/ECS/Components/CameraFocusCompontent";
import { ComponentTypeEnum } from "../Engine/ECS/Components/Component";
import GraphicsComponent from "../Engine/ECS/Components/GraphicsComponent";
import MovementComponent from "../Engine/ECS/Components/MovementComponent";
import PositionParentComponent from "../Engine/ECS/Components/PositionParentComponent";
import ECSManager from "../Engine/ECS/ECSManager";
import Entity from "../Engine/ECS/Entity";
import Vec3 from "../Engine/Maths/Vec3";
import GraphicsBundle from "../Engine/Objects/GraphicsBundle";
import Rendering from "../Engine/Rendering/Rendering";
import Game from "./States/Game";
import ParticleSpawner from "../Engine/Objects/ParticleSpawner";
import PositionComponent from "../Engine/ECS/Components/PositionComponent";
import ParticleSpawnerComponent from "../Engine/ECS/Components/ParticleSpawnerComponent";
import PointLightComponent from "../Engine/ECS/Components/PointLightComponent";

export default abstract class Character {
	protected rendering: Rendering;
	protected ecsManager: ECSManager;
	protected audioPlayer: AudioPlayer;

	bodyEntity: Entity;
	protected fireEntity: Entity;

	protected groupPositionComp: PositionParentComponent;
	protected movComp: MovementComponent;
	protected cameraFocusComp: CameraFocusComponent;
	protected bodyMesh: GraphicsBundle;

	protected lastAnimation: Function;
	protected currentAnimation: Function;

	protected offGroundTimer: number;
	protected accentionTimer: number;
	protected accentionEffectInterval: number;

	protected timer: number;

	is_lit: boolean;

	protected character_string: string;
	protected start_position: Vec3;
	protected start_size: Vec3;
	protected start_rotation: Vec3;
	protected start_origin: Vec3;
	protected start_rotation_order: string;
	protected trigger_download_needed: boolean;
	protected allCharacterDict: object;
	protected drag_addition: number = 10;
	is_accending: boolean;
	accended: boolean;
	protected accentionTimerThreshold: number = 4;
	protected accention_rotation_base: number = 0.1;
	protected accention_pl_color_base: number = 0.1;

	abstract get_forward_and_right(): [Vec3, Vec3];
	abstract update_client();
	abstract modify_acc_vec(Vec3);
	abstract jump_controll();
	abstract character_specific_controll();
	abstract character_specific_camera_operations(number);
	abstract extinguish_audio_operations();
	abstract light_up_audio_operations();
	abstract accend();
	abstract character_specific_accended_operations(number);

	constructor(
		rendering: Rendering,
		ecsManager: ECSManager,
		audioPlayer: AudioPlayer,
		character_string: string,
		allCharacterDict: object,
		start_position: Vec3 = new Vec3(),
		start_size: Vec3 = new Vec3([0.25, 0.25, 0.25]),
		start_rotation: Vec3 = new Vec3(),
		start_origin: Vec3 = new Vec3(),
		start_rotation_order: string = "XYZ",
		trigger_download_needed: boolean = false
	) {
		this.rendering = rendering;
		this.ecsManager = ecsManager;
		this.audioPlayer = audioPlayer;
		this.allCharacterDict = allCharacterDict;

		this.character_string = character_string;
		this.start_position = start_position;
		this.start_size = start_size;
		this.start_rotation = start_rotation;
		this.start_origin = start_origin;
		this.start_rotation_order = start_rotation_order;
		this.trigger_download_needed = trigger_download_needed;

		this.timer = 0.0;
		this.lastAnimation = this.resetAnimation;
		this.currentAnimation = this.resetAnimation;
		this.offGroundTimer = 0.0;
		this.accentionTimer = 0.0;
		this.accentionEffectInterval = 0.001;
		this.is_lit = false;
		this.is_accending = false;
		this.accended = false;
	}

	async init() {
		let result: [Entity, Entity] =
			Game.getInstanceNoSa().objectPlacer.placePlayer(
				this.start_position,
				this.start_size,
				this.start_rotation,
				this
			);

		this.bodyEntity = result[0];
		this.fireEntity = result[1];
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
			this.groupPositionComp.position = this.start_position;
		}

		if (this.movComp != undefined) {
			this.movComp.velocity.setValues(0.0, 0.0, 0.0);
		}
	}

	extinguish() {
		if (this.is_lit) {
			let particleSpawnerComp = this.fireEntity.getComponent(
				ComponentTypeEnum.PARTICLESPAWNER
			) as ParticleSpawnerComponent;
			let pointLightComp = this.fireEntity.getComponent(
				ComponentTypeEnum.POINTLIGHT
			) as PointLightComponent;

			this.extinguish_audio_operations();
			particleSpawnerComp.particleSpawner.setNumParticles(0);
			pointLightComp.pointLight.colour.setValues(0.0, 0.0, 0.0);
			this.is_lit = false;
		}
	}

	light_up() {
		if (!this.is_lit) {
			this.light_up_audio_operations();

			let particleSpawnerComp = this.fireEntity.getComponent(
				ComponentTypeEnum.PARTICLESPAWNER
			) as ParticleSpawnerComponent;
			let pointLightComp = this.fireEntity.getComponent(
				ComponentTypeEnum.POINTLIGHT
			) as PointLightComponent;

			let nrOfFireParticles = 4;
			particleSpawnerComp.particleSpawner.setNumParticles(nrOfFireParticles);
			for (let i = 0; i < nrOfFireParticles; i++) {
				let dir = new Vec3([
					Math.random() * 2.0 - 1.0,
					1.0,
					Math.random() * 2.0 - 1.0,
				]);
				particleSpawnerComp.particleSpawner.setParticleData(
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

			pointLightComp.pointLight.colour.setValues(0.2, 0.06, 0.0);
			this.is_lit = true;
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

		console.log("Pos: " + this.groupPositionComp.position);

		if (this.accended) {
			return;
		}

		this.update_client();

		this.timer += dt;

		let accVec = new Vec3();

		if (!this.is_accending) {
			this.modify_acc_vec(accVec);

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
			this.jump_controll();
			if (!this.movComp.onGround || this.movComp.jumpRequested) {
				this.offGroundTimer += dt;
				if (this.offGroundTimer >= 0.5) {
					this.currentAnimation = this.jumpAnimation;
				}
			} else {
				this.offGroundTimer = 0.0;
			}

			this.character_specific_controll();

			this.character_specific_camera_operations(dt);

			// Update drag based on velocity
			let xzVelocity = new Vec3(this.movComp.velocity);
			xzVelocity.y = 0.0;
			this.movComp.drag = this.drag_addition + xzVelocity.len();

			// Reset animation timer if animation has changed since last frame
			if (this.currentAnimation != this.lastAnimation) {
				this.timer = 0.0;
			}
			this.currentAnimation();
			this.lastAnimation = this.currentAnimation;
		} else {
			// Accending
			this.accentionTimer += dt;

			const accention_pl_color_addition = 0.01;
			const accention_rotation_addition = 0.1;
			const accention_y_vel_addition = 0.2;

			this.currentAnimation = this.runAnimation;
			this.movComp.velocity.add(new Vec3([0, accention_y_vel_addition, 0]));
			let particleSpawnerComp = this.fireEntity.getComponent(
				ComponentTypeEnum.PARTICLESPAWNER
			) as ParticleSpawnerComponent;
			particleSpawnerComp.destructor();

			let posComp = this.bodyEntity.getComponent(
				ComponentTypeEnum.POSITION
			) as PositionComponent;
			posComp.rotation.y += this.accention_rotation_base;
			this.accention_rotation_base += accention_rotation_addition;

			let pointLightComp = this.fireEntity.getComponent(
				ComponentTypeEnum.POINTLIGHT
			) as PointLightComponent;

			pointLightComp.pointLight.colour.setValues(
				this.accention_pl_color_base,
				this.accention_pl_color_base,
				this.accention_pl_color_base
			);

			this.accention_pl_color_base += accention_pl_color_addition;

			if (this.accentionTimer > this.accentionTimerThreshold) {
				this.accended = true;
				this.is_accending = false;
				this.movComp.velocity = new Vec3([0, 0, 0]);
				this.character_specific_accended_operations(dt);
			}
		}

		let currentTime = Date.now() * 0.001;
		this.bodyMesh.emissionColor.setValues(
			Math.max(Math.cos(currentTime), 0.0),
			Math.max(Math.sin(currentTime * 0.66), 0.0),
			Math.max(Math.sin(currentTime * 0.33), 0.0)
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

	private resetAnimation() {
		(<PositionComponent>(
			this.bodyEntity.getComponent(ComponentTypeEnum.POSITION)
		)).origin.setValues(0.0, 0.0, 0.0);
		(<PositionComponent>(
			this.bodyEntity.getComponent(ComponentTypeEnum.POSITION)
		)).rotation.setValues(0.0, 90.0, 0.0);
	}

	private walkAnimation(animationSpeed: number = 7.5) {
		this.resetAnimation();

		(<PositionComponent>(
			this.bodyEntity.getComponent(ComponentTypeEnum.POSITION)
		)).origin.setValues(
			null,
			Math.cos(this.timer * animationSpeed) * 0.15 + 0.3,
			null
		);
		this.groupPositionComp.rotation.setValues(
			Math.cos(this.timer * animationSpeed) * 5.0,
			null,
			null
		);
	}

	private runAnimation(animationSpeed: number = 12.0) {
		this.resetAnimation();

		this.walkAnimation(animationSpeed);
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
