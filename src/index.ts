import { ScoreBoard } from 'mineflayer'
const { mineflayer: mineflayerViewer } = require('prismarine-viewer')
import { createBot } from 'mineflayer'
import { createFastWindowClicker, getWindowTitle } from './fastWindowClick'
import { addLoggerToClientWriteFunction, debug, logMcChat } from './logger'
const WebSocket = require('ws')
require('dotenv').config()

const ingameName = 'MercuryPickles'
const version = '1.4.3-Alpha'
const wss = new WebSocket(`wss://sky.coflnet.com/modsocket?player=${ingameName}&version=${version}`)

let durationSet = false
let data
let itemName: string
let setPrice = false
let lastCommand: string
let lastTargetPrice: number
let isCurrentlyPurchasing: boolean = false

const bot = createBot({
    username: 'bot',
    auth: 'microsoft',
    logErrors: true,
    version: '1.8.9',
    host: 'mc.hypixel.net'
})

const windowClicker = createFastWindowClicker(bot._client)
if (process.env.LOG_PACKAGES === 'true') {
    addLoggerToClientWriteFunction(bot._client)
}

bot.once('spawn', async () => {
    mineflayerViewer(bot, { port: 3007, firstPerson: false })
    await bot.waitForChunksToLoad()
    await sleep(2000)
    bot.chat('/play sb')
    bot.on('scoreboardTitleChanged', onScoreboardChanged)
    bot.on('message', (message, type) => {
        let text = message.getText(null)

        if (type == 'chat') {
            logMcChat(message.toAnsi())
            if (text.startsWith('You purchased')) {
                debug('New item purchased')
                bot.chat(lastCommand)
            }
            if (text.startsWith('You claimed') && text.includes('from')) {
                debug('Claimed item -> relist')
                let itemname = text.split('You claimed ')[1].split(' from')[0]
                sellItem({ itemName: itemname, price: lastTargetPrice, duration: 24 })
            }
            if (text.startsWith('[Auction]') && text.includes('bought') && text.includes('for')) {
                debug('New item sold')
                claimItem(text.split(' bought ')[1].split(' for ')[0])
            }
        }
    })
})

wss.onmessage = msg => {
    let data = JSON.parse(msg.data)
    data.data = JSON.parse(data.data)

    switch (data.type) {
        case 'flip':
            // Timeout of 1 second after trying to buy one flip to not disrupt buying process
            // TODO: Optimize to end lock after purchase was successful or failed
            if (isCurrentlyPurchasing) {
                setTimeout(() => {
                    isCurrentlyPurchasing = false
                }, 1000)
                return
            }
            isCurrentlyPurchasing = true
            lastCommand = data.data.messages[0]['onClick']
            let messageParts: string[] = data.data.messages[0]['text'].split(' ')
            let arrowIndex = messageParts.indexOf('->')
            lastTargetPrice = parseInt(messageParts[arrowIndex + 1].replace(/,/g, ''))

            bot.chat(data.data.messages[0]['onClick'])
            setTimeout(() => {
                windowClicker.click_purchase(data.data.startingBid)
                setTimeout(() => {
                    windowClicker.click_confirm(data.data.startingBid, data.data.itemName)
                }, 50)
            }, 50)
            break
        case 'chatMessage':
        case 'writeToChat':
            for (let da of [...data.data]) {
                logMcChat(da.text)
            }
            break
        case 'swapProfile':
            swapProfile(data.data)
            break
        case 'sellItem':
            sellItem(data.data)
            break
        case 'trade':
            tradePerson(data.data)
            break
        case 'getInventory':
            // TODO send this: bot.inventory.slots
            break
    }
}

async function onScoreboardChanged(scoreboard: ScoreBoard) {
    if (scoreboard.title.includes('SKYBLOCK')) {
        bot.removeListener('scoreboardTitleChanged', onScoreboardChanged)
        debug('Joined SkyBlock')
        await sleep(2500)
        bot.chat('/is')
    }
}

async function tradePerson(data: TradeData) {
    let addedCoins = false
    let addedItems = false
    let trading = true
    while (trading) {
        bot.chat('/trade ' + data.target)

        bot.on('message', async msgE => {
            let msg = msgE.getText(null)

            if (msg == 'You cannot trade while the server is lagging!') {
                bot.chat('The server is lagging, give it a second')
                await sleep(5000)
            } else if (msg.startsWith('Cannot find player named')) {
                debug('Player is not avaliable to trade with, please rerequest when they are capable of trading')
                trading = false
                return
            } else if (msg == 'You are too far away to trade with that player!') {
                bot.chat('Hey ' + data.target + ' come here so we can trade!')
            } else if (msg.startsWith('You have sent a trade request to ')) {
                debug('successfully sent trade, waiting for them to accept')
                bot.on('windowOpen', async window => {
                    trading = false

                    debug('Trade window opened')
                    if (!addedItems) {
                        for (let slot of data.slots) {
                            slot += 44
                            clickWindow(slot)
                            debug('Clicked slot ' + slot)
                        }
                        debug('Added all items')
                    }
                    if (data.coins > 0 && !addedCoins) {
                        bot._client.once('open_sign_entity', ({ location }) => {
                            let price = data.coins
                            debug('New sign entity')
                            debug('price to set ' + Math.floor(price).toString())
                            bot._client.write('update_sign', {
                                location: {
                                    x: location.z,
                                    y: location.y,
                                    z: location.z
                                },
                                text1: `\"${Math.floor(price).toString()}\"`,
                                text2: '{"italic":false,"extra":["^^^^^^^^^^^^^^^"],"text":""}',
                                text3: '{"italic":false,"extra":["Your auction"],"text":""}',
                                text4: '{"italic":false,"extra":["starting bid"],"text":""}'
                            })
                            addedCoins = true
                        })
                        clickWindow(36)
                    }
                    if (!(data.coins > 0) || addedCoins) {
                        wss.emit({ type: 'affirmFlip', data: [JSON.stringify(window.slots)] })
                        let res = await new Promise(function (resolve, reject) {
                            wss.onmessage = message => {
                                if (JSON.parse(message).type == 'tradeResponse') {
                                    resolve(JSON.parse(message).data)
                                }
                            }
                        })
                        if (!res) {
                            return
                        }
                        await sleep(500)
                        if (
                            (window.slots[39].nbt.value as any).display.value.Name.value.includes('Deal!') ||
                            (window.slots[39].nbt.value as any).display.value.Name.value.includes('Warning!')
                        ) {
                            await sleep(3400)
                        }
                        clickWindow(39)
                    }
                })
            }
        })

        await sleep(5000)
    }
}

