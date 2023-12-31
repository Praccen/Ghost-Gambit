import { gl } from "../../../main";
import ShaderProgram from "../ShaderProgram";

const geometryVertexShaderSrc: string = `#version 300 es
// If inputs change, also update GeometryPass::setupVertexAttributePointers to match
layout (location = 0) in vec3 inPosition;
layout (location = 1) in vec3 inNormal;
layout (location = 2) in vec2 inTexCoords;

// If uniforms change, also update PhongShaderProgram to match
uniform mat4 modelMatrix;
uniform mat4 viewProjMatrix;
uniform mat4 textureMatrix;

out vec3 fragPos;
out vec3 fragNormal;
out vec2 texCoords;

void main() {
    vec4 worldPos = modelMatrix * vec4(inPosition, 1.0);
	texCoords = vec2(textureMatrix * vec4(inTexCoords, 0.0, 1.0));

	// Calculate normal matrix, should be done on CPU but I can't be bothered with implementing inverse of a matrix and don't want to find a good lib atm
	mat3 normalMatrix = mat3(modelMatrix);
	normalMatrix = inverse(normalMatrix);
	normalMatrix = transpose(normalMatrix);

	fragNormal = normalize(normalMatrix * inNormal);
	fragPos = worldPos.xyz;

    gl_Position = viewProjMatrix * worldPos;
}`;

export const geometryFragmentShaderSrc: string = `#version 300 es
precision highp float;

in vec3 fragPos;
in vec3 fragNormal;
in vec2 texCoords;

layout (location = 0) out vec4 gPositionEmission;
layout (location = 1) out vec4 gNormal;
layout (location = 2) out vec4 gColourSpec;

struct Material {
	sampler2D diffuse;
	sampler2D specular;
	sampler2D emission;
};

uniform Material material;
uniform vec3 emissionColor;

mat4 thresholdMatrix = mat4(
	1.0, 9.0, 3.0, 11.0,
	13.0, 5.0, 15.0, 7.0,
	4.0, 12.0, 2.0, 10.0,
	16.0, 8.0, 14.0, 6.0
	);

void main() {
	float opacity = texture(material.diffuse, texCoords).a;

	float threshold = thresholdMatrix[int(floor(mod(gl_FragCoord.x, 4.0)))][int(floor(mod(gl_FragCoord.y, 4.0)))] / 17.0;
    if (threshold >= opacity) {
        discard;
    }

	float emissionValue = texture(material.emission, texCoords).r;
	
	gColourSpec.rgb = texture(material.diffuse, texCoords).rgb;
	if ((emissionColor.r > 0.0 || emissionColor.g > 0.0 || emissionColor.b > 0.0) && emissionValue > 0.0) {
		gColourSpec.rgb = emissionColor;
	}
    gColourSpec.a = texture(material.specular, texCoords).r;
	
	gPositionEmission.rgb = fragPos;
	gPositionEmission.a = emissionValue;
	gNormal = vec4(fragNormal, 1.0);
}`;

class GeometryPass extends ShaderProgram {
	constructor() {
		super("GeometryPass", geometryVertexShaderSrc, geometryFragmentShaderSrc);

		this.use();

		this.setUniformLocation("modelMatrix");
		this.setUniformLocation("viewProjMatrix");
		this.setUniformLocation("textureMatrix");

		this.setUniformLocation("material.diffuse");
		this.setUniformLocation("material.specular");
		this.setUniformLocation("material.emission");

		this.setUniformLocation("emissionColor");

		gl.uniform1i(this.getUniformLocation("material.diffuse")[0], 0);
		gl.uniform1i(this.getUniformLocation("material.specular")[0], 1);
		gl.uniform1i(this.getUniformLocation("material.emission")[0], 2);
	}

	setupVertexAttributePointers(): void {
		// Change if input layout changes in shaders
		const stride = 8 * 4;
		gl.vertexAttribPointer(0, 3, gl.FLOAT, false, stride, 0);
		gl.enableVertexAttribArray(0);

		gl.vertexAttribPointer(1, 3, gl.FLOAT, false, stride, 3 * 4);
		gl.enableVertexAttribArray(1);

		gl.vertexAttribPointer(2, 2, gl.FLOAT, false, stride, 6 * 4);
		gl.enableVertexAttribArray(2);
	}
}

export let geometryPass = null;

export let createGeometryPass = function () {
	geometryPass = new GeometryPass();
};
