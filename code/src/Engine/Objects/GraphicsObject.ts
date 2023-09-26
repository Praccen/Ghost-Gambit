import { gl } from "../../main";
import Vec3 from "../Maths/Vec3";
import Triangle from "../Physics/Shapes/Triangle";
import ShaderProgram from "../ShaderPrograms/ShaderProgram";

export default class GraphicsObject {
	shaderProgram: ShaderProgram;

	// Private
	private VAO: WebGLVertexArrayObject;
	private VBO: WebGLBuffer;
	private EBO: WebGLBuffer;

	constructor(shaderProgram: ShaderProgram) {
		this.shaderProgram = shaderProgram;

		this.VAO = null;
		this.VBO = null;
		this.EBO = null; // Optional

		this.init();
	}

	init() {
		// Create buffers
		this.VAO = gl.createVertexArray();
		this.VBO = gl.createBuffer();
		this.EBO = gl.createBuffer();

		// Bind buffers
		gl.bindVertexArray(this.VAO);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.VBO);

		this.shaderProgram.setupVertexAttributePointers();

		gl.bindVertexArray(null);
	}

	// changeShaderProgram(shaderProgram) {
	// 	this.shaderProgram = shaderProgram;
	// }

	bindVAO() {
		gl.bindVertexArray(this.VAO);
	}

	unbindVAO() {
		gl.bindVertexArray(null);
	}

	setVertexData(data: Float32Array) {
		gl.bindVertexArray(this.VAO);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.VBO);
		gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
		gl.bindVertexArray(null);
	}

	setIndexData(data: Int32Array) {
		gl.bindVertexArray(this.VAO);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.EBO);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);

		gl.bindVertexArray(null);
	}

	setupTriangles(triangles: Array<Triangle>) {}

	getVertexPositions(): Array<Vec3> {
		return null;
	}

	draw() {
		// Can this be virtual?
	}
}
