import { createBot } from 'mineflayer'
import { createFastWindowClicker } from './fastWindowClick'
import { initLogger, log, printMcChatToConsole } from './logger'
import { clickWindow, isCoflChatMessage, removeMinecraftColorCodes, sleep } from './utils'
import { onWebsocketCreateAuction } from './sellHandler'
import { tradePerson } from './tradeHandler'
import { swapProfile } from './swapProfileHandler'
import { flipHandler, onItemWhitelistedMessage } from './flipHandler'
import { claimSoldItem, registerIngameMessageHandler } from './ingameMessageHandler'
import { MyBot, TextMessageData } from '../types/autobuy'
import { getConfigProperty, initConfigHelper, updatePersistentConfigProperty } from './configHelper'
import { getSessionId } from './coflSessionManager'
import { sendWebhookInitialized } from './webhookHandler'
import { handleCommand, setupConsoleInterface } from './consoleHandler'
import { initAFKHandler, tryToTeleportToIsland } from './AFKHandler'
import { runSequence } from './sequenceRunner'
const WebSocket = require('ws')
var prompt = require('prompt-sync')()
initConfigHelper()
initLogger()
const version = 'af-2.0.0'
let _websocket: WebSocket
let ingameName = getConfigProperty('INGAME_NAME')

if (!ingameName) {
    ingameName = prompt('Enter your ingame name: ')
    updatePersistentConfigProperty('INGAME_NAME', ingameName)
}

log(`Starting BAF v${version} for ${ingameName}`, 'info')
const bot: MyBot = createBot({
    username: ingameName,
    auth: 'microsoft',
    logErrors: true,
    version: '1.8.9',
    host: 'mc.hypixel.net'
})

bot.setMaxListeners(0)

bot.state = 'gracePeriod'
createFastWindowClicker(bot._client)

// Log packets
//addLoggerToClientWriteFunction(bot._client)

bot.on('kicked', (reason,_)=>log(reason, 'warn'))
bot.on('error', log)

bot.once('login', () => {
    log(`Logged in as ${bot.username}`)
    connectWebsocket()
    bot._client.on('packet', async function (packet, packetMeta) {
        if (packetMeta.name.includes('disconnect')) {
            let wss = await getCurrentWebsocket()
            wss.send(
                JSON.stringify({
                    type: 'report',
                    data: `"${JSON.stringify(packet)}"`
                })
            )
            printMcChatToConsole('§f[§4BAF§f]: §fYou were disconnected from the server...')
            printMcChatToConsole('§f[§4BAF§f]: §f' + JSON.stringify(packet))
        }
    })
})

bot.once('spawn', async () => {
    await bot.waitForChunksToLoad()
    await sleep(2000)
    bot.chat('/play sb')
    bot.on('scoreboardTitleChanged', onScoreboardChanged)
    registerIngameMessageHandler(bot)
})

function connectWebsocket(url: string = getConfigProperty('WEBSOCKET_URL')) {
    log(`Called connectWebsocket for ${url}`)
    _websocket = new WebSocket(`${url}?player=${bot.username}&version=${version}&SId=${getSessionId(ingameName)}`)
    _websocket.onopen = function () {
        log(`Opened websocket to ${url}`)
        setupConsoleInterface(bot)
        sendWebhookInitialized()
        updatePersistentConfigProperty('WEBSOCKET_URL', url)
    }
    _websocket.onmessage = function (msg) {
        try {
            onWebsocketMessage(msg)
        } catch (e) {
            log('Error while handling websocket message: ' + e, 'error')
            log('Message: ' + JSON.stringify(msg), 'error')
        }
    }
    _websocket.onclose = function (e) {
        printMcChatToConsole('§f[§4BAF§f]: §4Connection closed. Reconnecting...')
        log('Connection closed. Reconnecting... ', 'warn')
        setTimeout(function () {
            connectWebsocket()
        }, 1000)
    }
    _websocket.onerror = function (err) {
        log('Connection error: ' + JSON.stringify(err), 'error')
        _websocket.close()
    }
}

