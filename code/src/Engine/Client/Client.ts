import Game from "../../Game/States/Game";
import { ComponentTypeEnum } from "../ECS/Components/Component";
import PositionParentComponent from "../ECS/Components/PositionParentComponent";
import Entity from "../ECS/Entity";
import Vec3 from "../Maths/Vec3";
import { StatesEnum } from "../State";

export class Client {
	private socket: WebSocket;
	bodyEntities: Map<string, Entity> = new Map<string, Entity>();
	connected: boolean = false;
	private uid: string;
	activeRooms: string[] = [];
	isServer: boolean = true;
	gameStarted: boolean = false;

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
	createRoom(roomId: string): void {
		this.send(JSON.stringify({ type: "CRE", room_id: roomId }), 100);
	}

	joinRoom(roomId: string): void {
		this.send(JSON.stringify({ type: "JOI", room_id: roomId }), 100);
	}

	sendMove(pos: Vec3, rot: Vec3): void {
		if (this.connected) {
			this.send(
				JSON.stringify({
					type: "MOV",
					id: this.uid,
					x_pos: pos.x,
					y_pos: pos.y,
					z_pos: pos.z,
					x_rot: rot.x,
					y_rot: rot.y,
					z_rot: rot.z,
				}),
				0 // No retries
			);
		}
	}
	handleMessages(message: string): void {
		// console.log(message);
		const msg = JSON.parse(message);
		switch (msg.type) {
			case "CON":
				switch (msg.msg) {
					case "OK":
						this.connected = true;
						this.uid = msg.id;
						this.isServer = msg.server;
						break;
					case "ERR":
						break;
				}
				break;
			case "JOI":
				console.log("Client connected: " + msg.id);
				const newEnt = Game.getInstanceNoSa().objectPlacer.placePlayer(
					new Vec3([-10.0, -10.0, -10.0]),
					new Vec3([0.25, 0.25, 0.25]),
					new Vec3(),
					null
				)[0];
				this.bodyEntities.set(msg.id, newEnt);
				break;
			case "MOV":
				if (this.bodyEntities.get(msg.id) != undefined) {
					let posComp = <PositionParentComponent>(
						this.bodyEntities
							.get(msg.id)
							.getComponent(ComponentTypeEnum.POSITIONPARENT)
					);
					if (posComp) {
						posComp.position.x = msg.x_pos;
						posComp.position.y = msg.y_pos;
						posComp.position.z = msg.z_pos;
						posComp.rotation.x = msg.x_rot;
						posComp.rotation.y = msg.y_rot;
						posComp.rotation.z = msg.z_rot;
					}
				}
				break;
			case "DIS":
				console.log("Client disconnected" + msg.id);
				Game.getInstanceNoSa().ecsManager.removeEntity(
					this.bodyEntities.get(msg.id).id
				);
				this.bodyEntities.delete(msg.id);
				break;
			case "GET":
				this.activeRooms = msg.rooms;
				break;
			case "STR":
				console.log("Strating game!");
				// Game.getInstanceNoSa().gotoState = StatesEnum.GAME;
				this.gameStarted = true;
				break;
		}
	}

	getRooms(): void {
		this.send(JSON.stringify({ type: "GET" }), 5);
	}

	sendStart(): void {
		this.send(JSON.stringify({ type: "STR" }), 0);
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
			}, 1000);
		}

		return false;
	}
}
