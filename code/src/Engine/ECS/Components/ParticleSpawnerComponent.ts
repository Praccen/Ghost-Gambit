import ParticleSpawner from "../../Objects/ParticleSpawner";
import { Component, ComponentTypeEnum } from "./Component";

export default class ParticleSpawnerComponent extends Component {
	lifeTime: number;
	resetTimer: number;
	particleSpawner: ParticleSpawner;

	constructor(particleSpawner: ParticleSpawner) {
		super(ComponentTypeEnum.PARTICLESPAWNER);

		this.lifeTime = 1.0;
		this.resetTimer = 0.0;
		this.particleSpawner = particleSpawner;
	}
}
