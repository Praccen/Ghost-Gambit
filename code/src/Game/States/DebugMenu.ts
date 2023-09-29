import { ComponentTypeEnum } from "../../Engine/ECS/Components/Component";
import Entity from "../../Engine/ECS/Entity";
import Button from "../../Engine/GUI/Button";
import Div from "../../Engine/GUI/Div";
import TextObject2D from "../../Engine/GUI/Text/TextObject2D";
import Vec3 from "../../Engine/Maths/Vec3";
import { OverlayRendering } from "../../Engine/Rendering/OverlayRendering";
import { windowInfo } from "../../main";
import { StateAccessible, input } from "../GameMachine";
import Game from "./Game";

export default class DebugMenu {
	private overlay: OverlayRendering;
	private stateAccessible: StateAccessible;
	private game: Game;

	private downloadOctreesButton: Button;
	private downloadTransformsButton: Button;

	private placementMenu: Div;
	private movingPlacementBox: Boolean;

	private entitiesBox: Div;
	private movingEntitiesBox: boolean;

	mouseOverGuiElement: boolean;
	actionText: TextObject2D;

	constructor(stateAccessible: StateAccessible, game: Game) {
		this.overlay = new OverlayRendering();
		this.stateAccessible = stateAccessible;
		this.game = game;

		this.mouseOverGuiElement = false;

		this.downloadOctreesButton = this.overlay.getNewButton();
		this.downloadOctreesButton.position.x = 0.8;
		this.downloadOctreesButton.position.y = 0.1;
		this.downloadOctreesButton.center = true;
		this.downloadOctreesButton.textSize = 40;
		this.downloadOctreesButton.textString = "Download \nOctrees";

		let self = this;
		this.downloadOctreesButton.onClick(function () {
			self.stateAccessible.meshStore.downloadOctrees();
		});

		this.downloadTransformsButton = this.overlay.getNewButton();
		this.downloadTransformsButton.position.x = 0.6;
		this.downloadTransformsButton.position.y = 0.1;
		this.downloadTransformsButton.center = true;
		this.downloadTransformsButton.textSize = 40;
		this.downloadTransformsButton.textString = "Download \nTransforms";

		this.downloadTransformsButton.onClick(function () {
			self.game.objectPlacer.downloadTransforms();
		});

		this.placementMenu = this.overlay.getNewDiv();
		this.placementMenu.getElement().style.backgroundColor = "gray";
		this.placementMenu.getElement().style.opacity = "70%";
		this.placementMenu.position.x = 0.01;
		this.placementMenu.position.y = 0.03;
		this.placementMenu.getElement().style.borderRadius = "5px";
		this.placementMenu.getElement().style.maxHeight = "50%";
		this.placementMenu.getElement().style.overflowY = "auto";
		this.placementMenu.getElement().style.resize = "vertical";
		// Prevent picking through gui element (also don't update the properties box when hovering the properties window)
		this.placementMenu.getElement().onmouseenter = () => {
			this.mouseOverGuiElement = true;
		};
		this.placementMenu.getElement().onmouseleave = () => {
			if (!input.mouseClicked) {
				this.mouseOverGuiElement = false;
			}
		};

		let placementMenuText = this.overlay.getNew2DText(this.placementMenu);
		placementMenuText.textString = "Placement menu";
		placementMenuText.getElement().style.backgroundColor = "dimgray";
		placementMenuText.getElement().style.width = "100%";
		placementMenuText.getElement().style.cursor = "move";
		placementMenuText.getElement().style.borderRadius = "5px";
		placementMenuText.getElement().onmousedown = () => {
			this.movingPlacementBox = true;
		};

		this.actionText = this.overlay.getNew2DText();
		this.actionText.position.x = 0.4;
		this.actionText.position.y = 0.01;
		this.actionText.size = 20;

		this.entitiesBox = this.overlay.getNewDiv();
		this.entitiesBox.getElement().style.backgroundColor = "gray";
		this.entitiesBox.position.x = 0.85;
		this.entitiesBox.position.y = 0.03;
		this.entitiesBox.getElement().style.borderRadius = "5px";
		this.entitiesBox.getElement().style.height = "50%";
		this.entitiesBox.getElement().style.maxHeight = "100%";
		this.entitiesBox.getElement().style.overflowY = "auto";
		this.entitiesBox.getElement().style.resize = "vertical";
		// Prevent picking through gui element (also don't update the properties box when hovering the properties window)
		this.entitiesBox.getElement().onmouseenter = () => {
			this.mouseOverGuiElement = true;
		};
		this.entitiesBox.getElement().onmouseleave = () => {
			if (!input.mouseClicked) {
				this.mouseOverGuiElement = false;
			}
		};

		this.movingEntitiesBox = false;

		let entitiesText = this.overlay.getNew2DText(this.entitiesBox);
		entitiesText.textString = "Entities";
		entitiesText.getElement().style.backgroundColor = "dimgray";
		entitiesText.getElement().style.width = "100%";
		entitiesText.getElement().style.cursor = "move";
		entitiesText.getElement().style.borderRadius = "5px";
		entitiesText.getElement().onmousedown = () => {
			this.movingEntitiesBox = true;
		};
	}

