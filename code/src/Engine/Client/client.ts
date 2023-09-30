export class Client {
	private socket: WebSocket;

	constructor() {
		this.socket = new WebSocket("ws://localhost:8080");
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

	joinRoom(roomId): boolean {
		this.send(JSON.stringify({ type: "JOI", room_id: roomId }), 100);
		return false;
	}

	sendPosition(): void {}

	handleMessages(message: string): void {
		console.log(message);
		const msg = JSON.parse(message);
		switch (msg.type) {
			case "CRE":
				switch (msg.msg) {
					case "OK":
						break;
					case "ERR":
						break;
				}
				break;
			case "JOI":
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
