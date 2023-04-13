import { ScoreBoard } from 'mineflayer'
import { createBot } from 'mineflayer'
import { createFastWindowClicker } from './fastWindowClick'
import { addLoggerToClientWriteFunction, debug, logMcChat } from './logger'
import { clickWindow, getWindowTitle, sleep } from './utils'
import { onWebsocketCreateAuction } from './sellHandler'
import { tradePerson } from './tradeHandler'
import { swapProfile } from './swapProfileHandler'
import { flipHandler } from './flipHandler'
import { registerIngameMessageHandler } from './ingameMessageHandler'
import { MyBot, TextMessageData } from '../types/autobuy'
const WebSocket = require('ws')
require('dotenv').config()

const ingameName = 'MercuryPickles'
const version = '1.5.0-af'
let wss: WebSocket

const bot: MyBot = createBot({
    username: ingameName,
    auth: 'microsoft',
    logErrors: true,
    version: '1.8.9',
    host: 'mc.hypixel.net'
})
bot.state = 'gracePeriod'
createFastWindowClicker(bot._client)

if (process.env.LOG_PACKAGES === 'true') {
    addLoggerToClientWriteFunction(bot._client)
}

bot.once('login', () => {
    wss = new WebSocket(`wss://sky.coflnet.com/modsocket?player=${ingameName}&version=${version}`)
    wss.onmessage = onWebsocketMessage
})

bot.once('spawn', async () => {
    await bot.waitForChunksToLoad()
    await sleep(2000)
    bot.chat('/play sb')
    bot.on('scoreboardTitleChanged', onScoreboardChanged)
    registerIngameMessageHandler(bot)
})

async function onWebsocketMessage(msg) {
    let message = JSON.parse(msg.data)
    let data = JSON.parse(message.data)

    switch (message.type) {
        case 'flip':
            flipHandler(bot, data)
            break
        case 'chatMessage':
            for (let da of [...(data as TextMessageData[])]) {
                logMcChat(da.text)
            }
            break
        case 'writeToChat':
            logMcChat((data as TextMessageData).text)
            break
        case 'swapProfile':
            swapProfile(bot, data)
            break
        case 'createAuction':
            onWebsocketCreateAuction(bot, data)
            break
        case 'trade':
            tradePerson(bot, wss, data)
            break
        case 'tradeResponse':
            let tradeDisplay = (bot.currentWindow.slots[39].nbt.value as any).display.value.Name.value
            if (tradeDisplay.includes('Deal!') || tradeDisplay.includes('Warning!')) {
                await sleep(3400)
            }
            clickWindow(bot, 39)
            break
        case 'getInventory':
            debug('Uploading inventory...')
            wss.send(
                JSON.stringify({
                    type: 'uploadInventory',
                    data: JSON.stringify(bot.inventory)
                })
            )
            break
    }
}

async function onScoreboardChanged(scoreboard: ScoreBoard) {
    if (scoreboard.title.includes('SKYBLOCK')) {
        bot.removeListener('scoreboardTitleChanged', onScoreboardChanged)
        debug('Joined SkyBlock')
        setTimeout(() => {
            debug('Waited for grace period to end. Flips can now be bought.')
            bot.state = null
        }, 5500)
        await sleep(2500)
        bot.chat('/is')
    }
}
