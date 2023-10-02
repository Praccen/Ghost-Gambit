import ECSManager from "../../Engine/ECS/ECSManager";
import GraphicsComponent from "../../Engine/ECS/Components/GraphicsComponent";
import PositionComponent from "../../Engine/ECS/Components/PositionComponent";
import CollisionComponent from "../../Engine/ECS/Components/CollisionComponent";
import BoundingBoxComponent from "../../Engine/ECS/Components/BoundingBoxComponent";
import State, { StatesEnum } from "../../Engine/State";
import Rendering from "../../Engine/Rendering/Rendering";
import { input, options, StateAccessible } from "../GameMachine";
import Button from "../../Engine/GUI/Button";
import MeshCollisionComponent from "../../Engine/ECS/Components/MeshCollisionComponent";
import GraphicsBundle from "../../Engine/Objects/GraphicsBundle";
import Heightmap from "../../Engine/Objects/Heightmap";
import { IntersectionTester } from "../../Engine/Physics/IntersectionTester";
import Ray from "../../Engine/Physics/Shapes/Ray";
import Triangle from "../../Engine/Physics/Shapes/Triangle";
import { OverlayRendering } from "../../Engine/Rendering/OverlayRendering";
import { gl } from "../../main";
import Scene from "../../Engine/Rendering/Scene";
import ObjectPlacer from "../ObjectPlacer";
import { WebUtils } from "../../Engine/Utils/WebUtils";
import ParticleSpawnerComponent from "../../Engine/ECS/Components/ParticleSpawnerComponent";
import Vec3 from "../../Engine/Maths/Vec3";
import PointLightComponent from "../../Engine/ECS/Components/PointLightComponent";
import PlayerCharacter from "../PlayerCharacter";
import { Client } from "../../Engine/Client/Client";
import BotCharacter from "../BotCharacter";

export default class Game extends State {
	rendering: Rendering;
	ecsManager: ECSManager;
	private stateAccessible: StateAccessible;

	private overlayRendering: OverlayRendering;
	private menuButton: Button;
	private mapBundle: GraphicsBundle;
	objectPlacer: ObjectPlacer;

	private scene: Scene;
	private static instance: Game;

	private playerCharacter: PlayerCharacter;

	private botCharacterList: Array<BotCharacter>;
	num_bots: number;

	private allCharacterDict: { player: PlayerCharacter; bots: BotCharacter[] };

	private oWasPressed: boolean;

	client: Client;
	unlockedGraves: boolean;

	public static getInstance(sa: StateAccessible): Game {
		if (!Game.instance) {
			Game.instance = new Game(sa);
		}
		return Game.instance;
	}

	public static getInstanceNoSa(): Game {
		return Game.instance;
	}

	private constructor(sa: StateAccessible) {
		super();
		this.stateAccessible = sa;
		this.objectPlacer = new ObjectPlacer(
			this.stateAccessible.meshStore,
			this.stateAccessible.textureStore
		);
		this.oWasPressed = true;

		this.botCharacterList = [];

		this.allCharacterDict = {
			player: this.playerCharacter,
			bots: this.botCharacterList,
		};
		this.num_bots = 0;
		this.unlockedGraves = false;
	}

