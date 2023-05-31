import { Client } from 'minecraft-protocol'
import { log, logPacket, printMcChatToConsole } from './logger'
import { numberWithThousandsSeparators } from './utils'

let windowClicker

export function getFastWindowClicker(): FastWindowClicker {
    if (windowClicker) {
        return windowClicker
    }
    throw 'Window Clicker not created!'
}

export function createFastWindowClicker(client: Client) {
    let actionCounter = 1
    let lastWindowId = 0

    let _windowClicker = {
        // click purchase in window "BIN Auction View"
        clickPurchase: function (price: number, windowId: number) {
            client.write('window_click', {
                windowId: windowId,
                slot: 31,
                mouseButton: 0,
                action: actionCounter,
                mode: 0,
                item: {
                    blockId: 371,
                    itemCount: 1,
                    itemDamage: 0,
                    nbtData: {
                        type: 'compound',
                        name: '',
                        value: {
                            overrideMeta: { type: 'byte', value: 1 },
                            display: {
                                type: 'compound',
                                value: {
                                    Lore: {
                                        type: 'list',
                                        value: {
                                            type: 'string',
                                            value: ['', `┬º7Price: ┬º6${numberWithThousandsSeparators(price)} coins`, '', '┬ºeClick to purchase!']
                                        }
                                    },
                                    Name: { type: 'string', value: '┬º6Buy Item Right Now' }
                                }
                            },
                            AttributeModifiers: { type: 'list', value: { type: 'end', value: [] } }
                        }
                    }
                }
            })
            actionCounter += 1
        },
        clickBedPurchase: function (price: number, windowId: number) {
            client.write('window_click', {
                windowId: windowId,
                slot: 31,
                mouseButton: 0,
                action: actionCounter,
                mode: 0,
                item: {
                    blockId: 355,
                    itemCount: 1,
                    itemDamage: 0,
                    nbtData: {
                        type: 'compound',
                        name: '',
                        value: {
                            overrideMeta: { type: 'byte', value: 1 },
                            display: {
                                type: 'compound',
                                value: {
                                    Lore: {
                                        type: 'list',
                                        value: {
                                            type: 'string',
                                            value: ['', `┬º7Price: ┬º6${numberWithThousandsSeparators(price)} coins`, '', '┬ºcCan be bought soon!']
                                        }
                                    },
                                    Name: { type: 'string', value: '┬º6Buy Item Right Now' }
                                }
                            },
                            AttributeModifiers: { type: 'list', value: { type: 'end', value: [] } }
                        }
                    }
                }
            })
            actionCounter += 1
        },
        // click confirm in window "Confirm Purchase"
        clickConfirm: function (price: number, itemName: string, windowId: number) {
            client.write('window_click', {
                windowId: windowId,
                slot: 11,
                mouseButton: 0,
                action: actionCounter,
                mode: 0,
                item: {
                    blockId: 159,
                    itemCount: 1,
                    itemDamage: 13,
                    nbtData: {
                        type: 'compound',
                        name: '',
                        value: {
                            overrideMeta: { type: 'byte', value: 1 },
                            display: {
                                type: 'compound',
                                value: {
                                    Lore: {
                                        type: 'list',
                                        value: {
                                            type: 'string',
                                            value: [
                                                `┬º7Purchasing: ┬ºa┬ºf┬º9${itemName.replace(/§/g, '┬º')}`,
                                                `┬º7Cost: ┬º6${numberWithThousandsSeparators(Math.floor(price))} coins`
                                            ]
                                        }
                                    },
                                    Name: { type: 'string', value: '┬ºaConfirm' }
                                }
                            },
                            AttributeModifiers: { type: 'list', value: { type: 'end', value: [] } }
                        }
                    }
                }
            })
            actionCounter += 1
        },
        getLastWindowId: function () {
            return lastWindowId
        }
    }

    client.on('packet', function (packet, packetMeta) {
        if (packetMeta.name === 'open_window') {
            lastWindowId = packet.windowId
        }
        if (packetMeta.name === 'window_items') {
            if (packet.items[31]?.nbtData?.value?.display?.value?.Lore?.value?.value?.toString()?.includes('Someone else purchased the item!')) {
                let itemName = null
                if (packet.items[13] && packet.items[13].nbtData?.value?.display?.value?.Name?.value) {
                    itemName = packet.items[13].nbtData?.value?.display?.value?.Name?.value
                }
                printMcChatToConsole(`§f[§4BAF§f]: §fAuction${itemName ? ` (${itemName}§f)` : ''} §fwas already purchased by someone else...`)
            }
        }
        logPacket(packet, packetMeta, false)
    })
    windowClicker = _windowClicker
}
