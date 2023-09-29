import MeshStore from "../Engine/AssetHandling/MeshStore";
import BoundingBoxComponent from "../Engine/ECS/Components/BoundingBoxComponent";
import CollisionComponent from "../Engine/ECS/Components/CollisionComponent";
import {
	Component,
	ComponentTypeEnum,
} from "../Engine/ECS/Components/Component";
import GraphicsComponent from "../Engine/ECS/Components/GraphicsComponent";
import MeshCollisionComponent from "../Engine/ECS/Components/MeshCollisionComponent";
import PositionComponent from "../Engine/ECS/Components/PositionComponent";
import ECSManager from "../Engine/ECS/ECSManager";
import Entity from "../Engine/ECS/Entity";
import Vec3 from "../Engine/Maths/Vec3";
import { IntersectionTester } from "../Engine/Physics/IntersectionTester";
import Ray from "../Engine/Physics/Shapes/Ray";
import Triangle from "../Engine/Physics/Shapes/Triangle";
import Scene from "../Engine/Rendering/Scene";
import { WebUtils } from "../Engine/Utils/WebUtils";
import Game from "./States/Game";

class Placement {
	modelPath: string;
	diffuseTexturePath: string;
	specularTexturePath: string;
	sizeMultiplier: number;
	addCollision: boolean;

	constructor(
		modelPath: string,
		diffuseTexturePath: string,
		specularTexturePath: string,
		addCollision: boolean = true
	) {
		this.modelPath = modelPath;
		this.diffuseTexturePath = diffuseTexturePath;
		this.specularTexturePath = specularTexturePath;
		this.addCollision = addCollision;
	}
}

export default class ObjectPlacer {
	placements: Map<string, Placement>;
	private entityPlacements: Map<number, string>;
	private scene: Scene;
	private ecsManager: ECSManager;
	private meshStore: MeshStore;
	private downloadNeeded: boolean;

	currentlyEditingEntityId: number;

	game: Game;

	constructor(meshStore: MeshStore) {
		this.meshStore = meshStore;
		this.placements = new Map<string, Placement>();
		this.entityPlacements = new Map<number, string>();
		this.downloadNeeded = false;
	}

	async load(scene: Scene, ecsManager: ECSManager) {
		this.scene = scene;
		this.ecsManager = ecsManager;
		this.game = Game.getInstanceNoSa();

		this.placements.clear();
		this.entityPlacements.clear();

		await this.loadFromFile();

		this.downloadNeeded = false;
	}

	private async loadFromFile() {
		// Execute the PlacementList code
		const placementsResponse = await fetch(
			"Assets/placements/PlacementList.js"
		);
		if (placementsResponse.ok) {
			const content = await placementsResponse.text();

			eval(content);
		}

		// Now read all transforms for the placements from Placements.txt
		const response = await fetch("Assets/placements/Placements.txt");
		if (response.ok) {
			const content = await response.text();

			if (content != "") {
				let currentPlacementType = "";
				for (let t of content.split("\n")) {
					t = t.trim();
					if (t == "") {
						break;
					}
					if (t.startsWith("Placement:")) {
						currentPlacementType = t.substring("Placement:".length);
					} else {
						let [p, s, r] = t.split("|");
						this.placeObject(
							currentPlacementType,
							new Vec3(p.split(",").map((n) => parseFloat(n))),
							new Vec3(s.split(",").map((n) => parseFloat(n))),
							new Vec3(r.split(",").map((n) => parseFloat(n)))
						);
					}
				}
			}
		}
	}

	makeCheckpoint() {}

	undo() {}

	getCurrentObjectName(): string {
		if (this.currentlyEditingEntityId == undefined) {
			return "nothing";
		}

		let objectName = this.entityPlacements.get(this.currentlyEditingEntityId);

		if (objectName == undefined) {
			return "unknown";
		}

		return objectName;
	}

