export class LobbyDatabase {
	private static instance: LobbyDatabase;

	private data: Set<string>;

	private constructor() {
		this.data = new Set();
	}

	public static getInstance(): LobbyDatabase {
		if (!LobbyDatabase.instance) {
			LobbyDatabase.instance = new LobbyDatabase();
		}
		return LobbyDatabase.instance;
	}

	public addLobby(lobbyId: string): void {
		this.data.add(lobbyId);
	}

	public has(lobbyId: string): boolean {
		if (this.data.has(lobbyId)) return true;
		return false;
	}

	public removeLobby(lobbyId: string): boolean {
		return this.data.delete(lobbyId);
	}

	public getAll(): Set<string> {
		return this.data;
	}
}
