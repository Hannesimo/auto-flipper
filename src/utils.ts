export async function clickWindow(bot, slot: number) {
    return bot.clickWindow(slot, 0, 0)
}

export async function sleep(ms: number): Promise<void> {
    return await new Promise(resolve => setTimeout(resolve, ms))
}

export function getWindowTitle(window) {
    if (window.title) {
        let parsed = JSON.parse(window.title)
        return parsed.extra ? parsed['extra'][0]['text'] : parsed.translate
    }
    if (window.windowTitle) {
        return JSON.parse(window.windowTitle)['extra'][0]['text']
    }
    return ''
}

export function numberWithThousandsSeparators(number?: number): string {
    if (!number) {
        return '0'
    }
    var parts = number.toString().split('.')
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    return parts.join('.')
}

export function isCoflChatMessage(message: string) {
    return removeMinecraftColorCodes(message).startsWith('[Chat]')
}

export function removeMinecraftColorCodes(text: string) {
    return text?.replace(/§[0-9a-fk-or]/gi, '')
}
