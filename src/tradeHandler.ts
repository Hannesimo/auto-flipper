import { MyBot, TradeData } from '../types/autobuy'
import { debug } from './logger'
import { clickWindow, sleep } from './utils'

export async function tradePerson(bot: MyBot, websocket: WebSocket, data: TradeData) {
    let addedCoins = false
    let addedItems = false
    let trading = true
    while (trading) {
        bot.chat('/trade ' + data.target)

        bot.on('message', async msgE => {
            let msg = msgE.getText(null)

            if (msg == 'You cannot trade while the server is lagging!') {
                bot.chat('The server is lagging, give it a second')
                await sleep(5000)
            } else if (msg.startsWith('Cannot find player named')) {
                debug('Player is not avaliable to trade with, please rerequest when they are capable of trading')
                trading = false
                return
            } else if (msg == 'You are too far away to trade with that player!') {
                bot.chat('Hey ' + data.target + ' come here so we can trade!')
            } else if (msg.startsWith('You have sent a trade request to ')) {
                debug('successfully sent trade, waiting for them to accept')
                bot.on('windowOpen', async window => {
                    trading = false

                    debug('Trade window opened')
                    if (!addedItems) {
                        for (let slot of data.slots) {
                            slot += 44
                            clickWindow(bot, slot)
                            debug('Clicked slot ' + slot)
                        }
                        debug('Added all items')
                    }
                    if (data.coins > 0 && !addedCoins) {
                        bot._client.once('open_sign_entity', ({ location }) => {
                            let price = data.coins
                            debug('New sign entity')
                            debug('price to set ' + Math.floor(price).toString())
                            bot._client.write('update_sign', {
                                location: {
                                    x: location.z,
                                    y: location.y,
                                    z: location.z
                                },
                                text1: `\"${Math.floor(price).toString()}\"`,
                                text2: '{"italic":false,"extra":["^^^^^^^^^^^^^^^"],"text":""}',
                                text3: '{"italic":false,"extra":["Your auction"],"text":""}',
                                text4: '{"italic":false,"extra":["starting bid"],"text":""}'
                            })
                            addedCoins = true
                        })
                        clickWindow(bot, 36)
                    }
                    if (!(data.coins > 0) || addedCoins) {
                        websocket.send(JSON.stringify({ type: 'affirmFlip', data: [JSON.stringify(window.slots)] }))
                    }
                })
            }
        })

        await sleep(5000)
    }
}
