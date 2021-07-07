import http from "http";
import { Server } from "socket.io";

let io: Server;

export const Socket = {
	init: (httpServer: http.Server) => {
		io = new Server(httpServer, {
			cors: {
				origin: process.env.CLIENT_URL,
				methods: ["GET", "POST"]
			}
		});
		return io;
	},
	getIO: () => {
		if (!io) {
			throw new Error("Socket.io is not initialized!");
		}
		return io;
	},
};
