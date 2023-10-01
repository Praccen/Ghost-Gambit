import Vec3 from "../../Maths/Vec3";
import ParticleSpawner from "../../Objects/ParticleSpawner";
import { Component, ComponentTypeEnum } from "./Component";

export default class ParticleSpawnerComponent extends Component {
	lifeTime: number;
	resetTimer: number;
	particleSpawner: ParticleSpawner;
	offset: Vec3;

	constructor(particleSpawner: ParticleSpawner) {
		super(ComponentTypeEnum.PARTICLESPAWNER);

		this.lifeTime = 1.0;
		this.resetTimer = 0.0;
		this.particleSpawner = particleSpawner;
		this.offset = new Vec3();
	}
}
