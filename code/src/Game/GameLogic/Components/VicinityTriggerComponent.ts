import { Component, ComponentTypeEnum } from "../../../Engine/ECS/Components/Component";
import Entity from "../../../Engine/ECS/Entity";

ComponentTypeEnum

export default class VicinityTriggerComponent extends Component {
	range: number;
	inVicinityOf: Array<Entity>;

	constructor() {
		super(ComponentTypeEnum.VICINITYTRIGGER);
		this.range = 1.0;
		this.inVicinityOf = new Array<Entity>();
	}
}