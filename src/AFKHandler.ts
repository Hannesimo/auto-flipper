import { ScoreBoard } from 'mineflayer'
import { MyBot } from '../types/autobuy'
import { printMcChatToConsole, log } from './logger'
import { removeMinecraftColorCodes } from './utils'

export function initAFKHandler(bot: MyBot) {
    let consecutiveTeleportAttempts = 0
    let intervalId
    registerCheckInverval()

    function registerCheckInverval() {
        if (intervalId) {
            clearInterval(intervalId)
        }
        intervalId = setInterval(() => {
            let teleportWasTried = checkAFKAndTeleport(bot)
            if (teleportWasTried) {
                consecutiveTeleportAttempts++
                log(`ConsecutiveTeleportAttemps: ${consecutiveTeleportAttempts}`)
                registerCheckInverval()
            } else {
                consecutiveTeleportAttempts = 0
            }
        }, 10000 * (consecutiveTeleportAttempts + 1))
    }
}

function checkAFKAndTeleport(bot: MyBot) {
    if (isLimbo(bot.scoreboard.sidebar)) {
        log('Bot seems to be in limbo. Sending "/lobby"')
        printMcChatToConsole('§f[§4BAF§f]: §fYou seem to be in limbo.')
        printMcChatToConsole('§f[§4BAF§f]: §fWarping back to lobby...')
        bot.chat('/lobby')
        return true
    }

    if (!removeMinecraftColorCodes(bot.scoreboard.sidebar.title).includes('SKYBLOCK')) {
        log(`Bot seems to be in lobby (Sidebar title = ${bot.scoreboard.sidebar.title}). Sending "/play sb"`)
        printMcChatToConsole('§f[§4BAF§f]: §fYou seem to be in the lobby.')
        printMcChatToConsole('§f[§4BAF§f]: §fWarping back into skyblock...')
        bot.chat('/play sb')
        return true
    }

    let scoreboard = bot.scoreboard.sidebar.items.map(item => item.displayName.getText(null).replace(item.name, ''))
    if (!scoreboard.find(e => e.includes('Your Island'))) {
        log('Bot is not on island. Warping back')
        log(bot.scoreboard)
        printMcChatToConsole('§f[§4BAF§f]: §fYou seem to not be on your island.')
        printMcChatToConsole('§f[§4BAF§f]: §fWarping back to island...')
        bot.chat('/is')
        return true
    }
    return false
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
