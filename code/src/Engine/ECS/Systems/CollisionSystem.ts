import System from "./System";
import { ComponentTypeEnum } from "../Components/Component";
import { IntersectionTester } from "../../Physics/IntersectionTester";
import MeshCollisionComponent from "../Components/MeshCollisionComponent";
import IntersectionInformation from "../../Physics/IntersectionInformation";
import MovementComponent from "../Components/MovementComponent";
import PositionComponent from "../Components/PositionComponent";
import Vec3 from "../../Maths/Vec3";
import { CollisionSolver } from "../../Physics/CollisionSolver";
import CollisionComponent from "../Components/CollisionComponent";
import BoundingBoxComponent from "../Components/BoundingBoxComponent";
import Shape from "../../Physics/Shapes/Shape";

export default class CollisionSystem extends System {
	constructor() {
		super([
			ComponentTypeEnum.COLLISION,
			ComponentTypeEnum.BOUNDINGBOX,
			ComponentTypeEnum.POSITION,
		]);
		// Optional MESHCOLLISION, MOVEMENT
	}

	update(dt: number) {
		let information = new Array<IntersectionInformation>();

		for (let e1 of this.entities) {
			let e1CollisionComp = <CollisionComponent>(
				e1.getComponent(ComponentTypeEnum.COLLISION)
			);

			// If this is static or immovable only other objects collisions with this matters
			if (e1CollisionComp.isStatic || e1CollisionComp.isImmovable) {
				continue;
			}

			information.length = 0;

			let e1BoundingBoxComp = <BoundingBoxComponent>(
				e1.getComponent(ComponentTypeEnum.BOUNDINGBOX)
			);

			// This is not static, so the bounding box needs to be updated in case it moved
			e1BoundingBoxComp.updateTransformMatrix();

			let e1MeshCollisionComp = <MeshCollisionComponent>(
				e1.getComponent(ComponentTypeEnum.MESHCOLLISION)
			);
			if (e1MeshCollisionComp) {
				// Update mesh collision component
				e1MeshCollisionComp.octree.setModelMatrix();
			}

			for (let e2 of this.entities) {
				if (e1.id == e2.id) {
					// Don't collide with self
					continue;
				}

				let e2BoundingBoxComp = <BoundingBoxComponent>(
					e2.getComponent(ComponentTypeEnum.BOUNDINGBOX)
				);

				let e2CollisionComp = <CollisionComponent>(
					e2.getComponent(ComponentTypeEnum.COLLISION)
				);

				if (!e2CollisionComp.isStatic) {
					// e2 is not static, so it can move, we need to update the bounding box
					// Update the e2 bounding box using saved matrix
					e2BoundingBoxComp.updateTransformMatrix();
				}

				let e2MeshCollisionComp = <MeshCollisionComponent>(
					e2.getComponent(ComponentTypeEnum.MESHCOLLISION)
				);
				if (e1MeshCollisionComp || e2MeshCollisionComp) {
					// At least one of the entities have mesh collision
					// Start by checking bounding boxes, but don't save information
					if (
						IntersectionTester.identifyIntersection(
							[e1BoundingBoxComp.boundingBox],
							[e2BoundingBoxComp.boundingBox]
						)
					) {
						let e1ShapeArray = new Array<Shape>();
						let e2ShapeArray = new Array<Shape>();

						if (e1MeshCollisionComp) {
							// Entity 1 has mesh collision, check e2 bb versus e1 mesh octree
							e1MeshCollisionComp.octree.getShapesForCollision(
								e2BoundingBoxComp.boundingBox,
								e1ShapeArray
							);

							// Then update the shapes using their saved transform matrix
							for (let shape of e1ShapeArray) {
								shape.setUpdateNeeded();
							}
						} else {
							// Entity 1 does not have mesh collision, use the bounding box for intersection testing
							e1ShapeArray.push(e1BoundingBoxComp.boundingBox);
						}

						if (e2MeshCollisionComp) {
							// Entity 2 has mesh collision, check e1 bb versus e2 mesh octree

							// First update e2 octree
							// TODO: This has to be done every time right now since multiple instances of the same object share the same octree, but has different transforms. Can this be solved another way?
							e2MeshCollisionComp.octree.setModelMatrix(
								e2BoundingBoxComp.boundingBox.getTransformMatrix()
							);

							// Then get the shapes from the octree
							e2MeshCollisionComp.octree.getShapesForCollision(
								e1BoundingBoxComp.boundingBox,
								e2ShapeArray
							);

							// Then update the shapes using their saved transform matrix
							if (!e2CollisionComp.isStatic) {
								for (let shape of e2ShapeArray) {
									shape.setUpdateNeeded();
								}
							}
						} else {
							// Entity 2 does not have mesh collision, use the bounding box for intersection testing
							e2ShapeArray.push(e2BoundingBoxComp.boundingBox);
						}

						// We now have our updated shape arrays to intersection test, let's do it!
						IntersectionTester.identifyIntersectionInformation(
							e1ShapeArray,
							e2ShapeArray,
							information
						);
					}
				} else {
					// None of the entities have mesh collision, do collision with bounding boxes, and save information
					IntersectionTester.identifyIntersectionInformation(
						[e1BoundingBoxComp.boundingBox],
						[e2BoundingBoxComp.boundingBox],
						information
					);
				}
			}

			let movComp = <MovementComponent>(
				e1.getComponent(ComponentTypeEnum.MOVEMENT)
			);

			// Update velocities
			if (movComp) {
				movComp.onGround = false;
				for (let inf of information) {
					let axis = new Vec3(inf.axis);
					// let depth = inf.depth;
					if (inf.shapeB.getTransformedNormals().length == 1) {
						axis.deepAssign(inf.shapeB.getTransformedNormals()[0]);
						// depth = SAT.getOverlap(axis, inf.shapeA.getTransformedVertices(), inf.shapeB.getTransformedVertices(), {value: false}, 0);
					}
					let dotProd = movComp.velocity.dot(axis);
					if (dotProd < 0.0) {
						movComp.velocity.subtract(new Vec3(axis).multiply(dotProd));
					}

					if (axis.y > 0.5) {
						movComp.onGround = true;
					}
				}
			}

			// Prioritize the parent position component if there is one
			let posComp = <PositionComponent>(
				e1.getComponent(ComponentTypeEnum.POSITIONPARENT)
			);

			// Otherwise move the position component
			if (!posComp) {
				posComp = <PositionComponent>(
					e1.getComponent(ComponentTypeEnum.POSITION)
				);
			}

			let displacement = CollisionSolver.getTranslationNeeded(information);
			posComp.position.add(displacement);
		}
	}
}
