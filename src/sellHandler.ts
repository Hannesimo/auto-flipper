import { MyBot, SellData } from '../types/autobuy'
import { debug } from './logger'
import { clickWindow, getWindowTitle } from './utils'

let setPrice = false
let durationSet = false
let retryCount = 0

export async function onWebsocketCreateAuction(bot: MyBot, data: SellData) {
    if (bot.state) {
        debug('Currently busy with something else (' + bot.state + ') -> not selling')
        if (retryCount > 3) {
            retryCount = 0
            return
        }
        setTimeout(() => {
            retryCount++
            onWebsocketCreateAuction(bot, data)
        }, 1000)
        return
    }
    bot.state = 'selling'
    debug('Selling item...')
    debug(data)
    sellItem(data, bot)
}

async function sellItem(data: SellData, bot: MyBot) {
    let handler = function (window: any) {
        debug('Going into handler')
        sellHandler(data, bot, window, () => {
            bot.removeListener('windowOpen', handler)
        })
    }
    bot.on('windowOpen', handler)
    bot.chat('/ah')
}

async function sellHandler(data: SellData, bot: MyBot, sellWindow, removeEventListenerCallback: Function) {
    debug('Going into sellHandler')
    let title = getWindowTitle(sellWindow)
    debug(title)
    if (title.toString().includes('Auction House')) {
        clickWindow(bot, 15)
    }
    if (title == 'Manage Auctions') {
        debug(sellWindow.slots)
        let clickSlot
        sellWindow.slots.forEach(item => {
            if (item && item.nbt.value.display.value.Name.value.includes('Create Auction')) clickSlot = item.slot
        })
        clickWindow(bot, clickSlot)
    }
    if (title == 'Create Auction') {
        clickWindow(bot, 48)
    }

    if (title == 'Create BIN Auction') {
        if (!setPrice && !durationSet) {
            if (!sellWindow.slots[13].nbt.value.display.value.Name.value.includes('Click on an item in your inventory!')) {
                clickWindow(bot, 13)
            }

            // calculate item slot, by calculating the slot index without the chest
            let itemSlot = data.slot - bot.inventory.inventoryStart + sellWindow.inventoryStart
            if (!sellWindow.slots[itemSlot]) {
                bot.state = null
                removeEventListenerCallback()
                debug('No item on index ' + itemSlot + ' found -> probably already sold')
                return
            }
            clickWindow(bot, itemSlot)
            bot._client.once('open_sign_entity', ({ location }) => {
                let price = (data as SellData).price
                debug('Price to set ' + Math.floor(price).toString())
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
            clickWindow(bot, 31)
            setPrice = true
        } else if (setPrice && !durationSet) {
            clickWindow(bot, 33)
        } else if (setPrice && durationSet) {
            clickWindow(bot, 29)
        }
    }
    if (title == 'Auction Duration') {
        setAuctionDuration(bot, data.duration).then(() => {
            durationSet = true
        })
        clickWindow(bot, 16)
    }
    if (title == 'Confirm BIN Auction') {
        debug('Successfully listed an item')
        clickWindow(bot, 11)
        removeEventListenerCallback()
        setPrice = false
        durationSet = false
        bot.state = null
    }
}

async function setAuctionDuration(bot: MyBot, time: number) {
    debug('setAuctionDuration function')
    return new Promise<void>(resolve => {
        bot._client.once('open_sign_entity', ({ location }) => {
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
