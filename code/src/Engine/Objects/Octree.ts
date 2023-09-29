import { SAT } from "../Maths/SAT";
import Vec3 from "../Maths/Vec3";
import { IntersectionTester } from "../Physics/IntersectionTester";
import OBB from "../Physics/Shapes/OBB";
import Ray from "../Physics/Shapes/Ray";
import Shape from "../Physics/Shapes/Shape";
import Triangle from "../Physics/Shapes/Triangle";

class TreeNode {
	obb: OBB;
	size: number;
	position: Vec3;
	children: Array<TreeNode>;
	content: Array<Shape>;

	constructor(size: number, position: Vec3) {
		this.obb = new OBB();
		this.size = size;
		this.position = position;
		let halfSize = size * 0.5;
		this.obb.setMinAndMaxVectors(
			new Vec3([-halfSize, -halfSize, -halfSize]).add(this.position),
			new Vec3([halfSize, halfSize, halfSize]).add(this.position)
		);

		this.children = new Array<TreeNode>();
		this.content = new Array<Shape>();
	}

	/**
	 * Create 8 child nodes
	 * @returns if new children was created. Will be false if there already exists children for this node or the sizes of the children would be smaller than minNodeSize.
	 */
	private createChildren(minNodeSize: number): boolean {
		let halfSize = this.size * 0.5;
		if (this.children.length == 0 && halfSize >= minNodeSize) {
			let quarterSize = this.size * 0.25;
			for (let x = -1; x < 2; x += 2) {
				for (let y = -1; y < 2; y += 2) {
					for (let z = -1; z < 2; z += 2) {
						this.children.push(
							new TreeNode(
								halfSize,
								new Vec3([
									x * quarterSize,
									y * quarterSize,
									z * quarterSize,
								]).add(this.position)
							)
						);
					}
				}
			}

			return true;
		}

		return false;
	}

	private checkIfContains(shape: Shape) {
		let minVec = new Vec3(this.position).subtract([
			this.size / 2.0,
			this.size / 2.0,
			this.size / 2.0,
		]);
		let maxVec = new Vec3(this.position).add([
			this.size / 2.0,
			this.size / 2.0,
			this.size / 2.0,
		]);
		let shapeVertices = shape.getTransformedVertices();
		for (let vertex of shapeVertices) {
			let returnVal = true;
			for (let i = 0; i < 3; i++) {
				if (minVec[i] > vertex[i] || vertex[i] > maxVec[i]) {
					returnVal = false;
				}
			}
			if (returnVal) {
				return true;
			}
		}
		return false;
	}

	subdivideTree(minNodeSize: number) {
		this.createChildren(minNodeSize);

		for (let child of this.children) {
			child.subdivideTree(minNodeSize);
		}
	}

	addShape(shape: Shape, minNodeSize: number, maxShapesPerNode: number) {
		if (
			this.checkIfContains(shape) &&
			IntersectionTester.identifyIntersection([shape], [this.obb])
		) {
			if (this.children.length == 0) {
				// Leaf node
				if (this.content.length >= maxShapesPerNode) {
					// New children are needed
					this.createChildren(minNodeSize); // This will create children if the size of the child nodes are still bigger than the minNodeSize
				}
			}

			if (this.children.length == 0) {
				// Still leaf node
				this.content.push(shape);
			} else {
				// No longer leaf node
				// Add all the content from this node to child nodes instead
				for (let shape of this.content) {
					for (let child of this.children) {
						child.addShape(shape, minNodeSize, maxShapesPerNode);
					}
				}

				this.content.length = 0;

				// Keep going deeper
				for (let child of this.children) {
					child.addShape(shape, minNodeSize, maxShapesPerNode);
				}
			}
		}
	}

	setModelMatrix(modelMatrix: Matrix4) {
		this.obb.setTransformMatrix(modelMatrix);

		for (const shape of this.content) {
			shape.setTransformMatrix(modelMatrix);
		}

		for (const child of this.children) {
			child.setModelMatrix(modelMatrix);
		}
	}

	prune() {
		for (let i = 0; i < this.children.length; i++) {
			this.children[i].prune();

			if (
				this.children[i].content.length == 0 &&
				this.children[i].children.length == 0
			) {
				this.children.splice(i, 1);
				i--;
			}
		}
	}

	updateBox() {
		this.obb.setUpdateNeeded();

		for (const shape of this.content) {
			shape.setUpdateNeeded();
		}

		for (const child of this.children) {
			child.updateBox();
		}
	}

	getShapesForCollision(boundingBox: OBB, shapeArray: Array<Shape>) {
		if (IntersectionTester.identifyIntersection([boundingBox], [this.obb])) {
			for (const child of this.children) {
				child.getShapesForCollision(boundingBox, shapeArray);
			}

			for (const shape of this.content) {
				shapeArray.push(shape);
			}
		}
	}

	getShapesForRayCast(
		ray: Ray,
		shapeArray: Array<Shape>,
		maxDistance: number = Infinity
	) {
		if (IntersectionTester.doRayCast(ray, [this.obb], maxDistance) >= 0.0) {
			for (const child of this.children) {
				child.getShapesForRayCast(ray, shapeArray, maxDistance);
			}

			for (const shape of this.content) {
				shapeArray.push(shape);
			}
		}
	}

