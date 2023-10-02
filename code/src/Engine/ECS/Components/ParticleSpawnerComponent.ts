import ObjectPlacer from "../../../Game/ObjectPlacer";
import Div from "../../GUI/Div";
import Vec3 from "../../Maths/Vec3";
import ParticleSpawner from "../../Objects/ParticleSpawner";
import { OverlayRendering } from "../../Rendering/OverlayRendering";
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

	addToGui(
		overlayRendering: OverlayRendering,
		parentDiv: Div,
		objectPlacer: ObjectPlacer
	) {
		let addTextEdit = (label: string, vec: Vec3, index: number) => {
			let propEditText = overlayRendering.getNewEditText(parentDiv);
			propEditText.textString = label;
			propEditText.textSize = 20;
			propEditText.scaleWithWindow = true;
			propEditText.getInputElement().value = vec[index].toString();
			propEditText.onChange((ev) => {
				vec[index] = parseFloat(propEditText.getInputElement().value);
			});
			objectPlacer.makeCheckpoint();
		};

		addTextEdit("OffsetX", this.offset, 0);
		addTextEdit("OffsetY", this.offset, 1);
		addTextEdit("OffsetZ", this.offset, 2);
	}

	destructor(): void {
		this.particleSpawner.setNumParticles(0);
	}
}
