import { Component, ComponentTypeEnum } from "./Component";
import Triangle from "../../Physics/Shapes/Triangle";
import GraphicsObject from "../../Objects/GraphicsObject";
import Octree from "../../Objects/Octree";
import Vec3 from "../../Maths/Vec3";

export default class MeshCollisionComponent extends Component {
	octree: Octree;

	constructor(octree: Octree, graphicsObject?: GraphicsObject) {
		super(ComponentTypeEnum.MESHCOLLISION);
		this.octree = octree;

		if (graphicsObject) {
			this.setup(graphicsObject, 0.1, 100);
		}
	}

	/**
	 * Sets up the triangles based on the vertices in a graphics object
	 * @param graphicsObj The graphics object
	 */
	private setup(
		graphicsObj: GraphicsObject,
		smallestNodeSizeMultiplicator: number,
		maxShapesPerNode: number
	) {
		let triangles = new Array<Triangle>();
		graphicsObj.setupTriangles(triangles);

		let minVec = new Vec3([Infinity, Infinity, Infinity]);
		let maxVec = new Vec3([-Infinity, -Infinity, -Infinity]);
		for (let tri of triangles) {
			for (let vertex of tri.getTransformedVertices()) {
				maxVec.max(vertex);
				minVec.min(vertex);
			}
		}
		this.octree = new Octree(
			minVec,
			maxVec,
			smallestNodeSizeMultiplicator,
			maxShapesPerNode
		);

		this.octree.addShapes(triangles);
		this.octree.prune();
	}
}
