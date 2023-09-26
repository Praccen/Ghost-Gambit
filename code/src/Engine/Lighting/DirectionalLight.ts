import { gl } from "../../main";
import Vec3 from "../Maths/Vec3";
import ShaderProgram from "../ShaderPrograms/ShaderProgram";

export default class DirectionalLight {
	direction: Vec3;
	colour: Vec3;
	ambientMultiplier: number;

	lightProjectionBoxSideLength: number;

	private gl: WebGL2RenderingContext;
	private shaderProgram: ShaderProgram;

	constructor(gl: WebGL2RenderingContext, shaderProgram: ShaderProgram) {
		gl = gl;
		this.shaderProgram = shaderProgram;

		this.direction = new Vec3([0.0, -1.0, -0.5]);
		this.colour = new Vec3([0.2, 0.2, 0.2]);
		this.ambientMultiplier = 0.1;
		this.lightProjectionBoxSideLength = 50.0;
	}

	bind() {
		gl.uniform3fv(
			this.shaderProgram.getUniformLocation("directionalLight.direction")[0],
			this.direction.normalize()
		);
		gl.uniform3fv(
			this.shaderProgram.getUniformLocation("directionalLight.colour")[0],
			this.colour
		);
		gl.uniform1f(
			this.shaderProgram.getUniformLocation(
				"directionalLight.ambientMultiplier"
			)[0],
			this.ambientMultiplier
		);
	}

	calcAndSendLightSpaceMatrix(
		focusPos: Vec3,
		offset: number,
		uniformLocation: WebGLUniformLocation
	) {
		let cameraPos = new Vec3(focusPos);
		let offsetVec = new Vec3(this.direction).normalize().multiply(offset);
		let lightSpaceMatrix = new Matrix4(null).setOrtho(
			-this.lightProjectionBoxSideLength,
			this.lightProjectionBoxSideLength,
			-this.lightProjectionBoxSideLength,
			this.lightProjectionBoxSideLength,
			0.1,
			offset * 2.0
		); // Start by setting it to projection
		cameraPos.subtract(offsetVec);
		let lightView = new Matrix4(null).setLookAt(
			cameraPos.x,
			cameraPos.y,
			cameraPos.z,
			focusPos.x,
			focusPos.y,
			focusPos.z,
			0.0,
			1.0,
			0.0
		); // This will make it impossible to have exactly straight down shadows, but I'm fine with that
		lightSpaceMatrix = lightSpaceMatrix.concat(lightView); // Multiply with view
		gl.uniformMatrix4fv(uniformLocation, false, lightSpaceMatrix.elements);
	}
}
