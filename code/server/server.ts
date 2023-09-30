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
					// Send ACK msg to client
					ws.send(
						JSON.stringify({
							type: "CRE",
							msg: "OK",
						})
					);
				} else {
					ws.send(
						JSON.stringify({
							type: "CRE",
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
					for (const element of rooms.get(msg.room_id)) {
						if (element != ws) {
							element.send(
								JSON.stringify({ type: "JOI", id: clients.get(ws).id })
							);
						}
					}
				}
				break;
			case "MOV":
				for (const element of rooms.get(clients.get(ws).room)) {
					if (element != ws) {
						element.send(message);
					}
				}
				break;
			case "GET":
				var roomList = [];

				console.log(rooms.keys());
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
		rooms.delete(roomName);
		clients.delete(ws);
	});
});
