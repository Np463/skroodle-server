interface Lobby {
	owner: string;
	roomId: string;
	rounds: number;
	secondsPerRound: number;
}

export class LobbyDatabase {
	private static instance: LobbyDatabase;

	private data: Map<string, Lobby>;

	private constructor() {
		this.data = new Map();
	}

	public static getInstance(): LobbyDatabase {
		if (!LobbyDatabase.instance) {
			LobbyDatabase.instance = new LobbyDatabase();
		}
		return LobbyDatabase.instance;
	}

	public createLobby(sessionId: string): Lobby {
		let roomId: string;
		do {
			roomId = Math.random().toString(36).slice(2, 7);
		} while (this.data.has(roomId));
		this.data.set(roomId, {
			owner: sessionId,
			roomId,
			rounds: 4,
			secondsPerRound: 90,
		});
		return this.data.get(roomId)!;
	}

	public has(roomId: string): boolean {
		if (this.data.has(roomId)) return true;
		return false;
	}

	public get(roomId: string): Lobby | undefined {
		return this.data.get(roomId);
	}

	public removeLobby(roomId: string): boolean {
		console.log("Deleting lobby: " + roomId);
		return this.data.delete(roomId);
	}

	public getOwner(roomId: string): string {
		if (this.data.has(roomId)) {
			return this.data.get(roomId)!.owner;
		}
		return "";
	}

	public getAll(): Array<Lobby> {
		return Array.from(this.data.values());
	}

	public setOwner(roomId: string, sessionId: string): void {
		if (this.data.has(roomId)) {
			let lobby = this.data.get(roomId)!;
			this.data.set(roomId, { ...lobby, owner: sessionId });
		}
	}

	public setRounds(roomId: string, rounds: number): void {
		if (this.data.has(roomId)) {
			let lobby = this.data.get(roomId)!;
			this.data.set(roomId, { ...lobby, rounds: rounds });
		}
	}

	public setSecondsPerRound(roomId: string, secondsPerRound: number): void {
		if (this.data.has(roomId)) {
			let lobby = this.data.get(roomId)!;
			this.data.set(roomId, { ...lobby, secondsPerRound: secondsPerRound });
		}
	}
}
