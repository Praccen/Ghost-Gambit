import Vec3 from "../../Maths/Vec3";
import GraphicsObject from "../../Objects/GraphicsObject";
import OBB from "../../Physics/Shapes/OBB";
import { Component, ComponentTypeEnum } from "./Component";

export default class BoundingBoxComponent extends Component {
	boundingBox: OBB;

	constructor() {
		super(ComponentTypeEnum.BOUNDINGBOX);

		this.boundingBox = new OBB();
	}

	/**
	 * Sets up the bounding box based on the vertices in a graphics object
	 * @param graphicsObj The graphics object
	 */
	setup(graphicsObj: GraphicsObject) {
		let minVec = new Vec3([Infinity, Infinity, Infinity]);
		let maxVec = new Vec3([-Infinity, -Infinity, -Infinity]);

		let vertices = graphicsObj.getVertexPositions();

		for (let vertex of vertices) {
			maxVec.max(vertex);
			minVec.min(vertex);
		}

		this.boundingBox.setMinAndMaxVectors(minVec, maxVec);
	}

	/**
	 * Update the transform matrix used for the bounding box
	 * @param matrix Optional: Will set a new matrix to use for the bounding box. If no matrix is sent, it will use the previously set matrix but mark the box to be updated.
	 */
	updateTransformMatrix(matrix?: Matrix4) {
		if (matrix) {
			this.boundingBox.setTransformMatrix(matrix);
		} else {
			this.boundingBox.setUpdateNeeded();
		}
	}
}
