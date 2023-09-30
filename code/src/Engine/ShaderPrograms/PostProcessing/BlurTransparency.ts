import ShaderProgram from "../ShaderProgram";
import { screenQuadVertexSrc } from "../ScreenQuadShaderProgram";
import { gl } from "../../../main";

const blurTransparencyFragmentSrc: string = `#version 300 es
precision highp float;

out vec4 fragColor;
  
in vec2 texCoords;

uniform sampler2D image;
uniform sampler2D mask;

float weight[5] = float[] (0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216);

void main()
{             
    vec2 texOffset = vec2(1.0 / float(textureSize(image, 0).x), 1.0 / float(textureSize(image, 0).y)); // gets size of single texel
    vec3 noBlurResult = texture(image, texCoords).rgb;
    vec3 blurResult;
    int useBlur = 0;
    
    blurResult = texture(image, texCoords).rgb * weight[0]; // current fragment's contribution
    for(int i = 1; i < 5; ++i)
    {
        vec2 xPlusCoord = texCoords + vec2(texOffset.x * float(i), 0.0);
        if (texture(mask, xPlusCoord).r > 0.0) {
            useBlur = 1;
        } 
        blurResult += texture(image, xPlusCoord).rgb * weight[i] * 0.5;

        vec2 xMinusCoord = texCoords - vec2(texOffset.x * float(i), 0.0);
        if (texture(mask, xMinusCoord).r > 0.0) {
            useBlur = 1;
        } 

        blurResult += texture(image, xMinusCoord).rgb * weight[i] * 0.5;
    }

    for(int i = 1; i < 5; ++i)
    {
        vec2 yPlusCoord = texCoords + vec2(0.0, texOffset.y * float(i));
        if (texture(mask, yPlusCoord).r > 0.0) {
            useBlur = 1;
        } 
        blurResult += texture(image, yPlusCoord).rgb * weight[i] * 0.5;

        vec2 yMinusCoord = texCoords - vec2(0.0, texOffset.y * float(i));
        if (texture(mask, yMinusCoord).r > 0.0) {
            useBlur = 1;
        } 
        blurResult += texture(image, yMinusCoord).rgb * weight[i] * 0.5;
    }

    vec3 result;
    if (useBlur == 1) {
        result = blurResult;
    } else {
        result = noBlurResult;
    }
    
    fragColor = vec4(result, 1.0);
}`;

class BlurTransparency extends ShaderProgram {
	constructor() {
		super("BlurTransparency", screenQuadVertexSrc, blurTransparencyFragmentSrc);

		this.use();

		this.setUniformLocation("image");
		this.setUniformLocation("mask");

		gl.uniform1i(this.getUniformLocation("image")[0], 0);
		gl.uniform1i(this.getUniformLocation("mask")[0], 1);
	}

	setupVertexAttributePointers(): void {
		// Change if input layout changes in shaders
		const stride = 4 * 4;
		gl.vertexAttribPointer(0, 2, gl.FLOAT, false, stride, 0);
		gl.enableVertexAttribArray(0);

		gl.vertexAttribPointer(1, 2, gl.FLOAT, false, stride, 2 * 4);
		gl.enableVertexAttribArray(1);
	}
}

export let blurTransparency = null;

export let createBlurTransparency = function () {
	blurTransparency = new BlurTransparency();
};
