import Vec from "./Vec";

export default class Vec2 extends Vec {
	constructor(base?: number[]) {
		super(2, base);
	}

	get x(): number {
		return this[0];
	}

	get y(): number {
		return this[1];
	}

	set x(x: number) {
		this[0] = x;
	}

	set y(y: number) {
		this[1] = y;
	}

	setValues(x?: number, y?: number): Vec2 {
		if (x != undefined) {
			this[0] = x;
		}
		if (y != undefined) {
			this[1] = y;
		}
		return this;
	}
}
