import { gl } from "../../main";
import Vec3 from "../Maths/Vec3";
import ShaderProgram from "../ShaderPrograms/ShaderProgram";

export default class PointLight {
	position: Vec3;
	colour: Vec3;

	constant: number;
	linear: number;
	quadratic: number;
	// private radius: number; // TODO: implement light volumes

	private gl: WebGL2RenderingContext;
	private shaderProgram: ShaderProgram;

	constructor(gl: WebGL2RenderingContext, shaderProgram: ShaderProgram) {
		gl = gl;
		this.shaderProgram = shaderProgram;

		this.position = new Vec3([0.0, 0.0, 0.0]);
		this.colour = new Vec3([1.0, 1.0, 1.0]);

		this.constant = 1.0;
		this.linear = 0.07;
		this.quadratic = 0.017;
		// this.radius = (-this.linear + Math.sqrt(this.linear * this.linear - 4.0 * this.quadratic * (this.constant - (256.0 / 5.0)))) / (2.0 * this.quadratic);
	}

	bind(lightIndex: number) {
		let ul = this.shaderProgram.getUniformLocation(
			"pointLights[" + lightIndex + "].position"
		);
		if (ul[1]) {
			gl.uniform3fv(ul[0], this.position);
		}
		ul = this.shaderProgram.getUniformLocation(
			"pointLights[" + lightIndex + "].colour"
		);
		if (ul[1]) {
			gl.uniform3fv(ul[0], this.colour);
		}

		ul = this.shaderProgram.getUniformLocation(
			"pointLights[" + lightIndex + "].constant"
		);
		if (ul[1]) {
			gl.uniform1f(ul[0], this.constant);
		}
		ul = this.shaderProgram.getUniformLocation(
			"pointLights[" + lightIndex + "].linear"
		);
		if (ul[1]) {
			gl.uniform1f(ul[0], this.linear);
		}
		ul = this.shaderProgram.getUniformLocation(
			"pointLights[" + lightIndex + "].quadratic"
		);
		if (ul[1]) {
			gl.uniform1f(ul[0], this.quadratic);
		}
	}
}
