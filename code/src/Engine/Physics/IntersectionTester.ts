import { SAT } from "../Maths/SAT";
import Vec3 from "../Maths/Vec3";
import IntersectionInformation from "./IntersectionInformation";
import Ray from "./Shapes/Ray";
import Shape from "./Shapes/Shape";

export module IntersectionTester {
	/**
	 * Will check if there is an intersection between two meshes.
	 * @param shapeArrayA List of shapes in physical object A.
	 * @param shapeArrayB List of shapes in physical object B.
	 * @returns if there is an intersection.
	 */
	export function identifyIntersection(
		shapeArrayA: Array<Shape>,
		shapeArrayB: Array<Shape>
	): boolean {
		let intersectionAxis = new Vec3();
		let intersectionDepth = { depth: Infinity };
		for (let shapeA of shapeArrayA) {
			for (let shapeB of shapeArrayB) {
				if (
					SAT.getIntersection3D(
						shapeA,
						shapeB,
						intersectionAxis,
						intersectionDepth
					)
				) {
					return true;
				}
			}
		}

		return false;
	}

	/**
	 * Finds the intersection information (axises, depths, and points) between two physical objects, if they intersect
	 * @param shapeArrayA List of shapes in physical object A.
	 * @param shapeArrayB List of shapes in physical object B.
	 * @param intersectionInformation An array that gets filled with information about all intersections happening between the two objects.
	 * @returns If there is an intersection.
	 */
	export function identifyIntersectionInformation(
		shapeArrayA: Array<Shape>,
		shapeArrayB: Array<Shape>,
		intersectionInformation: Array<IntersectionInformation>
	): boolean {
		let intersecting = false;
		let tempIntersectionAxis = new Vec3();
		let tempIntersectionDepth = { depth: Infinity };

		for (let shapeA of shapeArrayA) {
			for (let shapeB of shapeArrayB) {
				if (
					SAT.getIntersection3D(
						shapeA,
						shapeB,
						tempIntersectionAxis,
						tempIntersectionDepth
					)
				) {
					intersecting = true;

					// Save information about intersection
					intersectionInformation.push(
						new IntersectionInformation(
							tempIntersectionAxis,
							tempIntersectionDepth.depth,
							SAT.getIntersectionPoint(shapeA, shapeB, tempIntersectionAxis),
							shapeA,
							shapeB
						)
					);
				}
			}
		}

		return intersecting;
	}

	/**
	 * Finds the closest ray cast hit between a ray and an array of shapes
	 * @param ray Ray shape
	 * @param shapeArray shape array to cast against
	 * @param maxDistance The furthest allowed hit
	 * @param breakOnFirstHit If the first hit should be returned immediately
	 * @returns the closest hit
	 */
	export function doRayCast(
		ray: Ray,
		shapeArray: Array<Shape>,
		maxDistance: number = Infinity,
		breakOnFirstHit: boolean = false
	): number {
		let closestHit = -1.0;

		for (const shape of shapeArray) {
			let dist = SAT.getContinousIntersection3D(
				ray,
				shape,
				ray.getDir(),
				new Vec3([0.0, 0.0, 0.0]),
				maxDistance
			);
			if (dist >= 0.0 && (dist < closestHit || closestHit < 0)) {
				closestHit = dist;
				maxDistance = closestHit;

				if (breakOnFirstHit) {
					return closestHit;
				}
			}
		}

		return closestHit;
	}
}
