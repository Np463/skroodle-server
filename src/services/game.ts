// Stores data about a game. Round, Points, Chat?, Word, Timer, Drawer, Owner
class Game {
	private points: Map<string, number>;

	private rounds: number;
	private secondsPerRound: number;

	public constructor(rounds: number, secondsPerRound: number) {
		this.points = new Map<string, number>();
		this.rounds = rounds;
		this.secondsPerRound = secondsPerRound;
	}
}

export class GameService {
	private static instance: GameService;

	private games: Map<string, Game>;

	private constructor() {
		this.games = new Map();
	}

	public static getInstance(): GameService {
		if (!GameService.instance) {
			GameService.instance = new GameService();
		}
		return GameService.instance;
	}

	public createGame(
		roomId: string,
		rounds: number,
		secondsPerRound: number
	): void {
		let game = new Game(rounds, secondsPerRound);
		this.games.set(roomId, game);
	}

	public has(roomId: string): boolean {
		if (this.games.has(roomId)) return true;
		return false;
	}

	public removeGame(roomId: string): boolean {
		return this.games.delete(roomId);
	}

	public get(roomId: string): Game | undefined {
		return this.games.get(roomId);
	}
}
