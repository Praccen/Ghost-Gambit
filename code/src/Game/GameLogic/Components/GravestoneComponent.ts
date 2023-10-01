import { Component, ComponentTypeEnum } from "../../../Engine/ECS/Components/Component";
import Entity from "../../../Engine/ECS/Entity";

export default class GravestoneComponent extends Component {
	graveStoneEntity: Entity;

	constructor(graveStoneEntity: Entity) {
		super(ComponentTypeEnum.GRAVESTONE);
		this.graveStoneEntity = graveStoneEntity;
	}
}