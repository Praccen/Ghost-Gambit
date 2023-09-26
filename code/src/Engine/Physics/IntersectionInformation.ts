import Vec3 from "../Maths/Vec3";
import Shape from "./Shapes/Shape";

export default class IntersectionInformation {
	axis: Vec3;
	depth: number;
	point: Vec3;
	shapeA: Shape;
	shapeB: Shape;

	constructor(
		axis: Vec3,
		depth: number,
		point: Vec3,
		shapeA: Shape,
		shapeB: Shape
	) {
		this.axis = new Vec3(axis);
		this.depth = depth;
		this.point = new Vec3(point);
		this.shapeA = shapeA;
		this.shapeB = shapeB;
	}
}
