interface SESSIONS {
    [key: string]: ColfSession
}

interface Config {
    INGAME_NAME: string
    WEBHOOK_URL: string
    FLIP_ACTION_DELAY: number
    USE_COFL_CHAT: boolean
    SESSIONS: SESSIONS
}

interface ColfSession {
    id: string
    expires: Date
}