	print(): string {
		let result = "{\n";
		result += "s" + this.size + "\n";
		result += "p" + this.position + "\n";
		result += "[\n";
		for (let shape of this.content) {
			result +=
				"t[" +
				shape.getOriginalVertices()[0] +
				"], [" +
				shape.getOriginalVertices()[1] +
				"], [" +
				shape.getOriginalVertices()[2] +
				"]\n";
		}
		result += "]\n";
		if (this.children.length > 0) {
			for (let child of this.children) {
				result += child.print();
			}
		}
		result += "}\n";

		return result;
	}
}

export default class Octree {
	baseNode: TreeNode;
	minNodeSize: number;
	maxShapesPerNode: number;

	constructor(
		minVec: Vec3,
		maxVec: Vec3,
		smallestNodeSizeMultiplicator: number,
		maxShapesPerNode: number
	) {
		let baseNodeSize = maxVec.x - minVec.x;
		baseNodeSize = Math.max(baseNodeSize, maxVec.y - minVec.y);
		baseNodeSize = Math.max(baseNodeSize, maxVec.z - minVec.z);

		this.baseNode = new TreeNode(
			baseNodeSize,
			new Vec3(minVec).add(maxVec).multiply(0.5)
		);
		this.minNodeSize = baseNodeSize * smallestNodeSizeMultiplicator;
		this.maxShapesPerNode = maxShapesPerNode;
	}

	addShape(shape: Shape) {
		this.baseNode.addShape(shape, this.minNodeSize, this.maxShapesPerNode);
	}

	addShapes(shapes: Array<Shape>) {
		for (let shape of shapes) {
			this.baseNode.addShape(shape, this.minNodeSize, this.maxShapesPerNode);
		}
	}

	/**
	 * Update the transform matrix used for the triangles.
	 * @param matrix Optional: Will set a new matrix to use for the triangles. If no matrix is sent, it will use the previously set matrix but mark all triangles to be updated.
	 */
	setModelMatrix(matrix?: Matrix4) {
		if (matrix == this.baseNode.obb.getTransformMatrix()) {
			// Setting the already used matrix
			// TODO: This screws us over if transform matrix is the same matrix but has been modified :(
			return;
		}
		if (matrix) {
			this.baseNode.setModelMatrix(matrix);
		} else {
			this.baseNode.updateBox();
		}
	}

	prune() {
		this.baseNode.prune();
	}

	getShapesForCollision(boundingBox: OBB, shapeArray: Array<Shape>) {
		this.baseNode.getShapesForCollision(boundingBox, shapeArray);
	}

	getShapesForRayCast(
		ray: Ray,
		shapeArray: Array<Shape>,
		maxDistance: number = Infinity
	) {
		this.baseNode.getShapesForRayCast(ray, shapeArray, maxDistance);
	}

	getDataString() {
		let output = "";
		output += this.minNodeSize + "\n";
		output += this.maxShapesPerNode + "\n";
		output += this.baseNode.print();
		return output;
	}

	parseOct(input: string) {
		delete this.baseNode;

		let rows = input.split("\n");
		this.minNodeSize = parseFloat(rows[0]);
		this.maxShapesPerNode = parseInt(rows[1]);

		let currentNode = this.baseNode;
		let currentSize = 0.0;
		let parentQueue = new Array<TreeNode>();

		for (let i = 3; i < rows.length; i++) {
			let row = rows[i];

			if (row == "{") {
				// Information for child node starts
			} else if (row == "[") {
				// Start of triangles
			} else if (row == "]") {
				// End of triangles
			} else if (row == "}") {
				// Node over, set currentNode to parent
				currentNode = parentQueue.pop();
			} else if (row.startsWith("s")) {
				row = row.substring(1);
				// Size of node
				currentSize = parseFloat(row);
			} else if (row.startsWith("p")) {
				row = row.substring(1);
				// Position of node
				let currentPos = new Vec3(row.split(",").map((n) => parseFloat(n)));

				// The position is the last information needed to create the child node, so we do it
				// and set currentNode to the new child
				if (this.baseNode == undefined) {
					this.baseNode = new TreeNode(currentSize, currentPos);
					currentNode = this.baseNode;
				} else {
					// Add current node to parent queue
					parentQueue.push(currentNode);
					let length = currentNode.children.push(
						new TreeNode(currentSize, currentPos)
					);
					currentNode = currentNode.children[length - 1];
				}
			} else if (row.startsWith("t")) {
				// Triangle
				// t[-3,3,1.5], [-3,3,2.5], [-4,3,1.5]
				row = row.substring(1);
				let points = row.split(", ");
				let tri = new Triangle();

				tri.setVertices(
					new Vec3(
						points[0]
							.substring(1, points[0].length - 1)
							.split(",")
							.map((n) => parseFloat(n))
					),
					new Vec3(
						points[1]
							.substring(1, points[1].length - 1)
							.split(",")
							.map((n) => parseFloat(n))
					),
					new Vec3(
						points[2]
							.substring(1, points[2].length - 1)
							.split(",")
							.map((n) => parseFloat(n))
					)
				);

				currentNode.content.push(tri);
			}
		}
	}
}
