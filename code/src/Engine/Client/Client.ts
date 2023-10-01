import Game from "../../Game/States/Game";
import { ComponentTypeEnum } from "../ECS/Components/Component";
import PositionParentComponent from "../ECS/Components/PositionParentComponent";
import Entity from "../ECS/Entity";
import Vec3 from "../Maths/Vec3";

export class Client {
	private socket: WebSocket;
	private bodyEntities: Map<string, Entity> = new Map<string, Entity>();
	connected: boolean = false;
	private uid: string;

	constructor() {
		this.socket = new WebSocket("wss://sever54.rlyeh.nu", "v1");
		this.socket.addEventListener("open", (event) => {
			console.log("Connected to server");
		});

		this.socket.addEventListener("message", (event) => {
			this.handleMessages(event.data);
		});

		this.socket.addEventListener("close", (event) => {
			console.log("Disconnected from server");
		});
	}

	// Create room with {roomId}
	createRoom(roomId: string): boolean {
		this.send(JSON.stringify({ type: "CRE", room_id: roomId }), 100);
		return false;
	}

	joinRoom(roomId: string): boolean {
		this.send(JSON.stringify({ type: "JOI", room_id: roomId }), 100);
		return false;
	}

	sendMove(pos: Vec3, rot: Vec3): void {
		if (this.connected) {
			this.send(
				JSON.stringify({
					type: "MOV",
					id: this.uid,
					x: pos.x,
					y: pos.y,
					z: pos.z,
				}),
				0 // No retries
			);
		}
	}
	handleMessages(message: string): void {
		console.log(message);
		const msg = JSON.parse(message);
		switch (msg.type) {
			case "CON":
				switch (msg.msg) {
					case "OK":
						this.connected = true;
						this.uid = msg.id;
						break;
					case "ERR":
						this.joinRoom("TEST1");
						break;
				}
				break;
			case "JOI":
				console.log("Client connected: " + msg.id);
				this.bodyEntities.set(
					msg.id,
					Game.getInstanceNoSa().objectPlacer.placeObject(
						"Ghost Character",
						new Vec3(),
						new Vec3([0.25, 0.25, 0.25]),
						new Vec3(),
						new Vec3(),
						"XYZ",
						false
					)[0]
				);
				break;
			case "MOV":
				if (this.bodyEntities.get(msg.id) != undefined) {
					let posComp = <PositionParentComponent>(
						this.bodyEntities
							.get(msg.id)
							.getComponent(ComponentTypeEnum.POSITIONPARENT)
					);
					posComp.position.x = msg.x;
					posComp.position.y = msg.y;
					posComp.position.z = msg.z;
				}
				break;
			case "DIS":
				break;
		}
	}

	// Send message, try {tries} numper of times with 3 sec intercal
	send(message: string, tries: number): boolean {
		if (this.socket.readyState === 1) {
			this.socket.send(message);
			return true;
		} else if (tries > 0) {
			const that = this;
			setTimeout(function () {
				that.send(message, tries - 1);
			}, 3);
		}

		return false;
	}
}