	async init() {
		this.overlay.show();

		// Force the entities box to reload.
		let length = this.entitiesBox.children.length;
		if (length > 1) {
			this.entitiesBox.children[1].remove();
			this.entitiesBox.children.splice(1, 1);
		}
	}

	private addComponentButtons(e: Entity, componentsDiv: Div) {
		for (let comp of e.components) {
			let compBtn = this.overlay.getNewButton(componentsDiv);
			compBtn.textString = ComponentTypeEnum[comp.type];
			compBtn.textSize = 20;
			compBtn.scaleWithWindow = true;
			compBtn.getInputElement().className = "listButton";
			compBtn.getElement().style.width = "100%";

			let compPropDiv = this.overlay.getNewDiv(componentsDiv);
			comp.addToGui(this.overlay, compPropDiv, this.game.objectPlacer);

			compBtn.onClick(() => {
				compPropDiv.toggleHidden();
			});
			compPropDiv.setHidden(true);
		}
	}

	// updateEntityBoxComponents(entityId: number) {
	// 	for (let i = 1; i < this.entitiesBox.children.length; i += 2) {
	// 		if (this.entitiesBox.children[i].textString == entityId.toString()) {
	// 			let hiddenProps: boolean[] = []; // keep track of what was hidden and not
	// 			for (let child of (<Div>this.entitiesBox.children[i+1]).children) {
	// 				hiddenProps.push(child.getHidden()); // store hidden state
	// 				child.remove();
	// 			}
	// 			(<Div>this.entitiesBox.children[i+1]).children.length = 0;
	// 			const entity = this.game.ecsManager.getEntity(entityId);

	// 			this.addComponentButtons(entity, (<Div>this.entitiesBox.children[i+1]));

	// 			// Reapply hidden states
	// 			for (let child of (<Div>this.entitiesBox.children[i+1]).children) {
	// 				child.setHidden(hiddenProps.shift());
	// 			}
	// 		}
	// 	}
	// }

	update(dt: number) {
		// Moving of boxes
		if (!input.mouseClicked) {
			this.movingPlacementBox = false;
			this.movingEntitiesBox = false;
		}

		if (this.movingPlacementBox) {
			this.placementMenu.position.x =
				input.mousePositionOnCanvas.x / windowInfo.resolutionWidth;
			this.placementMenu.position.y =
				input.mousePositionOnCanvas.y / windowInfo.resolutionHeight;
		}

		if (this.movingEntitiesBox) {
			this.entitiesBox.position.x =
				input.mousePositionOnCanvas.x / windowInfo.resolutionWidth;
			this.entitiesBox.position.y =
				input.mousePositionOnCanvas.y / windowInfo.resolutionHeight;
		}

		// Update the placement menu if it is not synced with placements (+1 is because there is a text child as well)
		if (
			this.placementMenu.children.length !=
			this.game.objectPlacer.placements.size + 1
		) {
			for (let i = 1; i < this.placementMenu.children.length; i++) {
				this.placementMenu.children[i].remove();
				this.placementMenu.children.splice(i, 1);
				i--;
			}

			this.game.objectPlacer.placements.forEach((value, key) => {
				let objectSelector = this.overlay.getNewButton(this.placementMenu);
				objectSelector.textString = key.substring(key.lastIndexOf("/") + 1);
				objectSelector.textSize = 20;
				objectSelector.scaleWithWindow = true;
				objectSelector.getInputElement().className = "listButton";
				objectSelector.getElement().style.width = "100%";
				objectSelector.onClick(() => {
					this.game.objectPlacer.placeObject(
						key,
						new Vec3(),
						new Vec3([1.0, 1.0, 1.0]),
						new Vec3([0.0, 0.0, 0.0])
					);
				});
			});
		}

		// Update the entities menu
		if (
			this.entitiesBox.children.length !=
			this.game.ecsManager.entities.length * 2 + 1
		) {
			for (let i = 1; i < this.entitiesBox.children.length; i++) {
				this.entitiesBox.children[i].remove();
				this.entitiesBox.children.splice(i, 1);
				i--;
			}

			this.game.ecsManager.entities.forEach((e) => {
				let entityBtn = this.overlay.getNewButton(this.entitiesBox);
				entityBtn.textString = "" + e.id;
				entityBtn.textSize = 20;
				entityBtn.scaleWithWindow = true;
				entityBtn.getInputElement().className = "listButton";
				entityBtn.getElement().style.width = "100%";

				let componentsDiv = this.overlay.getNewDiv(this.entitiesBox);
				componentsDiv.getElement().style.paddingLeft = "10px";
				componentsDiv.setHidden(true);

				this.addComponentButtons(e, componentsDiv);

				entityBtn.onClick(() => {
					componentsDiv.toggleHidden();
					this.game.objectPlacer.selectNewObjectFromEntityId(e.id);
				});
			});
		}

		for (let i = 1; i < this.entitiesBox.children.length; i += 2) {
			let eChild = this.entitiesBox.children[i];
			eChild.getElement().style.backgroundColor = "transparent";

			if (
				this.game.objectPlacer.currentlyEditingEntityId != undefined &&
				eChild.textString ==
					"" + this.game.objectPlacer.currentlyEditingEntityId
			) {
				eChild.getElement().style.backgroundColor = "dimgray";
			}
		}
	}

	reset() {
		this.overlay.hide();
	}

	draw() {
		this.overlay.draw();
	}
}
