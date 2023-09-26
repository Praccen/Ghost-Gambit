import { input } from "../../Game/GameMachine";
import { windowInfo } from "../../main";
import Camera from "../Camera";
import Ray from "../Physics/Shapes/Ray";
import Vec2 from "./Vec2";
import Vec3 from "./Vec3";

export module MousePicking {
	export function GetRay(camera: Camera): Ray {
		let ndc = new Vec2([
			input.mousePositionOnCanvas.x,
			input.mousePositionOnCanvas.y,
		]);
		ndc.x = (ndc.x / windowInfo.resolutionWidth - 0.5) * 2.0;
		ndc.y = (ndc.y / windowInfo.resolutionHeight - 0.5) * -2.0;

		let mouseRayClip = new Vector4([ndc.x, ndc.y, -1.0, 1.0]);
		let mouseRayCamera = new Matrix4(camera.getProjectionMatrix())
			.invert()
			.multiplyVector4(mouseRayClip);
		mouseRayCamera.elements[2] = -1.0;
		mouseRayCamera.elements[3] = 0.0;
		let mouseRayWorld4D = new Matrix4(camera.getViewMatrix())
			.invert()
			.multiplyVector4(mouseRayCamera);
		let dir = new Vec3([
			mouseRayWorld4D.elements[0],
			mouseRayWorld4D.elements[1],
			mouseRayWorld4D.elements[2],
		]).normalize();

		let ray = new Ray();
		ray.setDir(dir);
		ray.setStart(camera.getPosition());

		return ray;
	}
}
