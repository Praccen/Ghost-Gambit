import { SAT } from "./Engine/Maths/SAT";
import GameMachine from "./Game/GameMachine";
import { createGeometryPass } from "./Engine/ShaderPrograms/DeferredRendering/GeometryPass";
import { createLightingPass } from "./Engine/ShaderPrograms/DeferredRendering/LightingPass";
import { createParticleShaderProgram } from "./Engine/ShaderPrograms/ParticleShaderProgram";
import { createGrassShaderProgram } from "./Engine/ShaderPrograms/GrassShaderProgram";
import { createPhongShaderProgram } from "./Engine/ShaderPrograms/PhongShaderProgram";
import { createBloomBlending } from "./Engine/ShaderPrograms/PostProcessing/BloomBlending";
import { createBloomExtraction } from "./Engine/ShaderPrograms/PostProcessing/BloomExtraction";
import { createCrtShaderProgram } from "./Engine/ShaderPrograms/PostProcessing/CrtShaderProgram";
import { createGaussianBlur } from "./Engine/ShaderPrograms/PostProcessing/GaussianBlur";
import { createScreenQuadShaderProgram } from "./Engine/ShaderPrograms/ScreenQuadShaderProgram";
import { createShadowPass } from "./Engine/ShaderPrograms/ShadowMapping/ShadowPass";
import { createSimpleShaderProgram } from "./Engine/ShaderPrograms/SimpleShaderProgram";
import { createGrassShadowPass } from "./Engine/ShaderPrograms/ShadowMapping/GrassShadowPass";
import { createSkyboxShaderProgram } from "./Engine/ShaderPrograms/Skybox/SkyboxShaderProgram";

SAT.runUnitTests();

// Globals
export let gl: WebGL2RenderingContext;
export let applicationStartTime = Date.now();
export let windowInfo = {
	resolutionWidth: 1920,
	resolutionHeight: 1080,
	paddingX: 0,
	paddingY: 0,
};

function initWebGL(): WebGL2RenderingContext {
	let canvas = <HTMLCanvasElement>document.getElementById("gameCanvas");
	canvas.width = windowInfo.resolutionWidth;
	canvas.height = windowInfo.resolutionHeight;

	let tempGl = canvas.getContext("webgl2", { antialias: false });
	if (!tempGl.getExtension("EXT_color_buffer_float")) {
		alert(
			"Rendering to floating point textures is not supported on this platform"
		);
	}
	if (!tempGl.getExtension("OES_texture_float_linear")) {
		alert("Floating point rendering to FBO textures not supported");
	}

	if (!tempGl) {
		console.log("Failed to get rendering context for WebGL");
		return;
	}

	return tempGl;
}

const heightByWidth = 9 / 16;
const widthByHeight = 16 / 9;
const gameDiv = document.getElementById("gameDiv");

function resize(gl: WebGL2RenderingContext) {
	// Get the dimensions of the viewport
	let innerWindowSize = {
		width: window.innerWidth,
		height: window.innerHeight,
	};

	let newGameHeight;
	let newGameWidth;

	// Determine game size
	if (heightByWidth > innerWindowSize.height / innerWindowSize.width) {
		newGameHeight = innerWindowSize.height;
		newGameWidth = newGameHeight * widthByHeight;
	} else {
		newGameWidth = innerWindowSize.width;
		newGameHeight = newGameWidth * heightByWidth;
	}

	let newGameX = (innerWindowSize.width - newGameWidth) / 2;
	let newGameY = (innerWindowSize.height - newGameHeight) / 2;

	// Center the game by setting the padding of the game
	gameDiv.style.padding = newGameY + "px " + newGameX + "px";

	// Resize game
	gameDiv.style.width = newGameWidth + "px";
	gameDiv.style.height = newGameHeight + "px";
	gl.canvas.width = newGameWidth; // This is not the same as style.width, so it won't be inherited by the css inherit property
	gl.canvas.height = newGameHeight; // This is not the same as style.height, so it won't be inherited by the css inherit property

	// Update the windowInfo resolution
	windowInfo.resolutionWidth = newGameWidth;
	windowInfo.resolutionHeight = newGameHeight;
	windowInfo.paddingX = newGameX;
	windowInfo.paddingY = newGameY;
}

function createShaders() {
	createGeometryPass();
	createLightingPass();
	createBloomBlending();
	createBloomExtraction();
	createCrtShaderProgram();
	createGaussianBlur();
	createShadowPass();
	createGrassShadowPass();
	createParticleShaderProgram();
	createGrassShaderProgram();
	createPhongShaderProgram();
	createScreenQuadShaderProgram();
	createSimpleShaderProgram();
	createSkyboxShaderProgram();
}

let gameMachine: GameMachine;

/* main */
window.onload = async () => {
	"use strict";

	// Set up webgl
	gl = initWebGL();

	// Create all shaders
	createShaders();

	gameMachine = new GameMachine();

	// Resize to fit the current window
	resize(gl);

	// Resize canvas in the future when window is resized
	window.addEventListener("resize", function () {
		resize(gl);
	});

	window.addEventListener("beforeunload", function (e: BeforeUnloadEvent) {
		gameMachine.onExit(e);
	});

	window.addEventListener("contextmenu", function (e: Event) {
		e.preventDefault();
	});

	// Start the state machine
	gameMachine.start();
};
