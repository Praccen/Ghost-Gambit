import { applicationStartTime, gl } from "../../../main";
import Camera from "../../Camera";
import Scene from "../Scene";
import { particleShaderProgram } from "../../ShaderPrograms/ParticleShaderProgram";

export default class ParticleRenderPass {
	constructor() {}

	draw(scene: Scene, camera: Camera) {
		if (scene.particleSpawners.length > 0) {
			// only do this if there are any particle spawners

			particleShaderProgram.use();
			camera.bindViewProjMatrix(
				particleShaderProgram.getUniformLocation("viewProjMatrix")[0]
			);
			gl.uniform3fv(
				particleShaderProgram.getUniformLocation("cameraPos")[0],
				camera.getPosition()
			);
			gl.uniform1f(
				particleShaderProgram.getUniformLocation("currentTime")[0],
				(Date.now() - applicationStartTime) * 0.001
			);
			for (const particleSpawner of scene.particleSpawners.values()) {
				particleSpawner.draw();
			}
		}
	}
}
