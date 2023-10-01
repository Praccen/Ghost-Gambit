import { Component, ComponentTypeEnum } from "./Component";
import Vec3 from "../../Maths/Vec3";
import Div from "../../GUI/Div";
import { OverlayRendering } from "../../Rendering/OverlayRendering";
import ObjectPlacer from "../../../Game/ObjectPlacer";
import GuiObject from "../../GUI/GuiObject";
import EditText from "../../GUI/Text/EditText";
import Quaternion from "quaternion";

export default class PositionComponent extends Component {
	position: Vec3;
	rotation: Vec3;
	scale: Vec3;
	origin: Vec3;
	rotationOrder: string;

	matrix: Matrix4;

	private guiObjects: Map<string, EditText>;

	constructor(componentType?: ComponentTypeEnum) {
		super(componentType ? componentType : ComponentTypeEnum.POSITION);

		this.position = new Vec3();
		this.rotation = new Vec3();
		this.scale = new Vec3([1.0, 1.0, 1.0]);
		this.origin = new Vec3();
		this.rotationOrder = "XYZ";

		this.matrix = new Matrix4(null);

		this.guiObjects = new Map<string, EditText>();
	}

	calculateMatrix(matrix: Matrix4) {
		matrix.translate(this.position.x, this.position.y, this.position.z);
		if (this.rotation.length2() > 0.0000001) {
			let quat = Quaternion.fromEulerLogical(this.rotation.x * (Math.PI/180), this.rotation.y * (Math.PI/180), this.rotation.z * (Math.PI/180), this.rotationOrder);
			let axisAngle = quat.toAxisAngle();

			matrix.rotate(
				axisAngle[1] * (180/Math.PI),
				axisAngle[0][0],
				axisAngle[0][1],
				axisAngle[0][2]
			);
		}
		matrix.scale(this.scale.x, this.scale.y, this.scale.z);
		matrix.translate(-this.origin.x, -this.origin.y, -this.origin.z);
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
			propEditText.getInputElement().onchange = (ev) => {
				vec[index] = parseFloat(propEditText.getInputElement().value);
			};
			objectPlacer.makeCheckpoint();
			this.guiObjects.set(label, propEditText);
		};

		addTextEdit("PosX", this.position, 0);
		addTextEdit("PosY", this.position, 1);
		addTextEdit("PosZ", this.position, 2);

		addTextEdit("RotX", this.rotation, 0);
		addTextEdit("RotY", this.rotation, 1);
		addTextEdit("RotZ", this.rotation, 2);

		addTextEdit("ScaleX", this.scale, 0);
		addTextEdit("ScaleY", this.scale, 1);
		addTextEdit("ScaleZ", this.scale, 2);

		addTextEdit("OriginX", this.origin, 0);
		addTextEdit("OriginY", this.origin, 1);
		addTextEdit("OriginZ", this.origin, 2);
	}

	updateGui() {
		let updateTextEdit = (label: string, vec: Vec3, index: number) => {
			let guiObject = this.guiObjects.get(label);
			if (guiObject) {
				guiObject.getInputElement().value = vec[index].toString();
			}
		};

		updateTextEdit("PosX", this.position, 0);
		updateTextEdit("PosY", this.position, 1);
		updateTextEdit("PosZ", this.position, 2);

		updateTextEdit("RotX", this.rotation, 0);
		updateTextEdit("RotY", this.rotation, 1);
		updateTextEdit("RotZ", this.rotation, 2);

		updateTextEdit("ScaleX", this.scale, 0);
		updateTextEdit("ScaleY", this.scale, 1);
		updateTextEdit("ScaleZ", this.scale, 2);

		updateTextEdit("OriginX", this.origin, 0);
		updateTextEdit("OriginY", this.origin, 1);
		updateTextEdit("OriginZ", this.origin, 2);
	}
}
