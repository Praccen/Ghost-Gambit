import State, { StatesEnum } from "./State";

export default class StateMachine {
	states: Map<
		StatesEnum,
		{ stateType: any; minUpdateRate: number; state: State }
	>;

	protected fps: number = 0;
	protected currentState: StatesEnum;

	private firstLoop: boolean;

	// Frame timer variables
	private lastTick = null;
	private updateTimer = 0.0;
	private fpsUpdateTimer = 0.0;
	private frameCounter = 0;
	private dt = 0.0;

	constructor(startState: StatesEnum) {
		this.states = new Map<
			StatesEnum,
			{ stateType: any; minUpdateRate: number; state: State }
		>();
		this.currentState = startState;

		this.firstLoop = true;
	}

	addState(
		stateEnum: StatesEnum,
		stateType: any,
		minUpdateRate: number,
		state: State
	) {
		this.states.set(stateEnum, {
			stateType: stateType,
			minUpdateRate: minUpdateRate,
			state: state,
		});
		this.states.get(stateEnum).state.reset();
	}

	updateFrameTimers() {
		let now = Date.now();
		this.dt = (now - (this.lastTick || now)) * 0.001;
		this.lastTick = now;

		this.frameCounter++;
		this.fpsUpdateTimer += this.dt;

		if (this.fpsUpdateTimer > 0.5) {
			this.fps = this.frameCounter / this.fpsUpdateTimer;
			this.fpsUpdateTimer -= 0.5;
			this.frameCounter = 0;
		}
	}

	updateState(state: State, minUpdateRate?: number) {
		this.updateFrameTimers();

		// Constant update rate
		this.updateTimer += this.dt;
		let updatesSinceRender = 0;

		if (minUpdateRate != undefined) {
			//Only update if update timer goes over update rate
			while (this.updateTimer >= minUpdateRate) {
				if (updatesSinceRender >= 20) {
					// Too many updates, throw away the rest of dt (makes the game run in slow-motion)
					this.updateTimer = 0;
					break;
				}

				state.update(minUpdateRate);
				this.updateTimer -= minUpdateRate;
				updatesSinceRender++;
			}
		}

		if (updatesSinceRender == 0) {
			// dt is faster than min update rate, or no min update rate is set
			state.update(this.updateTimer);
			this.updateTimer = 0.0;
		}

		state.prepareDraw(this.dt);

		if (!this.firstLoop) {
			state.draw();
		}

		this.firstLoop = false;
	}

	async runCurrentState() {
		if (!this.states.get(this.currentState).state.initialized) {
			await this.states.get(this.currentState).state.init();
		}

		// Update the state
		this.updateState(
			this.states.get(this.currentState).state,
			this.states.get(this.currentState).minUpdateRate
		);

		// Check if we should change state
		if (this.states.get(this.currentState).state.gotoState != StatesEnum.STAY) {
			let oldState = this.currentState;
			this.currentState = this.states.get(this.currentState).state.gotoState;

			this.states.get(oldState).state.reset();
			this.states.get(oldState).state.gotoState = StatesEnum.STAY;

			// TODO: Add different ways to switch states, like for example, maybe we want to just have a state overlayed on top of another (pause menu).
		}

		requestAnimationFrame(this.runCurrentState.bind(this));
	}

	start() {
		requestAnimationFrame(this.runCurrentState.bind(this));
	}
}
