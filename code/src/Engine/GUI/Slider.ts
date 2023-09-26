import Vec2 from "../Maths/Vec2";
import Div from "./Div";
import GuiObject from "./GuiObject";

export default class Slider extends GuiObject {
	position: Vec2;
	textSize: number;

	private inputNode: HTMLInputElement;
	private label: HTMLLabelElement;

	constructor(parentDiv?: Div) {
		super(parentDiv);
		this.position = new Vec2();
		this.textSize = 42;

		// make an input node and a label node
		this.inputNode = document.createElement("input");
		this.inputNode.type = "range";

		this.label = document.createElement("label");
		this.label.textContent = this.textString;

		this.div.appendChild(this.label);
		this.div.appendChild(this.inputNode);
	}

	getElement(): HTMLDivElement {
		return this.div;
	}

	getInputElement(): HTMLInputElement {
		return this.inputNode;
	}

	getValue(): number {
		return Number(this.inputNode.value);
	}

	draw() {
		this.position2D = this.position;
		this.fontSize = this.textSize;
		this.label.textContent = this.textString;
		this.drawObject();
	}
}
