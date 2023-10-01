import { ComponentTypeEnum } from "../../../Engine/ECS/Components/Component";
import ECSManager from "../../../Engine/ECS/ECSManager";
import System from "../../../Engine/ECS/Systems/System";
import Game from "../../States/Game";
import SentientComponent from "../Components/SentientComponent";
import VicinityTriggerComponent from "../Components/VicinityTriggerComponent";

export default class SentientSystem extends System {
    private ecsManager: ECSManager;

	constructor(ecsManager: ECSManager) {
		super([ComponentTypeEnum.SENTIENT, ComponentTypeEnum.VICINITYTRIGGER]);
        this.ecsManager = ecsManager;
	}

	update(dt: number) {
        for (let e of this.entities) {
            let vicinityTriggerComponent = e.getComponent(ComponentTypeEnum.VICINITYTRIGGER) as VicinityTriggerComponent;
            let sentientComponent = e.getComponent(ComponentTypeEnum.SENTIENT) as SentientComponent;
            if (sentientComponent.character == undefined) {
                continue;
            }
            for (let vicinityEntity of vicinityTriggerComponent.inVicinityOf) {
                if (!sentientComponent.character.is_lit && vicinityEntity.hasComponent(ComponentTypeEnum.CANDLE)) {
                    this.ecsManager.removeEntity(vicinityEntity.id);
                    sentientComponent.character.light_up();
                    Game.getInstanceNoSa().unlockedGraves = true;
                    break;
                }
                if (sentientComponent.character.is_lit && vicinityEntity.hasComponent(ComponentTypeEnum.GRAVESTONE)) {
                    this.ecsManager.removeEntity(vicinityEntity.id);
                    break;
                }
            }
        }
	}
}