	placeObject(
		type: string,
		position: Vec3,
		size: Vec3,
		rotation: Vec3
	): Entity {
		let placement = this.placements.get(type);
		if (placement == undefined) {
			return null;
		}

		// Mark that we have changed something
		this.downloadNeeded = true;

		let entity = this.ecsManager.createEntity();
		this.currentlyEditingEntityId = entity.id;
		this.entityPlacements.set(entity.id, type);

		let mesh = this.scene.getNewMesh(
			placement.modelPath,
			placement.diffuseTexturePath,
			placement.specularTexturePath
		);

		let graComp = new GraphicsComponent(mesh);
		this.ecsManager.addComponent(entity, graComp);
		let posComp = new PositionComponent();
		posComp.position.deepAssign(position);
		posComp.scale.deepAssign(size);
		posComp.rotation.deepAssign(rotation);
		this.ecsManager.addComponent(entity, posComp);

		let boundingBoxComp = new BoundingBoxComponent();
		boundingBoxComp.setup(mesh.graphicsObject);
		boundingBoxComp.updateTransformMatrix(mesh.modelMatrix);
		this.ecsManager.addComponent(entity, boundingBoxComp);

		if (!placement.addCollision) {
			return entity;
		}

		// Collision stuff
		let collisionComp = new CollisionComponent();
		collisionComp.isStatic = true;
		this.ecsManager.addComponent(entity, collisionComp);

		let octree = this.meshStore.getOctree(placement.modelPath, false);
		if (octree == undefined) {
			return entity;
		}
		let meshColComp = new MeshCollisionComponent(octree);
		meshColComp.octree.setModelMatrix(mesh.modelMatrix);
		this.ecsManager.addComponent(entity, meshColComp);
		return entity;
	}

	rayCastToNonSelectedObjects(ray: Ray): number {
		let closest = Infinity;

		for (let e of this.ecsManager.entities) {
			if (e.id == this.currentlyEditingEntityId) {
				continue;
			}

			let bbComp = e.getComponent(
				ComponentTypeEnum.BOUNDINGBOX
			) as BoundingBoxComponent;
			if (bbComp == undefined) {
				continue;
			}

			bbComp.boundingBox.setUpdateNeeded();

			let dist = IntersectionTester.doRayCast(
				ray,
				[bbComp.boundingBox],
				closest
			); // Ray cast against bounding box, only caring about hits closer than the previous closest
			if (dist >= 0 && dist < closest) {
				// Boundingbox is closer than current closest hit
				// Ray cast against mesh if there is one, only caring about hits closer than the previous closest
				let meshColComp = e.getComponent(
					ComponentTypeEnum.MESHCOLLISION
				) as MeshCollisionComponent;
				if (meshColComp != undefined) {
					// TODO: This is ugly but works. Makes sure we have the correct transform matrix in the octree, and in case it was already correct, we force it to update anyways.
					meshColComp.octree.setModelMatrix(
						bbComp.boundingBox.getTransformMatrix()
					);
					meshColComp.octree.setModelMatrix();
					let shapeArray = new Array<Triangle>();
					meshColComp.octree.getShapesForRayCast(ray, shapeArray, closest);
					dist = IntersectionTester.doRayCast(ray, shapeArray, closest);
				}

				if (dist >= 0.0 && dist < closest) {
					// Hit is still closer than current closest
					// Update the closest information and save the object for editing
					closest = dist;
				}
			}
		}
		return closest;
	}

	rayCastToSelectNewObject(ray: Ray) {
		let closest = Infinity;

		for (let e of this.ecsManager.entities) {
			let bbComp = e.getComponent(
				ComponentTypeEnum.BOUNDINGBOX
			) as BoundingBoxComponent;
			if (bbComp == undefined) {
				continue;
			}

			bbComp.boundingBox.setUpdateNeeded();

			let dist = IntersectionTester.doRayCast(
				ray,
				[bbComp.boundingBox],
				closest
			); // Ray cast against bounding box, only caring about hits closer than the previous closest
			if (dist >= 0 && dist < closest) {
				// Boundingbox is closer than current closest hit

				// Ray cast against mesh if there is one, only caring about hits closer than the previous closest
				let meshColComp = e.getComponent(
					ComponentTypeEnum.MESHCOLLISION
				) as MeshCollisionComponent;
				if (meshColComp != undefined) {
					// TODO: This is ugly but works. Makes sure we have the correct transform matrix in the octree, and in case it was already correct, we force it to update anyways.
					meshColComp.octree.setModelMatrix(
						bbComp.boundingBox.getTransformMatrix()
					);
					meshColComp.octree.setModelMatrix();
					let shapeArray = new Array<Triangle>();
					meshColComp.octree.getShapesForRayCast(ray, shapeArray, closest);
					dist = IntersectionTester.doRayCast(ray, shapeArray, closest);
				}

				if (dist >= 0 && dist < closest) {
					// Hit is still closer than current closest
					// Update the closest information and save the object for editing
					closest = dist;
					this.currentlyEditingEntityId = e.id;
				}
			}
		}

		if (closest >= Infinity) {
			this.currentlyEditingEntityId = null;
		}
	}

