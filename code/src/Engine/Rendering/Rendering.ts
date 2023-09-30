import { gl, windowInfo } from "../../main";
import { options } from "../../Game/GameMachine";
import Framebuffer from "../Framebuffer";
import Texture from "../Textures/Texture";
import TextureStore from "../AssetHandling/TextureStore";
import Camera from "../Camera";
import Scene from "./Scene";
import ShadowRenderPass from "./RenderPasses/ShadowRenderPass";
import CRTRenderPass from "./RenderPasses/CRTRenderPass";
import BloomRenderPass from "./RenderPasses/BloomRenderPass";
import SkyboxRenderPass from "./RenderPasses/SkyboxRenderPass";
import GeometryRenderPass from "./RenderPasses/GeometryRenderPass";
import LightingRenderPass from "./RenderPasses/LightingRenderPass";
import ParticleRenderPass from "./RenderPasses/ParticleRenderPass";
import FinishedOutputRenderPass from "./RenderPasses/FinishedOutputRenderPass";

export default class Rendering {
	// public
	camera: Camera;
	clearColour: { r: number; g: number; b: number; a: number };

	// ---- Post processing toggles ----
	useCrt: boolean;
	useBloom: boolean;
	// ---------------------------------

	// private
	private textureStore: TextureStore;
	private resolutionWidth: number;
	private resolutionHeight: number;

	// ---- Particles ----
	private particleFramebuffer: Framebuffer;
	private particleRenderPass: ParticleRenderPass;
	// -------------------

	// ---- Shadows ----
	private shadowRenderPass: ShadowRenderPass;
	// -----------------

	// ---- Deferred rendering ----
	private geometryRenderPass: GeometryRenderPass;
	private lightingRenderPass: LightingRenderPass;
	// ----------------------------

	// ---- Skybox ----
	private useSkybox: boolean;
	private skyboxRenderPass: SkyboxRenderPass;
	// ----------------

	// ---- Post processing ----
	// Crt effect
	private crtFramebuffer: Framebuffer;
	private crtRenderPass: CRTRenderPass;

	// Bloom
	private bloomExtractionInputFramebuffer: Framebuffer;
	private bloomRenderPass: BloomRenderPass;
	// -------------------------

	// Finished output
	private finishedFramebuffer: Framebuffer;
	private finishedOutputRenderPass: FinishedOutputRenderPass;

	private scene: Scene;

	constructor(textureStore: TextureStore, scene: Scene) {
		this.textureStore = textureStore;
		this.scene = scene;

		this.shadowRenderPass = new ShadowRenderPass();

		this.camera = new Camera(gl);
		this.resolutionWidth = windowInfo.resolutionWidth;
		this.resolutionHeight = windowInfo.resolutionHeight;

		// ---- Deferred rendering ----
		this.geometryRenderPass = new GeometryRenderPass();

		let textureArray = new Array<Texture>();
		for (
			let i = 0;
			i < this.geometryRenderPass.outputFramebuffer.textures.length;
			i++
		) {
			textureArray.push(this.geometryRenderPass.outputFramebuffer.textures[i]);
		}
		textureArray.push(this.shadowRenderPass.shadowBuffer.depthTexture);
		this.lightingRenderPass = new LightingRenderPass(textureArray);
		// ----------------------------

		// ---- Particles ----
		this.particleFramebuffer = new Framebuffer(
			this.resolutionWidth,
			this.resolutionHeight,
			[new Texture(false), new Texture(false, gl.R32F, gl.RED, gl.FLOAT)],
			null
		);
		this.particleRenderPass = new ParticleRenderPass(
			this.particleFramebuffer.textures
		);
		// -------------------

		// ---- Skybox ----
		this.useSkybox = false;
		this.skyboxRenderPass = new SkyboxRenderPass();
		// ----------------

		// ---- Post processing ----
		// Crt effect
		this.useCrt = options.useCrt;
		this.crtFramebuffer = new Framebuffer(
			this.resolutionWidth,
			this.resolutionHeight,
			[new Texture(false)],
			null
		);

		this.crtRenderPass = new CRTRenderPass(this.crtFramebuffer.textures);

		// Bloom
		this.bloomExtractionInputFramebuffer = new Framebuffer(
			windowInfo.resolutionWidth,
			windowInfo.resolutionHeight,
			[new Texture(false)],
			null
		);
		this.bloomRenderPass = new BloomRenderPass(
			this.bloomExtractionInputFramebuffer.textures
		);
		this.useBloom = options.useBloom;
		// -------------------------¨

		this.finishedFramebuffer = new Framebuffer(
			windowInfo.resolutionWidth,
			windowInfo.resolutionHeight,
			[new Texture(false)],
			null
		);

		this.finishedOutputRenderPass = new FinishedOutputRenderPass(
			this.finishedFramebuffer.textures
		);

		this.initGL();
	}

