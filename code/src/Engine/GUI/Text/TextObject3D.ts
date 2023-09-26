import Vec3 from "../../Maths/Vec3";
import GuiObject from "../GuiObject";

export default class TextObject3D extends GuiObject {
	position: Vec3;
	size: number;
	scaleFontWithDistance: boolean;

	private textNode: Text;

	constructor() {
		super();

		this.position = new Vec3();
		this.size = 42;
		this.scaleFontWithDistance = true;

		// make a text node for its content
		this.textNode = document.createTextNode("");
		this.div.appendChild(this.textNode);
	}

	draw3D(viewProj: Matrix4): void {
		let pos = new Vector4([
			this.position.x,
			this.position.y,
			this.position.z,
			1.0,
		]);
		let screenCoords = viewProj.multiplyVector4(pos);
		screenCoords.elements[0] =
			(screenCoords.elements[0] / screenCoords.elements[3] + 1.0) / 2.0;
		screenCoords.elements[1] =
			1.0 - (screenCoords.elements[1] / screenCoords.elements[3] + 1.0) / 2.0;

		if (screenCoords.elements[2] > 0.0) {
			this.position2D.x = screenCoords.elements[0];
			this.position2D.y = screenCoords.elements[1];

			let size = this.size;
			if (this.scaleFontWithDistance) {
				size = this.size / screenCoords.elements[2];
			}
			this.fontSize = size;

			this.div.hidden = false;
			this.textNode.textContent = this.textString;
			this.drawObject();
		} else {
			this.div.hidden = true;
		}
	}
}
