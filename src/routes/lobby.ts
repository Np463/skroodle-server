import express from "express";
import * as LobbyController from "../controllers/lobby";

const router = express.Router();

router.post("/lobby", LobbyController.createLobby);

export default router;
