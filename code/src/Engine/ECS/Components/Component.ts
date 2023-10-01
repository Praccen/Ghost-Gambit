import ObjectPlacer from "../../../Game/ObjectPlacer";
import Div from "../../GUI/Div";
import { OverlayRendering } from "../../Rendering/OverlayRendering";

export enum ComponentTypeEnum {
	BOUNDINGBOX,
	CAMERAFOCUS,
	COLLISION,
	GRAPHICS,
	MESHCOLLISION,
	MOVEMENT,
	PARTICLESPAWNER,
	POINTLIGHT,
	POSITION,
	POSITIONPARENT,
	DELIVERYZONE,

	// Game logic component types
	VICINITYTRIGGER,
	SENTIENT,
	CANDLE
}

export class Component {
	private _type: ComponentTypeEnum;

	constructor(type: ComponentTypeEnum) {
		this._type = type;
	}

	destructor(): void {}

	get type(): ComponentTypeEnum {
		return this._type;
	}

	addToGui(
		overlayRendering: OverlayRendering,
		parentDiv: Div,
		objectPlacer: ObjectPlacer
	) {}
}
