import Vec3 from "../../Maths/Vec3";

export default class Shape {
	margin: number;

	constructor() {
		this.margin = 0.0;
	}

	setUpdateNeeded() {}

	setTransformMatrix(matrix: Matrix4) {}

	getOriginalVertices(): Array<Vec3> {
		return null;
	}

	getTransformedVertices(): Array<Vec3> {
		return null;
	}

	getTransformedNormals(): Array<Vec3> {
		return null;
	}

	getTransformedEdges(): Array<Vec3> {
		return null;
	}

	getTransformedEdgeNormals(): Array<Vec3> {
		return null;
	}
}
