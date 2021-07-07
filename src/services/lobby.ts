interface Lobby {
	id: string,
	owner: string
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

	public addLobby(id: string, owner: string): void {
		this.data.set(id, {id, owner});
	}

	public has(roomId: string): boolean {
		if (this.data.has(roomId)) return true;
		return false;
	}

	public removeLobby(roomId: string): boolean {
		return this.data.delete(roomId);
	}

	public getAll(): Array<Lobby> {
		return Array.from(this.data.values());
	}
}
