import { ComponentTypeEnum } from "../../../Engine/ECS/Components/Component";
import ECSManager from "../../../Engine/ECS/ECSManager";
import System from "../../../Engine/ECS/Systems/System";
import GravestoneComponent from "../Components/GravestoneComponent";
import PlayerCharacter from "../../PlayerCharacter";
import SentientComponent from "../Components/SentientComponent";
import VicinityTriggerComponent from "../Components/VicinityTriggerComponent";

export default class SentientSystem extends System {
	private ecsManager: ECSManager;
	private firstRecentSwitchEntityIds: Array<number> = [];
	private secondRecentSwitchEntityIds: Array<number> = [];
	private reanableFlameStealThreshhold: number = 5;
	private reanableFlameStealCounters: Array<number> = [];

	constructor(ecsManager: ECSManager) {
		super([ComponentTypeEnum.SENTIENT, ComponentTypeEnum.VICINITYTRIGGER]);
		this.ecsManager = ecsManager;
	}

	update(dt: number) {
		let reanableFlameStealShift = false;
		for (let i = 0; i < this.reanableFlameStealCounters.length; i++) {
			this.reanableFlameStealCounters[i] += dt;
			if (
				this.reanableFlameStealCounters[i] > this.reanableFlameStealThreshhold
			) {
				reanableFlameStealShift = true;
			}
		}
		if (reanableFlameStealShift) {
			this.reanableFlameStealCounters.shift();
			this.firstRecentSwitchEntityIds.shift();
			this.secondRecentSwitchEntityIds.shift();
		}

		for (let e of this.entities) {
			let vicinityTriggerComponent = e.getComponent(
				ComponentTypeEnum.VICINITYTRIGGER
			) as VicinityTriggerComponent;
			let sentientComponent = e.getComponent(
				ComponentTypeEnum.SENTIENT
			) as SentientComponent;
			if (sentientComponent.character == undefined) {
				continue;
			}
			for (let vicinityEntity of vicinityTriggerComponent.inVicinityOf) {
				if (
					!sentientComponent.character.is_lit &&
					vicinityEntity.hasComponent(ComponentTypeEnum.CANDLE)
				) {
					this.ecsManager.removeEntity(vicinityEntity.id);
					sentientComponent.character.light_up();
					break;
				}
				if (
					!sentientComponent.character.is_lit &&
					vicinityEntity.hasComponent(ComponentTypeEnum.SENTIENT)
				) {
					let otherSentientComponent = vicinityEntity.getComponent(
						ComponentTypeEnum.SENTIENT
					) as SentientComponent;
					if (
						otherSentientComponent.character &&
						otherSentientComponent.character.is_lit
					) {
						let takenIds = false;
						for (let i = 0; i < this.firstRecentSwitchEntityIds.length; i++) {
							let id_1 = this.firstRecentSwitchEntityIds[i];
							let id_2 = this.secondRecentSwitchEntityIds[i];
							if (
								(vicinityEntity.id == id_1 && e.id == id_2) ||
								(e.id == id_1 && vicinityEntity.id == id_2)
							) {
								takenIds = true;
								break;
							}
						}
						if (!takenIds) {
							this.firstRecentSwitchEntityIds.push(vicinityEntity.id);
							this.secondRecentSwitchEntityIds.push(e.id);
							this.reanableFlameStealCounters.push(0);
							sentientComponent.character.light_up();
							if (otherSentientComponent.character) {
								otherSentientComponent.character.extinguish();
							}
						}
						break;
					}
				}
				if (
					sentientComponent.character.is_lit &&
					vicinityEntity.hasComponent(ComponentTypeEnum.GRAVESTONE)
				) {
					let gravestoneComp = vicinityEntity.getComponent(ComponentTypeEnum.GRAVESTONE) as GravestoneComponent;
					if (!gravestoneComp.claimed) {
						sentientComponent.character.accend();
					}
					gravestoneComp.claimed = true;
					break;
				}
			}
		}
	}
}
