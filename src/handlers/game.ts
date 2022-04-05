import { Socket } from "socket.io";
import { LobbyDatabase } from "../services/lobby";
import { Socket as SocketService } from "../services/socket";
import { GameService } from "../services/game";

export default (socket: Socket) => {
	const lobbies = LobbyDatabase.getInstance();
	const io = SocketService.getIO();
	const games = GameService.getInstance();

	const startGame = (roomId: any) => {
		//create a new game instance
		//gameId = game.create();
		//Check if owner
		let ownerId = lobbies.getOwner(roomId);
		if (socket.data.sessionId === ownerId) {
			io.in(roomId).emit("game:loading");
		} else {
			return socket.emit("lobby:error", {
				error: "Only the room creator can start the game.",
			});
		}
		let dueDate = Date.now() + 5 * 1000;
		io.in(roomId).emit("game:starting", dueDate);
	};

	socket.on("lobby:startGame", startGame);
};
