import * as fs from "fs/promises";
import { RemoteSocket, Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { clearInterval } from "timers";
import { Socket as SocketService } from "./socket";

enum GameState {
	GameStart,
	RoundSetup,
	TurnSetup,
	TurnStart,
	TurnEnd,
	RoundEnd,
	GameEnd,
}
// Stores data about a game. Round, Points, Chat?, Word, Timer, Drawer, Owner
class Game {
	private roomId: string;
	private canvasPoints: any;
	private scoreboard: Map<string, number>;
	private players: RemoteSocket<DefaultEventsMap>[];
	private rounds: number;
	private secondsPerRound: number;
	private createdAt: number;

	private currentRound: number = 0;
	private roundDueDate: number = 0;
	private word: string = "";
	private wordChoices: string[] = [];
	private drawer!: RemoteSocket<DefaultEventsMap>;
	private remainingDrawers: RemoteSocket<DefaultEventsMap>[] = [];

	private gameState: GameState;
	private wordsList: WordsList;

	private roundTimer!: NodeJS.Timeout;

	private pointsInterval!: NodeJS.Timeout;
	private startIndex: number = -1;
	private strokeStartIndex: number = -1;

	public constructor(
		roomId: string,
		players: RemoteSocket<DefaultEventsMap>[],
		rounds: number,
		secondsPerRound: number,
		wordList: WordsList
	) {
		this.roomId = roomId;
		this.scoreboard = new Map<string, number>();
		this.canvasPoints = new Array();
		this.players = players;
		this.rounds = rounds;
		this.secondsPerRound = secondsPerRound;
		this.createdAt = Date.now();
		this.gameState = GameState.GameStart;
		this.wordsList = wordList;
		this.processGame();
	}

	private async processGame() {
		switch (this.gameState) {
			case GameState.GameStart:
				this.roundDueDate = Date.now() + 1.5 * 1000;
				this.roundTimer = setInterval(() => {
					if (Date.now() >= this.roundDueDate) {
						clearInterval(this.roundTimer);
						SocketService.getIO()
							.in(this.roomId)
							.emit("game:starting", this.gameState);
						this.gameState = GameState.RoundSetup;
						this.processGame();
					}
				}, 100);
				break;
			case GameState.RoundSetup:
				if (this.currentRound === this.rounds) {
					this.gameState = GameState.GameEnd;
					this.processGame();
					break;
				}
				this.currentRound++;
				this.remainingDrawers = [...this.players];
				this.gameState = GameState.TurnSetup;
				this.processGame();
				break;
			case GameState.TurnSetup:
				if (this.remainingDrawers.length === 0) {
					this.gameState = GameState.RoundEnd;
					this.processGame();
					break;
				}
				this.drawer = this.remainingDrawers.pop()!;
				this.wordChoices = this.wordsList.getWords();

				this.roundDueDate = Date.now() + 10 * 1000;

				SocketService.getIO()
					.in(this.roomId)
					.emit("game:choosingWord", {
						drawer: {
							userId: this.drawer.data.userId,
							username: this.drawer.data.username,
						},
						dueDate: this.roundDueDate,
						round: this.currentRound,
						gameState: this.gameState,
					});
				this.drawer.emit("game:wordChoices", this.wordChoices);

				this.roundTimer = setInterval(() => {
					if (Date.now() >= this.roundDueDate) {
						clearInterval(this.roundTimer);
						this.word = this.wordChoices[Math.floor(Math.random() * 3)];
						this.gameState = GameState.TurnStart;
						this.processGame();
					}
				}, 100);
				break;
			case GameState.TurnStart:
				this.roundDueDate = Date.now() + this.secondsPerRound * 1000;
				let hiddenWord = this.word
					.split("")
					.map((l) => {
						if (l === " " || l === "-") return l;
						else return "_";
					})
					.join("");
				SocketService.getIO().in(this.roomId).emit("game:turnStart", {
					word: hiddenWord,
					dueDate: this.roundDueDate,
					gameState: this.gameState,
				});
				this.drawer.emit("game:selectedWord", this.word);
				this.roundTimer = setInterval(() => {
					if (Date.now() >= this.roundDueDate) {
						clearInterval(this.roundTimer);
						this.gameState = GameState.TurnEnd;
						this.processGame();
					}
				}, 100);
				this.pointsInterval = setInterval(() => {
					if (this.gameState !== GameState.TurnStart) return;
					let endIndex = this.canvasPoints.length - 1;
					let existingStroke = [];
					let newPoints = [];
					if (
						this.startIndex > -1 &&
						this.strokeStartIndex < this.canvasPoints[this.startIndex].length
					) {
						existingStroke = this.canvasPoints[this.startIndex].slice(
							this.strokeStartIndex + 1
						);
						this.strokeStartIndex = this.canvasPoints[endIndex].length - 1;
					}
					if (this.startIndex < endIndex) {
						newPoints = this.canvasPoints.slice(this.startIndex + 1);
						this.startIndex = endIndex;
						this.strokeStartIndex = this.canvasPoints[endIndex].length - 1;
					}
					if (existingStroke.length > 0 || newPoints.length > 0) {
						SocketService.getIO()
							.to(this.roomId)
							.except(this.drawer.id)
							.emit("game:addPoint", {
								existingStroke: existingStroke,
								newPoints: newPoints,
							});
					}
				}, 1000);
				break;
			case GameState.TurnEnd:
				clearInterval(this.pointsInterval);
				this.canvasPoints = new Array();
				this.startIndex = -1;
				this.strokeStartIndex = -1;
				this.roundDueDate = Date.now() + 5 * 1000;
				SocketService.getIO().in(this.roomId).emit("game:turnEnd", {
					word: this.word,
					dueDate: this.roundDueDate,
					gameState: this.gameState,
				});
				this.roundTimer = setInterval(() => {
					if (Date.now() >= this.roundDueDate) {
						clearInterval(this.roundTimer);
						this.gameState = GameState.TurnSetup;
						this.processGame();
					}
				}, 100);
				break;
			case GameState.RoundEnd:
				this.roundDueDate = Date.now() + 5 * 1000;
				SocketService.getIO().in(this.roomId).emit("game:roundEnd", {
					dueDate: this.roundDueDate,
					gameState: this.gameState,
				});
				this.roundTimer = setInterval(() => {
					if (Date.now() >= this.roundDueDate) {
						clearInterval(this.roundTimer);
						this.gameState = GameState.RoundSetup;
						this.processGame();
					}
				}, 100);
				break;
			case GameState.GameEnd:
				this.roundDueDate = Date.now() + 60 * 1000;
				SocketService.getIO().in(this.roomId).emit("game:gameEnd", {
					dueDate: this.roundDueDate,
					gameState: this.gameState,
				});
				this.roundTimer = setInterval(() => {
					if (Date.now() >= this.roundDueDate) {
						clearInterval(this.roundTimer);
					}
				}, 100);
				break;
		}
	}

	public setWord(wordChoice: number): void {
		if (this.gameState != GameState.TurnSetup) return;
		this.word = this.wordChoices[wordChoice];
		clearInterval(this.roundTimer);
		this.gameState = GameState.TurnStart;
		this.processGame();
	}

	public getDrawer(): RemoteSocket<DefaultEventsMap> {
		return this.drawer;
	}

	public getGameState() {
		return {
			scoreboard: Array.from(this.scoreboard.entries()),
			canvasPoints: this.canvasPoints,
			players: this.players.map((s) => ({
				userId: s.data.userId,
				username: s.data.username,
			})),
			rounds: this.rounds,
			currentRound: this.currentRound,
			dueDate: this.roundDueDate,
			drawer: this.drawer
				? {
						userId: this.drawer.data.userId,
						username: this.drawer.data.username,
				  }
				: null,
			word: this.word,
			gameState: this.gameState,
		};
	}

	public getGameStateEnum() {
		return this.gameState;
	}

	public addCanvasPoint(index: number, point: number[]) {
		if (!this.canvasPoints[index]) {
			this.canvasPoints[index] = [point];
		} else {
			this.canvasPoints[index].push(point);
		}
	}

	public clearCanvas() {
		this.canvasPoints = [];
		this.startIndex = -1;
		this.strokeStartIndex = -1;
	}

	public undo() {
		if (
			this.startIndex >= 0 &&
			this.startIndex === this.canvasPoints.length - 1
		) {
			this.startIndex--;
			if (this.startIndex >= 0) {
				this.strokeStartIndex = this.canvasPoints[this.startIndex].length - 1;
			} else {
				this.strokeStartIndex = -1;
			}
		}
		this.canvasPoints.pop();
	}
}

class WordsList {
	private words: string[] = [];

	public constructor() {
		this.populateWords();
	}

	public async populateWords() {
		let wordsList: string[] = [];
		try {
			const data = await fs.readFile("words.txt", { encoding: "utf8" });
			this.words = data.split(/\n/);
		} catch (err) {
			console.error(err);
		}
	}

	public getWords(): string[] {
		let w = [];
		for (let i = 0; i < 3; i++) {
			w.push(this.words[Math.floor(Math.random() * this.words.length)]);
		}
		return w;
	}
}

export class GameService {
	private static instance: GameService;

	private games: Map<string, Game>;

	private wordsList: WordsList;

	private constructor() {
		this.games = new Map();
		this.wordsList = new WordsList();
	}

	public static getInstance(): GameService {
		if (!GameService.instance) {
			GameService.instance = new GameService();
		}
		return GameService.instance;
	}

	public createGame(
		roomId: string,
		players: RemoteSocket<DefaultEventsMap>[],
		rounds: number,
		secondsPerRound: number
	): void {
		let game = new Game(
			roomId,
			players,
			rounds,
			secondsPerRound,
			this.wordsList
		);
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
