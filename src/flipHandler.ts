import { Flip, MyBot } from '../types/autobuy'
import { getFastWindowClicker } from './fastWindowClick'
import { debug } from './logger'
import { sleep } from './utils'

export async function flipHandler(bot: MyBot, flip: Flip) {
    flip.purchaseAt = new Date(flip.purchaseAt)
    debug('Flip: ' + JSON.stringify(flip))

    if (bot.state) {
        debug('Currently busy with something else (' + bot.state + ') -> not buying flip')
        return
    }
    bot.state = 'purchasing'
    let timeout = setTimeout(() => {
        if (bot.state === 'purchasing') {
            debug("Resetting 'bot.state === purchasing' lock")
            bot.state = null
        }
    }, 2500)

    // TODO: Check what slot/item to click for bed flips
    let lastWindowId = getFastWindowClicker().getLastWindowId()
    let isBed = flip.purchaseAt.getTime() > new Date().getTime()

    let delayUntilBuyStart = isBed ? flip.purchaseAt.getTime() - new Date().getTime() : 0
    debug(new Date().toISOString())
    debug(flip.purchaseAt.toISOString())

    bot.lastViewAuctionCommandForPurchase = `/viewauction ${flip.id}`
    bot.chat(bot.lastViewAuctionCommandForPurchase)
    await sleep(delayUntilBuyStart)
    if (isBed) {
        getFastWindowClicker().clickBedPurchase(flip.startingBid, lastWindowId + 1)
    } else {
        getFastWindowClicker().clickPurchase(flip.startingBid, lastWindowId + 1)
    }
    getFastWindowClicker().clickConfirm(flip.startingBid, flip.itemName, lastWindowId + 2)
    clearTimeout(timeout)
    bot.state = null
}
