export default class Vec extends Array<number> {
	constructor(size: number, base?: number[]) {
		super(size);
		if (base) {
			this.iterate((i: number) => {
				this[i] = base[i];
			});
		} else {
			this.fill(0);
		}
	}

	iterate(fun: Function) {
		for (let i = 0; i < this.length; i++) {
			fun(i);
		}
	}

	deepAssign(base: number[]): any {
		this.iterate((i: number) => {
			this[i] = base[i];
		});

		return this;
	}

	compare(other: number[]): boolean {
		let returnVal = true;
		this.iterate((i: number) => {
			if (this[i] != other[i]) {
				returnVal = false;
				return;
			}
		});
		return returnVal;
	}

	len(): number {
		return Math.sqrt(this.length2());
	}

	length2(): number {
		let returnVal = 0;
		this.iterate((i: number) => {
			returnVal += Math.pow(this[i], 2);
		});
		return returnVal;
	}

	/**
	 * Normalizes the vector and returns it.
	 * It does not return a copy, so this will change the instance itself.
	 */
	normalize(): any {
		const length = this.len();
		if (length > 0.0) {
			this.iterate((i: number) => {
				this[i] /= length;
			});
		}
		return this;
	}

	dot(otherVec: number[]): number {
		let dot = 0.0;
		this.iterate((i: number) => {
			dot += this[i] * otherVec[i];
		});
		return dot;
	}

	flip(): any {
		this.iterate((i: number) => {
			this[i] *= -1.0;
		});
		return this;
	}

	add(vec: number[]): any {
		this.iterate((i: number) => {
			this[i] += vec[i];
		});
		return this;
	}

	subtract(vec: number[]): any {
		this.iterate((i: number) => {
			this[i] -= vec[i];
		});
		return this;
	}

	multiply(mult: number): any {
		this.iterate((i: number) => {
			this[i] *= mult;
		});
		return this;
	}

	min(vec: number[]): any {
		this.iterate((i: number) => {
			this[i] = Math.min(this[i], vec[i]);
		});
		return this;
	}

	max(vec: number[]): any {
		this.iterate((i: number) => {
			this[i] = Math.max(this[i], vec[i]);
		});
		return this;
	}
}
