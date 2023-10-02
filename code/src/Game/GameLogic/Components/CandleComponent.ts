import {
	Component,
	ComponentTypeEnum,
} from "../../../Engine/ECS/Components/Component";

export default class CandleComponent extends Component {
	consumable: boolean;

	constructor(consumable: boolean) {
		super(ComponentTypeEnum.CANDLE);
		this.consumable = consumable;
	}
}
