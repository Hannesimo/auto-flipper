interface SESSIONS {
    [key: string]: ColfSession
}

interface Config {
    INGAME_NAME: string
    WEBHOOK_URL: string
    FLIP_ACTION_DELAY: number
    USE_COFL_CHAT: boolean
    ENABLE_CONSOLE_INPUT: boolean
    SESSIONS: SESSIONS
    WEBSOCKET_URL: string
    BED_MULTIPLE_CLICKS_DELAY: number
}

interface ColfSession {
    id: string
    expires: Date
}
