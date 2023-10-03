import OpponentCharacter from "../../Game/OpponentCharacter";
import Game from "../../Game/States/Game";
import { ComponentTypeEnum } from "../ECS/Components/Component";
import PositionParentComponent from "../ECS/Components/PositionParentComponent";
import Entity from "../ECS/Entity";
import Vec3 from "../Maths/Vec3";
import { StatesEnum } from "../State";

export class Client {
	private socket: WebSocket;
	bodyEntities: Map<string, OpponentCharacter> = new Map<
		string,
		OpponentCharacter
	>();
	connected: boolean = false;
	uid: string;
	activeRooms: string[] = [];
	isServer: boolean = true;
	gameStarted: boolean = false;
	private game: Game;

	constructor(game: Game) {
		this.game = game;
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
				// Send pos to joind clients
				let posComp = <PositionParentComponent>(
					this.game.gameItemsDict.player.bodyEntity.getComponent(
						ComponentTypeEnum.POSITIONPARENT
					)
				);
				if (posComp) {
					this.sendMove(posComp.position, posComp.rotation);
				}
				const newEnt = new OpponentCharacter(
					this.game.rendering,
					this.game.ecsManager,
					this.game.stateAccessible.audioPlayer,
					"Ghost Character",
					this.game.gameItemsDict,
					false,
					new Vec3([0.0, -10.0, 0.0])
				);
				newEnt.init();
				this.bodyEntities.set(msg.id, newEnt);
				this.game.gameItemsDict.opponents.push(newEnt);
				break;
			case "MOV":
				if (this.bodyEntities.get(msg.id) != undefined) {
					let posComp = <PositionParentComponent>(
						this.bodyEntities
							.get(msg.id)
							.bodyEntity.getComponent(ComponentTypeEnum.POSITIONPARENT)
					);
					if (posComp && !this.bodyEntities.get(msg.id).is_accending) {
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
				console.log("Client disconnected: " + msg.id);
				Game.getInstanceNoSa().ecsManager.removeEntity(
					this.bodyEntities.get(msg.id).bodyEntity.id
				);
				this.bodyEntities.delete(msg.id);
				break;
			case "GET":
				this.activeRooms = msg.rooms;
				break;
			case "STR":
				console.log("Strating game!");
				this.gameStarted = true;
				this.game.resetStartTime();
				// Game.getInstanceNoSa().gotoState = StatesEnum.GAME;
				break;
		}
	}

	getRooms(): void {
		this.send(JSON.stringify({ type: "GET" }), 5);
	}

	sendStart(): void {
		this.send(JSON.stringify({ type: "STR" }), 0);
	}
	sendLeave(): void {
		this.send(JSON.stringify({ type: "LEA" }), 0);
		this.connected = false;
		this.gameStarted = false;
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
