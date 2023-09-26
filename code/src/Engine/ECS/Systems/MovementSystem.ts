import System from "./System";
import { ComponentTypeEnum } from "../Components/Component";
import PositionComponent from "../Components/PositionComponent";
import MovementComponent from "../Components/MovementComponent";
import Vec3 from "../../Maths/Vec3";

export default class MovementSystem extends System {
	constructor() {
		super([ComponentTypeEnum.POSITION, ComponentTypeEnum.MOVEMENT]);
	}

	update(dt: number) {
		for (const e of this.entities) {
			let posComp = <PositionComponent>(
				e.getComponent(ComponentTypeEnum.POSITIONPARENT)
			);

			if (posComp == undefined) {
				posComp = <PositionComponent>e.getComponent(ComponentTypeEnum.POSITION);
			}
			let movComp = <MovementComponent>(
				e.getComponent(ComponentTypeEnum.MOVEMENT)
			);

			let oldVel = new Vec3(movComp.velocity);

			// Do movement calculations
			movComp.velocity.add(
				new Vec3(movComp.accelerationDirection).multiply(
					movComp.acceleration * dt
				)
			);
			movComp.velocity.add(new Vec3(movComp.constantAcceleration).multiply(dt));

			movComp.jumpAllowed = movComp.jumpAllowed || movComp.onGround;

			if (movComp.jumpAllowed && movComp.jumpRequested) {
				movComp.velocity.y = movComp.jumpPower;
				movComp.onGround = false;
				movComp.jumpRequested = false;
				movComp.jumpAllowed = false;
			}

			//Drag
			let dragVec = new Vec3(movComp.velocity).multiply(-1.0);
			dragVec.y = 0.0;
			let magnitude = dragVec.len();
			movComp.velocity.add(
				dragVec.normalize().multiply(Math.min(movComp.drag * dt, magnitude))
			);

			//stop if velocity is too slow
			const accelerating =
				movComp.accelerationDirection.x != 0.0 ||
				movComp.accelerationDirection.z != 0.0;
			if (!accelerating && movComp.velocity.length2() < 0.001) {
				movComp.velocity.multiply(0.0);
			}

			let displacement = new Vec3(movComp.velocity)
				.add(oldVel)
				.multiply(0.5 * dt);

			if (Math.abs(displacement.x) > 0.001) {
				posComp.position.x += displacement.x;
			}

			if (Math.abs(displacement.y) > 0.001) {
				posComp.position.y += displacement.y;
			}

			if (Math.abs(displacement.z) > 0.001) {
				posComp.position.z += displacement.z;
			}

			movComp.accelerationDirection.multiply(0.0);
		}
	}
}
