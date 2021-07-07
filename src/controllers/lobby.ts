import { RequestHandler } from "express";
import { LobbyDatabase } from "../services/lobby";

export const createLobby: RequestHandler = (req, res) => {
	// let lobbyId: string;
	// const db = LobbyDatabase.getInstance();
	// do {
	// 	lobbyId = Math.random().toString(36).slice(2, 7);
	// } while (db.has(lobbyId));
	// db.addLobby(lobbyId);
	// res.send({ lobbyId: lobbyId });
};
