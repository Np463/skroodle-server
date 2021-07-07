import { Socket } from "socket.io";

export default (socket: Socket) => {
	socket.emit("session", {
		sessionId: socket.data.sessionId,
		userId: socket.data.userId,
	});
};
