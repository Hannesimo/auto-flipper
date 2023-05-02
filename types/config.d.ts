interface SESSIONS {
    [key: string]: ColfSession
}

interface Config {
    INGAME_NAME: string
    WEBHOOK_URL: string
    SESSIONS: SESSIONS
}

interface ColfSession {
    id: string
    expires: Date
}
