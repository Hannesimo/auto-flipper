import { MyBot, SellData } from '../types/autobuy'
import { log } from './logger'
import { clickWindow, getWindowTitle, numberWithThousandsSeparators } from './utils'
import { sendWebhookItemListed } from './webhookHandler'

let setPrice = false
let durationSet = false
let retryCount = 0

export async function onWebsocketCreateAuction(bot: MyBot, data: SellData) {
    if (bot.state) {
        log('Currently busy with something else (' + bot.state + ') -> not selling')
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
    log('Selling item...')
    log(data)
    sellItem(data, bot)
}

async function sellItem(data: SellData, bot: MyBot) {
    let timeout = setTimeout(() => {
        log('Seems something went wrong while selling. Removing lock')
        bot.state = null
        bot.removeAllListeners('windowOpen')
    }, 10000)

    let handler = function (window: any) {
        sellHandler(data, bot, window, () => {
            clearTimeout(timeout)
            bot.removeAllListeners('windowOpen')
        })
    }
    bot.on('windowOpen', handler)
    bot.chat('/ah')
}

async function sellHandler(data: SellData, bot: MyBot, sellWindow, removeEventListenerCallback: Function) {
    let title = getWindowTitle(sellWindow)
    log(title)
    if (title.toString().includes('Auction House')) {
        clickWindow(bot, 15)
    }
    if (title == 'Manage Auctions') {
        let clickSlot
        for (let i = 0; i < sellWindow.slots.length; i++) {
            const item = sellWindow.slots[i]
            if (item && item.nbt.value.display.value.Name.value.includes('Create Auction')) {
                if (item && (item.nbt as any).value?.display?.value?.Lore?.value?.value?.toString().includes('You reached the maximum number')) {
                    log('Maximum number of auctons reached -> cant sell')
                    removeEventListenerCallback()
                    bot.state = null
                    return
                }
                clickSlot = item.slot
            }
        }
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
                log('No item at index ' + itemSlot + ' found -> probably already sold')
                return
            }

            let id = sellWindow.slots[itemSlot]?.nbt?.value?.ExtraAttributes?.value?.id?.value
            let uuid = sellWindow.slots[itemSlot]?.nbt?.value?.ExtraAttributes?.value?.uuid?.value
            if (data.id !== id && data.id !== uuid) {
                bot.state = null
                removeEventListenerCallback()
                log(sellWindow.slots[itemSlot])
                log('Item at index ' + itemSlot + '" does not match item that is supposed to be sold: "' + data.id + '" -> dont sell')
                return
            }

            clickWindow(bot, itemSlot)
            bot._client.once('open_sign_entity', ({ location }) => {
                let price = (data as SellData).price
                log('Price to set ' + Math.floor(price).toString())
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
            log('opening pricer')
            clickWindow(bot, 31)
            setPrice = true
        } else if (setPrice && !durationSet) {
            clickWindow(bot, 33)
        } else if (setPrice && durationSet) {
            const fail = () => {
                console.log('Something went wrong while listing an item')

                clickWindow(bot, 13) // Take the item out of the window

                removeEventListenerCallback()
                setPrice = false
                durationSet = false
                bot.state = null
            }

            const itemToList = sellWindow.slots[13]
            const id = itemToList?.nbt?.value?.ExtraAttributes?.value?.id?.value
            const uuid = itemToList?.nbt?.value?.ExtraAttributes?.value?.uuid?.value

            if(id !== data.id && uuid !== data.id) {
                console.log('Wrong item in sell slot')
                fail()
                return
            }

            const confirmItem = sellWindow.slots[29]
            const name = <string> confirmItem?.nbt?.value?.display?.value?.Name?.value
            const lore = <string[]> confirmItem?.nbt?.value?.display?.value?.Lore?.value?.value

            if(!name || !lore) {
                console.log('Name or lore not present')
                fail()
                return
            }

            const stripLine = (txt: string) => txt.replace(/§./g, '')
            let priceLine = lore.find(el => stripLine(el).includes('Item price'))
            if(!priceLine) {
                console.log('Price not present')
                fail()
                return
            }
            priceLine = stripLine(priceLine)

            priceLine = priceLine.split(': ')[1].split(' coins')[0]
            priceLine = priceLine.replace(/[,.]/g, '')
            const p = Number(priceLine)
            if(p !== Math.floor(data.price)) {
                console.log('Wrong price')
                fail()
                return
            }

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
        log('Successfully listed an item')
        clickWindow(bot, 11)
        removeEventListenerCallback()
        setPrice = false
        durationSet = false
        bot.state = null
        sendWebhookItemListed(data.itemName, numberWithThousandsSeparators(data.price), data.duration)
    }
}

async function setAuctionDuration(bot: MyBot, time: number) {
    log('setAuctionDuration function')
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
