import Matrix3 from "../../Maths/Matrix3";
import Vec3 from "../../Maths/Vec3";
import Shape from "./Shape";

export default class Triangle extends Shape {
	private originalVertices: Array<Vec3>;
	private originalNormal: Vec3;

	private transformedVertices: Array<Vec3>;
	private transformedNormals: Array<Vec3>;
	private transformedEdges: Array<Vec3>;
	private transformedEdgeNormals: Array<Vec3>;

	private transformMatrix: Matrix4;
	private verticesNeedsUpdate: boolean;
	private normalNeedsUpdate: boolean;
	private edgesNeedsUpdate: boolean;
	private edgeNormalsNeedsUpdate: boolean;

	constructor() {
		super();
		this.originalVertices = new Array<Vec3>();
		this.originalNormal = new Vec3();
		this.transformedVertices = new Array<Vec3>();
		this.transformedNormals = new Array<Vec3>(1);
		this.transformedEdges = new Array<Vec3>();
		this.transformedEdgeNormals = new Array<Vec3>();
		this.transformMatrix = new Matrix4(null);
		this.verticesNeedsUpdate = false;
		this.normalNeedsUpdate = false;
		this.edgesNeedsUpdate = false;
		this.edgeNormalsNeedsUpdate = false;
	}

	setVertices(vertex1: Vec3, vertex2: Vec3, vertex3: Vec3) {
		this.originalVertices.length = 0;
		this.transformedEdges.length = 0;
		this.originalVertices.push(vertex1);
		this.originalVertices.push(vertex2);
		this.originalVertices.push(vertex3);
		this.originalNormal.deepAssign(
			new Vec3(vertex1)
				.subtract(vertex2)
				.cross(new Vec3(vertex3).subtract(vertex2))
				.normalize()
		);

		this.verticesNeedsUpdate = true;
		this.normalNeedsUpdate = true;
		this.edgesNeedsUpdate = true;
		this.edgeNormalsNeedsUpdate = true;
	}

	setUpdateNeeded() {
		this.verticesNeedsUpdate = true;
		this.normalNeedsUpdate = true;
		this.edgesNeedsUpdate = true;
		this.edgeNormalsNeedsUpdate = true;
	}

	setTransformMatrix(matrix: Matrix4) {
		this.transformMatrix = matrix;
		this.verticesNeedsUpdate = true;
		this.normalNeedsUpdate = true;
		this.edgesNeedsUpdate = true;
		this.edgeNormalsNeedsUpdate = true;
	}

	getOriginalVertices(): Array<Vec3> {
		return this.originalVertices;
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
		if (this.normalNeedsUpdate) {
			this.transformedNormals.length = 0;
			this.getTransformedVertices();
			this.transformedNormals.push(
				new Vec3(this.transformedVertices[0])
					.subtract(this.transformedVertices[1])
					.cross(
						new Vec3(this.transformedVertices[2]).subtract(
							this.transformedVertices[1]
						)
					)
					.normalize()
			);

			// let tempMatrix = new Matrix3();
			// tempMatrix.fromMatrix4(this.transformMatrix).invert().transpose();

			// this.transformedNormals.length = 0;
			// this.transformedNormals.push(tempMatrix
			// 	.multiplyVec3(this.originalNormal)
			// 	.normalize());

			// NO IDEA WHY THIS IS NEEDED BUT IT IS :(
			this.transformedNormals[0].x *= -1.0;
			this.transformedNormals[0].z *= -1.0;

			this.normalNeedsUpdate = false;
		}
		return this.transformedNormals;
	}

	getTransformedEdges(): Array<Vec3> {
		if (this.edgesNeedsUpdate) {
			this.getTransformedVertices(); // Force update of vertices
			this.transformedEdges.length = 0;

			this.transformedEdges.push(
				new Vec3(this.transformedVertices[1])
					.subtract(this.transformedVertices[0])
					.normalize()
			);
			this.transformedEdges.push(
				new Vec3(this.transformedVertices[2])
					.subtract(this.transformedVertices[1])
					.normalize()
			);
			this.transformedEdges.push(
				new Vec3(this.transformedVertices[0])
					.subtract(this.transformedVertices[2])
					.normalize()
			);

			this.edgesNeedsUpdate = false;
		}
		return this.transformedEdges;
	}

	getTransformedEdgeNormals(): Array<Vec3> {
		if (this.edgeNormalsNeedsUpdate) {
			this.getTransformedEdges(); // Force update of edges
			this.getTransformedNormals(); // Force update of normal
			this.transformedEdgeNormals.length = 0;

			this.transformedEdgeNormals.push(
				new Vec3(this.transformedEdges[0])
					.cross(this.transformedNormals[0])
					.normalize()
			);
			this.transformedEdgeNormals.push(
				new Vec3(this.transformedEdges[1])
					.cross(this.transformedNormals[0])
					.normalize()
			);
			this.transformedEdgeNormals.push(
				new Vec3(this.transformedEdges[2])
					.cross(this.transformedNormals[0])
					.normalize()
			);

			this.edgeNormalsNeedsUpdate = false;
		}
		return this.transformedEdgeNormals;
	}
}
