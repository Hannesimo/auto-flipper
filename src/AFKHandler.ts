import { MyBot } from '../types/autobuy'
import { printMcChatToConsole, log } from './logger'

export function initAFKHandler(bot: MyBot) {
    setInterval(() => {
        let scoreboard = bot.scoreboard.sidebar.items.map(item => item.displayName.getText(null).replace(item.name, ''))
        if (!scoreboard.find(e => e.includes('Your Island'))) {
            log('Bot is not on island. Warping back')
            printMcChatToConsole('§f[§4BAF§f]: §fYou seem to not be on your island.')
            printMcChatToConsole('§f[§4BAF§f]: §fTrying to warp back to island...')
            bot.chat('/is')
        }
    }, 10000)
}
