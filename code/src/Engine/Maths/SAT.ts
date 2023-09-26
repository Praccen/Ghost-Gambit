import Shape from "../Physics/Shapes/Shape";
import Triangle from "../Physics/Shapes/Triangle";
import Vec3 from "./Vec3";

export module SAT {
	/**
	 * Finds how big of an overlap there is between two sets of points along a vector.
	 * @param overlapVector The vector to test along.
	 * @param shapeAVertices Points in set A
	 * @param shapeBVertices Points in set B
	 * @param reverse An object holding a variable "value" that is set to true if the vector should be flipped in order to have the vector point from dataset B towards dataset A.
	 * Is set by this function.
	 * @returns How big the overlap is, returns -1.0 if there is no overlap.
	 */
	export function getOverlap(
		overlapVector: Vec3,
		shapeAVertices: Array<Vec3>,
		shapeBVertices: Array<Vec3>,
		reverse: { value: boolean },
		margin: number
	): number {
		let maxA = overlapVector.dot(shapeAVertices[0]);
		let minA = maxA;
		let maxB = overlapVector.dot(shapeBVertices[0]);
		let minB = maxB;

		let tempDot = 0.0;

		for (let i = 1; i < shapeAVertices.length; i++) {
			tempDot = overlapVector.dot(shapeAVertices[i]);
			if (tempDot < minA) {
				minA = tempDot;
			}
			if (tempDot > maxA) {
				maxA = tempDot;
			}
		}

		for (let i = 1; i < shapeBVertices.length; i++) {
			tempDot = overlapVector.dot(shapeBVertices[i]);
			if (tempDot < minB) {
				minB = tempDot;
			}
			if (tempDot > maxB) {
				maxB = tempDot;
			}
		}

		let overlap1 = maxB - minA;
		let overlap2 = maxA - minB;
		if (overlap1 >= -margin && overlap2 >= -margin) {
			if (overlap1 > overlap2) {
				reverse.value = true;
				return overlap2;
			} else {
				reverse.value = false;
				return overlap1;
			}
		}

		return -1.0;
	}

	/**
	 * Finds if two sets of vertices will overlap along an axis given their relative speed within the time frame (time input object).
	 * Will alter the first collision time and last collision time in the times object
	 * @param testVec The axis for overlap
	 * @param shapeAVertices Vertices for shape A
	 * @param shapeBVertices Vertices for shape B
	 * @param relativeVelocity Relative velocity between the shapes
	 * @param times Times object which contains - first, last, max. Max is how soon the overlap has to happen to count.
	 * @returns If an overlap happens within the timeframe (times.max)
	 */
	export function getContinousOverlap(
		testVec: Vec3,
		shapeAVertices: Array<Vec3>,
		shapeBVertices: Array<Vec3>,
		relativeVelocity: Vec3,
		times: { first: number; last: number; max: number }
	): boolean {
		let minA = Infinity,
			minB = Infinity;
		let maxA = -Infinity,
			maxB = -Infinity;

		let tempDot = 0.0;

		for (const vert of shapeAVertices) {
			tempDot = vert.dot(testVec);

			minA = Math.min(minA, tempDot);
			maxA = Math.max(maxA, tempDot);
		}

		for (const vert of shapeBVertices) {
			tempDot = vert.dot(testVec);

			minB = Math.min(minB, tempDot);
			maxB = Math.max(maxB, tempDot);
		}

		//Following found here: https://www.geometrictools.com/Documentation/MethodOfSeparatingAxes.pdf

		let T: number;
		let speed = testVec.dot(relativeVelocity);

		if (maxB <= minA) {
			if (speed <= 0.0) {
				// Interval (B) initially on ‘left’ of interval (A)
				return false; // Intervals moving apart
			}

			T = (minA - maxB) / speed;
			if (T > times.first) {
				times.first = T;
			}
			if (times.first > times.max) {
				return false;
			} // Early exit

			T = (maxA - minB) / speed;
			if (T < times.last) {
				times.last = T;
			}
			if (times.first > times.last) {
				return false;
			} // Early exit
		} else if (maxA <= minB) {
			// Interval (B) initially on ‘right’ of interval (A)
			if (speed >= 0.0) {
				return false;
			} // Intervals moving apart

			T = (maxA - minB) / speed;
			if (T > times.first) {
				times.first = T;
			}
			if (times.first > times.max) {
				return false;
			} // Early exit

			T = (minA - maxB) / speed;
			if (T < times.last) {
				times.last = T;
			}
			if (times.first > times.last) {
				return false;
			} // Early exit
		} else {
			// Interval (A) and interval (B) overlap
			if (speed > 0.0) {
				T = (maxA - minB) / speed;
				if (T < times.last) {
					times.last = T;
				}
				if (times.first > times.last) {
					return false;
				} // Early exit
			} else if (speed < 0.0) {
				T = (minA - maxB) / speed;
				if (T < times.last) {
					times.last = T;
				}
				if (times.first > times.last) {
					return false;
				} // Early exit
			}
		}

		return true;
	}