	async load() {
		this.scene = new Scene(
			this.stateAccessible.textureStore,
			this.stateAccessible.meshStore
		);
		this.rendering = new Rendering(
			this.stateAccessible.textureStore,
			this.scene
		);
		this.ecsManager = new ECSManager(this.rendering);
		this.overlayRendering = new OverlayRendering(this.rendering.camera);

		this.createMapEntity();

		if (this.client == undefined) {
			this.client = new Client();
		} else {
			// this.client.sendLeave();
		}

		let dirLight = this.scene.getDirectionalLight();
		dirLight.ambientMultiplier = 0.3;
		dirLight.direction.setValues(0.2, -0.4, -0.7);
		dirLight.colour.setValues(0.1, 0.1, 0.4);

		this.playerCharacter = new PlayerCharacter(
			this.rendering,
			this.ecsManager,
			this.stateAccessible.audioPlayer,
			"Ghost Character",
			this.allCharacterDict
		);

		this.allCharacterDict.player = this.playerCharacter;

		this.menuButton = this.overlayRendering.getNewButton();
		this.menuButton.position.x = 0.9;
		this.menuButton.position.y = 0.0;
		this.menuButton.textSize = 40;
		this.menuButton.getInputElement().style.backgroundColor = "transparent";
		this.menuButton.getInputElement().style.borderColor = "transparent";
		this.menuButton.textString = "Menu";

		let self = this;
		this.menuButton.onClick(function () {
			self.gotoState = StatesEnum.MAINMENU;
		});

		this.rendering.setSkybox("Assets/textures/skyboxes/NightSky");

		let fireflies = this.ecsManager.createEntity();
		let nrOfFireflies = 3000;
		let firefliesParticles = this.scene.getNewParticleSpawner(
			"Assets/textures/fire.png",
			nrOfFireflies
		);
		let invertedMatrix = new Matrix4(this.mapBundle.modelMatrix).invert(); // Invert the transform matrix used for the heightmap

		for (let i = 0; i < nrOfFireflies; i++) {
			let tempPos = new Vec3([
				Math.random() * 100.0 - 50.0,
				-5.0,
				Math.random() * 100.0 - 50.0,
			]);
			// Get the height of the heightmap at the corresponding position
			let height = (<Heightmap>(
				this.mapBundle.graphicsObject
			)).getHeightFromWorldPosition(
				this.mapBundle.modelMatrix,
				tempPos,
				invertedMatrix
			);
			tempPos.y = height;
			firefliesParticles.setParticleData(
				i,
				tempPos,
				0.03,
				new Vec3([Math.random() * 0.2 - 0.1, 0.0, Math.random() * 0.2 - 0.1]),
				new Vec3([
					Math.random() * 0.2 - 0.1,
					Math.random() * 0.1,
					Math.random() * 0.2 - 0.1,
				])
			);
		}
		firefliesParticles.sizeChangePerSecond = 0;
		firefliesParticles.fadePerSecond = 0.05;

		let particleComp = new ParticleSpawnerComponent(firefliesParticles);
		particleComp.lifeTime = 10;
		this.ecsManager.addComponent(fireflies, particleComp);

		await this.objectPlacer.load(this.scene, this.ecsManager);

		await this.playerCharacter.init();

		this.botCharacterList.length = 0;
		this.num_bots = 0;

		this.unlockedGraves = false;

		self.gotoState = StatesEnum.PRELOBBY;
	}

	async init() {
		super.init();
		if (this.stateAccessible.restartGame) {
			if (this.menuButton) {
				this.menuButton.remove();
			}
			await this.load();
			this.stateAccessible.restartGame = false;
		}

		this.overlayRendering.show();
		this.rendering.useCrt = options.useCrt;
		this.rendering.useBloom = options.useBloom;
		if (WebUtils.GetCookie("debug") == "true") {
			this.gotoState = StatesEnum.DEBUGMODE;
		}
		this.oWasPressed = true;
		// Activate audio
		this.stateAccessible.audioPlayer.active = true;

		// Play theme music
		this.stateAccessible.audioPlayer.playAudio("theme_1", true);
	}

