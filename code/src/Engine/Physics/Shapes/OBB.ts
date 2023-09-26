import Matrix3 from "../../Maths/Matrix3";
import Vec3 from "../../Maths/Vec3";
import Shape from "./Shape";

export default class OBB extends Shape {
	private originalVertices: Array<Vec3>;
	private originalNormals: Array<Vec3>;

	private transformedVertices: Array<Vec3>;
	private transformedNormals: Array<Vec3>;

	private transformMatrix: Matrix4;
	private verticesNeedsUpdate: boolean;
	private normalsNeedsUpdate: boolean;

	constructor() {
		super();
		this.originalVertices = new Array<Vec3>();
		this.originalNormals = new Array<Vec3>();
		this.transformedVertices = new Array<Vec3>();
		this.transformedNormals = new Array<Vec3>();
		this.transformMatrix = new Matrix4(null);
		this.verticesNeedsUpdate = false;
		this.normalsNeedsUpdate = false;
	}

	setVertices(vertices: Array<Vec3>) {
		this.originalVertices.length = 0;
		for (let vert of vertices) {
			this.originalVertices.push(vert);
		}

		this.verticesNeedsUpdate = true;
	}

	setNormals(normals: Array<Vec3>) {
		this.originalNormals.length = 0;
		for (let norm of normals) {
			this.originalNormals.push(norm);
		}

		this.normalsNeedsUpdate = true;
	}

	/**
	 * Creates an axis aligned bounding box (AABB).
	 * @param minVec Corner for the lower bound.
	 * @param maxVec Corner for the upper bound.
	 */
	setMinAndMaxVectors(minVec: Vec3, maxVec: Vec3) {
		this.originalNormals.length = 0;
		this.originalNormals.push(new Vec3([1.0, 0.0, 0.0]));
		this.originalNormals.push(new Vec3([0.0, 1.0, 0.0]));
		this.originalNormals.push(new Vec3([0.0, 0.0, 1.0]));

		this.originalVertices.length = 0;

		for (let i = 0; i < 8; i++) {
			this.originalVertices.push(new Vec3([0.0, 0.0, 0.0]));
		}

		this.originalVertices[0].deepAssign(minVec);
		this.originalVertices[1].setValues(minVec.x, minVec.y, maxVec.z);
		this.originalVertices[2].setValues(minVec.x, maxVec.y, minVec.z);
		this.originalVertices[3].setValues(minVec.x, maxVec.y, maxVec.z);
		this.originalVertices[4].setValues(maxVec.x, minVec.y, minVec.z);
		this.originalVertices[5].setValues(maxVec.x, minVec.y, maxVec.z);
		this.originalVertices[6].setValues(maxVec.x, maxVec.y, minVec.z);
		this.originalVertices[7].deepAssign(maxVec);

		this.normalsNeedsUpdate = true;
		this.verticesNeedsUpdate = true;
	}

	setUpdateNeeded() {
		this.verticesNeedsUpdate = true;
		this.normalsNeedsUpdate = true;
	}

	setTransformMatrix(matrix: Matrix4) {
		this.transformMatrix = matrix;
		this.verticesNeedsUpdate = true;
		this.normalsNeedsUpdate = true;
	}

	getTransformedVertices(): Array<Vec3> {
		if (this.verticesNeedsUpdate) {
			this.transformedVertices.length = 0;

			for (const originalVertex of this.originalVertices) {
				let transformedVertex = this.transformMatrix.multiplyVector4(
					new Vector4([...originalVertex, 1.0])
				);
				let transformedVertexVec3 = new Vec3([
					transformedVertex.elements[0],
					transformedVertex.elements[1],
					transformedVertex.elements[2],
				]);
				this.transformedVertices.push(transformedVertexVec3);
			}
			this.verticesNeedsUpdate = false;
		}
		return this.transformedVertices;
	}

	getTransformedNormals(): Array<Vec3> {
		if (this.normalsNeedsUpdate) {
			this.transformedNormals.length = 0;

			this.getTransformedVertices();

			this.transformedNormals.push(
				new Vec3(this.transformedVertices[0])
					.subtract(this.transformedVertices[1])
					.cross(
						new Vec3(this.transformedVertices[4]).subtract(
							this.transformedVertices[0]
						)
					)
					.normalize()
			);

			this.transformedNormals.push(
				new Vec3(this.transformedVertices[0])
					.subtract(this.transformedVertices[1])
					.cross(
						new Vec3(this.transformedVertices[2]).subtract(
							this.transformedVertices[0]
						)
					)
					.normalize()
			);

			this.transformedNormals.push(
				new Vec3(this.transformedVertices[0])
					.subtract(this.transformedVertices[2])
					.cross(
						new Vec3(this.transformedVertices[4]).subtract(
							this.transformedVertices[0]
						)
					)
					.normalize()
			);

			// let tempMatrix = new Matrix3();
			// tempMatrix.fromMatrix4(this.transformMatrix).invert().transpose();
			// for (const originalNormal of this.originalNormals) {
			// 	this.transformedNormals.push(
			// 		tempMatrix.multiplyVec3(originalNormal).normalize()
			// 	);
			// }

			this.normalsNeedsUpdate = false;
		}
		return this.transformedNormals;
	}

	getTransformedEdges(): Array<Vec3> {
		return this.getTransformedNormals();
	}

	getTransformedEdgeNormals(): Array<Vec3> {
		return this.getTransformedNormals();
	}

	getTransformMatrix(): Matrix4 {
		return this.transformMatrix;
	}
}
