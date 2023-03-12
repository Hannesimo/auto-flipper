import { Client } from 'minecraft-protocol'
import { numberWithThousandsSeparators } from './formatter'
import { logPacket } from './logger'

export function createFastWindowClicker(client: Client): FastWindowClicker {
    let actionCounter = 1
    let lastWindowId = 1

    let windowClicker = {
        // click purchase in window "BIN Auction View"
        click_purchase: function (price: number) {
            actionCounter += 1
            client.write('window_click', {
                windowId: lastWindowId,
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
        },
        // click confirm in window "Confirm Purchase"
        click_confirm: function (price: number, itemName: string) {
            actionCounter += 1
            client.write('window_click', {
                windowId: lastWindowId,
                slot: 31,
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
        }
    }

    client.on('packet', function (packet, packetMeta) {
        if (packetMeta.name === 'open_window') {
            lastWindowId = packet.windowId
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