	reset() {
		super.reset();
		if (this.overlayRendering) {
			this.overlayRendering.hide();
		}
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT);
		input.touchUsed = false;
		input.drawTouchControls();
	}

	onExit(e: BeforeUnloadEvent) {
		this.objectPlacer.onExit(e);
	}

	createMapEntity() {
		let texturePath = "Assets/heightmaps/heightmap.png";
		let texturePathColour = "Assets/textures/HeightmapTexture.png";
		let texturePathSpec = "Assets/textures/black.png";
		let entity = this.ecsManager.createEntity();
		this.mapBundle = this.scene.getNewHeightMap(
			texturePath,
			texturePathColour,
			texturePathSpec
		);

		let heightmap = this.mapBundle.graphicsObject as Heightmap;
		let vertices = heightmap.getVertices();

		for (let i = 0; i < heightmap.xResolution * heightmap.zResolution; i++) {
			if (vertices[i * 8 + 4] > 0.999995) {
				// Set uvs to be mud
				vertices[i * 8 + 6] = 0.25;
			} else {
				// Set uvs to be gravel
				vertices[i * 8 + 6] = 0.75;
			}
		}

		heightmap.setVertexData(vertices);

		this.ecsManager.addComponent(entity, new GraphicsComponent(this.mapBundle));
		let posComp = new PositionComponent();
		posComp.position.setValues(-50.0, -4.0, -50.0);
		posComp.scale.setValues(0.5, 25.0, 0.5);
		this.ecsManager.addComponent(entity, posComp);

		// Collision stuff
		let boundingBoxComp = new BoundingBoxComponent();
		boundingBoxComp.setup(this.mapBundle.graphicsObject);
		boundingBoxComp.updateTransformMatrix(this.mapBundle.modelMatrix);
		this.ecsManager.addComponent(entity, boundingBoxComp);
		let collisionComp = new CollisionComponent();
		collisionComp.isStatic = true;
		this.ecsManager.addComponent(entity, collisionComp);
		let meshColComp = new MeshCollisionComponent(
			this.stateAccessible.meshStore.getOctree(
				"Assets/heightmaps/heightmap.png"
			)
		);
		meshColComp.octree.setModelMatrix(this.mapBundle.modelMatrix);
		this.ecsManager.addComponent(entity, meshColComp);

		// Update the model matrix and mark the octree to be updated
		posComp.calculateMatrix(this.mapBundle.modelMatrix);
		meshColComp.octree.setModelMatrix();
	}

	doRayCast(ray: Ray): number {
		let triangleArray = new Array<Triangle>();
		this.stateAccessible.meshStore
			.getOctree("Assets/heightmaps/heightmap.png")
			.getShapesForRayCast(ray, triangleArray);
		return IntersectionTester.doRayCast(ray, triangleArray);
	}

	async spawnBots() {
		for (let i = 0; i < this.num_bots; i++) {
			let bot = new BotCharacter(
				this.rendering,
				this.ecsManager,
				this.stateAccessible.audioPlayer,
				"Ghost Character",
				this.allCharacterDict,
				i,
				new Vec3([Math.random() * 20, 1.5, Math.random() * 20])
			);
			this.botCharacterList.push(bot);
		}
		for (const bot of this.botCharacterList) {
			await bot.init();
		}
	}

	update(dt: number) {
		// TODO: Fix spectate mode, currently only a black screen
		if (this.playerCharacter.accended) {
			this.gotoState = StatesEnum.SPECTATEMODE;
			console.info("this.gotoState = StatesEnum.SPECTATEMODE;");
		}
		this.playerCharacter.update(dt);
		if (this.playerCharacter.is_lit) {
			this.unlockedGraves = true;
		}

		for (const bot of this.botCharacterList) {
			bot.update(dt);
		}

		if (input.keys["P"]) {
			this.playerCharacter.respawn();
		}

		if (input.keys["O"]) {
			if (!this.oWasPressed) {
				this.gotoState = StatesEnum.DEBUGMODE;
				WebUtils.SetCookie("debug", "true");
			}
			this.oWasPressed = true;
		} else {
			this.oWasPressed = false;
		}

		this.ecsManager.update(dt);
	}

	prepareDraw(dt: number): void {
		this.ecsManager.updateRenderingSystems(dt);
	}

	draw() {
		this.rendering.draw();
		this.overlayRendering.draw();
		input.drawTouchControls();
	}
}
