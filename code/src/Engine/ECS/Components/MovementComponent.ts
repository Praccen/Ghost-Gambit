import { Component, ComponentTypeEnum } from "./Component";
import Vec2 from "../../Maths/Vec2";
import Vec3 from "../../Maths/Vec3";

export default class MovementComponent extends Component {
	constantAcceleration: Vec3;
	accelerationDirection: Vec3;
	acceleration: number;
	velocity: Vec3;
	drag: number;
	onGround: boolean;
	jumpPower: number;
	jumpRequested: boolean;
	jumpAllowed: boolean;

	constructor() {
		super(ComponentTypeEnum.MOVEMENT);
		this.constantAcceleration = new Vec3([0.0, -9.8, 0.0]);
		this.accelerationDirection = new Vec3();
		this.acceleration = 6.0;
		this.velocity = new Vec3();
		this.drag = 4.0;
		this.onGround = false;
		this.jumpPower = 5.0;
		this.jumpRequested = false;
		this.jumpAllowed = false;
	}
}
