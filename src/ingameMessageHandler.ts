import { MyBot } from '../types/autobuy'
import { debug, logMcChat } from './logger'
import { clickWindow, getWindowTitle } from './utils'
import { ChatMessage } from 'prismarine-chat'

export function registerIngameMessageHandler(bot: MyBot) {
    let onMessageFunction = (message: ChatMessage, type) => {
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
                    debug('New item purchased')
                    bot.chat(auctionViewCommand)
                    bot.once('windowOpen', window => {
                        let title = getWindowTitle(window)
                        if (title == 'BIN Auction View') {
                            if (window.slots[31].name.includes('gold_block')) {
                                debug('New BIN Auction View, clicking slot 31, claiming purchased auction')
                                clickWindow(bot, 31)
                                bot.state = null
                            }
                        }
                    })
                }
                claimPurchasedFunction(bot.lastViewAuctionCommandForPurchase)
            }
            if (text.startsWith('[Auction]') && text.includes('bought') && text.includes('for')) {
                debug('New item sold')
                claimSoldItem(bot, text.split(' bought ')[1].split(' for ')[0])
            }
        }
    }

    bot.on('message', onMessageFunction)
}

async function claimSoldItem(bot: MyBot, itemName: string) {
    if (bot.state) {
        debug('Currently busy with something else (' + bot.state + ') -> not claiming sold item')
        setTimeout(() => {
            claimSoldItem(bot, itemName)
        }, 1000)
        return
    }

    bot.state = 'claiming'
    bot.chat('/ah')

    let handler = window => {
        claimHandler(bot, window, itemName, () => {
            bot.removeListener('windowOpen', handler)
        })
    }
    bot.on('windowOpen', handler)
}

async function claimHandler(bot: MyBot, window, itemName: string, removeEventListenerCallback: Function) {
    let title = getWindowTitle(window)
    if (title.toString().includes('Auction House')) {
        clickWindow(bot, 15)
    }
    if (title == 'Manage Auctions') {
        let clickSlot

        window.slots.forEach(item => {
            if (item && item.nbt.value.display.value.Name.value.includes(itemName) && JSON.stringify(item.nbt.value.display.value.Lore).includes('Sold for'))
                clickSlot = item.slot
        })
        clickWindow(bot, clickSlot)
        removeEventListenerCallback()
        bot.state = null
    }
}
