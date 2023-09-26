import { gl } from "../../main";

export default class Texture {
	// Public
	width: number;
	height: number;
	texture: WebGLTexture;

	loadedFromFile: boolean;

	protected useMipMap: boolean;

	protected internalFormat: number;
	protected format: number;
	protected dataStorageType: number;
	protected textureTarget: number;

	constructor(
		useMipMap: boolean = true,
		internalFormat: number = gl.RGBA,
		format: number = gl.RGBA,
		dataStorageType: number = gl.UNSIGNED_BYTE,
		textureTarget: number = gl.TEXTURE_2D
	) {
		// this.missingTextureData = new Uint8Array([
		//     255, 255, 255, 255, 0, 0, 0, 255,
		//     0, 0, 0, 255, 255, 255, 255, 255
		// ]);

		this.useMipMap = useMipMap;

		this.internalFormat = internalFormat;
		this.format = format;
		this.dataStorageType = dataStorageType;
		this.textureTarget = textureTarget;

		// Generate texture
		this.texture = gl.createTexture();
		gl.bindTexture(this.textureTarget, this.texture);

		// Set texture parameters
		gl.texParameteri(this.textureTarget, gl.TEXTURE_WRAP_S, gl.REPEAT);
		gl.texParameteri(this.textureTarget, gl.TEXTURE_WRAP_T, gl.REPEAT);
		gl.texParameteri(this.textureTarget, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(this.textureTarget, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

		// Make a 1 by 1 empty texture
		this.setTextureData(null, 1, 1);

		gl.bindTexture(this.textureTarget, null);
	}

	setTextureData(data: Uint8Array, width: number, height: number) {
		this.width = width;
		this.height = height;
		gl.bindTexture(this.textureTarget, this.texture);
		gl.texImage2D(
			this.textureTarget,
			0,
			this.internalFormat,
			width,
			height,
			0,
			this.format,
			this.dataStorageType,
			data
		);
		if (this.useMipMap) {
			gl.generateMipmap(this.textureTarget);
			gl.texParameteri(
				this.textureTarget,
				gl.TEXTURE_MIN_FILTER,
				gl.LINEAR_MIPMAP_LINEAR
			);
		}
		gl.bindTexture(this.textureTarget, null);

		this.loadedFromFile = false;
	}

	bind(textureIndex: number = 0) {
		gl.activeTexture(gl.TEXTURE0 + textureIndex);
		gl.bindTexture(this.textureTarget, this.texture);
	}

	loadFromFile(URL: string) {
		let image = new Image();
		image.crossOrigin = "";
		image.src = URL;
		let self = this;
		image.addEventListener("load", function () {
			// Now that the image has loaded copy it to the texture and save the width/height.
			self.width = image.width;
			self.height = image.height;
			gl.bindTexture(self.textureTarget, self.texture);
			gl.texImage2D(
				self.textureTarget,
				0,
				self.internalFormat,
				self.format,
				self.dataStorageType,
				image
			);
			if (self.useMipMap) {
				gl.generateMipmap(self.textureTarget);
				gl.texParameteri(
					self.textureTarget,
					gl.TEXTURE_MIN_FILTER,
					gl.LINEAR_MIPMAP_LINEAR
				);
			}
			self.loadedFromFile = true;
		});
	}

	setTexParameterI(a: number, b: number) {
		gl.bindTexture(this.textureTarget, this.texture);
		gl.texParameteri(this.textureTarget, a, b);
		gl.bindTexture(this.textureTarget, null);
	}
}

// Texture::~Texture() {
// 	glDeleteTextures(1, &m_texture);
// }
