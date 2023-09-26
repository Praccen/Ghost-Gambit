import GuiObject from "./GuiObject";
import Vec2 from "../Maths/Vec2";

export default class Div extends GuiObject {
	position: Vec2;
	size: number;
	children: Array<GuiObject>;

	constructor(parentDiv?: Div) {
		super(parentDiv);
		
		this.position = new Vec2();
		this.size = 42;
		this.children = new Array<GuiObject>();
	}

	appendChild(childObj: GuiObject) {
		this.children.push(childObj);
		this.div.appendChild(childObj.getElement());
	}

	draw(): void {
		this.position2D = this.position;
		this.fontSize = this.size;
		this.drawObject();
	}
}
