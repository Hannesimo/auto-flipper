import readline from 'readline'
import { getConfigProperty } from './configHelper'
import { MyBot } from '../types/autobuy'
import { changeWebsocketURL, getCurrentWebsocket } from './BAF'
import { claimPurchased } from './ingameMessageHandler'
import { printMcChatToConsole } from './logger'
import { sleep } from './utils'

let consoleSetupFinished = false

export function setupConsoleInterface(bot: MyBot) {
    if (!getConfigProperty('ENABLE_CONSOLE_INPUT') || consoleSetupFinished) {
        return
    }
    consoleSetupFinished = true

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    })

    rl.on('line', async input => {
        let ws = await getCurrentWebsocket()
        let lowercaseInput = input.toLowerCase()
        if ((lowercaseInput?.startsWith('/cofl') || lowercaseInput?.startsWith('/baf')) && lowercaseInput?.split(' ').length >= 2) {
            handleCommand(bot, input)
            return
        }
        if (input?.startsWith('/')) {
            bot.chat(input)
            return
        }
        ws.send(
            JSON.stringify({
                type: 'chat',
                data: `"${input}"`
            })
        )
    })
}

export async function handleCommand(bot: MyBot, data: string) {
    let wss = await getCurrentWebsocket()
    let lowercaseInput = data.toLowerCase()
    if ((lowercaseInput?.startsWith('/cofl') || lowercaseInput?.startsWith('/baf')) && data?.split(' ').length >= 2) {
        let splits = data.split(' ')
        splits.shift() // remove /cofl
        let command = splits.shift()

        if (command === 'connect') {
            changeWebsocketURL(splits[0])
            return
        }
        if (command === 'forceClaim') {
            printMcChatToConsole(`§f[§4BAF§f]: §fForce claiming...`)
            let canStillClaim = true
            while (canStillClaim) {
                try {
                    canStillClaim = await claimPurchased(bot, false)
                    await sleep(1000)
                } catch (e) {
                    canStillClaim = false
                    printMcChatToConsole(`§f[§4BAF§f]: §fRan into error while claiming. Please check your logs or report this to the developer.`)
                }
            }
            printMcChatToConsole(`§f[§4BAF§f]: §fFinished claiming.`)
            return
        }

        wss.send(
            JSON.stringify({
                type: command,
                data: `"${splits.join(' ')}"`
            })
        )
    } else {
        bot.chat(data)
    }
}
