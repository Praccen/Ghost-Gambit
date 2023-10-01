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
let uid = 0;

wss.on("connection", (ws) => {
	clients.set(ws, { room: "NOT_VALID", id: uid++ });
	// const index = clients.indexOf(ws);
	console.log("Someone connected!");

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
					rooms.get(msg.room_id)!.push(ws);
					// Send CON msg to client
					ws.send(
						JSON.stringify({
							type: "CON",
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
					rooms.get(msg.room_id)!.push(ws);
					clients.get(ws).room = msg.room_id;
					ws.send(
						JSON.stringify({
							type: "CON",
							msg: "OK",
						})
					);
					for (const element of rooms.get(msg.room_id)) {
						if (element != ws) {
							// Add client to all others in room
							element.send(
								JSON.stringify({ type: "JOI", id: clients.get(ws).id })
							);
							// Add all others in room to client
							ws.send(
								JSON.stringify({ type: "JOI", id: clients.get(element).id })
							);
						}
					}
				}
				break;
			case "MOV":
				const roomName = clients.get(ws).room;
				if (roomName != "NOT_VALID") {
					for (const element of rooms.get(roomName)) {
						if (element != ws) {
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
		const roomName = clients.get(ws).room;
		if (roomName != "NOT_VALID" && rooms.get(roomName)!.length <= 1) {
			rooms.delete(roomName);
		}
		clients.delete(ws);
	});
});
