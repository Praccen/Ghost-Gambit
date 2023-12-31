import GraphicsObject from "./GraphicsObject";
import Texture from "../Textures/Texture";
import ShaderProgram from "../ShaderPrograms/ShaderProgram";
import Triangle from "../Physics/Shapes/Triangle";
import Vec3 from "../Maths/Vec3";
import { gl } from "../../main";

export default class PhongQuad extends GraphicsObject {
	// Private
	private vertices: Float32Array;
	private indices: Int32Array;

	constructor(shaderProgram: ShaderProgram) {
		super(shaderProgram);

		// prettier-ignore
		this.vertices = new Float32Array([ 
            // positions        // normals         // uv
            -0.5,  0.5,  0.0,   0.0, 0.0, 1.0,     0.0, 1.0,
            -0.5, -0.5,  0.0,   0.0, 0.0, 1.0,     0.0, 0.0,
             0.5, -0.5,  0.0,   0.0, 0.0, 1.0,     1.0, 0.0,
             0.5,  0.5,  0.0,   0.0, 0.0, 1.0,     1.0, 1.0,
        ]);

		// prettier-ignore
		this.indices = new Int32Array([
            0, 1, 2,
            0, 2, 3,
        ]);
		this.setVertexData(this.vertices);
		this.setIndexData(this.indices);
	}

	setupTriangles(triangles: Array<Triangle>) {
		triangles.length = 0; // Clear triangles
		for (let i = 0; i < this.indices.length; i += 3) {
			// Go through the vertices
			// Save the positions as shapes in the input array
			const length = triangles.push(new Triangle());
			triangles[length - 1].setVertices(
				new Vec3([
					this.vertices[this.indices[i] * 8],
					this.vertices[this.indices[i] * 8 + 1],
					this.vertices[this.indices[i] * 8 + 2],
				]),
				new Vec3([
					this.vertices[this.indices[i + 1] * 8],
					this.vertices[this.indices[i + 1] * 8 + 1],
					this.vertices[this.indices[i + 1] * 8 + 2],
				]),
				new Vec3([
					this.vertices[this.indices[i + 2] * 8],
					this.vertices[this.indices[i + 2] * 8 + 1],
					this.vertices[this.indices[i + 2] * 8 + 2],
				])
			);
		}
	}

	getVertexPositions(): Array<Vec3> {
		let returnArr = new Array<Vec3>();
		for (let i = 0; i < this.vertices.length; i += 8) {
			returnArr.push(
				new Vec3([this.vertices[i], this.vertices[i + 1], this.vertices[i + 2]])
			);
		}
		return returnArr;
	}

	draw() {
		this.bindVAO();
		gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_INT, 0);
	}
}