	initGL() {
		this.clearColour = { r: 0.15, g: 0.1, b: 0.1, a: 1.0 };
		gl.clearColor(
			this.clearColour.r,
			this.clearColour.g,
			this.clearColour.b,
			this.clearColour.a
		);

		// Enable depth test
		gl.enable(gl.DEPTH_TEST);

		//Enable alpha blending
		// gl.enable(gl.BLEND);
		// gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		gl.disable(gl.BLEND);

		// Disable faceculling
		gl.cullFace(gl.BACK);
		gl.disable(gl.CULL_FACE);
	}

	reportCanvasResize(x: number, y: number) {
		this.resolutionWidth = x;
		this.resolutionHeight = y;
		this.geometryRenderPass.setResolution(x, y);
		this.particleFramebuffer.setProportions(x, y);
		this.crtFramebuffer.setProportions(x, y);
		this.finishedFramebuffer.setProportions(x, y);

		this.bloomExtractionInputFramebuffer.setProportions(x, y);
		this.bloomRenderPass.setResolution(x, y);
	}

	setSkybox(path: string) {
		this.skyboxRenderPass.setSkybox(this.textureStore.getCubeMap(path));
		this.useSkybox = true;
	}

	draw() {
		if (
			this.resolutionWidth != windowInfo.resolutionWidth ||
			this.resolutionHeight != windowInfo.resolutionHeight
		) {
			this.reportCanvasResize(
				windowInfo.resolutionWidth,
				windowInfo.resolutionHeight
			);
		}

		gl.enable(gl.DEPTH_TEST);

		// ---- Shadow pass ----
		this.shadowRenderPass.draw(this.scene, this.camera);
		// ---------------------

		// ---- Geometry pass ----
		this.geometryRenderPass.draw(this.scene, this.camera);
		// -----------------------

		// Geometry pass over, start rendering to the particle framebuffer
		this.particleFramebuffer.bind(gl.DRAW_FRAMEBUFFER);

		// Clear the output with the actual clear colour we have set
		gl.clearColor(
			this.clearColour.r,
			this.clearColour.g,
			this.clearColour.b,
			this.clearColour.a
		);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);

		// ---- Lighting pass ----
		this.lightingRenderPass.draw(this.scene, this.camera);
		// -----------------------

		// Copy the depth buffer information from the gBuffer to the current depth buffer
		this.geometryRenderPass.outputFramebuffer.bind(gl.READ_FRAMEBUFFER);
		gl.blitFramebuffer(
			0,
			0,
			this.resolutionWidth,
			this.resolutionHeight,
			0,
			0,
			this.resolutionWidth,
			this.resolutionHeight,
			gl.DEPTH_BUFFER_BIT,
			gl.NEAREST
		);

		// ---- Skybox ----
		if (this.useSkybox) {
			this.skyboxRenderPass.draw(this.camera);
		}
		// ----------------

		// Setup appropriate post processing framebuffer (or to finished directly)
		if (this.useBloom) {
			this.particleRenderPass.outputBuffer =
				this.bloomExtractionInputFramebuffer;
		} else if (this.useCrt) {
			this.particleRenderPass.outputBuffer = this.crtFramebuffer;
		} else {
			this.particleRenderPass.outputBuffer = this.finishedFramebuffer;
		}

		// ---- Particles ----
		this.particleRenderPass.draw(this.scene, this.camera);
		// -------------------

		// ---- Post processing ----
		if (this.useBloom) {
			if (this.useCrt) {
				this.bloomRenderPass.outputFramebuffer = this.crtFramebuffer;
			} else {
				this.bloomRenderPass.outputFramebuffer = null;
			}
			this.bloomRenderPass.draw();
		}

		if (this.useCrt) {
			this.crtRenderPass.draw();
		}
		// -------------------------

		if (!this.useCrt && !this.useBloom) {
			this.finishedOutputRenderPass.draw();
		}
	}
}
