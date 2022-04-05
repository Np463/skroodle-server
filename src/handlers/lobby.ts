import { Socket } from "socket.io";
import { LobbyDatabase } from "../services/lobby";
import { Socket as SocketService } from "../services/socket";
import { SessionStore } from "../services/session";

export default (socket: Socket) => {
	const lobbies = LobbyDatabase.getInstance();
	const io = SocketService.getIO();
	const sessions = SessionStore.getInstance();

	const createLobby = () => {
		let lobby = lobbies.createLobby(socket.data.sessionId);
		socket.join(lobby.roomId);
		socket.emit("lobby:createdOrJoined", {
			roomId: lobby.roomId,
			rounds: lobby.rounds,
			secondsPerRound: lobby.secondsPerRound,
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
			let lobby = lobbies.get(roomId)!;
			socket.join(roomId);
			socket.emit("lobby:createdOrJoined", {
				roomId: roomId,
				rounds: lobby.rounds,
				secondsPerRound: lobby.secondsPerRound,
			});
			socket.to(roomId).emit("player:connected", {
				userId: socket.data.userId,
				username: socket.data.username,
			});
		} else {
			socket.emit("lobby:error", {
				error: "Room does not exist",
			});
		}
	};

	const playerList = async (roomId: any, callback: any) => {
		const sockets = await io.in(roomId).fetchSockets();
		if (sockets) {
			if (sockets.find((s) => s.data.sessionId === socket.data.sessionId)) {
				let ownerSessionId = lobbies.getOwner(roomId);
				let ownerUserId = sessions.findSession(ownerSessionId);
				callback({
					players: sockets.map((s) => ({
						userId: s.data.userId,
						username: s.data.username,
					})),
					owner: ownerUserId,
				});
			}
		}
	};

	const disconnecting = async () => {
		for (const room of socket.rooms) {
			if (room !== socket.id) {
				socket.to(room).emit("player:disconnected", {
					userId: socket.data.userId,
					username: socket.data.username,
				});
				const sockets = await io.in(room).fetchSockets();
				if (sockets.length < 2) {
					// delete room from lobby db
					lobbies.removeLobby(room);
					return;
				}
				// if this client was the room's owner, select a new owner
				let roomOwner = lobbies.getOwner(room);
				if (roomOwner && roomOwner === socket.data.sessionId) {
					for (const s of sockets) {
						if (s.data.sessionId !== socket.data.sessionId) {
							lobbies.setOwner(room, s.data.sessionId);
							break;
						}
					}
				}
			}
		}
	};

	const changeSettings = (roomId: string, setting: string, newValue: any) => {
		if (socket.data.sessionId !== lobbies.getOwner(roomId)) return;

		switch (setting) {
			case "rounds":
				if (newValue < 1 || newValue > 10) return;
				lobbies.setRounds(roomId, newValue);
				io.in(roomId).emit("lobby:settingsUpdated", {
					setting: "rounds",
					value: newValue,
				});
				break;
			case "secondsPerRound":
				if (newValue < 20 || newValue > 180) return;
				lobbies.setSecondsPerRound(roomId, newValue);
				io.in(roomId).emit("lobby:settingsUpdated", {
					setting: "secondsPerRound",
					value: newValue,
				});
				break;
		}
	};

	socket.on("disconnecting", disconnecting);
	socket.on("lobby:create", createLobby);
	socket.on("lobby:join", joinLobby);
	socket.on("lobby:updateSettings", changeSettings);
	socket.on("players:list", playerList);
};
