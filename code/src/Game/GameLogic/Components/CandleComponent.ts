import {
	Component,
	ComponentTypeEnum,
} from "../../../Engine/ECS/Components/Component";

export default class CandleComponent extends Component {
	constructor() {
		super(ComponentTypeEnum.CANDLE);
	}
}