	selectNewObjectFromEntityId(id: number) {
		this.currentlyEditingEntityId = id;
	}

	updateCurrentlyEditingObject(
		rotationChange: number,
		scaleChange: number,
		newPosition?: Vec3
	) {
		if (this.currentlyEditingEntityId != null) {
			let entity = this.ecsManager.getEntity(this.currentlyEditingEntityId);
			if (entity != undefined) {
				let posComp = entity.getComponent(
					ComponentTypeEnum.POSITIONPARENT
				) as PositionComponent;
				if (posComp == undefined) {
					posComp = entity.getComponent(
						ComponentTypeEnum.POSITION
					) as PositionComponent;
				}

				if (posComp == undefined) {
					return;
				}

				// Mark that we have changed something
				this.downloadNeeded = true;

				posComp.rotation.y += rotationChange;
				posComp.scale.add(new Vec3([scaleChange, scaleChange, scaleChange]));
				if (scaleChange != 0) {
					posComp.scale.x = Math.round(posComp.scale.x * 10000) / 10000;
					posComp.scale.y = Math.round(posComp.scale.y * 10000) / 10000;
					posComp.scale.z = Math.round(posComp.scale.z * 10000) / 10000;
				}
				if (newPosition != undefined) {
					newPosition.x = Math.round(newPosition.x * 100) / 100;
					newPosition.y = Math.round(newPosition.y * 100) / 100;
					newPosition.z = Math.round(newPosition.z * 100) / 100;
					posComp.position.deepAssign(newPosition);
				}

				posComp.updateGui();
			}
		}
	}

	deleteCurrentObject() {
		if (this.currentlyEditingEntityId != undefined) {
			let entity = this.ecsManager.getEntity(this.currentlyEditingEntityId);

			if (entity != undefined) {
				// Remove graphics bundle from scene
				// TODO: Make this automatic when entity is removed
				let graphicsComponent = entity.getComponent(
					ComponentTypeEnum.GRAPHICS
				) as GraphicsComponent;
				if (graphicsComponent != undefined) {
					this.scene.deleteGraphicsBundle(graphicsComponent.object);
				}
			}

			this.ecsManager.removeEntity(this.currentlyEditingEntityId);
			if (this.entityPlacements.delete(this.currentlyEditingEntityId)) {
				// Mark that we have changed something
				this.downloadNeeded = true;
			}
		}

		this.currentlyEditingEntityId = null;
	}

	duplicateCurrentObject() {
		if (this.currentlyEditingEntityId != undefined) {
			let entityPlacement = this.entityPlacements.get(
				this.currentlyEditingEntityId
			);
			if (entityPlacement == undefined) {
				return;
			}

			let entity = this.ecsManager.getEntity(this.currentlyEditingEntityId);

			if (entity == undefined) {
				return;
			}

			let posComp: PositionComponent = <PositionComponent>(
				entity.getComponent(ComponentTypeEnum.POSITIONPARENT)
			);

			if (posComp == undefined) {
				posComp = <PositionComponent>(
					entity.getComponent(ComponentTypeEnum.POSITION)
				);
			}

			if (posComp == undefined) {
				return;
			}

			this.placeObject(
				entityPlacement,
				new Vec3(posComp.position).add([0.0, 5.0, 0.0]),
				new Vec3(posComp.scale),
				new Vec3(posComp.rotation)
			);
		}
	}

	downloadTransforms() {
		let transformsData = "";

		for (let [placementString, placement] of this.placements) {
			transformsData += "Placement:" + placementString + "\n";
			for (let ep of this.entityPlacements) {
				if (ep[1] == placementString) {
					let entity = this.ecsManager.getEntity(ep[0]);
					if (entity != undefined) {
						let posComp: PositionComponent = <PositionComponent>(
							entity.getComponent(ComponentTypeEnum.POSITIONPARENT)
						);
						if (posComp == undefined) {
							posComp = <PositionComponent>(
								entity.getComponent(ComponentTypeEnum.POSITION)
							);
						}

						if (posComp != undefined) {
							transformsData +=
								posComp.position +
								"|" +
								posComp.scale +
								"|" +
								posComp.rotation +
								"\n";
						}
					}
				}
			}
		}

		WebUtils.DownloadFile("Placements.txt", transformsData);
		this.downloadNeeded = false;
	}

	onExit(e: BeforeUnloadEvent) {
		if (this.downloadNeeded) {
			e.preventDefault();
			e.returnValue = "";
			this.downloadTransforms();
			return;
		}

		delete e["returnValue"];
	}
}
