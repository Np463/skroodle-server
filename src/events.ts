import { Socket } from "socket.io";
import registerLobbyEvents from './handlers/lobby';
import registerSessionEvents from './handlers/session';

export const registerEvents = (socket: Socket) => {
	registerSessionEvents(socket);
	registerLobbyEvents(socket);
}