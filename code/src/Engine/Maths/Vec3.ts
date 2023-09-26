import Vec from "./Vec";

export default class Vec3 extends Vec {
	constructor(base?: number[]) {
		super(3, base);
	}

	get x(): number {
		return this[0];
	}

	get y(): number {
		return this[1];
	}

	get z(): number {
		return this[2];
	}

	set x(x: number) {
		this[0] = x;
	}

	set y(y: number) {
		this[1] = y;
	}

	set z(z: number) {
		this[2] = z;
	}

	setValues(x?: number, y?: number, z?: number): Vec3 {
		if (x != undefined) {
			this[0] = x;
		}
		if (y != undefined) {
			this[1] = y;
		}
		if (z != undefined) {
			this[2] = z;
		}

		return this;
	}

	cross(otherVec: number[]): Vec3 {
		let tempVec: Vec3 = new Vec3();
		tempVec.x = this[1] * otherVec[2] - this[2] * otherVec[1];
		tempVec.y = this[0] * otherVec[2] - this[2] * otherVec[0];
		tempVec.z = this[0] * otherVec[1] - this[1] * otherVec[0];
		this.deepAssign(tempVec);
		return this;
	}
}
