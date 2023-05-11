import readline from 'readline'
import { getConfigProperty } from './configHelper'

export function setupConsoleInterface(ws: WebSocket) {
    if (!getConfigProperty('USE_COFL_CHAT')) {
        return
    }

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    })

    rl.on('line', input => {
        let info = JSON.stringify({
            type: 'chat',
            data: `"${input}"`
        })
        ws.send(info)
    })
}
