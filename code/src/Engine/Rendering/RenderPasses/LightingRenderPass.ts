import { gl } from "../../../main";
import Camera from "../../Camera";
import Framebuffer from "../../Framebuffer";
import ScreenQuad from "../../Objects/ScreenQuad";
import { lightingPass } from "../../ShaderPrograms/DeferredRendering/LightingPass";
import Texture from "../../Textures/Texture";
import Scene from "../Scene";

export default class LightingRenderPass {
	private screenQuad: ScreenQuad;

	outputFramebuffer: Framebuffer;

	constructor(inputTextures: Texture[]) {
		this.screenQuad = new ScreenQuad(lightingPass, inputTextures);
	}

	setResolution(x: number, y: number) {
		this.outputFramebuffer.setProportions(x, y);
	}

	draw(scene: Scene, camera: Camera) {
		// Disable depth testing for screen quad(s) rendering
		gl.disable(gl.DEPTH_TEST);

		// ---- Lighting pass ----
		lightingPass.use();

		gl.uniform3fv(
			lightingPass.getUniformLocation("camPos")[0],
			camera.getPosition()
		);
		scene.directionalLight.bind();
		scene.directionalLight.calcAndSendLightSpaceMatrix(
			camera.getPosition(),
			20.0,
			lightingPass.getUniformLocation("lightSpaceMatrix")[0]
		);
		// Point lights
		gl.uniform1i(
			lightingPass.getUniformLocation("nrOfPointLights")[0],
			scene.pointLights.length
		);
		for (let i = 0; i < scene.pointLights.length; i++) {
			scene.pointLights[i].bind(i);
		}

		this.screenQuad.draw(true);
		// -----------------------

		// Enable depth test again
		gl.enable(gl.DEPTH_TEST);
	}
}
