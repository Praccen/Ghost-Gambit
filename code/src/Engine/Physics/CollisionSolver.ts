import IntersectionInformation from "./IntersectionInformation";
import Vec3 from "../Maths/Vec3";

export module CollisionSolver {
	export function getTranslationNeeded(
		intersectionInformation: Array<IntersectionInformation>
	): Vec3 {
		if (intersectionInformation.length == 0) {
			return new Vec3();
		}

		// Displace along the axis which has the most depth
		let resultingVec = new Vec3();
		let maxDepth = 0.0;
		for (let inf of intersectionInformation) {
			// Only displace for triangles if it is along the normal
			if (inf.shapeB.getTransformedNormals().length == 1) {
				if (inf.axis.dot(inf.shapeB.getTransformedNormals()[0]) < 0.99) {
					continue;
				}
			}

			if (inf.depth > maxDepth) {
				resultingVec.deepAssign(inf.axis);
				maxDepth = inf.depth;
			}
		}
		resultingVec.multiply(maxDepth);

		return resultingVec;
	}
}
