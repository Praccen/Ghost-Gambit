import { ComponentTypeEnum } from "../../../Engine/ECS/Components/Component";
import ParticleSpawnerComponent from "../../../Engine/ECS/Components/ParticleSpawnerComponent";
import System from "../../../Engine/ECS/Systems/System";
import Game from "../../States/Game";
import GravestoneComponent from "../Components/GravestoneComponent";

export default class GravestoneSystem extends System {
	constructor() {
		super([ComponentTypeEnum.GRAVESTONE]);
	}

	update(dt: number) {
		for (let e of this.entities) {
			let gravestoneComponent = e.getComponent(
				ComponentTypeEnum.GRAVESTONE
			) as GravestoneComponent;
			if (gravestoneComponent.graveStoneEntity == undefined) {
				continue;
			}

			let particleSpawnerComponent =
				gravestoneComponent.graveStoneEntity.getComponent(
					ComponentTypeEnum.PARTICLESPAWNER
				) as ParticleSpawnerComponent;
			if (particleSpawnerComponent != undefined) {
				if (
					gravestoneComponent.claimed ||
					!Game.getInstanceNoSa().unlockedGraves
				) {
					particleSpawnerComponent.particleSpawner.fadePerSecond = 100000.0;
				} else if (Game.getInstanceNoSa().unlockedGraves) {
					particleSpawnerComponent.particleSpawner.fadePerSecond = 0.5;
				}
			}
		}
	}
}
