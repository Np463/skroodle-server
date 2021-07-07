import { Socket } from "socket.io";
import { LobbyDatabase } from "../services/lobby";
import { Socket as SocketService } from "../services/socket";

export default (socket: Socket) => {
	const lobbies = LobbyDatabase.getInstance();
	const io = SocketService.getIO();
	const createLobby = () => {
		let roomId: string;
		do {
			roomId = Math.random().toString(36).slice(2, 7);
		} while (lobbies.has(roomId));
		lobbies.addLobby(roomId, socket.data.sessionId);
		socket.join(roomId);
		socket.emit("lobby:created", {
			roomId: roomId,
		});
	};
	const joinLobby = async ({ roomId }: any) => {
		if (!roomId) return;
		if (lobbies.has(roomId)) {
			// Check if there is another socket in the room with the same sessionId
			const sockets = await io.in(roomId).fetchSockets();
			if (sockets) {
				for (const s of sockets) {
					if (s.data.sessionId === socket.data.sessionId) {
						return socket.emit("lobby:error", {
							error: "You are already connected to this room on another tab",
						});
					}
				}
			}
			socket.join(roomId);
			socket.emit("lobby:created", {
				roomId: roomId,
			});
		} else {
			socket.emit("lobby:error", {
				error: "Room does not exist",
			});
		}
	};
	socket.on("lobby:create", createLobby);
	socket.on("lobby:join", joinLobby);
};
