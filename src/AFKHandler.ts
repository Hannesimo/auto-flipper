import { ScoreBoard } from 'mineflayer'
import { MyBot } from '../types/autobuy'
import { printMcChatToConsole, log } from './logger'

let one = true

export function initAFKHandler(bot: MyBot) {
    setInterval(() => {
        if (isLimbo(bot.scoreboard.sidebar)) {
            log('Bot seems to be in limbo. Sending "/lobby"')
            printMcChatToConsole('§f[§4BAF§f]: §fYou seem to be in limbo.')
            printMcChatToConsole('§f[§4BAF§f]: §fWarping back to lobby...')
            bot.chat('/lobby')
            return
        }

        if (!bot.scoreboard.sidebar.title.replace(/§[0-9a-fk-or]/gi, '').includes('SKYBLOCK')) {
            log(`Bot seems to be in lobby (Sidebar title = ${bot.scoreboard.sidebar.title}). Sending "/play sb"`)
            printMcChatToConsole('§f[§4BAF§f]: §fYou seem to be in the lobby.')
            printMcChatToConsole('§f[§4BAF§f]: §fWarping back into skyblock...')
            bot.chat('/play sb')
            return
        }

        let scoreboard = bot.scoreboard.sidebar.items.map(item => item.displayName.getText(null).replace(item.name, ''))
        if (!scoreboard.find(e => e.includes('Your Island'))) {
            log('Bot is not on island. Warping back')
            log(bot.scoreboard)
            printMcChatToConsole('§f[§4BAF§f]: §fYou seem to not be on your island.')
            printMcChatToConsole('§f[§4BAF§f]: §fWarping back to island...')
            bot.chat('/is')
        }
    }, 10000)
}

function isLimbo(sidebar: ScoreBoard) {
    let isLimbo = true
    sidebar.items.forEach(item => {
        if (item.displayName.getText(null).replace(item.name, '') !== '') {
            isLimbo = false
        }
    })
    return isLimbo
}
