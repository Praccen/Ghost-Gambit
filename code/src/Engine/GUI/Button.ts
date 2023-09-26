import Vec2 from "../Maths/Vec2";
import Div from "./Div";
import GuiObject from "./GuiObject";

export default class Button extends GuiObject {
	position: Vec2;
	textSize: number;

	private inputNode: HTMLInputElement;

	constructor(parentDiv?: Div) {
		super(parentDiv);
		this.position = new Vec2();
		this.textSize = 42;

		// make an input node and a label node
		this.inputNode = document.createElement("input");
		this.inputNode.type = "button";
		this.inputNode.className = "button";

		this.div.appendChild(this.inputNode);
	}

	getElement(): HTMLDivElement {
		return this.div;
	}

	getInputElement(): HTMLInputElement {
		return this.inputNode;
	}

	onClick(fn: any) {
		this.inputNode.addEventListener("click", fn);
	}

	draw() {
		this.position2D = this.position;
		this.inputNode.value = this.textString;
		this.fontSize = this.textSize;

		this.drawObject();
	}
}
