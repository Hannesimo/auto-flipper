import { MyBot, SellData } from '../types/autobuy'
import { log } from './logger'
import { clickWindow, getWindowTitle } from './utils'
import sendWebhook, { EmbedConstructor, WebhookConstructor } from './webhookHandler'
import { getConfigProperty } from './configHelper'
let webhookUrl = getConfigProperty('WEBHOOK_URL')

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
            if (item && item.type === 380 && (item.nbt as any).value?.display?.value?.Name?.value?.toString().includes('Claim All')) {
                log('Found cauldron to claim all sold auctions -> clicking index ' + item.slot)
                clickWindow(bot, item.slot)
                removeEventListenerCallback()
                bot.state = null
                return
            }
        }
        clickWindow(bot, clickSlot)
    }
    if (title == 'Create Auction') {
        clickWindow(bot, 48)
    }
    let itemName;

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
                log('No item on index ' + itemSlot + ' found -> probably already sold')
                return
            }
            itemName = sellWindow.slots[itemSlot].name
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
        let tempPrice = setPrice;
        let tempDuration = durationSet;
        setPrice = false
        durationSet = false
        bot.state = null
        if(webhookUrl) sendWebhook(
            webhookUrl,
            new WebhookConstructor()
            .setUsername("BAF")
            .addEmbeds([
                new EmbedConstructor()
                .setTitle("Item Listed")
                .setFields([{
                    name: "Listed Item:",
                    value: `\`\`\`${itemName}\`\`\``,
                    inline: false
                }, {
                    name: "Item Price:",
                    value: `\`\`\`${tempPrice}\`\`\``,
                    inline: false
                }, {
                    name: "AH Duration:",
                    value: `\`\`\`${tempDuration}\`\`\``,
                    inline: false
                }])
                .setThumbnail({
                    url: `https://minotar.net/helm/${bot._client.username}/600.png`
                })
            ])
        )
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
