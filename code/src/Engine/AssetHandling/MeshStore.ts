import Vec2 from "../Maths/Vec2";
import Vec3 from "../Maths/Vec3";
import Triangle from "../Physics/Shapes/Triangle";
import { geometryPass } from "../ShaderPrograms/DeferredRendering/GeometryPass";
import Heightmap from "../Objects/Heightmap";
import Mesh from "../Objects/Mesh";
import Octree from "../Objects/Octree";
import { WebUtils } from "../Utils/WebUtils";

export default class MeshStore {
	private meshMap: Map<string, Mesh>;
	private heightmapMap: Map<string, Heightmap>;
	private octreeMap: Map<
		string,
		{ octree: Octree; triangles: Array<Triangle> }
	>;

	constructor() {
		this.meshMap = new Map<string, Mesh>();
		this.heightmapMap = new Map<string, Heightmap>();
		this.octreeMap = new Map<
			string,
			{ octree: Octree; triangles: Array<Triangle> }
		>();
	}

	getMesh(path: string, printWarnings: boolean = true): Mesh {
		let mesh = this.meshMap.get(path);
		if (mesh) {
			return mesh;
		}

		if (printWarnings) {
			console.warn("Trying to get mesh " + path + " before loading it");
		}
		return null;
	}

	async loadMesh(path: string): Promise<Mesh> {
		let mesh = this.meshMap.get(path);
		if (mesh) {
			return mesh;
		}

		let newVertices = await this.parseObjContent(path);
		this.meshMap.set(path, new Mesh(geometryPass, newVertices));

		return this.meshMap.get(path);
	}

	getHeightmap(path: string, printWarnings: boolean = true): Heightmap {
		let heightmap = this.heightmapMap.get(path);
		if (heightmap) {
			return heightmap;
		}

		if (printWarnings) {
			console.warn("Trying to get heightmap " + path + " before loading it");
		}
		return null;
	}

	async loadHeightmap(
		path: string,
		useTextureSizeForResolution: boolean = true,
		x: number = 2,
		y: number = 2,
		sizePerX: number = 1.0,
		sizePerY: number = 1.0
	): Promise<Heightmap> {
		let heightmap = this.heightmapMap.get(path);
		if (heightmap) {
			return heightmap;
		}

		let newHeightmap = new Heightmap(geometryPass);
		if (!useTextureSizeForResolution) {
			newHeightmap.createPlane(x, y, sizePerX, sizePerY);
		}
		await newHeightmap.readHeightDataFromTexture(
			path,
			useTextureSizeForResolution
		);
		this.heightmapMap.set(path, newHeightmap);

		return newHeightmap;
	}

	getOctree(path: string, printWarnings: boolean = true): Octree {
		let octree = this.octreeMap.get(path);
		if (octree && octree.triangles.length == 0) {
			return octree.octree;
		}

		if (printWarnings) {
			console.warn("Trying to get octree " + path + " before loading it");
		}
		return null;
	}

	async loadOctree(
		path: string,
		smallestOctreeNodeSizeMultiplicator: number,
		maxShapesPerOctreeNode: number,
		timeLimit: number = Infinity
	): Promise<{ octree: Octree; doneLoading: boolean }> {
		let startTime = Date.now();

		let octree = this.octreeMap.get(path);
		if (octree && octree.triangles.length == 0) {
			return { octree: octree.octree, doneLoading: true };
		}

		if (octree == undefined) {
			// Immediately make it defined, but with no content, to only do the initialization once
			this.octreeMap.set(path, {
				octree: null,
				triangles: null,
			});

			octree = this.octreeMap.get(path);

			let triangles = new Array<Triangle>();
			if (path.endsWith(".obj")) {
				let mesh = this.getMesh(path, false);
				if (!mesh) {
					console.warn(
						"Trying to get octree for " + path + " before loading " + path
					);
					return null;
				}

				mesh.setupTriangles(triangles);
			} else {
				let heightmap = this.getHeightmap(path, false);
				if (!heightmap) {
					console.warn(
						"Trying to get octree for " + path + " before loading " + path
					);
					return null;
				}

				heightmap.setupTriangles(triangles);
			}

			octree.triangles = triangles;

			let octPath =
				"Assets/octrees/" + path.split("/").pop().split(".")[0] + ".oct";
			const response = await fetch(octPath);
			if (response.ok) {
				console.log("Loaded octree from " + octPath);
				const octContent = await response.text();

				octree.octree = new Octree(
					new Vec3(),
					new Vec3(),
					smallestOctreeNodeSizeMultiplicator,
					maxShapesPerOctreeNode
				);
				octree.octree.parseOct(octContent);
				octree.triangles.length = 0;
			} else {
				console.log(
					"Did not find an octree to load from " +
						octPath +
						". Generating it from scratch."
				);
				let minVec = new Vec3([Infinity, Infinity, Infinity]);
				let maxVec = new Vec3([-Infinity, -Infinity, -Infinity]);
				for (let tri of triangles) {
					for (let vertex of tri.getTransformedVertices()) {
						maxVec.max(vertex);
						minVec.min(vertex);
					}
				}

				octree.octree = new Octree(
					minVec,
					maxVec,
					smallestOctreeNodeSizeMultiplicator,
					maxShapesPerOctreeNode
				);
			}
		}

		while (
			octree.octree != undefined &&
			octree.triangles != undefined &&
			octree.triangles.length > 0 &&
			Date.now() - startTime < timeLimit
		) {
			octree.octree.addShape(octree.triangles.pop());
		}

		if (octree.triangles != undefined && octree.triangles.length == 0) {
			octree.octree.prune();

			// console.groupCollapsed("octree for " + path);
			// octree.octree.print();
			// console.groupEnd();
		}

		return {
			octree: octree.octree,
			doneLoading:
				octree.triangles != undefined && octree.triangles.length == 0,
		};
	}

