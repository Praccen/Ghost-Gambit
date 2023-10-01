import ObjectPlacer from "../../../Game/ObjectPlacer";
import Div from "../../GUI/Div";
import PointLight from "../../Lighting/PointLight";
import Vec3 from "../../Maths/Vec3";
import { OverlayRendering } from "../../Rendering/OverlayRendering";
import { Component, ComponentTypeEnum } from "./Component";

export default class PointLightComponent extends Component {
	pointLight: PointLight;
	posOffset: Vec3;

	constructor(pointLight: PointLight) {
		super(ComponentTypeEnum.POINTLIGHT);
		this.pointLight = pointLight;
		this.posOffset = new Vec3();
	}

	addToGui(
		overlayRendering: OverlayRendering,
		parentDiv: Div,
		objectPlacer: ObjectPlacer
	) {
		let addTextEdit = (label: string, vec: Vec3, index: number) => {
			let propEditText = overlayRendering.getNewEditText(parentDiv);
			propEditText.textString = label;
			propEditText.textSize = 20;
			propEditText.scaleWithWindow = true;
			propEditText.getInputElement().value = vec[index].toString();
			propEditText.onChange((ev) => {
				vec[index] = parseFloat(propEditText.getInputElement().value);
			});
			objectPlacer.makeCheckpoint();
		};

		addTextEdit("R", this.pointLight.colour, 0);
		addTextEdit("G", this.pointLight.colour, 1);
		addTextEdit("B", this.pointLight.colour, 2);

		addTextEdit("PosOffsetX", this.posOffset, 0);
		addTextEdit("PosOffsetY", this.posOffset, 1);
		addTextEdit("PosOffsetZ", this.posOffset, 2);
	}
}
