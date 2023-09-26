import Matrix3 from "../../Maths/Matrix3";
import Vec3 from "../../Maths/Vec3";
import Shape from "./Shape";

export default class Particle extends Shape {
	private originalVertex: Vec3;

	private transformedVertex: Vec3;

	private transformMatrix: Matrix4;
	private needsUpdate: boolean;

	constructor() {
		super();
		this.originalVertex = new Vec3();
		this.transformedVertex = new Vec3();

		this.transformMatrix = new Matrix4(null);
		this.needsUpdate = false;
		this.margin = 0.1;
	}

	setVertex(vertex: Vec3) {
		this.originalVertex.deepAssign(vertex);
		this.needsUpdate = true;
	}

	setUpdateNeeded() {
		this.needsUpdate = true;
	}

	setTransformMatrix(matrix: Matrix4) {
		this.transformMatrix = matrix;
		this.needsUpdate = true;
	}

	getTransformedVertices(): Array<Vec3> {
		if (this.needsUpdate) {
			let tempVertex = this.transformMatrix.multiplyVector4(
				new Vector4([...this.originalVertex, 1.0])
			);

			this.transformedVertex.setValues(
				tempVertex[0],
				tempVertex[1],
				tempVertex[2]
			);
		}
		return [this.transformedVertex];
	}

	getTransformedNormals(): Array<Vec3> {
		return [];
	}

	getTransformedEdges(): Array<Vec3> {
		return [];
	}

	getTransformedEdgeNormals(): Array<Vec3> {
		return [];
	}
}
