import { Flip, FlipWhitelistedData, MyBot } from '../types/autobuy'
import { getConfigProperty } from './configHelper'
import { log, printMcChatToConsole } from './logger'
import { clickWindow, getWindowTitle, numberWithThousandsSeparators, removeMinecraftColorCodes, sleep } from './utils'

export async function flipHandler(bot: MyBot, flip: Flip) {
    flip.purchaseAt = new Date(flip.purchaseAt)

    if (bot.state) {
        setTimeout(() => {
            flipHandler(bot, flip)
        }, 1100)
        return
    }
    bot.state = 'purchasing'
    let timeout = setTimeout(() => {
        if (bot.state === 'purchasing') {
            log("Resetting 'bot.state === purchasing' lock")
            bot.state = null
            bot.removeAllListeners('windowOpen')
        }
    }, 10000)
    let isBed = flip.purchaseAt.getTime() > new Date().getTime()

    bot.lastViewAuctionCommandForPurchase = `/viewauction ${flip.id}`
    bot.chat(bot.lastViewAuctionCommandForPurchase)

    printMcChatToConsole(
        `§f[§4BAF§f]: §fTrying to purchase flip${isBed ? ' (Bed)' : ''}: ${flip.itemName} §for ${numberWithThousandsSeparators(
            flip.startingBid
        )} coins (Target: ${numberWithThousandsSeparators(flip.target)})`
    )

    await useRegularPurchase(bot, flip, isBed)
    clearTimeout(timeout)
}

function useRegularPurchase(bot: MyBot, flip: Flip, isBed: boolean) {
    return new Promise<void>((resolve, reject) => {
        bot.addListener('windowOpen', async window => {
            await sleep(getConfigProperty('FLIP_ACTION_DELAY'))
            let title = getWindowTitle(window)
            if (title.toString().includes('BIN Auction View')) {
                let multipleBedClicksDelay = getConfigProperty('BED_MULTIPLE_CLICKS_DELAY')
                let delayUntilBuyStart = isBed
                    ? flip.purchaseAt.getTime() - new Date().getTime() - (multipleBedClicksDelay > 0 ? multipleBedClicksDelay : 0)
                    : flip.purchaseAt.getTime() - new Date().getTime()
                await sleep(delayUntilBuyStart)

                if (isBed && getConfigProperty('BED_MULTIPLE_CLICKS_DELAY') > 0) {
                    for (let i = 0; i < 3; i++) {
                        clickWindow(bot, 31)
                        await sleep(getConfigProperty('BED_MULTIPLE_CLICKS_DELAY'))
                    }
                } else {
                    clickWindow(bot, 31)
                }
            }
            if (title.toString().includes('Confirm Purchase')) {
                clickWindow(bot, 11)
                bot.removeAllListeners('windowOpen')
                bot.state = null
                resolve()
                return
            }
        })
    })
}

// Stores the last 3 whitelist messages so add it to the webhook message for purchased flips
let whitelistObjects: FlipWhitelistedData[] = []
export function onItemWhitelistedMessage(text: string) {
    let chatMessage = removeMinecraftColorCodes(text)
    let itemName = chatMessage.split(' for ')[0]
    let price = chatMessage.split(' for ')[1].split(' matched your Whitelist entry: ')[0]
    let secondPart = chatMessage.split(' matched your Whitelist entry: ')[1]
    let reason = secondPart.split('\n')[0].trim()
    let finder = secondPart.split('Found by ')[1]

    whitelistObjects.unshift({
        itemName: itemName,
        reason: reason,
        finder: finder,
        price: price
    })

    if (whitelistObjects.length > 3) {
        whitelistObjects.pop()
    }
}

export function getWhitelistedData(itemName: string, price: string): FlipWhitelistedData {
    return whitelistObjects.find(x => x.itemName === itemName && x.price === price)
}