	/**
	 * This will find the average point of intersection between two shapes along an axis.
	 * This assumes that the shapes are intersecting and can not be used to find out IF two shapes are intersecting.
	 * @param shapeA Shape A
	 * @param shapeB Shape B
	 * @param testAxis The axis to test along.
	 * @returns The average point of intersection.
	 */
	export function getIntersectionPoint(
		shapeA: Shape,
		shapeB: Shape,
		testAxis: Vec3
	): Vec3 {
		let shapeAVertices = shapeA.getTransformedVertices();
		let shapeBVertices = shapeB.getTransformedVertices();

		let maxAPoints: Array<number> = new Array<number>();
		let minAPoints: Array<number> = new Array<number>();
		let maxBPoints: Array<number> = new Array<number>();
		let minBPoints: Array<number> = new Array<number>();

		let maxA = testAxis.dot(shapeAVertices[0]);
		maxAPoints.push(0);
		let minA = maxA;
		minAPoints.push(0);
		let maxB = testAxis.dot(shapeBVertices[0]);
		maxBPoints.push(0);
		let minB = maxB;
		minBPoints.push(0);

		let tempDot = 0.0;

		for (let i = 1; i < shapeAVertices.length; i++) {
			tempDot = testAxis.dot(shapeAVertices[i]);
			if (tempDot < minA) {
				minA = tempDot;
				minAPoints.length = 0;
				minAPoints.push(i);
			} else if (tempDot == minA) {
				// TODO: Add some kind of epsilon?
				minAPoints.push(i);
			}
			if (tempDot > maxA) {
				maxA = tempDot;
				maxAPoints.length = 0;
				maxAPoints.push(i);
			} else if (tempDot == maxA) {
				// TODO: Add some kind of epsilon?
				maxAPoints.push(i);
			}
		}

		for (let i = 1; i < shapeBVertices.length; i++) {
			tempDot = testAxis.dot(shapeBVertices[i]);
			if (tempDot < minB) {
				minB = tempDot;
				minBPoints.length = 0;
				minBPoints.push(i);
			} else if (tempDot == minB) {
				// TODO: Add some kind of epsilon?
				minBPoints.push(i);
			}
			if (tempDot > maxB) {
				maxB = tempDot;
				maxBPoints.length = 0;
				maxBPoints.push(i);
			} else if (tempDot == maxB) {
				// TODO: Add some kind of epsilon?
				maxBPoints.push(i);
			}
		}

		let overlap1 = Math.abs(maxB - minA);
		let overlap2 = Math.abs(maxA - minB);

		let averagePoint = new Vec3();
		let nrPoints = 0;

		if (overlap1 > overlap2) {
			// overlap2
			for (const p of maxAPoints) {
				averagePoint.add(shapeAVertices[p]);
				nrPoints++;
			}
			for (const p of minBPoints) {
				averagePoint.add(shapeBVertices[p]);
				nrPoints++;
			}
		} else {
			// overlap1;
			let averagePoint = new Vec3();
			let nrPoints = 0;
			for (const p of minAPoints) {
				averagePoint.add(shapeAVertices[p]);
				nrPoints++;
			}
			for (const p of maxBPoints) {
				averagePoint.add(shapeBVertices[p]);
				nrPoints++;
			}
		}
		averagePoint.multiply(1.0 / nrPoints);
		return averagePoint;
	}

