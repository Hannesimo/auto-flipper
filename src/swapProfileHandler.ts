import { MyBot, SwapData } from '../types/autobuy'
import { debug } from './logger'
import { clickWindow, getWindowTitle } from './utils'

export async function swapProfile(bot: MyBot, data: SwapData) {
    bot.setQuickBarSlot(8)
    bot.activateItem()
    bot.on('windowOpen', window => {
        let title = getWindowTitle(window)
        if (title == 'SkyBlock Menu') {
            clickWindow(bot, 48)
        }
        if (title == 'Profile Management') {
            let clickSlot
            window.slots.forEach(item => {
                if (item && (item.nbt.value as any).display.value.Name.value.includes((data as SwapData).profile)) clickSlot = item.slot
            })
            debug('Clickslot is ' + clickSlot)
            clickWindow(bot, clickSlot)
        }
        if (title.includes('Profile:')) {
            clickWindow(bot, 11)
            debug('Successfully swapped profiles')
        }
    })
}
