import GraphicsBundle from "../../Objects/GraphicsBundle";
import { Component, ComponentTypeEnum } from "./Component";

export default class GraphicsComponent extends Component {
	object: GraphicsBundle;

	constructor(object: GraphicsBundle) {
		super(ComponentTypeEnum.GRAPHICS);
		this.object = object;
	}
}
