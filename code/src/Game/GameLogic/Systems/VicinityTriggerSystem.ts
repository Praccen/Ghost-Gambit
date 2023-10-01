import { ComponentTypeEnum } from "../../../Engine/ECS/Components/Component";
import System from "../../../Engine/ECS/Systems/System";
import { ECSUtils } from "../../../Engine/Utils/ESCUtils";
import VicinityTriggerComponent from "../Components/VicinityTriggerComponent";

export default class VicinityTriggerSystem extends System {
	constructor() {
		super([ComponentTypeEnum.VICINITYTRIGGER]);
	}

	update(dt: number) {
        for (let e of this.entities) {
            (e.getComponent(ComponentTypeEnum.VICINITYTRIGGER) as VicinityTriggerComponent).inVicinityOf.length = 0;
        }
        
		for (let i = 0; i < this.entities.length; i++) {
            let e1Pos = ECSUtils.CalculatePosition(this.entities[i]);
            if (e1Pos == undefined) {
                continue;
            }
            let e1Vicinity = this.entities[i].getComponent(ComponentTypeEnum.VICINITYTRIGGER) as VicinityTriggerComponent;
            for (let j = i + 1; j < this.entities.length; j++) {
                let e2Pos = ECSUtils.CalculatePosition(this.entities[j]);
                if (e2Pos == undefined) {
                    continue;
                }
                let e2Vicinity = this.entities[j].getComponent(ComponentTypeEnum.VICINITYTRIGGER) as VicinityTriggerComponent;

                let dist = e2Pos.subtract(e1Pos).len(); 
                if (dist < e1Vicinity.range) {
                    e1Vicinity.inVicinityOf.push(this.entities[j]);
                }
                if (dist < e2Vicinity.range) {
                    e2Vicinity.inVicinityOf.push(this.entities[i]);
                }
            }
		}
	}
}
