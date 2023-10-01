import { Component, ComponentTypeEnum } from "../../../Engine/ECS/Components/Component";

export default class GravestoneComponent extends Component {
	constructor() {
		super(ComponentTypeEnum.GRAVESTONE);
	}
}