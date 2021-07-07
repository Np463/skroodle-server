interface Session {
	userId: string,
	username: string
}

export class SessionStore {
	private static instance: SessionStore;

	private sessions: Map<string, Session>;

	private constructor() {
		this.sessions = new Map();
	}

	public static getInstance() : SessionStore {
		if (!SessionStore.instance) {
			SessionStore.instance = new SessionStore();
		}
		return SessionStore.instance;
	}

	public findSession(sessionId: string) : Session | undefined {
		return this.sessions.get(sessionId);
	}

	public saveSession(sessionId: string, session: Session) : void {
		this.sessions.set(sessionId, session);
	}

}