export async function clickWindow(bot, slot: number) {
    return bot.clickWindow(slot, 0, 0)
}

export async function sleep(ms: number): Promise<void> {
    return await new Promise(resolve => setTimeout(resolve, ms))
}

export function getWindowTitle(window) {
    if (window.title) {
        // This worked before, for some reason it doesnt anymore
        // let title = JSON.parse(window.title)['translate']
        return JSON.parse(window.title)['extra'][0]['text']
    }
    if (window.windowTitle) {
        return JSON.parse(window.windowTitle)['extra'][0]['text']
    }
    return ''
}
