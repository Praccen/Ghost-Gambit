import { Component, ComponentTypeEnum } from "../../../Engine/ECS/Components/Component";

export default class SentientComponent extends Component {
    hasCandle: boolean;

	constructor() {
		super(ComponentTypeEnum.SENTIENT);

        this.hasCandle = false;
	}
}