async function claimItem(item: string) {
    itemName = item
    bot.chat('/ah')
    bot.on('windowOpen', claimHandler)
}

async function sellItem(sellData: SellData) {
    data = sellData
    bot.chat('/ah')
    bot.on('windowOpen', sellHandler)
}

async function claimHandler(window) {
    let title = getWindowTitle(window)
    if (title.toString().includes('Auction House')) {
        clickWindow(15)
    }
    if (title == 'Manage Auctions') {
        let clickSlot

        window.slots.forEach(item => {
            if (item && item.nbt.value.display.value.Name.value.includes(itemName) && JSON.stringify(item.nbt.value.display.value.Lore).includes('Sold for'))
                clickSlot = item.slot
        })
        clickWindow(clickSlot)
    }
}

async function sellHandler(sellWindow) {
    let title = getWindowTitle(sellWindow)
    if (title.toString().includes('Auction House')) {
        clickWindow(15)
    }
    if (title == 'Manage Auctions') {
        let clickSlot
        sellWindow.slots.forEach(item => {
            if (item && item.nbt.value.display.value.Name.value.includes('Create Auction')) clickSlot = item.slot
        })
        clickWindow(clickSlot)
    }
    if (title == 'Create Auction') {
        clickWindow(48)
    }

    if (title == 'Create BIN Auction') {
        if (!setPrice && !durationSet) {
            if (!sellWindow.slots[13].nbt.value.display.value.Name.value.includes('Click on an item in your inventory!')) {
                clickWindow(13)
            }
            let clickSlot
            debug(data)
            sellWindow.slots.forEach(item => {
                if (item && item.nbt.value.display?.value.Name.value.includes(data.itemName)) clickSlot = item.slot
            })
            clickWindow(clickSlot)
            debug('added item')
            bot._client.once('open_sign_entity', ({ location }) => {
                let price = data.price
                debug('New sign entity')
                debug('price to set ' + Math.floor(price).toString())
                bot._client.write('update_sign', {
                    location: {
                        x: location.z,
                        y: location.y,
                        z: location.z
                    },
                    text1: `\"${Math.floor(price).toString()}\"`,
                    text2: '{"italic":false,"extra":["^^^^^^^^^^^^^^^"],"text":""}',
                    text3: '{"italic":false,"extra":["Your auction"],"text":""}',
                    text4: '{"italic":false,"extra":["starting bid"],"text":""}'
                })
            })
            debug('opening pricer')
            clickWindow(31)
            setPrice = true
        } else if (setPrice && !durationSet) {
            clickWindow(33)
        } else if (setPrice && durationSet) {
            clickWindow(29)
        }
    }
    if (title == 'Auction Duration') {
        clickWindow(16)
        setAuctionDuration(data.duration).then(() => {
            durationSet = true
        })
    }
    if (title == 'Confirm BIN Auction') {
        clickWindow(11)
        debug('Successfully listed an item')
        bot.removeListener('windowOpen', sellHandler)
        setPrice = false
        durationSet = false
    }
}

async function setAuctionDuration(time: number) {
    return new Promise<void>(resolve => {
        bot._client.once('open_sign_entity', ({ location }) => {
            debug('New sign entity')
            bot._client.write('update_sign', {
                location: {
                    x: location.z,
                    y: location.y,
                    z: location.z
                },
                text1: `\"${Math.floor(time).toString()}\"`,
                text2: '{"italic":false,"extra":["^^^^^^^^^^^^^^^"],"text":""}',
                text3: '{"italic":false,"extra":["Auction"],"text":""}',
                text4: '{"italic":false,"extra":["hours"],"text":""}'
            })
            resolve()
        })
    })
}

async function swapProfile(data: SwapData) {
    bot.setQuickBarSlot(8)
    bot.activateItem()
    bot.on('windowOpen', window => {
        let title = getWindowTitle(window)
        if (title == 'SkyBlock Menu') {
            clickWindow(48)
        }
        if (title == 'Profile Management') {
            let clickSlot
            window.slots.forEach(item => {
                if (item && (item.nbt.value as any).display.value.Name.value.includes(data.profile)) clickSlot = item.slot
            })
            debug('Clickslot is ' + clickSlot)
            clickWindow(clickSlot)
        }
        if (title.includes('Profile:')) {
            clickWindow(11)
            debug('Successfully swapped profiles')
        }
    })
}

async function clickWindow(slot: number) {
    return bot.clickWindow(slot, 0, 0)
}

async function sleep(ms: number): Promise<void> {
    return await new Promise(resolve => setTimeout(resolve, ms))
}
