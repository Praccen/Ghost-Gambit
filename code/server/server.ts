import * as WebSocket from "ws";

const wss = new WebSocket.Server({ port: 8080 });

// Store connected clients
const rooms = new Map<string, WebSocket[]>();
const clients = new Map<
	WebSocket,
	{
		room: string;
		id: number;
	}
>();
let uid: number = 1;

console.log("Server started!");

wss.on("connection", (ws) => {
	console.log("Someone connected! " + uid);
	clients.set(ws, { room: "NOT_VALID", id: uid++ });
	if (ws.protocol != "v1") {
		console.log("Invalid protocol version: " + ws.protocol);
		ws.send(
			JSON.stringify({
				type: "CON",
				msg: "INV",
			})
		);
		ws.close();
	}

	ws.on("message", (message) => {
		// Broadcast received messages to all clients
		const msg = JSON.parse(message.toString());
		switch (msg.type) {
			case "CRE":
				// Create room
				if (!rooms.has(msg.room_id)) {
					console.log("Creating room: " + msg.room_id);
					// Set client room
					clients.get(ws).room = msg.room_id;
					// Add client to room
					rooms.set(msg.room_id, new Array());
					rooms.get(msg.room_id).push(ws);
					// Send CON msg to client
					ws.send(
						JSON.stringify({
							type: "CON",
							id: clients.get(ws).id.toString(),
							msg: "OK",
						})
					);
				} else {
					ws.send(
						JSON.stringify({
							type: "CON",
							msg: "ERR",
						})
					);
				}
				break;
			case "JOI":
				// Join room
				if (rooms.has(msg.room_id)) {
					console.log("Joining room: " + msg.room_id);
					rooms.get(msg.room_id).push(ws);
					clients.get(ws).room = msg.room_id;
					ws.send(
						JSON.stringify({
							type: "CON",
							id: clients.get(ws).id.toString(),
							msg: "OK",
						})
					);
					for (const element of rooms.get(msg.room_id)) {
						if (element != ws && element.OPEN) {
							// Add client to all others in room
							element.send(
								JSON.stringify({
									type: "JOI",
									id: clients.get(ws).id.toString(),
								})
							);
							// Add all others in room to client
							ws.send(
								JSON.stringify({
									type: "JOI",
									id: clients.get(element).id.toString(),
								})
							);
						}
					}
				}
				break;
			case "MOV":
				const roomName = clients.get(ws).room;
				if (roomName != "NOT_VALID") {
					for (const element of rooms.get(roomName)) {
						if (element != ws && element.OPEN) {
							element.send(message.toString());
						}
					}
				}
				break;
			case "GET":
				var roomList = [];

				for (const room of rooms.keys()) {
					roomList.push(room);
				}
				ws.send(
					JSON.stringify({
						type: "GET",
						rooms: roomList,
					})
				);
				break;
		}
	});

	ws.on("close", () => {
		// Remove the disconnected client from the clients map and clear up room if empty
		if (clients.get(ws)) {
			console.log("Someone disconnected! " + clients.get(ws).id);
		}
		const roomName = clients.get(ws).room;
		if (roomName != "NOT_VALID") {
			for (const element of rooms.get(roomName)) {
				if (element != ws && element.OPEN) {
					element.send(
						JSON.stringify({ type: "DIS", id: clients.get(ws).id.toString() })
					);
				}
			}

			rooms.get(roomName).splice(rooms.get(roomName).indexOf(ws), 1);
			if (rooms.get(roomName).length <= 0) {
				rooms.delete(roomName);
			}
		}
		clients.delete(ws);
	});
});
