import { Client } from 'minecraft-protocol'
import { numberWithThousandsSeparators } from './formatter'
import { logPacket } from './logger'

export function createFastWindowClicker(client: Client): FastWindowClicker {
    let actionCounter = 1
    let lastWindowId = 0

    let windowClicker = {
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
                                            value: [`┬º7Purchasing: ┬ºa┬ºf┬º9${itemName}`, `┬º7Cost: ┬º6${numberWithThousandsSeparators(price)} coins`]
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
        onAuctionWasAlreadyBought: function () {
            // to be overwritten
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
            packet.items.forEach(item => {
                if (item.blockId === 392 && item.nbtData?.value?.display?.value?.Lore?.value?.value?.toString()?.includes('Someone else purchased the item!')) {
                    windowClicker.onAuctionWasAlreadyBought()
                }
            })
        }
        logPacket(packet, packetMeta, false)
    })
    return windowClicker
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
