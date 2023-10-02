import { ComponentTypeEnum } from "../ECS/Components/Component";
import PositionComponent from "../ECS/Components/PositionComponent";
import PositionParentComponent from "../ECS/Components/PositionParentComponent";
import Entity from "../ECS/Entity";
import Vec3 from "../Maths/Vec3";

export module ECSUtils {
	export function CalculatePosition(entity: Entity): Vec3 {
		let posComp = <PositionComponent>(
			entity.getComponent(ComponentTypeEnum.POSITION)
		);
		let posParentComp = <PositionParentComponent>(
			entity.getComponent(ComponentTypeEnum.POSITIONPARENT)
		);

		let tempMatrix = new Matrix4(null);
		if (posComp == undefined) {
			if (posParentComp == undefined) {
				return null;
			}

			posParentComp.calculateMatrix(tempMatrix);
		} else {
			if (posParentComp != undefined) {
				posParentComp.calculateMatrix(tempMatrix);
			}
			posComp.calculateMatrix(tempMatrix);
		}

		let posVector = tempMatrix.multiplyVector4(new Vector4([0, 0, 0, 1]));
		let pos = new Vec3().setValues(
			posVector.elements[0],
			posVector.elements[1],
			posVector.elements[2]
		);
		return pos;
	}
}