	/**
	 * Intersection testing of two shapes.
	 * @param shapeA Shape A
	 * @param shapeB Shape B
	 * @param intersectionAxis The minimum translation vector (MTV).
	 * This is the axis at which the shapes are intersecting the least.
	 * Is set by this function.
	 * Will always point from Shape B towards Shape A.
	 * @param intersectionDepth An object holding a variable "depth" that will state how much the shapes are intersecting.
	 * Is set by this function
	 * @returns Boolean stating if the shapes intersect or not.
	 */
	export function getIntersection3D(
		shapeA: Shape,
		shapeB: Shape,
		intersectionAxis: Vec3,
		intersectionDepth: { depth: number }
	): boolean {
		intersectionDepth.depth = Infinity;

		let shapeAVertices = shapeA.getTransformedVertices();
		let shapeBVertices = shapeB.getTransformedVertices();

		// Check normal and update intersection depth and axis if shallower than previous
		let checkNormal = function (normal: Vec3): boolean {
			let reverse = { value: false };
			let overlap = SAT.getOverlap(
				normal,
				shapeAVertices,
				shapeBVertices,
				reverse,
				shapeA.margin + shapeB.margin
			);

			if (overlap < 0.0) {
				return false;
			}

			if (overlap < intersectionDepth.depth) {
				intersectionDepth.depth = overlap;
				intersectionAxis.deepAssign(normal);
				if (reverse.value) {
					intersectionAxis.flip();
				}
			}
			return true;
		};

		let shapeANormals = shapeA.getTransformedNormals();
		for (let normal of shapeANormals) {
			if (!checkNormal(normal)) {
				return false;
			}
		}

		let shapeBNormals = shapeB.getTransformedNormals();
		for (let normal of shapeBNormals) {
			if (!checkNormal(normal)) {
				return false;
			}
		}

		// The shapes are intersecting along all normals
		// Two cases are possible;
		// 1. The shapes are flat and coplanar -> We need to test the shapes in "2d", projected on the plane they are on
		// 2. The shapes are not flat and coplanar -> We need to test the cross products of all the edges of ShapeA with the edges of ShapeB

		// Lets start with the coplanar possibility, which can be checked by seeing if both shapes have only one normal, and the two shapes normals are perpendicular
		// Side note; If the normals are perpendicular, but the shapes are not coplanar, the previous tests would have found a seperating axis, so we wouldn't have gotten here

		if (shapeANormals.length == 1 && shapeBNormals.length == 1) {
			// Coplanar possible
			let crossVector = new Vec3(shapeANormals[0]).cross(shapeBNormals[0]);

			if (
				crossVector.x == 0.0 &&
				crossVector.y == 0.0 &&
				crossVector.z == 0.0
			) {
				// Coplanar
				// Test the edge normals for all edges
				for (const AEdgeNormal of shapeA.getTransformedEdgeNormals()) {
					if (!checkNormal(AEdgeNormal)) {
						return false;
					}
				}

				for (const BEdgeNormal of shapeB.getTransformedEdgeNormals()) {
					if (!checkNormal(BEdgeNormal)) {
						return false;
					}
				}

				// There is an intersection, return it
				return true;
			}
		}

		// Calculate cross vectors of edges and test along the results
		for (const e1 of shapeA.getTransformedEdges()) {
			for (const e2 of shapeB.getTransformedEdges()) {
				const dotProd = e1.dot(e2);
				if (dotProd < 0.99 && dotProd > -0.99) {
					let testVec = new Vec3();
					testVec.deepAssign(e1);
					testVec.cross(e2).normalize();
					if (!checkNormal(testVec)) {
						return false;
					}
				}
			}
		}

		return true;
	}

