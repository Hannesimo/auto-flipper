import readline from 'readline'

export function setupConsoleInterface(ws: WebSocket) {
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
