import { MyBot, SellData } from '../types/autobuy'
import { log, printMcChatToConsole } from './logger'
import { clickWindow, getWindowTitle, numberWithThousandsSeparators, removeMinecraftColorCodes } from './utils'
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
        log('Seems something went wrong while selling. Removing lock', 'warn')
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
                log('No item at index ' + itemSlot + ' found -> probably already sold', 'warn')
                return
            }

            let id = sellWindow.slots[itemSlot]?.nbt?.value?.ExtraAttributes?.value?.id?.value
            let uuid = sellWindow.slots[itemSlot]?.nbt?.value?.ExtraAttributes?.value?.uuid?.value
            if (data.id !== id && data.id !== uuid) {
                bot.state = null
                removeEventListenerCallback()
                log('Item at index ' + itemSlot + '" does not match item that is supposed to be sold: "' + data.id + '" -> dont sell', 'warn')
                log(JSON.stringify(sellWindow.slots[itemSlot]))
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
            const resetAndTakeOutItem = () => {
                clickWindow(bot, 13) // Take the item out of the window
                removeEventListenerCallback()
                setPrice = false
                durationSet = false
                bot.state = null
            }

            try {
                const lore = <string[]>sellWindow.slots[29]?.nbt?.value?.display?.value?.Lore?.value?.value
                let priceLine = lore.find(el => removeMinecraftColorCodes(el).includes('Item price'))
                if (!priceLine) {
                    log('Price not present', 'error')
                    log(sellWindow.slots[29])
                    resetAndTakeOutItem()
                    return
                }
                priceLine = removeMinecraftColorCodes(priceLine)

                priceLine = priceLine.split(': ')[1].split(' coins')[0]
                priceLine = priceLine.replace(/[,.]/g, '')

                if (Number(priceLine) !== Math.floor(data.price)) {
                    log('Price is not the one that should be there', 'error')
                    log(data)
                    log(sellWindow.slots[29])
                    resetAndTakeOutItem()
                    return
                }
            } catch (e) {
                log('Checking if correct price was set in sellHandler through an error: ' + JSON.stringify(e), 'error')
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
        printMcChatToConsole(`§f[§4BAF§f]: §fItem listed: ${data.itemName} for ${numberWithThousandsSeparators(data.price)} coins`)
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
