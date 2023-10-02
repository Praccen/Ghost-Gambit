import Entity from "../../Engine/ECS/Entity";
import Button from "../../Engine/GUI/Button";
import Div from "../../Engine/GUI/Div";
import { OverlayRendering } from "../../Engine/Rendering/OverlayRendering";
import State, { StatesEnum } from "../../Engine/State";
import { StateAccessible } from "../GameMachine";
import Game from "./Game";

export default class LobbyState extends State {
	private overlay: OverlayRendering;
	private sa: StateAccessible;
	private participantsDiv: Div;
	private timePassed: number = 2;
	private startButton: Button;
	private addBotButton: Button;
	private removeParticipantButton: Button;

	constructor(sa: StateAccessible) {
		super();
		this.sa = sa;
		this.overlay = new OverlayRendering();

		this.startButton = this.overlay.getNewButton();
		this.startButton.position.x = 0.8;
		this.startButton.position.y = 0.8;
		this.startButton.center = true;
		this.startButton.textString = "Start";

		let self = this;
		this.startButton.onClick(function () {
			if (self.sa.localGame) {
				Game.getInstanceNoSa().spawnBots();
				self.gotoState = StatesEnum.GAME;
			} else {
				if (Game.getInstanceNoSa().client.isServer) {
					Game.getInstanceNoSa().client.sendStart();
					self.gotoState = StatesEnum.GAME;
				}
			}
		});

		let backButton = this.overlay.getNewButton();
		backButton.position.x = 0.01;
		backButton.position.y = 0.8;
		backButton.textString = "Back";

		backButton.onClick(function () {
			self.gotoState = StatesEnum.MAINMENU;
			Game.getInstanceNoSa().client.sendLeave();
			sa.restartGame = true;
		});

		this.participantsDiv = this.overlay.getNewDiv();
		this.participantsDiv.getElement().style.backgroundColor = "gray";
		this.participantsDiv.getElement().style.opacity = "70%";
		this.participantsDiv.position.x = 0.01;
		this.participantsDiv.position.y = 0.03;
		this.participantsDiv.getElement().style.borderRadius = "5px";
		this.participantsDiv.getElement().style.overflowY = "auto";
		this.participantsDiv.getElement().style.width = "50%";
		this.participantsDiv.getElement().style.height = "70%";

		let participantsDivTitle = this.overlay.getNew2DText(this.participantsDiv);
		participantsDivTitle.textString = "Participants";
		participantsDivTitle.getElement().style.backgroundColor = "dimgray";
		participantsDivTitle.getElement().style.width = "100%";
		participantsDivTitle.getElement().style.borderRadius = "5px";

		this.addParticipant("You");

		this.addBotButton = this.overlay.getNewButton();
		this.addBotButton.position.x = 0.55;
		this.addBotButton.position.y = 0.7;
		this.addBotButton.textString = "Add bot";
		this.addBotButton.onClick(() => {
			this.addParticipant("Bot " + Game.getInstanceNoSa().num_bots++);
		});

		this.removeParticipantButton = this.overlay.getNewButton();
		this.removeParticipantButton.position.x = 0.55;
		this.removeParticipantButton.position.y = 0.6;
		this.removeParticipantButton.textString = "Remove";
		this.removeParticipantButton.onClick(() => {
			let length = this.participantsDiv.children.length;
			if (length > 2) {
				this.participantsDiv.children[length - 1].remove();
				this.participantsDiv.children.pop();
				Game.getInstanceNoSa().num_bots--;
			}
		});
	}

	private addParticipant(name: string) {
		let participantText = this.overlay.getNew2DText(this.participantsDiv);
		participantText.textString = name;
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

			if (this.sa.localGame) {
			} else {
				this.addBotButton.setHidden(true);
				this.removeParticipantButton.setHidden(true);
				for (const div of this.participantsDiv.children) {
					div.remove();
				}
				if (Game.getInstanceNoSa().client.connected) {
					// Hide start if not server
					if (!Game.getInstanceNoSa().client.isServer) {
						this.startButton.setHidden(true);
					}
					this.addParticipant("You");
					Game.getInstanceNoSa().client.bodyEntities.forEach(
						(value: Entity, key: string) => {
							this.addParticipant("Player_" + key);
						}
					);
					if (Game.getInstanceNoSa().client.gameStarted) {
						this.gotoState = StatesEnum.GAME;
					}
				}
			}
		}
	}

	draw() {
		this.overlay.draw();
	}
}