	/**
	 * Check when an intersection will occur (if it happens before timeMax).
	 * @param shapeA
	 * @param shapeB
	 * @param velocityA
	 * @param velocityB
	 * @param timeMax
	 * @returns Returns time of intersection if there is one within timeMax, otherwise returns -1.0
	 */
	export function getContinousIntersection3D(
		shapeA: Shape,
		shapeB: Shape,
		velocityA: Vec3,
		velocityB: Vec3,
		timeMax: number
	): number {
		// Treat shapeA as stationary and shapeB as moving
		let relativeVel = new Vec3(velocityB).subtract(velocityA);

		let times = { first: 0.0, last: Infinity, max: timeMax };

		let shapeAVertices = shapeA.getTransformedVertices();
		let shapeBVertices = shapeB.getTransformedVertices();

		let shapeANormals = shapeA.getTransformedNormals();
		for (let normal of shapeANormals) {
			if (
				!getContinousOverlap(
					normal,
					shapeAVertices,
					shapeBVertices,
					relativeVel,
					times
				)
			) {
				return -1.0;
			}
		}

		let shapeBNormals = shapeB.getTransformedNormals();
		for (let normal of shapeBNormals) {
			if (
				!getContinousOverlap(
					normal,
					shapeAVertices,
					shapeBVertices,
					relativeVel,
					times
				)
			) {
				return -1.0;
			}
		}

		// The shapes are intersecting along all normals
		// Two cases are possible;
		// 1. The shapes are flat and coplanar -> We need to test the shapes in "2d", projected on the plane they are on
		// 2. The shapes are not flat and coplanar -> We need to test the cross products of all the edges of ShapeA with the edges of ShapeB

		// Lets start with the coplanar possibility, which can be checked by seeing if both shapes have only one normal, and the two shapes normals are perpendicular
		// Side note; If the normals are perpendicular, but the shapes are not coplanar, the previous tests would have found a seperating axis, so we wouldn't have gotten here

		if (shapeANormals.length == 1 && shapeBNormals.length == 1) {
			// Coplanar possible
			let crossVector = new Vec3(shapeANormals[0]).cross(shapeBNormals[0]);

			if (
				crossVector.x == 0.0 &&
				crossVector.y == 0.0 &&
				crossVector.z == 0.0
			) {
				// Coplanar
				// Test the edge normals for all edges
				for (const AEdgeNormal of shapeA.getTransformedEdgeNormals()) {
					if (
						!getContinousOverlap(
							AEdgeNormal,
							shapeAVertices,
							shapeBVertices,
							relativeVel,
							times
						)
					) {
						return -1.0;
					}
				}

				for (const BEdgeNormal of shapeB.getTransformedEdgeNormals()) {
					if (
						!getContinousOverlap(
							BEdgeNormal,
							shapeAVertices,
							shapeBVertices,
							relativeVel,
							times
						)
					) {
						return -1.0;
					}
				}

				// There is an intersection, return it
				return times.first;
			}
		}

		// Calculate cross vectors of edges and test along the results
		for (const e1 of shapeA.getTransformedEdges()) {
			for (const e2 of shapeB.getTransformedEdges()) {
				const dotProd = e1.dot(e2);
				if (dotProd < 0.99 && dotProd > -0.99) {
					let testVec = new Vec3();
					testVec.deepAssign(e1);
					testVec.cross(e2).normalize();
					if (
						!getContinousOverlap(
							testVec,
							shapeAVertices,
							shapeBVertices,
							relativeVel,
							times
						)
					) {
						return -1.0;
					}
				}
			}
		}

		return times.first;
	}

