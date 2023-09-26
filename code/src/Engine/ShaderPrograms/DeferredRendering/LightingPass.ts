import ShaderProgram from "../ShaderProgram";
import { screenQuadVertexSrc } from "../ScreenQuadShaderProgram";
import { gl } from "../../../main";

export let pointLightsToAllocate: number = 100;

const lightingFragmentShaderSrc: string =
	`#version 300 es
precision highp float;

in vec2 texCoords;

out vec4 final_colour;

uniform sampler2D gPositionEmission;
uniform sampler2D gNormal;
uniform sampler2D gColourSpec;
uniform sampler2D depthMap;

struct PointLight {
	vec3 position;
	vec3 colour;

	float constant;
	float linear;
	float quadratic;
};

struct DirectionalLight {
	vec3 direction;
	vec3 colour;
	float ambientMultiplier;
};

#define NR_POINT_LIGHTS ` +
	pointLightsToAllocate +
	`

uniform DirectionalLight directionalLight;
uniform PointLight pointLights[NR_POINT_LIGHTS];
uniform int nrOfPointLights;
uniform vec3 camPos; //Used for specular lighting
uniform mat4 lightSpaceMatrix; // Used for shadow fragment position

vec3 CalcDirectionalLight(DirectionalLight light, vec3 normal, vec3 cameraDir, vec3 diffuse, float specular, float shininess, vec4 lightSpaceFragPos);
vec3 CalcPointLight(PointLight light, vec3 normal, vec3 fragPos, vec3 cameraDir, vec3 diffuse, float specular, float shininess);
float CalcShadow(vec4 lightSpaceFragPos, vec3 normal);

void main() {
	// Discard fragment if normal alpha is 0
	vec4 fragNormalWithAlpha = texture(gNormal, texCoords);
	if (fragNormalWithAlpha.a <= 0.0001) {
		discard;
	}
	
	vec3 fragPos = texture(gPositionEmission, texCoords).rgb;
	vec3 fragNormal = fragNormalWithAlpha.rgb;
	float shininess = 32.0f;
	vec3 diffuse = texture(gColourSpec, texCoords).rgb;
	float specular = texture(gColourSpec, texCoords).a;
	float emission = texture(gPositionEmission, texCoords).a;
	vec4 lightSpaceFragPos = (lightSpaceMatrix * vec4(fragPos, 1.0f));
	
	vec3 cameraDir = normalize(camPos - fragPos); //Direction vector from fragment to camera
	
	// vec3 result = fragNormal;
	// vec3 result = diffuse;
	// vec3 result = vec3(specular, specular, specular);
    vec3 result = vec3(0.0f);
	result += CalcDirectionalLight(directionalLight, fragNormal, cameraDir, diffuse, specular, shininess, lightSpaceFragPos);
	
	for (int i = 0; i < nrOfPointLights; i++) {
		result += CalcPointLight(pointLights[i], fragNormal, fragPos, cameraDir, diffuse, specular, shininess);
	}

	final_colour = vec4(result * (1.0 - emission) + diffuse * emission, 1.0f); // Set colour of fragment. Since we use screen door transparency, do not use alpha value
}

// Calculates the colour when using a directional light
vec3 CalcDirectionalLight(DirectionalLight light, vec3 normal, vec3 cameraDir, vec3 diffuse, float specular, float shininess, vec4 lightSpaceFragPos) {
	vec3 lightDir = normalize(-light.direction); //light direction from the fragment position

	// Diffuse shading
	float diff = max(dot(normal, lightDir), 0.0);

	// Specular shading
	vec3 reflectDir = reflect(-lightDir, normal);
	float spec = pow(max(dot(cameraDir, reflectDir), 0.0), shininess);

	// Combine results	
	vec3 ambient = diffuse * light.ambientMultiplier; //Ambient lighting
	vec3 finalDiffuse = light.colour * diff * diffuse;
	vec3 finalSpecular = light.colour * spec * specular;
	
	float shadow = CalcShadow(lightSpaceFragPos, normal);
	vec3 lighting = (ambient + (1.0f - shadow) * (finalDiffuse + finalSpecular));
	return lighting;
}

// Calculates the colour when using a point light.
vec3 CalcPointLight(PointLight light, vec3 normal, vec3 fragPos, vec3 cameraDir, vec3 diffuse, float specular, float shininess) {
	vec3 lighting;
	vec3 lightDir = normalize(light.position - fragPos); //light direction from the fragment position

	// Diffuse shading
	float diff = max(dot(normal, lightDir), 0.0);

	// Specular shading
	vec3 reflectDir = reflect(-lightDir, normal);
	float spec = pow(max(dot(cameraDir, reflectDir), 0.0), shininess);

	// Attenuation
	float distance = length(light.position - fragPos);
	float attenuation = 1.0f / (light.constant + light.linear * distance + light.quadratic * (distance * distance));
	
	// Combine results
	vec3 finalDiffuse = light.colour * diff * diffuse;
	vec3 finalSpecular = light.colour * spec * specular;
	finalDiffuse *= attenuation;
	finalSpecular *= attenuation;
	lighting = finalDiffuse + finalSpecular;
	//lighting = finalSpecular;
	return lighting;
}

float CalcShadow(vec4 lightSpaceFragPos, vec3 normal) {
	// perform perspective divide
    vec3 projCoords = lightSpaceFragPos.xyz / lightSpaceFragPos.w;

    // transform to [0,1] range
    projCoords = projCoords * 0.5 + 0.5;

	if (projCoords.z > 1.0) {
		return 0.0;
	}

    // get closest depth value from light's perspective (using [0,1] range fragPosLight as coords)
    float closestDepth = texture(depthMap, projCoords.xy).r; 

    // get depth of current fragment from light's perspective
    float currentDepth = projCoords.z;

    // check whether current frag pos is in shadow
	// float bias = 0.001;
	float bias = max(0.002 * (1.0 - dot(normal, directionalLight.direction)), 0.002);
	
	float shadow = 0.0;
	ivec2 textureSize = textureSize(depthMap, 0);
	vec2 texelSize = vec2(1.0 / float(textureSize.x), 1.0 / float(textureSize.y));
	for(int x = -1; x <= 1; ++x)
	{
		for(int y = -1; y <= 1; ++y)
		{
			float pcfDepth = texture(depthMap, projCoords.xy + vec2(x, y) * texelSize).r; 
			shadow += currentDepth - bias > pcfDepth ? 1.0 : 0.0;        
		}    
	}
	shadow = shadow / 9.0;

    return shadow;
}`;

