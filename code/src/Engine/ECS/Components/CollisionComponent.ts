import { Component, ComponentTypeEnum } from "./Component";

export default class CollisionComponent extends Component {
	isStatic: boolean; // True if this object never moves
	isImmovable: boolean; // True if this object is not effected by collisions

	constructor() {
		super(ComponentTypeEnum.COLLISION);
		this.isStatic = false;
		this.isImmovable = false;
	}
}
