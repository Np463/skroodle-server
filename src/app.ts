import express from "express";
import http from "http";
import { Server } from "socket.io";
import lobbyRoutes from "./routes/lobby";
import { Socket } from "./services/socket";

const PORT: number = parseInt(process.env.PORT as string, 10) || 8080;

const app = express();
const server = http.createServer(app);
const io = Socket.init(server);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
	// res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
	next();
})

app.use(lobbyRoutes);

server.listen(PORT, () => {
	console.log(`Server listening on port ${PORT}`);
});
