import Div from "../../Engine/GUI/Div";
import EditText from "../../Engine/GUI/Text/EditText";
import { OverlayRendering } from "../../Engine/Rendering/OverlayRendering";
import State, { StatesEnum } from "../../Engine/State";
import { StateAccessible } from "../GameMachine";
import Game from "./Game";

export default class PreLobbyState extends State {
	private overlay: OverlayRendering;
	private sa: StateAccessible;

	private roomDiv: Div;
	private timePassed: number = 1;

	private roomName: EditText;

	constructor(sa: StateAccessible) {
		super();
		this.sa = sa;
		this.overlay = new OverlayRendering();

		this.roomName = this.overlay.getNewEditText();
		this.roomName.position.x = 0.5;
		this.roomName.position.y = 0.3;
		this.roomName.center = true;
		this.roomName.textString = "ROOM NAME";

		let createButton = this.overlay.getNewButton();
		createButton.position.x = 0.6;
		createButton.position.y = 0.6;
		createButton.center = true;
		createButton.textString = "Host game";
		let self = this;
		createButton.onClick(function () {
			Game.getInstanceNoSa().client.createRoom(
				self.roomName.getInputElement().value
			);
			self.joinedGame(10);
			self.sa.localGame = false;
		});

		let localButton = this.overlay.getNewButton();
		localButton.position.x = 0.6;
		localButton.position.y = 0.68;
		localButton.center = true;
		localButton.textString = "Local game";
		localButton.onClick(function () {
			self.gotoState = StatesEnum.LOBBY;
		});

		let joinButton = this.overlay.getNewButton();
		joinButton.position.x = 0.4;
		joinButton.position.y = 0.6;
		joinButton.center = true;
		joinButton.textString = "Join";
		joinButton.onClick(function () {
			Game.getInstanceNoSa().client.joinRoom(self.roomName.getInputElement().value);
			self.joinedGame(10);
			self.sa.localGame = false;
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
		let infoText = this.overlay.getNew2DText(this.roomDiv);
		infoText.textString = "Click window to start search!";
	}

	private joinedGame(tries: number) {
		let self = this;
		setTimeout(function () {
			if (Game.getInstanceNoSa().client.connected) {
				self.gotoState = StatesEnum.LOBBY;
			} else if (tries > 0) {
				self.joinedGame(tries--);
			}
		}, 100);
	}

	private addRoom(name: string) {
		let roomName = this.overlay.getNewButton(this.roomDiv);
		roomName.textString = name;
		let self = this;
		roomName.onClick(() => {
			self.roomName.getInputElement().value = name;
		});
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
			// Clear list
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
				let infoText = this.overlay.getNew2DText(this.roomDiv);
				infoText.textString = "No rooms avalible!";
			}
		}
	}

	draw() {
		this.overlay.draw();
	}
}
