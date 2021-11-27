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

	public addLobby(roomId: string): void {
		this.data.add(roomId);
	}

	public has(roomId: string): boolean {
		if (this.data.has(roomId)) return true;
		return false;
	}

	public removeLobby(roomId: string): boolean {
		return this.data.delete(roomId);
	}

	public getAll(): Array<string> {
		return Array.from(this.data.values());
	}
}
