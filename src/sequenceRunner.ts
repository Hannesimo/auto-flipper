import { MyBot } from '../types/autobuy'
import { getCurrentWebsocket } from './BAF'
import { handleCommand } from './consoleHandler'
import { log } from './logger'
import { clickWindow } from './utils'

export async function runSequence(bot: MyBot, sequence: Sequence) {
    if (bot.state) {
        setTimeout(() => {
            runSequence(bot, sequence)
        }, 2000)
        return
    }
    bot.state = 'runningSequence'
    let timeout = setTimeout(() => {
        if (bot.state === 'runningSequence') {
            log("Resetting 'bot.state === runningSequence' lock")
            bot.state = null
            bot.removeAllListeners('windowOpen')
        }
    }, 10000)

    let wss = await getCurrentWebsocket()
    for (let step of sequence.steps) {
        switch (step.type) {
            case 'execute':
                await handleCommand(bot, step.data)
                break
            case 'click':
                // wait for window to open (or 2 seconds) because a new window might be in process of opening
                await waitForWindowOpen(bot, 2000)
                let currentWindow = bot.currentWindow
                if (!currentWindow) {
                    log(`No current window after 2 seconds during sequence run. ${step}`, 'error')
                    continue
                }
                let regexp = new RegExp(step.data)
                let slot = currentWindow.slots.find(item => {
                    return regexp.test(JSON.stringify(item))
                })
                if (slot) {
                    await clickWindow(bot, slot.slot)
                } else {
                    log(`Could not find slot to click during sequence. ${step}`, 'error')
                }
                break
            case 'upload':
                log(`Uploading inventory (${bot.currentWindow.title})...`)
                // wait for window to open (or 2 seconds) because a new window might be in process of opening
                await waitForWindowOpen(bot, 2000)
                wss.send(
                    JSON.stringify({
                        type: 'uploadUpperInventory',
                        data: JSON.stringify(bot.currentWindow)
                    })
                )
                break
            default:
                break
        }
    }

    if (bot.currentWindow) {
        bot.closeWindow(bot.currentWindow)
    }
    bot.removeAllListeners('windowOpen')
    clearTimeout(timeout)
    bot.state = null
}

function waitForWindowOpen(bot: MyBot, maxWaitTime: number = 2000) {
    return new Promise(resolve => {
        function handler(window) {
            bot.removeListener('windowOpen', handler)
            resolve(window)
        }

        setTimeout(() => {
            bot.removeListener('windowOpen', handler)
            resolve(null)
        }, maxWaitTime)

        bot.addListener('windowOpen', handler)
    })
}