	export function runUnitTests() {
		// prettier-ignore
		let vertexCoords = [
            // Triangle 0
            0.0, 1.0, 0.0,
            0.0, 0.0, 0.0,
            1.0, 0.0, 0.0,
            
            // Triangle 1
            0.5, 0.5, -0.1,
            0.5, 0.5, 1.0,
            0.5, 0.0, 1.0,

            // Triangle 2
            5.0, 5.0, 0.0,
            5.0, 4.0, 0.0,
            6.0, 4.0, 0.0,

            // Triangle 3
            1.0, 1.0, 0.0,
            1.0, 0.0, 0.0,
            2.0, 0.0, 0.0,
        ]

		// prettier-ignore
		let positiveTests: {t1Index: number, t2Index:number, depth: number, axis: Vec3, strictDirection: boolean}[] = [
            {t1Index: 0, t2Index: 1, depth: 0.1, axis: new Vec3([0.0, 0.0, -1.0]), strictDirection: true},
            {t1Index: 0, t2Index: 3, depth: 0.0, axis: new Vec3([0.0, 0.0, 1.0]), strictDirection: false},
        ]

		// prettier-ignore
		let negativeTests = [
            0, 2, // Coplanar
            1, 2,
        ]

		// Create Vec3s from the data points
		let vertexPositions = new Array<Vec3>();
		for (let i = 0; i < vertexCoords.length; i += 3) {
			vertexPositions.push(
				new Vec3([vertexCoords[i], vertexCoords[i + 1], vertexCoords[i + 2]])
			);
		}

		// Create triangles from the Vec3s
		let triangles = new Array<Triangle>();
		for (let i = 0; i < vertexPositions.length; i += 3) {
			let length = triangles.push(new Triangle());
			triangles[length - 1].setVertices(
				vertexPositions[i],
				vertexPositions[i + 1],
				vertexPositions[i + 2]
			);
		}

		let intersectionAxis = new Vec3();
		let intersectionDepth = { depth: 0.0 };
		// Test the triangles that should be intersecting, no matter the order they are tried in
		for (let i = 0; i < positiveTests.length; i++) {
			if (
				!SAT.getIntersection3D(
					triangles[positiveTests[i].t1Index],
					triangles[positiveTests[i].t2Index],
					intersectionAxis,
					intersectionDepth
				)
			) {
				alert("False negative intersection test!");
				debugger;
			} else if (
				Math.abs(intersectionDepth.depth - positiveTests[i].depth) > 0.00001
			) {
				alert("Intersection test returned wrong depth!");
				debugger;
			} else if (positiveTests[i].strictDirection) {
				// Check that the axis is pointing in the correct direction
				if (!intersectionAxis.compare(positiveTests[i].axis)) {
					alert("Intersection test returned wrong intersection axis!");
					debugger;
				}
			} else if (
				!intersectionAxis.cross(positiveTests[i].axis).compare([0.0, 0.0, 0.0])
			) {
				// Only check that the axises are perpendicular
				alert("Intersection test returned wrong intersection axis!");
				debugger;
			}

			if (
				!SAT.getIntersection3D(
					triangles[positiveTests[i].t2Index],
					triangles[positiveTests[i].t1Index],
					intersectionAxis,
					intersectionDepth
				)
			) {
				alert("False negative intersection test!");
				debugger;
			} else if (
				Math.abs(intersectionDepth.depth - positiveTests[i].depth) > 0.00001
			) {
				alert("Intersection test returned wrong depth!");
				debugger;
			} else if (positiveTests[i].strictDirection) {
				// Check that the axis is pointing in the correct direction
				if (!intersectionAxis.flip().compare(positiveTests[i].axis)) {
					alert("Intersection test returned wrong intersection axis!");
					debugger;
				}
			} else if (
				!intersectionAxis.cross(positiveTests[i].axis).compare([0.0, 0.0, 0.0])
			) {
				// Only check that the axises are perpendicular
				alert("Intersection test returned wrong intersection axis!");
				debugger;
			}
		}

		// Test the triangles that should not be intersecting, no matter the order they are tried in
		for (let i = 0; i < negativeTests.length; i += 2) {
			if (
				SAT.getIntersection3D(
					triangles[negativeTests[i]],
					triangles[negativeTests[i + 1]],
					new Vec3(),
					{ depth: 0.0 }
				) ||
				SAT.getIntersection3D(
					triangles[negativeTests[i + 1]],
					triangles[negativeTests[i]],
					new Vec3(),
					{ depth: 0.0 }
				)
			) {
				alert("False positive intersection test!");
				debugger;
			}
		}
	}
}
