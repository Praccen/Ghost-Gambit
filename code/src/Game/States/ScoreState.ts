import Button from "../../Engine/GUI/Button";
import Div from "../../Engine/GUI/Div";
import { OverlayRendering } from "../../Engine/Rendering/OverlayRendering";
import State, { StatesEnum } from "../../Engine/State";
import { StateAccessible } from "../GameMachine";
import OpponentCharacter from "../OpponentCharacter";
import Game from "./Game";

export default class LobbyState extends State {
	private overlay: OverlayRendering;
	private sa: StateAccessible;
	private participantsDiv: Div;

	constructor(sa: StateAccessible) {
		super();
		this.sa = sa;
		this.overlay = new OverlayRendering();

		this.participantsDiv = this.overlay.getNewDiv();
		this.participantsDiv.getElement().style.backgroundColor = "gray";
		this.participantsDiv.getElement().style.opacity = "70%";
		this.participantsDiv.position.x = 0.25;
		this.participantsDiv.position.y = 0.03;
		this.participantsDiv.getElement().style.borderRadius = "5px";
		this.participantsDiv.getElement().style.overflowY = "auto";
		this.participantsDiv.getElement().style.width = "50%";
		this.participantsDiv.getElement().style.height = "70%";

		let menuButton = this.overlay.getNewButton();
		menuButton.position.x = 0.5;
		menuButton.position.y = 0.8;
		menuButton.center = true;
		menuButton.textString = "Back to menu";

		let self = this;
		menuButton.onClick(function () {
			self.gotoState = StatesEnum.MAINMENU;
			if (Game.getInstanceNoSa().client) {
				Game.getInstanceNoSa().client.sendLeave();
			}
			sa.restartGame = true;
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

	private addParticipant(name: string) {
		let participantText = this.overlay.getNew2DText(this.participantsDiv);
		participantText.textString = name;
	}

	update(dt: number) {
		for (const div of this.participantsDiv.children) {
			div.remove();
		}
		let playersMap = new Map<string, number>();
		let startTime = Game.getInstanceNoSa().allCharacterDict.player.ascendTime;

		if (!this.sa.localGame) {
			playersMap.set(
				"Player_" + Game.getInstanceNoSa().client.uid + "(You)",
				Game.getInstanceNoSa().allCharacterDict.player.ascendTime.getTime() -
					startTime.getTime()
			);
			Game.getInstanceNoSa().client.bodyEntities.forEach(
				(value: OpponentCharacter, key: string) => {
					playersMap.set(
						"Player_" + key,
						value.ascendTime.getTime() - startTime.getTime()
					);
				}
			);
			const mapSort = new Map(
				[...playersMap.entries()].sort((a, b) => a[1] - b[1])
			);
			mapSort.forEach((value: number, key: string) => {
				this.addParticipant(key + " Time: " + value + " Seconds");
			});
		}
	}

	draw() {
		this.overlay.draw();
	}
}
