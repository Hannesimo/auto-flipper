import { MyBot } from '../types/autobuy'
import { log, printMcChatToConsole } from './logger'
import { clickWindow, getWindowTitle } from './utils'
import { ChatMessage } from 'prismarine-chat'
import { sendWebhookItemPurchased, sendWebhookItemSold } from './webhookHandler'
import { getCurrentWebsocket } from './BAF'

// if nothing gets bought for 1 hours, send a report
let errorTimeout

export async function registerIngameMessageHandler(bot: MyBot) {
    let wss = await getCurrentWebsocket()
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

                sendWebhookItemPurchased(text.split(' purchased ')[1].split(' for ')[0], text.split(' for ')[1].split(' coins!')[0])
                setNothingBoughtFor1HourTimeout(wss)
            }
            if (text.startsWith('[Auction]') && text.includes('bought') && text.includes('for')) {
                log('New item sold')
                claimSoldItem(bot)

                sendWebhookItemSold(
                    text.split(' bought ')[1].split(' for ')[0],
                    text.split(' for ')[1].split(' coins')[0],
                    text.split('[Auction] ')[1].split(' bought ')[0]
                )
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

    setNothingBoughtFor1HourTimeout(wss)
}

export function claimPurchased(bot: MyBot, useCollectAll: boolean = true): Promise<boolean> {
    return new Promise((resolve, reject) => {
        if (bot.state) {
            log('Currently busy with something else (' + bot.state + ') -> not claiming purchased item')
            setTimeout(async () => {
                let result = await claimPurchased(bot)
                resolve(result)
            }, 1000)
            return
        }
        bot.state = 'claiming'
        bot.chat('/ah')

        let timeout = setTimeout(() => {
            log('Claiming of purchased auction failed. Removing lock')
            bot.state = null
            resolve(false)
        }, 5000)

        bot.on('windowOpen', async window => {
            let title = getWindowTitle(window)
            log('Claiming auction window: ' + title)

            if (title.toString().includes('Auction House')) {
                clickWindow(bot, 13)
            }

            if (title.toString().includes('Your Bids')) {
                let slotToClick = -1
                for (let i = 0; i < window.slots.length; i++) {
                    const slot = window.slots[i]
                    let name = (slot?.nbt as any)?.value?.display?.value?.Name?.value?.toString()
                    if (useCollectAll && slot?.type === 380 && name?.includes('Claim') && name?.includes('All')) {
                        log('Found cauldron to claim all purchased auctions -> clicking index ' + i)
                        clickWindow(bot, i)
                        bot.removeAllListeners('windowOpen')
                        bot.state = null
                        clearTimeout(timeout)
                        resolve(true)
                        return
                    }
                    let lore = (slot?.nbt as any)?.value?.display?.value?.Lore?.value?.value?.toString()
                    if (lore?.includes('Status:') && lore?.includes('Sold!')) {
                        log('Found claimable purchased auction. Gonna click index ' + i)
                        log(JSON.stringify(slot))
                        slotToClick = i
                    }
                }
                if (slotToClick === -1) {
                    log('No claimable purchased auction found')
                    bot.removeAllListeners('windowOpen')
                    bot.state = null
                    bot.closeWindow(window)
                    clearTimeout(timeout)
                    resolve(false)
                    return
                }
                clickWindow(bot, slotToClick)
            }

            if (title.toString().includes('BIN Auction View')) {
                log('Claiming purchased auction...')
                bot.removeAllListeners('windowOpen')
                bot.state = null
                clearTimeout(timeout)
                clickWindow(bot, 31)
                resolve(true)
            }
        })
    })
}

export async function claimSoldItem(bot: MyBot): Promise<boolean> {
    return new Promise((resolve, reject) => {
        if (bot.state) {
            log('Currently busy with something else (' + bot.state + ') -> not claiming sold item')
            setTimeout(async () => {
                let result = await claimSoldItem(bot)
                resolve(result)
            }, 1000)
            return
        }

        let timeout = setTimeout(() => {
            log('Seems something went wrong while claiming sold item. Removing lock')
            bot.state = null
            bot.removeAllListeners('windowOpen')
            resolve(false)
        }, 10000)

        bot.state = 'claiming'
        bot.chat('/ah')

        bot.on('windowOpen', async window => {
            let title = getWindowTitle(window)
            if (title.toString().includes('Auction House')) {
                clickWindow(bot, 15)
            }
            if (title.toString().includes('Manage Auctions')) {
                log('Claiming sold auction...')
                let clickSlot

                for (let i = 0; i < window.slots.length; i++) {
                    const item = window.slots[i] as any
                    if (item?.nbt?.value?.display?.value?.Lore && JSON.stringify(item.nbt.value.display.value.Lore).includes('Sold for')) {
                        clickSlot = item.slot
                    }

                    let includesStatus = item?.nbt?.value?.display?.value?.Lore && JSON.stringify(item.nbt.value.display.value.Lore).includes('Status')
                    let includesSold = item?.nbt?.value?.display?.value?.Lore && JSON.stringify(item.nbt.value.display.value.Lore).includes('Expired!')
                    if (includesStatus && includesSold) {
                        log('Found expired auction. Gonna click slot ' + item.slot)
                        await claimExpiredAuction(bot, item.slot)
                    }

                    if (item && item.name === 'cauldron' && (item.nbt as any).value?.display?.value?.Name?.value?.toString().includes('Claim All')) {
                        log(item)
                        log('Found cauldron to claim all sold auctions -> clicking index ' + item.slot)
                        clickWindow(bot, item.slot)
                        clearTimeout(timeout)
                        bot.removeAllListeners('windowOpen')
                        bot.state = null
                        resolve(true)
                        return
                    }
                }

                if (!clickSlot) {
                    log('No sold auctions found')
                    clearTimeout(timeout)
                    bot.removeAllListeners('windowOpen')
                    bot.state = null
                    bot.closeWindow(window)
                    resolve(false)
                    return
                }
                log('Clicking auction to claim, index: ' + clickSlot)
                log(JSON.stringify(window.slots[clickSlot]))

                clickWindow(bot, clickSlot)
            }
            if (title == 'BIN Auction View') {
                log('Clicking slot 31, claiming purchased auction')
                clickWindow(bot, 31)
                clearTimeout(timeout)
                bot.removeAllListeners('windowOpen')
                bot.state = null
                bot.closeWindow(window)
                resolve(true)
            }
        })
    })
}

function claimExpiredAuction(bot, slot) {
    return new Promise(resolve => {
        bot.on('windowOpen', window => {
            let title = getWindowTitle(window)
            if (title == 'BIN Auction View') {
                log('Clicking slot 31, claiming expired auction')
                clickWindow(bot, 31)
                bot.removeAllListeners('windowOpen')
                bot.state = null
                bot.closeWindow(window)
                resolve(true)
            }
        })
        clickWindow(bot, slot)
    })
}

function setNothingBoughtFor1HourTimeout(wss: WebSocket) {
    if (errorTimeout) {
        clearTimeout(errorTimeout)
    }
    errorTimeout = setTimeout(() => {
        wss.send(
            JSON.stringify({
                type: 'clientError',
                data: 'Nothing bought for 1 hour'
            })
        )
    })
}
