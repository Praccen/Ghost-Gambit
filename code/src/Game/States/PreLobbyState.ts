import Div from "../../Engine/GUI/Div";
import { OverlayRendering } from "../../Engine/Rendering/OverlayRendering";
import State, { StatesEnum } from "../../Engine/State";
import { StateAccessible } from "../GameMachine";
import Game from "./Game";

export default class PreLobbyState extends State {
	private overlay: OverlayRendering;
	private sa: StateAccessible;

	private roomDiv: Div;
	private timePassed: number = 0;

	constructor(sa: StateAccessible) {
		super();
		this.sa = sa;
		this.overlay = new OverlayRendering();

		let roomName = this.overlay.getNewEditText();
		roomName.position.x = 0.5;
		roomName.position.y = 0.3;
		roomName.center = true;
		roomName.textString = "ROOM NAME";

		let createButton = this.overlay.getNewButton();
		createButton.position.x = 0.6;
		createButton.position.y = 0.6;
		createButton.center = true;
		createButton.textString = "Create";
		let self = this;
		createButton.onClick(function () {
			Game.getInstanceNoSa().client.createRoom(
				roomName.getInputElement().value
			);
			self.joinedGame(10);
		});

		let joinButton = this.overlay.getNewButton();
		joinButton.position.x = 0.4;
		joinButton.position.y = 0.6;
		joinButton.center = true;
		joinButton.textString = "Join";
		joinButton.onClick(function () {
			Game.getInstanceNoSa().client.joinRoom(roomName.getInputElement().value);
			self.joinedGame(10);
		});

		this.roomDiv = this.overlay.getNewDiv();
		this.roomDiv.getElement().style.backgroundColor = "gray";
		this.roomDiv.getElement().style.opacity = "70%";
		this.roomDiv.position.x = 0.01;
		this.roomDiv.position.y = 0.03;
		this.roomDiv.getElement().style.borderRadius = "5px";
		this.roomDiv.getElement().style.overflowY = "auto";
		this.roomDiv.getElement().style.width = "25%";
		this.roomDiv.getElement().style.height = "70%";
		this.addRoom("Click window to start search!");
	}

	private joinedGame(tries: number) {
		let self = this;
		setTimeout(function () {
			if (Game.getInstanceNoSa().client.connected) {
				self.gotoState = StatesEnum.GAME;
			} else if (tries > 0) {
				self.joinedGame(tries--);
			}
		}, 100);
	}

	private addRoom(name: string) {
		let roomName = this.overlay.getNew2DText(this.roomDiv);
		roomName.textString = name;
	}

	async init() {
		super.init();
		this.overlay.show();
	}

	reset() {
		super.reset();
		this.overlay.hide();
	}

	update(dt: number) {
		this.timePassed += dt;
		if (this.timePassed > 1) {
			for (const div of this.roomDiv.children) {
				div.remove();
			}
			this.timePassed = 0;
			Game.getInstanceNoSa().client.getRooms();
			if (Game.getInstanceNoSa().client.activeRooms.length > 0) {
				for (const room of Game.getInstanceNoSa().client.activeRooms) {
					this.addRoom(room);
				}
			} else {
				this.addRoom("No rooms avalible!");
			}
		}
	}

	draw() {
		this.overlay.draw();
	}
}
