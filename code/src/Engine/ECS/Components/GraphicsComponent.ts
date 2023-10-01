import ObjectPlacer from "../../../Game/ObjectPlacer";
import Div from "../../GUI/Div";
import Vec3 from "../../Maths/Vec3";
import GraphicsBundle from "../../Objects/GraphicsBundle";
import { OverlayRendering } from "../../Rendering/OverlayRendering";
import { Component, ComponentTypeEnum } from "./Component";

export default class GraphicsComponent extends Component {
	object: GraphicsBundle;

	constructor(object: GraphicsBundle) {
		super(ComponentTypeEnum.GRAPHICS);
		this.object = object;
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

		addTextEdit("EmissionR", this.object.emissionColor, 0);
		addTextEdit("EmissionG", this.object.emissionColor, 1);
		addTextEdit("EmissionB", this.object.emissionColor, 2);
	}
}
