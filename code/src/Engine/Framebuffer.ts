import { gl } from "../main";
import Texture from "./Textures/Texture";

export default class Framebuffer {
	// Public
	textures: Array<Texture>;
	depthTexture: Texture;

	// Private
	protected rbo: WebGLRenderbuffer;
	protected fbo: WebGLFramebuffer;
	protected width: number;
	protected height: number;

	/**
	 *
	 * @param width - width of framebuffer textures
	 * @param height - height of framebuffer textures
	 * @param textures - colour attachment textures, send empty array if no colour attachments should be used
	 * @param depthTexture - depth attachment texture, send null if no depth attachment (an rbo will be created instead)
	 */
	constructor(
		width: number,
		height: number,
		textures: Array<Texture>,
		depthTexture: Texture
	) {
		this.width = width;
		this.height = height;

		this.textures = textures;
		this.depthTexture = depthTexture;

		this.fbo = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);

		this.setupAttachments();

		if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE) {
			console.warn("ERROR::FRAMEBUFFER:: Framebuffer is not complete!");
		}

		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	}

	protected setupAttachments() {
		let attachments = new Array<any>();
		for (let i = 0; i < this.textures.length; i++) {
			this.textures[i].setTextureData(null, this.width, this.height);
			this.textures[i].setTexParameterI(gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			this.textures[i].setTexParameterI(gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			this.textures[i].setTexParameterI(gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			this.textures[i].setTexParameterI(gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.framebufferTexture2D(
				gl.FRAMEBUFFER,
				gl.COLOR_ATTACHMENT0 + i,
				gl.TEXTURE_2D,
				this.textures[i].texture,
				0
			);
			attachments.push(gl.COLOR_ATTACHMENT0 + i);
		}

		gl.drawBuffers(attachments);

		// More choices here would be good, not only texture or renderbuffer
		if (this.depthTexture != undefined) {
			this.depthTexture.setTextureData(null, this.width, this.height);

			gl.framebufferTexture2D(
				gl.FRAMEBUFFER,
				gl.DEPTH_ATTACHMENT,
				gl.TEXTURE_2D,
				this.depthTexture.texture,
				0
			);
		} else {
			this.rbo = gl.createRenderbuffer();
			gl.bindRenderbuffer(gl.RENDERBUFFER, this.rbo);
			gl.renderbufferStorage(
				gl.RENDERBUFFER,
				gl.DEPTH_STENCIL,
				this.width,
				this.height
			);

			gl.framebufferRenderbuffer(
				gl.FRAMEBUFFER,
				gl.DEPTH_STENCIL_ATTACHMENT,
				gl.RENDERBUFFER,
				this.rbo
			);
		}
	}

	setProportions(width: number, height: number) {
		this.width = width;
		this.height = height;
		for (let texture of this.textures) {
			texture.setTextureData(null, this.width, this.height);
		}
		if (this.depthTexture) {
			this.depthTexture.setTextureData(null, this.width, this.height);
		}

		if (this.rbo) {
			gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
			gl.bindRenderbuffer(gl.RENDERBUFFER, this.rbo);
			gl.renderbufferStorage(
				gl.RENDERBUFFER,
				gl.DEPTH24_STENCIL8,
				width,
				height
			);
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		}
	}

	bind(target: number) {
		gl.bindFramebuffer(target, this.fbo);
	}
}
