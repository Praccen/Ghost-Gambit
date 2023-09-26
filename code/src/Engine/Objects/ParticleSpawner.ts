import { applicationStartTime, gl } from "../../main";

import GraphicsObject from "./GraphicsObject";
import Texture from "../Textures/Texture";
import Vec3 from "../Maths/Vec3";
import ShaderProgram from "../ShaderPrograms/ShaderProgram";

export default class ParticleSpawner extends GraphicsObject {
	texture: Texture;
	fadePerSecond: number;
	sizeChangePerSecond: number;

	// Private
	private numParticles: number;
	private vertices: Float32Array;
	private indices: Int32Array;
	private instanceVBO: WebGLBuffer;

	constructor(
		shaderProgram: ShaderProgram,
		texture: Texture,
		numberOfStartingParticles: number = 0
	) {
		super(shaderProgram);

		this.texture = texture;

		this.bindVAO();
		this.instanceVBO = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceVBO);
		gl.bufferData(
			gl.ARRAY_BUFFER,
			numberOfStartingParticles * 11 * 4,
			gl.DYNAMIC_DRAW
		);
		shaderProgram.setupInstancedVertexAttributePointers();
		this.unbindVAO();

		// prettier-ignore
		this.vertices = new Float32Array([ 
            // positions  // uv
            -0.5,  0.5,   0.0, 1.0,
            -0.5, -0.5,   0.0, 0.0,
             0.5, -0.5,   1.0, 0.0,
             0.5,  0.5,   1.0, 1.0,
        ]);

		// prettier-ignore
		this.indices = new Int32Array([
            0, 1, 2,
            0, 2, 3,
        ]);
		this.setVertexData(this.vertices);
		this.setIndexData(this.indices);

		// All starting particles are initialized as size and position 0, so they wont be visable unless manually changed
		this.numParticles = numberOfStartingParticles;

		this.fadePerSecond = 0.0;
		this.sizeChangePerSecond = 1.0;
	}

	setNumParticles(amount: number) {
		this.numParticles = amount;

		this.bindVAO();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceVBO);
		gl.bufferData(gl.ARRAY_BUFFER, this.numParticles * 11 * 4, gl.DYNAMIC_DRAW);
		this.unbindVAO();
	}

	getNumberOfParticles(): number {
		return this.numParticles;
	}

	setParticleData(
		particleIndex: number,
		startPosition: Vec3,
		size: number,
		startVel: Vec3,
		acceleration: Vec3
	): boolean {
		if (particleIndex > this.numParticles) {
			return false;
		}

		let data = new Float32Array([
			startPosition.x,
			startPosition.y,
			startPosition.z,
			size,
			startVel.x,
			startVel.y,
			startVel.z,
			(Date.now() - applicationStartTime) * 0.001,
			acceleration.x,
			acceleration.y,
			acceleration.z,
		]);

		this.bufferSubDataUpdate(particleIndex * 11, data);

		return true;
	}

	setParticleStartPosition(particleIndex: number, position: Vec3): boolean {
		if (particleIndex > this.numParticles) {
			return false;
		}
		this.bufferSubDataUpdate(particleIndex * 11, new Float32Array(position));
		return true;
	}

	setParticleSize(particleIndex: number, size: number): boolean {
		if (particleIndex > this.numParticles) {
			return false;
		}
		this.bufferSubDataUpdate(particleIndex * 11 + 3, new Float32Array([size]));
		return true;
	}

	setParticleStartVelocity(particleIndex: number, vel: Vec3): boolean {
		if (particleIndex > this.numParticles) {
			return false;
		}
		this.bufferSubDataUpdate(particleIndex * 11 + 4, new Float32Array(vel));
		return true;
	}

	setParticleStartTime(particleIndex: number, time: number): boolean {
		if (particleIndex > this.numParticles) {
			return false;
		}
		this.bufferSubDataUpdate(particleIndex * 11 + 7, new Float32Array([time]));
		return true;
	}

	resetParticleStartTime(particleIndex: number): boolean {
		if (particleIndex > this.numParticles) {
			return false;
		}
		this.bufferSubDataUpdate(
			particleIndex * 11 + 7,
			new Float32Array([(Date.now() - applicationStartTime) * 0.001])
		);
		return true;
	}

	setParticleAcceleration(particleIndex: number, acc: Vec3): boolean {
		if (particleIndex > this.numParticles) {
			return false;
		}
		this.bufferSubDataUpdate(particleIndex * 11 + 8, new Float32Array(acc));
		return true;
	}

	private bufferSubDataUpdate(start: number, data: Float32Array): boolean {
		if (start > this.numParticles * 11) {
			return false;
		}
		this.bindVAO();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceVBO);
		gl.bufferSubData(gl.ARRAY_BUFFER, start * 4, data);
		this.unbindVAO();
		return true;
	}

	draw() {
		this.bindVAO();

		this.texture.bind(0);
		gl.uniform1f(
			this.shaderProgram.getUniformLocation("fadePerSecond")[0],
			this.fadePerSecond
		);
		gl.uniform1f(
			this.shaderProgram.getUniformLocation("sizeChangePerSecond")[0],
			this.sizeChangePerSecond
		);

		gl.drawElementsInstanced(
			gl.TRIANGLES,
			6,
			gl.UNSIGNED_INT,
			0,
			this.getNumberOfParticles()
		);
		this.unbindVAO();
	}
}
