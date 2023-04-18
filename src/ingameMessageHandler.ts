import { MyBot } from '../types/autobuy'
import { debug, logMcChat } from './logger'
import { clickWindow, getWindowTitle } from './utils'
import { ChatMessage } from 'prismarine-chat'

export function registerIngameMessageHandler(bot: MyBot) {
    bot.on('message', (message: ChatMessage, type) => {
        let text = message.getText(null)

        if (type == 'chat') {
            logMcChat(message.toAnsi())
            if (text.startsWith('You purchased')) {
                let claimPurchasedFunction = (auctionViewCommand: string) => {
                    if (bot.state) {
                        debug('Currently busy with something else (' + bot.state + ') -> not claiming purchased item')
                        setTimeout(() => {
                            claimPurchasedFunction(auctionViewCommand)
                        }, 1000)
                        return
                    }
                    bot.state = 'claiming'
                    debug('New item purchased -> ' + auctionViewCommand)

                    let windowHasOpened = false
                    bot.chat(auctionViewCommand)

                    setTimeout(() => {
                        if (!windowHasOpened) {
                            debug('Claiming of purchased auction failed. Removing lock')
                            bot.state = null
                        }
                    }, 5000)

                    bot.once('windowOpen', window => {
                        windowHasOpened = true
                        let title = getWindowTitle(window)
                        if (title == 'BIN Auction View') {
                            if (window.slots[31].name.includes('gold_block')) {
                                debug('New BIN Auction View, clicking slot 31, claiming purchased auction')
                                clickWindow(bot, 31)
                            }
                        }
                        bot.state = null
                    })
                }
                claimPurchasedFunction(`${bot.lastViewAuctionCommandForPurchase}`)
            }
            if (text.startsWith('[Auction]') && text.includes('bought') && text.includes('for')) {
                debug('New item sold')
                claimSoldItem(bot, text.split(' bought ')[1].split(' for ')[0])
            }
        }
    })
}

async function claimSoldItem(bot: MyBot, itemName: string) {
    if (bot.state) {
        debug('Currently busy with something else (' + bot.state + ') -> not claiming sold item')
        setTimeout(() => {
            claimSoldItem(bot, itemName)
        }, 1000)
        return
    }

    let timeout = setTimeout(() => {
        debug('Seems something went wrong while claiming sold item. Removing lock')
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
        debug('Claiming bought auction...')
        let clickSlot

        window.slots.forEach(item => {
            if (item?.nbt?.value?.display?.value?.Lore && JSON.stringify(item.nbt.value.display.value.Lore).includes('Sold for')) {
                clickSlot = item.slot
            }
        })

        debug('Clicking auction to claim, index: ' + clickSlot)
        debug(JSON.stringify(window.slots[clickSlot]))

        clickWindow(bot, clickSlot)
    }
    if (title == 'BIN Auction View') {
        if (window.slots[31].name.includes('gold_block')) {
            debug('New BIN Auction View, clicking slot 31, claiming purchased auction')
            clickWindow(bot, 31)
        }
        removeEventListenerCallback()
        bot.state = null
    }
}
