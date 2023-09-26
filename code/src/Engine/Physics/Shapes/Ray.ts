import Matrix3 from "../../Maths/Matrix3";
import Vec3 from "../../Maths/Vec3";
import Shape from "./Shape";

export default class Ray extends Shape {
	private start: Vec3;
	private dir: Vec3;

	constructor() {
		super();
		this.start = new Vec3([0.0, 0.0, 0.0]);
		this.dir = new Vec3([0.0, 0.0, 1.0]);
	}

	setStart(start: Vec3) {
		this.start = start;
	}

	setDir(dir: Vec3) {
		this.dir.deepAssign(dir).normalize();
	}

	getDir(): Vec3 {
		return this.dir;
	}

	setStartAndDir(start: Vec3, dir: Vec3) {
		this.start.deepAssign(start);
		this.dir.deepAssign(dir).normalize();
	}

	getTransformedVertices(): Array<Vec3> {
		return [this.start];
	}

	getTransformedNormals(): Array<Vec3> {
		return [this.dir];
	}

	getTransformedEdges(): Array<Vec3> {
		return [this.dir];
	}

	getTransformedEdgeNormals(): Array<Vec3> {
		return [this.dir];
	}
}
