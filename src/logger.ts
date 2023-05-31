import { Client, PacketMeta } from 'minecraft-protocol'
import winston from 'winston'
import { getConfigProperty } from './configHelper'
let fs = require('fs')
let path = require('path')
let logFilePath = path.join((process as any).pkg ? process.argv[0] : process.argv[1], '..')

let logger: winston.Logger

export function initLogger() {
    const loggerConfig = {
        format: winston.format.combine(winston.format.timestamp(), winston.format.prettyPrint()),
        transports: [],
        exceptionHandlers: [new winston.transports.File({ filename: 'log.txt', dirname: logFilePath })],
        rejectionHandlers: [new winston.transports.File({ filename: 'log.txt', dirname: logFilePath })]
    }
    loggerConfig.transports.push(
        new winston.transports.File({
            dirname: logFilePath,
            filename: 'log.txt',
            level: 'debug',
            format: winston.format.combine(winston.format.timestamp(), winston.format.prettyPrint()),
            options: {
                flags: 'w'
            }
        })
    )
    loggerConfig.transports.push(
        new winston.transports.Console({
            format: winston.format.combine(winston.format.timestamp(), winston.format.prettyPrint()),
            level: 'none'
        })
    )
    logger = winston.createLogger(loggerConfig)
}

export function log(string: any, level?: string) {
    logger.log(level || 'info', string)
}

export function logPacket(packet: any, packetMeta: PacketMeta, toServer: boolean) {
    if (!getConfigProperty('LOG_PACKAGES')) {
        return
    }

    if (packetMeta.name !== 'window_click' && packetMeta.name !== 'open_window' && packetMeta.name !== 'window_items') {
        return
    }

    fs.writeFileSync(
        'packets.log',
        `${toServer ? 'toServer' : 'toClient'}: ${JSON.stringify(packet)}\n${JSON.stringify(packetMeta)}\n----------------------------------------------\n`,
        { flag: 'a+' }
    )
}

export function printMcChatToConsole(string: string) {
    let msg = ''
    let split = string.split('§')
    msg += split[0]
    for (let a of string.split('§').slice(1, split.length)) {
        let color = a.charAt(0)
        let message

        if (Object.keys(colors).includes(color)) {
            msg += colors[color]
        }
        message = a.substring(1, a.length)
        msg += message
    }
    console.log('\x1b[0m\x1b[1m\x1b[90m' + msg + '\x1b[0m')
}

// this function adds a logging function to the wrtie function of the client
// resulting in all sent packets being logged by the logPacket function
export function addLoggerToClientWriteFunction(client: Client) {
    ;(function () {
        var old_prototype = client.write.prototype
        var old_init = client.write
        client.write = function (name, packet) {
            old_init.apply(this, arguments)
            logPacket(packet, { name: name, state: null }, true)
        }
        client.write.prototype = old_prototype
    })()
}

const colors = {
    0: '\x1b[0m\x1b[30m',
    1: '\x1b[0m\x1b[34m',
    2: '\x1b[0m\x1b[32m',
    3: '\x1b[0m\x1b[36m',
    4: '\x1b[0m\x1b[31m',
    5: '\x1b[0m\x1b[35m',
    6: '\x1b[0m\x1b[33m',
    7: '\x1b[0m\x1b[1m\x1b[90m',
    8: '\x1b[0m\x1b[90m',
    9: '\x1b[0m\x1b[34m',
    a: '\x1b[0m\x1b[32m',
    b: '\x1b[0m\x1b[36m',
    c: '\x1b[0m\x1b[31m',
    d: '\x1b[0m\x1b[35m',
    e: '\x1b[0m\x1b[33m',
    f: '\x1b[0m\x1b[37m'
}
