import Vec3 from "../Engine/Maths/Vec3";
import { ECSUtils } from "../Engine/Utils/ESCUtils";
import Character from "./Character";
import Rendering from "../Engine/Rendering/Rendering";
import ECSManager from "../Engine/ECS/ECSManager";
import AudioPlayer from "../Engine/Audio/AudioPlayer";
import GravestoneComponent from "./GameLogic/Components/GravestoneComponent";
import { ComponentTypeEnum } from "../Engine/ECS/Components/Component";

export default class OpponentCharacter extends Character {
	audioThreshholdDist: number = 50;
	drag_addition: number = 15;
	bot_number: number;
	isBot: boolean;

	constructor(
		rendering: Rendering,
		ecsManager: ECSManager,
		audioPlayer: AudioPlayer,
		character_string: string,
		gameItemsDict: object,
		isBot: boolean,
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
			gameItemsDict,
			start_position,
			start_size,
			start_rotation,
			start_origin,
			start_rotation_order,
			trigger_download_needed
		);
		this.isBot = isBot;
	}

	async init() {
		super.init();
	}

	character_specific_accended_operations(dt) {
		// this.gameItemsDict["opponents"].remove(this.bot_number);
		this.ecsManager.removeEntity(this.bodyEntity.id);
		this.ecsManager.removeEntity(this.fireEntity.id);
	}

	accend() {
		this.is_accending = true;
		this.ascendTime = Date.now();
		console.log("Player ascending!");
		let bot_pos = ECSUtils.CalculatePosition(this.bodyEntity);
		let dist = this.get_dist_to_player(bot_pos);
		if (dist < this.audioThreshholdDist) {
			let audio_level = dist / this.audioThreshholdDist;
			this.audioPlayer.playAudio("success_1", false, audio_level);
		}
	}
	get_dist_to_player(bot_pos: Vec3): number {
		if (!this.gameItemsDict["player"].accended) {
			return this.get_closest_relational_vec(bot_pos, "player").len();
		} else {
			return 200;
		}
	}

	get_closest_relational_vec(bot_pos: Vec3, key: string): Vec3 {
		let closestRVecToItem = new Vec3([9000, 9000, 9000]);
		if (key == "player") {
			if (!this.gameItemsDict["player"].accended) {
				let player_pos = ECSUtils.CalculatePosition(
					this.gameItemsDict["player"].bodyEntity
				);
				let bot_pos = ECSUtils.CalculatePosition(this.bodyEntity);
				return new Vec3(player_pos.subtract(bot_pos.clone()));
			} else {
				return closestRVecToItem;
			}
		} else {
			let closest_dist = closestRVecToItem.len();
			for (let itemId in this.gameItemsDict[key]) {
				let item = this.gameItemsDict[key][itemId];
				let itemEnt = this.ecsManager.getEntity(item.id);
				if (itemEnt != null) {
					let itemPos = ECSUtils.CalculatePosition(itemEnt);
					let rVecToItem = new Vec3(itemPos.subtract(bot_pos.clone()));
					let lenToItem = rVecToItem.len();
					if (lenToItem < closest_dist) {
						closest_dist = lenToItem;
						closestRVecToItem = rVecToItem;
					}
				}
			}
			return closestRVecToItem;
		}
	}

	get_closest_lit_bot_relational_vec(bot_pos: Vec3): Vec3 {
		let closestRVecToItem = new Vec3([9000, 9000, 9000]);

		let closest_dist = closestRVecToItem.len();
		for (let itemId in this.gameItemsDict["opponents"]) {
			let item = this.gameItemsDict["opponents"][itemId];
			let itemEnt = item.bodyEntity;
			if (itemEnt != null && !itemEnt.accended && !itemEnt.is_accending) {
				let itemPos = ECSUtils.CalculatePosition(itemEnt);
				if ((itemPos! = null)) {
					let rVecToItem = new Vec3(itemPos.subtract(bot_pos.clone()));
					let lenToItem = rVecToItem.len();
					if (lenToItem < closest_dist && item.is_lit) {
						closest_dist = lenToItem;
						closestRVecToItem = rVecToItem;
					}
				} else {
					return closestRVecToItem;
				}
			}
		}
		return closestRVecToItem;
	}

	get_closest_available_grave_relational_vec(bot_pos: Vec3): Vec3 {
		let closestRVecToItem = new Vec3([9000, 9000, 9000]);

		let closest_dist = closestRVecToItem.len();
		for (let itemId in this.gameItemsDict["grave_stones"]) {
			let item = this.gameItemsDict["grave_stones"][itemId];
			let itemEnt = this.ecsManager.getEntity(item.id);
			if (itemEnt != null) {
				let itemPos = ECSUtils.CalculatePosition(itemEnt);
				let rVecToItem = new Vec3(itemPos.subtract(bot_pos.clone()));
				let lenToItem = rVecToItem.len();
				let gsComponent = itemEnt.getComponent(
					ComponentTypeEnum.GRAVESTONE
				) as GravestoneComponent;
				if (lenToItem < closest_dist && !gsComponent.claimed) {
					closest_dist = lenToItem;
					closestRVecToItem = rVecToItem;
				}
			}
		}
		return closestRVecToItem;
	}

	extinguish_audio_operations() {
		let bot_pos = ECSUtils.CalculatePosition(this.bodyEntity);
		let dist = this.get_dist_to_player(bot_pos);
		if (dist < this.audioThreshholdDist) {
			let audio_level = dist / this.audioThreshholdDist;
			this.audioPlayer.playAudio("extinguish", false, audio_level);
		}
	}

	light_up_audio_operations() {
		let bot_pos = ECSUtils.CalculatePosition(this.bodyEntity);
		let dist = this.get_dist_to_player(bot_pos);
		if (dist < this.audioThreshholdDist) {
			let audio_level = dist / this.audioThreshholdDist;
			this.audioPlayer.playAudio("light_up", false, audio_level);
		}
	}

	get_forward_and_right(): [Vec3, Vec3] {
		return [new Vec3(), new Vec3()];
	}

	update_client() {
	}

	modify_acc_vec(accVec: Vec3) {
		if (!this.isBot) {
			return;
		}

		let bot_pos = ECSUtils.CalculatePosition(this.bodyEntity);

		let player_relational_vec = this.get_closest_relational_vec(
			bot_pos,
			"player"
		);
		let closest_candle_relational_vec = this.get_closest_relational_vec(
			bot_pos,
			"candles"
		);
		let closest_gravestone_relational_vec =
			this.get_closest_available_grave_relational_vec(bot_pos);
		let closest_bot_relational_vec =
			this.get_closest_lit_bot_relational_vec(bot_pos);

		let player_relational_vec_dist = player_relational_vec.len();
		let closest_candle_relational_vec_dist =
			closest_candle_relational_vec.len();
		let closest_gravestone_relational_vec_dist =
			closest_gravestone_relational_vec.len();
		let closest_bot_relational_vec_dist = closest_bot_relational_vec.len();

		let dist_list = [
			player_relational_vec_dist,
			closest_candle_relational_vec_dist,
			closest_gravestone_relational_vec_dist,
			closest_bot_relational_vec_dist,
		].sort((a, b) => a - b);

		let rVecList = [];
		for (let i = 0; i < dist_list.length; i++) {
			if (dist_list[i] == player_relational_vec_dist) {
				rVecList.push(player_relational_vec);
			} else if (dist_list[i] == closest_candle_relational_vec_dist) {
				rVecList.push(closest_candle_relational_vec);
			} else if (dist_list[i] == closest_gravestone_relational_vec_dist) {
				rVecList.push(closest_gravestone_relational_vec);
			} else if (dist_list[i] == closest_bot_relational_vec_dist) {
				rVecList.push(closest_bot_relational_vec);
			}
		}

		let closestEntityVec = rVecList[0];

		if (
			this.gameItemsDict["player"].is_accending ||
			this.gameItemsDict["player"].accended
		) {
			if (!this.is_lit) {
				closestEntityVec = closest_candle_relational_vec;
				if (
					closest_bot_relational_vec_dist < closest_candle_relational_vec_dist
				) {
					closestEntityVec = closest_bot_relational_vec;
				}
			} else {
				closestEntityVec = closest_gravestone_relational_vec;
				if (
					closest_bot_relational_vec_dist <
					closest_gravestone_relational_vec_dist
				) {
					closestEntityVec = closest_bot_relational_vec;
				}
			}
		} else {
			if (!this.is_lit) {
				closestEntityVec = closest_candle_relational_vec;
				if (
					player_relational_vec_dist < closest_candle_relational_vec_dist &&
					this.gameItemsDict["player"].is_lit
				) {
					closestEntityVec = player_relational_vec;
					if (closest_bot_relational_vec_dist < player_relational_vec_dist) {
						closestEntityVec = closest_bot_relational_vec;
					}
				}
			} else {
				closestEntityVec = closest_gravestone_relational_vec;
				if (
					player_relational_vec_dist < closest_gravestone_relational_vec_dist &&
					this.gameItemsDict["player"].is_lit
				) {
					closestEntityVec = player_relational_vec;
					if (closest_bot_relational_vec_dist < player_relational_vec_dist) {
						closestEntityVec = closest_bot_relational_vec;
					}
				}
			}
		}

		if (closestEntityVec.len() >= 9000) {
			closestEntityVec = player_relational_vec;
		}
		closestEntityVec.y = 0;
		accVec.add(closestEntityVec);
	}

	jump_controll() {
		if (!this.isBot) {
			return;
		}
		if (Math.random() > 0.995) {
			this.movComp.jumpRequested = true;
			this.offGroundTimer = 0.5;
			let bot_pos = ECSUtils.CalculatePosition(this.bodyEntity);
			let dist = this.get_dist_to_player(bot_pos);
			if (dist < this.audioThreshholdDist) {
				let audio_level = dist / this.audioThreshholdDist;
				this.audioPlayer.playAudio("ghost_sound_3", false, audio_level);
			}
		} else {
			this.movComp.jumpRequested = false;
		}
	}

	character_specific_controll() {
	}

	character_specific_camera_operations(dt: number) {

	}
}
