import Vec2 from "../../Maths/Vec2";
import Div from "../Div";
import GuiObject from "../GuiObject";

export default class TextObject2D extends GuiObject {
	position: Vec2;
	size: number;

	constructor(parentDiv?: Div) {
		super(parentDiv);

		this.position = new Vec2();
		this.size = 42;
	}

	draw(): void {
		this.position2D = this.position;
		this.fontSize = this.size;
		this.div.textContent = this.textString;
		this.drawObject();
	}
}