	downloadOctrees() {
		for (let octree of this.octreeMap) {
			let data = octree[1].octree.getDataString();
			WebUtils.DownloadFile(
				octree[0].split("/").pop().split(".")[0] + ".oct",
				data
			);
		}
	}

	private async parseObjContent(meshPath: string): Promise<Float32Array> {
		/*
		https://webglfundamentals.org/webgl/lessons/webgl-load-obj.html
		*/

		const response = await fetch(meshPath);
		const objContent = await response.text();

		const lines = objContent.split("\n");
		let vertexPositions = new Array<Vec3>();
		let vertexTexCoords = new Array<Vec2>();
		let vertexNormals = new Array<Vec3>();
		let vertices = new Array<{
			posIndex: number;
			texCoordIndex: number;
			normalIndex: number;
		}>();
		for (let line of lines) {
			line = line.trim();

			if (line.startsWith("vt")) {
				// Texture coordinates
				const coords = line.split(/\s+/).filter((element) => {
					return element != "vt";
				});
				vertexTexCoords.push(
					new Vec2([parseFloat(coords[0]), parseFloat(coords[1])])
				);
			} else if (line.startsWith("vn")) {
				// Normal
				const coords = line.split(/\s+/).filter((element) => {
					return element != "vn";
				});
				vertexNormals.push(
					new Vec3([
						parseFloat(coords[0]),
						parseFloat(coords[1]),
						parseFloat(coords[2]),
					])
				);
			} else if (line.startsWith("v")) {
				// Position
				const coords = line.split(/\s+/).filter((element) => {
					return element != "v";
				});
				vertexPositions.push(
					new Vec3([
						parseFloat(coords[0]),
						parseFloat(coords[1]),
						parseFloat(coords[2]),
					])
				);
			} else if (line.startsWith("f")) {
				// Faces
				const coords = line.split(/\s+/).filter((element) => {
					return element != "f";
				});
				for (let i = 0; i < coords.length - 2; i++) {
					for (let j = 0; j < 3; j++) {
						let index = j == 0 ? 0 : i + j; // 0 if j is zero, otherwize i +j
						const indices = coords[index].split("/");

						const last = vertices.push({
							posIndex: NaN,
							texCoordIndex: NaN,
							normalIndex: NaN,
						});
						if (indices.length > 0) {
							vertices[last - 1].posIndex = parseInt(indices[0]) - 1;
						}

						if (indices.length > 1) {
							vertices[last - 1].texCoordIndex = parseInt(indices[1]) - 1; // Can be empty, texCoordIndex will then be NaN
						}

						if (indices.length > 2) {
							vertices[last - 1].normalIndex = parseInt(indices[2]) - 1;
						}
					}
				}
			} else if (line.startsWith("#")) {
				// A comment, ignore
			} else if (line.length > 0) {
				// Unhandled keywords
				// console.warn("OBJ loader: Unhandled keyword " + line.split(/\s+/)[0]);
			}
		}

		let returnArr = new Float32Array(vertices.length * 8); // 3 * pos + 3 * norm + 2 * tx

		for (let i = 0; i < vertices.length; i++) {
			if (!isNaN(vertices[i].posIndex)) {
				returnArr[i * 8] = vertexPositions[vertices[i].posIndex].x;
				returnArr[i * 8 + 1] = vertexPositions[vertices[i].posIndex].y;
				returnArr[i * 8 + 2] = vertexPositions[vertices[i].posIndex].z;
			} else {
				returnArr[i * 8] = 0.0;
				returnArr[i * 8 + 1] = 0.0;
				returnArr[i * 8 + 2] = 0.0;
			}

			if (!isNaN(vertices[i].normalIndex)) {
				returnArr[i * 8 + 3] = vertexNormals[vertices[i].normalIndex].x;
				returnArr[i * 8 + 4] = vertexNormals[vertices[i].normalIndex].y;
				returnArr[i * 8 + 5] = vertexNormals[vertices[i].normalIndex].z;
			} else {
				returnArr[i * 8 + 3] = 1.0;
				returnArr[i * 8 + 4] = 0.0;
				returnArr[i * 8 + 5] = 0.0;
			}

			if (!isNaN(vertices[i].texCoordIndex)) {
				returnArr[i * 8 + 6] = vertexTexCoords[vertices[i].texCoordIndex].x;
				returnArr[i * 8 + 7] = vertexTexCoords[vertices[i].texCoordIndex].y;
			} else {
				returnArr[i * 8 + 6] = 0.0;
				returnArr[i * 8 + 7] = 0.0;
			}
		}
		return returnArr;
	}
}
