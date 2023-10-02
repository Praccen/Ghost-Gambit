import Vec3 from "../Engine/Maths/Vec3";
import { ECSUtils } from "../Engine/Utils/ESCUtils";
import Character from "./Character";
import Rendering from "../Engine/Rendering/Rendering";
import ECSManager from "../Engine/ECS/ECSManager";
import AudioPlayer from "../Engine/Audio/AudioPlayer";

export default class OpponentCharacter extends Character {
	audioThreshholdDist: number = 50;
	drag_addition: number = 15;
	bot_number: number;

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
		super(
			rendering,
			ecsManager,
			audioPlayer,
			character_string,
			allCharacterDict,
			start_position,
			start_size,
			start_rotation,
			start_origin,
			start_rotation_order,
			trigger_download_needed
		);
	}

	async init() {
		super.init();

		// this.cameraFocusComp = new CameraFocusComponent();
		// this.cameraFocusComp.offset.setValues(0.0, 1.5, -3.0);
		// this.cameraFocusComp.focusPoint.setValues(0.0, 1.5, 0.0);
		// this.ecsManager.addComponent(this.bodyEntity, this.cameraFocusComp);
	}

	character_specific_accended_operations(dt) {
		this.allCharacterDict["bots"].remove(this.bot_number);
		this.ecsManager.removeEntity(this.bodyEntity.id);
	}

	accend() {
		this.is_accending = true;
		let dist = this.get_dist_to_player();
		if (dist < this.audioThreshholdDist) {
			let audio_level = dist / this.audioThreshholdDist;
			this.audioPlayer.playAudio("success_1", false, audio_level);
		}
	}
	get_dist_to_player(): number {
		if (!this.allCharacterDict["player"].accended) {
			return this.get_player_relational_vec().len();
		} else {
			return 200;
		}
	}

	get_player_relational_vec(): Vec3 {
		if (!this.allCharacterDict["player"].accended) {
			let player_pos = ECSUtils.CalculatePosition(
				this.allCharacterDict["player"].bodyEntity
			);
			let bot_pos = ECSUtils.CalculatePosition(this.bodyEntity);
			return new Vec3(player_pos.subtract(bot_pos.clone()));
		} else {
			return new Vec3();
		}
	}

	extinguish_audio_operations() {
		let dist = this.get_dist_to_player();
		if (dist < this.audioThreshholdDist) {
			let audio_level = dist / this.audioThreshholdDist;
			this.audioPlayer.playAudio("extinguish", false, audio_level);
		}
	}

	light_up_audio_operations() {
		let dist = this.get_dist_to_player();
		if (dist < this.audioThreshholdDist) {
			let audio_level = dist / this.audioThreshholdDist;
			this.audioPlayer.playAudio("light_up", false, audio_level);
		}
	}

	get_forward_and_right(): [Vec3, Vec3] {
		// let forward = new Vec3(this.bodyEntity.getComponent(ComponentTypeEnum.POSITION).rotation ,0);
		// forward.y = 0.0;
		// forward.normalize();

		// let right = new Vec3(this.rendering.camera.getRight());
		// right.y = 0.0;
		// right.normalize();

		return [new Vec3(), new Vec3()];
	}

	update_client() {
		// const client = Game.getInstanceNoSa().client;
		// if (true) {
		//     client.send(
		//         JSON.stringify({
		//             type: "MOV",
		//             x: this.groupPositionComp.position.x,
		//             y: this.groupPositionComp.position.y,
		//             z: this.groupPositionComp.position.z,
		//         }),
		//         0
		//     );
		// }
	}

	modify_acc_vec(accVec: Vec3) {
		let dir_vec = this.get_player_relational_vec();
		dir_vec.y = 0;
		accVec.add(dir_vec);

		// // Movement input
		// let [forward, right] = this.get_forward_and_right()

		// // Touch / joystick control
		// input.updateGamepad();
		// if (input.joystickLeftDirection.length2() > 0.001) {
		//     accVec.add(new Vec3(right).multiply(input.joystickLeftDirection.x * 2.0));
		//     accVec.subtract(
		//         new Vec3(forward).multiply(input.joystickLeftDirection.y * 2.0)
		//     );
		// }
		// // Keyboard control
		// else {
		//     if (input.keys["W"]) {
		//         accVec.add(forward);
		//     }

		//     if (input.keys["S"]) {
		//         accVec.subtract(forward);
		//     }

		//     if (input.keys["A"]) {
		//         accVec.subtract(right);
		//     }

		//     if (input.keys["D"]) {
		//         accVec.add(right);
		//     }
		// }
	}

	jump_controll() {
		if (Math.random() > 0.995) {
			this.movComp.jumpRequested = true;
			this.offGroundTimer = 0.5;
			let dist = this.get_dist_to_player();
			if (dist < this.audioThreshholdDist) {
				let audio_level = dist / this.audioThreshholdDist;
				this.audioPlayer.playAudio("ghost_sound_3", false, audio_level);
			}
		} else {
			this.movComp.jumpRequested = false;
		}
	}

	character_specific_controll() {
		// if (input.keys["K"]) {
		//     this.light_up();
		// }
		// if (input.keys["L"]) {
		//     this.extinguish();
		// }
	}

	character_specific_camera_operations(dt: number) {
		// Update camera
		// if (input.keys["ARROWLEFT"]) {
		//     this.cameraFocusComp.offset.add(
		//         new Vec3(this.rendering.camera.getRight()).multiply(dt * 8.0)
		//     );
		// } else if (input.keys["ARROWRIGHT"]) {
		//     this.cameraFocusComp.offset.subtract(
		//         new Vec3(this.rendering.camera.getRight()).multiply(dt * 8.0)
		//     );
		// } else if (input.joystickRightDirection.length2() > 0.0) {
		//     this.cameraFocusComp.offset.add(
		//         new Vec3(this.rendering.camera.getRight()).multiply(
		//             dt * 8.0 * input.joystickRightDirection.x
		//         )
		//     );
		// } else if (this.movComp) {
		//     this.cameraFocusComp.offset.subtract(
		//         new Vec3(this.movComp.velocity).multiply(dt * 3.0)
		//     );
		// }
		// // ---- Keep a good camera distance ----
		// let disiredDistance = 2.0;
		// this.cameraFocusComp.offset.multiply(
		//     Math.pow(disiredDistance / this.cameraFocusComp.offset.len(), 0.1)
		// );
		// this.cameraFocusComp.offset.y = Math.max(
		//     this.cameraFocusComp.offset.y,
		//     0.5
		// );
		// let offsetXZ = new Vec3([
		//     this.cameraFocusComp.offset.x,
		//     0.0,
		//     this.cameraFocusComp.offset.z,
		// ]);
		// let len2 = offsetXZ.length2();
		// if (len2 < 1.0 && len2 > 0.001) {
		//     offsetXZ.normalize();
		//     this.cameraFocusComp.offset.x = offsetXZ.x;
		//     this.cameraFocusComp.offset.z = offsetXZ.z;
		// }
		// // -------------------------------------
	}

	// update() {
	//     // Calculate distances to goals
	//     const distanceToPlayer = this.currentPosition.distanceTo(this.playerPosition);
	//     const distanceToRestingPlace = this.currentPosition.distanceTo(this.restingPlace);
	//     const distanceToLightingPlace = this.currentPosition.distanceTo(this.lightingPlace);

	//     // Choose the goal based on proximity
	//     let goal: Vec3;

	//     if (distanceToPlayer < distanceToRestingPlace && distanceToPlayer < distanceToLightingPlace) {
	//         goal = this.playerPosition;
	//     } else if (distanceToRestingPlace < distanceToLightingPlace) {
	//         goal = this.restingPlace;
	//     } else {
	//         goal = this.lightingPlace;
	//     }

	//     // Use A* algorithm to navigate to the chosen goal
	//     const path = AStar.findPath(this.currentPosition, goal);

	//     // Move the OpponentCharacter along the path (assuming you have a method to move the OpponentCharacter)
	//     this.moveAlongPath(path);
	// }

	// moveAlongPath(path: Vec3[]) {
	//     // Implement logic to move the OpponentCharacter along the path
	//     // You can update the OpponentCharacter's position based on the path
	//     // For example, you can set the OpponentCharacter's position to the next point in the path.
	//     if (path.length > 0) {
	//         const nextPosition = path[0];
	//         // Move the OpponentCharacter towards the next position
	//         // Update the OpponentCharacter's position accordingly
	//         this.currentPosition = nextPosition;
	//     }
	// }
}
