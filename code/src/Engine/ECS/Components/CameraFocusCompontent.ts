import Vec3 from "../../Maths/Vec3";
import { Component, ComponentTypeEnum } from "./Component";

export default class CameraFocusComponent extends Component {
	offset: Vec3;
	focusPoint: Vec3;

	constructor() {
		super(ComponentTypeEnum.CAMERAFOCUS);
		this.offset = new Vec3([0.0, 1.0, -1.0]);
		this.focusPoint = new Vec3();
	}
}
