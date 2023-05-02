import { MyBot } from '../types/autobuy'
import { log, printMcChatToConsole } from './logger'
import { clickWindow, getWindowTitle } from './utils'
import { ChatMessage } from 'prismarine-chat'
import sendWebhook, { EmbedConstructor, WebhookConstructor } from './webhookHandler'
import { getConfigProperty } from './configHelper'
let webhookUrl = getConfigProperty('WEBHOOK_URL')

export function registerIngameMessageHandler(bot: MyBot, wss: WebSocket) {
    bot.on('message', (message: ChatMessage, type) => {
        let text = message.getText(null)
        if (type == 'chat') {
            printMcChatToConsole(message.toAnsi())
            if (text.startsWith('You purchased')) {
                wss.send(
                    JSON.stringify({
                        type: 'uploadTab',
                        data: JSON.stringify(Object.keys(bot.players).map(playername => bot.players[playername].displayName.getText(null)))
                    })
                )
                wss.send(
                    JSON.stringify({
                        type: 'uploadScoreboard',
                        data: JSON.stringify(bot.scoreboard.sidebar.items.map(item => item.displayName.getText(null).replace(item.name, '')))
                    })
                )
                claimPurchased(bot)
                let itemName = text.split(' purchased ')[1].split(' for ')[0]
                let price = text.split(' for ')[1].split(" coins!")[0]
                if(webhookUrl) sendWebhook(
                    webhookUrl,
                    new WebhookConstructor()
                    .setUsername("BAF")
                    .addEmbeds([
                        new EmbedConstructor()
                        .setTitle("Item Purchased")
                        .setFields([{
                            name: "Item:",
                           value: `\`\`\`${itemName}\`\`\``,
                           inline: true
                      }, {
                           name: "Bought for:",
                           value: `\`\`\`${price}\`\`\``,
                            inline: true
                      }])
                      .setThumbnail({
                         url: `https://minotar.net/helm/${bot._client.username}/600.png`
                      })
                    ])
                )
            }
            if (text.startsWith('[Auction]') && text.includes('bought') && text.includes('for')) {
                log('New item sold')
                let purchasedBy = text.split('[Auction] ')[1].split(" bought ")[0]
                let itemName = text.split(' bought ')[1].split(' for ')[0]
                let price = text.split(' for ')[1].split(" coins")[0]
                
                if(webhookUrl) sendWebhook(
                    webhookUrl,
                    new WebhookConstructor()
                    .setUsername("BAF")
                    .addEmbeds([
                        new EmbedConstructor()
                        .setTitle("Item Sold")
                        .setFields([{
                            name: "Purchased by:",
                            value: `\`\`\`${purchasedBy}\`\`\``,
                            inline: true
                        }, {
                            name: "Item Sold:",
                           value: `\`\`\`${itemName}\`\`\``,
                           inline: true
                      }, {
                           name: "Sold for:",
                           value: `\`\`\`${price}\`\`\``,
                            inline: true
                      }])
                      .setThumbnail({
                         url: `https://minotar.net/helm/${bot._client.username}/600.png`
                      })
                    ])
                )
                claimSoldItem(bot, text.split(' bought ')[1].split(' for ')[0])
            }

            if (bot.privacySettings && bot.privacySettings.chatRegex.test(text)) {
                wss.send(
                    JSON.stringify({
                        type: 'chatBatch',
                        data: JSON.stringify([text])
                    })
                )
            }
        }
    })
}

function claimPurchased(bot: MyBot) {
    if (bot.state) {
        log('Currently busy with something else (' + bot.state + ') -> not claiming purchased item')
        setTimeout(() => {
            claimPurchased(bot)
        }, 1000)
        return
    }
    bot.state = 'claiming'

    let windowHasOpened = false
    bot.chat('/ah')

    setTimeout(() => {
        if (!windowHasOpened) {
            log('Claiming of purchased auction failed. Removing lock')
            bot.state = null
        }
    }, 5000)

    bot.once('windowOpen', window => {
        windowHasOpened = true
        let title = getWindowTitle(window)

        if (title.toString().includes('Auction House')) {
            clickWindow(bot, 13)
            bot.once('windowOpen', window => {
                let slotToClick = -1
                for (let i = 0; i < window.slots.length; i++) {
                    const slot = window.slots[i]
                    if (slot?.type === 380 && (slot?.nbt as any)?.value?.display?.value?.Name?.value?.toString().includes('Claim All')) {
                        log('Found cauldron to claim all sold auctions -> clicking index ' + i)
                        clickWindow(bot, i)
                        bot.removeAllListeners('windowOpen')
                        bot.state = null
                        return
                    }
                    if ((slot?.nbt as any)?.value?.display?.value?.Lore?.value?.value?.toString().includes('§7Status: §aSold!')) {
                        log('Found claimable auction. Gonna click index ' + i)
                        slotToClick = i
                    }
                }
                clickWindow(bot, slotToClick)

                bot.once('windowOpen', window => {
                    if (window.slots[31].name.includes('gold_block')) {
                        log('Claiming purchased auction...')
                        clickWindow(bot, 31)
                    }
                    bot.removeAllListeners('windowOpen')
                    bot.state = null
                })
            })
        }
        bot.state = null
    })
}

async function claimSoldItem(bot: MyBot, itemName: string) {
    if (bot.state) {
        log('Currently busy with something else (' + bot.state + ') -> not claiming sold item')
        setTimeout(() => {
            claimSoldItem(bot, itemName)
        }, 1000)
        return
    }

    let timeout = setTimeout(() => {
        log('Seems something went wrong while claiming sold item. Removing lock')
        bot.state = null
        bot.removeAllListeners('windowOpen')
    }, 10000)

    bot.state = 'claiming'
    bot.chat('/ah')

    bot.on('windowOpen', window => {
        claimHandler(bot, window, itemName, () => {
            clearTimeout(timeout)
            bot.removeAllListeners('windowOpen')
        })
    })
}

async function claimHandler(bot: MyBot, window, itemName: string, removeEventListenerCallback: Function) {
    let title = getWindowTitle(window)
    if (title.toString().includes('Auction House')) {
        clickWindow(bot, 15)
    }
    if (title.toString().includes('Manage Auctions')) {
        log('Claiming bought auction...')
        let clickSlot

        window.slots.forEach(item => {
            if (item?.nbt?.value?.display?.value?.Lore && JSON.stringify(item.nbt.value.display.value.Lore).includes('Sold for')) {
                clickSlot = item.slot
            }
        })

        log('Clicking auction to claim, index: ' + clickSlot)
        log(JSON.stringify(window.slots[clickSlot]))

        clickWindow(bot, clickSlot)
    }
    if (title == 'BIN Auction View') {
        if (window.slots[31].name.includes('gold_block')) {
            log('New BIN Auction View, clicking slot 31, claiming purchased auction')
            clickWindow(bot, 31)
        }
        removeEventListenerCallback()
        bot.state = null
    }
}
