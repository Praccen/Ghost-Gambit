import {
	Component,
	ComponentTypeEnum,
} from "../../../Engine/ECS/Components/Component";
import Character from "../../Character";

export default class SentientComponent extends Component {
	character: Character;

	constructor(character: Character) {
		super(ComponentTypeEnum.SENTIENT);
		this.character = character;
	}
}