async function onWebsocketMessage(msg) {
    let message = JSON.parse(msg.data)
    let data = JSON.parse(message.data)

    switch (message.type) {
        case 'flip':
            log(message, 'debug')
            flipHandler(bot, data)
            break
        case 'chatMessage':
            if (data.length > 1 && data[1].text.includes('matched your Whitelist entry:') && !isCoflChatMessage(data[1].text)) {
                onItemWhitelistedMessage(data[1].text)
            }

            for (let da of [...(data as TextMessageData[])]) {
                let isCoflChat = isCoflChatMessage(da.text)
                if (!isCoflChat) {
                    log(message, 'debug')
                }
                if (getConfigProperty('USE_COFL_CHAT') || !isCoflChat) {
                    printMcChatToConsole(da.text)
                }
            }
            break
        case 'writeToChat':
            let isCoflChat = isCoflChatMessage(data.text)
            if (!isCoflChat) {
                log(message, 'debug')
            }
            if (getConfigProperty('USE_COFL_CHAT') || !isCoflChat) {
                printMcChatToConsole((data as TextMessageData).text)
            }
            break
        case 'swapProfile':
            log(message, 'debug')
            swapProfile(bot, data)

            break
        case 'createAuction':
            log(message, 'debug')
            onWebsocketCreateAuction(bot, data)
            break
        case 'trade':
            log(message, 'debug')
            tradePerson(bot, data)
            break
        case 'tradeResponse':
            let tradeDisplay = (bot.currentWindow.slots[39].nbt.value as any).display.value.Name.value
            if (tradeDisplay.includes('Deal!') || tradeDisplay.includes('Warning!')) {
                await sleep(3400)
            }
            clickWindow(bot, 39)
            break
        case 'getInventory':
            log('Uploading inventory...')
            let wss = await getCurrentWebsocket()
            wss.send(
                JSON.stringify({
                    type: 'uploadInventory',
                    data: JSON.stringify(bot.inventory)
                })
            )
            break
        case 'execute':
            log(message, 'debug')
            handleCommand(bot, data)
            break
        case 'runSequence':
            log(message, 'debug')
            break
        case 'privacySettings':
            log(message, 'debug')
            data.chatRegex = new RegExp(data.chatRegex)
            bot.privacySettings = data
            break
    }
}

bot.on('end', (reason) => {
    console.log(`Bot disconnected. Reason: ${reason}`);
    log(`Bot disconnected. Reason: ${reason}`, 'warn')
});

async function onScoreboardChanged() {
    if (
        bot.scoreboard.sidebar.items.map(item => item.displayName.getText(null).replace(item.name, '')).find(e => e.includes('Purse:') || e.includes('Piggy:'))
    ) {
        bot.removeListener('scoreboardTitleChanged', onScoreboardChanged)
        log('Joined SkyBlock')
        initAFKHandler(bot)
        setTimeout(async () => {
            let wss = await getCurrentWebsocket()
            log('Waited for grace period to end. Flips can now be bought.')
            bot.state = null
            bot.removeAllListeners('scoreboardTitleChanged')

            wss.send(
                JSON.stringify({
                    type: 'uploadScoreboard',
                    data: JSON.stringify(bot.scoreboard.sidebar.items.map(item => item.displayName.getText(null).replace(item.name, '')))
                })
            )
        }, 5500)
        await sleep(2500)
        tryToTeleportToIsland(bot, 0)

        await sleep(20000)
        // trying to claim sold items if sold while user was offline
        claimSoldItem(bot)
    }
}

export function changeWebsocketURL(newURL: string) {
    _websocket.onclose = () => {}
    _websocket.close()
    if (_websocket.readyState === WebSocket.CONNECTING || _websocket.readyState === WebSocket.CLOSING) {
        setTimeout(() => {
            changeWebsocketURL(newURL)
        }, 500)
        return
    }
    connectWebsocket(newURL)
}

export async function getCurrentWebsocket(): Promise<WebSocket> {
    if (_websocket.readyState === WebSocket.OPEN) {
        return _websocket
    }
    return new Promise(async resolve => {
        await sleep(1000)
        let socket = await getCurrentWebsocket()
        resolve(socket)
    })
}

