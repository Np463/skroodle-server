import express from "express";
import http from "http";
import lobbyRoutes from "./routes/lobby";
import { Socket } from "./services/socket";
import { SessionStore } from "./services/session";
import { LobbyDatabase } from "./services/lobby";
import { GameService } from "./services/game";
import { registerEvents } from "./events";
import { v4 as uuid } from "uuid";
import cors from "cors";

const PORT: number = 5000;

const app = express();
const server = http.createServer(app);
const io = Socket.init(server);
const sessionStore = SessionStore.getInstance();
const lobbyDatabase = LobbyDatabase.getInstance();
const gameService = GameService.getInstance();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(
	cors({
		origin: [
			"http://localhost:3000",
			"https://skroodle.io",
			"https://skroodle.com",
		],
	})
);

app.use(lobbyRoutes);

io.use((socket, next) => {
	let sessionId = socket.handshake.auth.sessionId;
	const username = socket.handshake.auth.username;
	console.log("sessionId: ", sessionId);
	console.log("username: ", username);
	if (sessionId) {
		const session = sessionStore.findSession(sessionId);
		console.log("session: ", session);
		if (session) {
			console.log("found session");
			socket.data.sessionId = sessionId;
			socket.data.userId = session.userId;
			socket.data.username = username;
			return next();
		}
	}
	if (!username) {
		return next(new Error("invalid username"));
	}
	do {
		sessionId = uuid();
	} while (sessionStore.findSession(sessionId));
	socket.data.sessionId = sessionId;
	socket.data.userId = uuid();
	socket.data.username = username;
	sessionStore.saveSession(socket.data.sessionId, {
		userId: socket.data.userId,
		username: socket.data.username,
	});
	next();
});

io.on("connection", registerEvents);

server.listen(PORT, () => {
	console.log(`Server listening on port ${PORT}`);
});
