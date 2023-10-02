import Vec3 from "../Engine/Maths/Vec3";

class AStarNode {
	public position: Vec3;
	public g: number; // Cost from start node to this node
	public h: number; // Heuristic (estimated cost from this node to goal)
	public f: number; // Total cost (g + h)
	public parent: AStarNode | null;

	constructor(
		position: Vec3,
		g: number,
		h: number,
		parent: AStarNode | null = null
	) {
		this.position = position;
		this.g = g;
		this.h = h;
		this.f = g + h;
		this.parent = parent;
	}
}

class AStar {
	static findPath(start: Vec3, goal: Vec3): Vec3 {
		const openSet: AStarNode[] = [];
		const closedSet: AStarNode[] = [];

		const startNode = new AStarNode(
			start,
			0,
			this.calculateHeuristic(start, goal)
		);
		openSet.push(startNode);

		while (openSet.length > 0) {
			// Find the node with the lowest f value in the open set
			const currentNode = this.getMinFNode(openSet);

			// Move the current node from open set to closed set
			openSet.splice(openSet.indexOf(currentNode), 1);
			closedSet.push(currentNode);

			// Check if the current node is the goal
			if (currentNode.position.equals(goal)) {
				return this.reconstructPath(currentNode);
			}

			// Get neighbors of the current node
			const neighbors = this.getNeighbors(currentNode, goal);

			for (const neighbor of neighbors) {
				// Skip if neighbor is in closed set
				if (closedSet.some((node) => node.position.equals(neighbor.position))) {
					continue;
				}

				// Calculate tentative g value
				const tentativeG =
					currentNode.g + currentNode.position.distanceTo(neighbor.position);

				// If neighbor is not in open set or tentative g is less than neighbor's g value
				if (
					!openSet.some((node) => node.position.equals(neighbor.position)) ||
					tentativeG < neighbor.g
				) {
					// Update neighbor
					neighbor.g = tentativeG;
					neighbor.h = this.calculateHeuristic(neighbor.position, goal);
					neighbor.f = neighbor.g + neighbor.h;
					neighbor.parent = currentNode;

					// Add neighbor to open set if not already in it
					if (
						!openSet.some((node) => node.position.equals(neighbor.position))
					) {
						openSet.push(neighbor);
					}
				}
			}
		}

		// No path found
		return new Vec3();
	}

	private static calculateHeuristic(position: Vec3, goal: Vec3): number {
		// Simple Euclidean distance can be used as a heuristic for the XZ plane
		return position.distanceTo(goal);
	}

	private static getMinFNode(nodes: AStarNode[]): AStarNode {
		return nodes.reduce(
			(minNode, node) => (node.f < minNode.f ? node : minNode),
			nodes[0]
		);
	}

	private static getNeighbors(node: AStarNode, goal: Vec3): AStarNode[] {
		// For simplicity, consider neighboring positions as adjacent positions
		const neighbors: AStarNode[] = [];

		// Example: Assuming only four directions (up, down, left, right)
		const directions = [
			new Vec3([0, 0, 1]), // Right
			new Vec3([0, 0, -1]), // Left
			new Vec3([1, 0, 0]), // Up
			new Vec3([-1, 0, 0]), // Down
		];

		for (const dir of directions) {
			const neighborPosition = node.position.clone().add(dir);
			const neighborNode = new AStarNode(
				neighborPosition,
				node.g + node.position.distanceTo(neighborPosition),
				this.calculateHeuristic(neighborPosition, goal),
				node
			);
			neighbors.push(neighborNode);
		}

		return neighbors;
	}

	private static reconstructPath(node: AStarNode): Vec3 {
		const path: Vec3 = new Vec3();
		let currentNode: AStarNode | null = node;

		while (currentNode !== null) {
			path.unshift(
				currentNode.position[0],
				currentNode.position[1],
				currentNode.position[2]
			);
			currentNode = currentNode.parent;
		}

		return path;
	}
}

export default AStar;
