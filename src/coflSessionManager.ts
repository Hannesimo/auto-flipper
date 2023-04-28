import { getConfigProperty, updatePersistentConfigProperty } from './configHelper'
import crypto from 'crypto'

const SESSIONS_KEY = 'SESSIONS'

export function getSessionId(username: string): string {
    let sessions = getConfigProperty(SESSIONS_KEY) as SESSIONS

    if (!sessions) {
        sessions = {}
        updatePersistentConfigProperty(SESSIONS_KEY, {})
    }

    if (!sessions[username]) {
        sessions[username] = {
            id: crypto.randomUUID(),
            expires: new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 180)
        }
        updatePersistentConfigProperty(SESSIONS_KEY, sessions)
    }

    if (isExpired(sessions[username].expires)) {
        delete sessions[username]
        updatePersistentConfigProperty(SESSIONS_KEY, sessions)
        return null
    } else {
        return sessions[username].id
    }
}

export function isExpired(date: Date) {
    return date.getTime() < new Date().getTime()
}