class LightingPass extends ShaderProgram {
	constructor() {
		super("LightingPass", screenQuadVertexSrc, lightingFragmentShaderSrc);

		this.use();

		this.setUniformLocation("gPositionEmission");
		this.setUniformLocation("gNormal");
		this.setUniformLocation("gColourSpec");
		this.setUniformLocation("depthMap");

		gl.uniform1i(this.getUniformLocation("gPositionEmission")[0], 0);
		gl.uniform1i(this.getUniformLocation("gNormal")[0], 1);
		gl.uniform1i(this.getUniformLocation("gColourSpec")[0], 2);
		gl.uniform1i(this.getUniformLocation("depthMap")[0], 3);

		for (let i = 0; i < pointLightsToAllocate; i++) {
			this.setUniformLocation("pointLights[" + i + "].position");
			this.setUniformLocation("pointLights[" + i + "].colour");

			this.setUniformLocation("pointLights[" + i + "].constant");
			this.setUniformLocation("pointLights[" + i + "].linear");
			this.setUniformLocation("pointLights[" + i + "].quadratic");
		}

		this.setUniformLocation("directionalLight.direction");
		this.setUniformLocation("directionalLight.colour");
		this.setUniformLocation("directionalLight.ambientMultiplier");
		this.setUniformLocation("nrOfPointLights");
		this.setUniformLocation("camPos");
		this.setUniformLocation("lightSpaceMatrix");
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

export let lightingPass = null;

export let createLightingPass = function () {
	lightingPass = new LightingPass();
};
