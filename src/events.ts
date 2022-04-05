import { Socket } from "socket.io";
import registerLobbyEvents from "./handlers/lobby";
import registerSessionEvents from "./handlers/session";
import registerGameEvents from "./handlers/game";

export const registerEvents = (socket: Socket) => {
	registerSessionEvents(socket);
	registerLobbyEvents(socket);
	registerGameEvents(socket);
};
