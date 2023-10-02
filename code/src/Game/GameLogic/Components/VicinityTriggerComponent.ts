import {
	Component,
	ComponentTypeEnum,
} from "../../../Engine/ECS/Components/Component";
import Entity from "../../../Engine/ECS/Entity";

ComponentTypeEnum;

export default class VicinityTriggerComponent extends Component {
	range: number;
	inVicinityOf: Array<Entity>;

	constructor(range: number = 1.0) {
		super(ComponentTypeEnum.VICINITYTRIGGER);
		this.range = range;
		this.inVicinityOf = new Array<Entity>();
	}
}
