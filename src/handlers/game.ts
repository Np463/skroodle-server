import { Socket } from "socket.io";
import { LobbyDatabase } from "../services/lobby";
import { Socket as SocketService } from "../services/socket";
import { GameService } from "../services/game";

export default (socket: Socket) => {
	const lobbies = LobbyDatabase.getInstance();
	const io = SocketService.getIO();
	const games = GameService.getInstance();

	const startGame = async (roomId: string) => {
		let ownerId = lobbies.getOwner(roomId);
		if (socket.data.sessionId === ownerId) {
			io.in(roomId).emit("game:loading");
		} else {
			return socket.emit("lobby:error", {
				error: "Only the room creator can start the game.",
			});
		}
		const lobby = lobbies.get(roomId)!;
		const sockets = await io.in(roomId).fetchSockets();
		games.createGame(roomId, sockets, lobby.rounds, lobby.secondsPerRound);
	};

	const getState = async (roomId: string, callback: any) => {
		const sockets = await io.in(roomId).fetchSockets();
		for (let s of sockets) {
			if (s.data.sessionId === socket.data.sessionId) {
				const game = games.get(roomId)!;
				var gameState = game.getGameState();
				if (
					game.getDrawer() !== socket.data.sessionId &&
					game.getGameStateEnum() === 3
				) {
					let hiddenWord = gameState.word
						.split("")
						.map((l) => {
							if (l === " " || l === "-") return l;
							else return "_";
						})
						.join("");
					gameState.word = hiddenWord;
				}
				return callback(gameState);
			}
		}
	};

	const chooseWord = (roomId: string, word: number) => {
		var game = games.get(roomId);
		if (!game || game.getDrawer() !== socket.data.sessionId) return;
		if (word < 0 || word > 2) return;
		game.setWord(word);
	};

	const canvasDraw = ({
		roomId,
		index,
		point,
	}: {
		roomId: string;
		index: number;
		point: number[];
	}) => {
		var game = games.get(roomId);
		if (
			!game ||
			game.getDrawer() !== socket.data.sessionId ||
			game.getGameStateEnum() !== 3
		)
			return;
		game.addCanvasPoint(index, point);
		// socket.to(roomId).emit("game:addPoint", { index, point });
	};

	const clearCanvas = (roomId: string) => {
		var game = games.get(roomId);
		if (
			!game ||
			game.getDrawer() !== socket.data.sessionId ||
			game.getGameStateEnum() !== 3
		)
			return;
		game.clearCanvas();
		io.in(roomId).emit("game:clearCanvas");
	};

	const undo = (roomId: string) => {
		var game = games.get(roomId);
		if (
			!game ||
			game.getDrawer() !== socket.data.sessionId ||
			game.getGameStateEnum() !== 3
		)
			return;
		game.undo();
		io.in(roomId).emit("game:undo");
	};

	const sendChatMessage = (roomId: string, message: string) => {
		var game = games.get(roomId);
		if (!game) return;
		if (
			game.getGameStateEnum() === 3 &&
			game.getDrawer() === socket.data.sessionId
		)
			return;
		if (
			game.getGameStateEnum() === 3 &&
			!game.hasGuessedCorrectly(socket.data.userId) &&
			game.guessWord(message, socket)
		) {
			io.in(roomId).emit("game:sendChatMessage", {
				type: "correct_guess",
				message: `${socket.data.username} guessed correctly!`,
			});
		} else {
			io.in(roomId).emit("game:sendChatMessage", {
				username: socket.data.username,
				message: message,
			});
		}
	};

	socket.on("lobby:startGame", startGame);
	socket.on("game:getState", getState);
	socket.on("game:chooseWord", chooseWord);
	socket.on("game:canvasDraw", canvasDraw);
	socket.on("game:clearCanvas", clearCanvas);
	socket.on("game:undo", undo);
	socket.on("game:sendChatMessage", sendChatMessage);
};
