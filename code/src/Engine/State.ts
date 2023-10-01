export enum StatesEnum {
	STAY,
	LOADINGSCREEN,
	MAINMENU,
	PRELOBBY,
	LOBBY,
	OPTIONS,
	CONTROLS,
	GAME,
	ENDSCREEN,
	DEBUGMODE,
}

export default class State {
	/*
	 * Set this to the enum for the state you want the state machine to move to.
	 * Leave it at STAY to keep running the current state.
	 */
	gotoState: StatesEnum;
	initialized: boolean;

	constructor() {
		this.gotoState = StatesEnum.STAY;
		this.initialized = false;
	}

	async init() {
		this.initialized = true;
	}

	reset() {
		this.initialized = false;
	}

	onExit(e: BeforeUnloadEvent) {}

	update(dt: number) {}

	prepareDraw(dt: number) {}

	draw() {}
}
