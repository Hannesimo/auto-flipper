import { Client, PacketMeta } from 'minecraft-protocol'
import { getConfigProperty } from './configHelper'
import winston from 'winston'

let logger: winston.Logger

export function initLogger() {
    const loggerConfig = {
        format: winston.format.json(),
        transports: [],
        exceptionHandlers: [
            new winston.transports.File({ filename: 'log.txt', format: winston.format.combine(winston.format.timestamp(), winston.format.json()) })
        ],
        rejectionHandlers: [
            new winston.transports.File({ filename: 'log.txt', format: winston.format.combine(winston.format.timestamp(), winston.format.json()) })
        ]
    }
    if (getConfigProperty('LOG_TO_FILE') !== undefined) {
        loggerConfig.transports.push(
            new winston.transports.File({
                filename: 'log.txt',
                level: getConfigProperty('LOG_TO_FILE'),
                format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
                options: {
                    flags: 'w'
                }
            })
        )
    }
    if (getConfigProperty('LOG_TO_CONSOLE') !== undefined) {
        loggerConfig.transports.push(
            new winston.transports.Console({
                level: getConfigProperty('LOG_TO_CONSOLE'),
                format: winston.format.combine(winston.format.timestamp(), winston.format.json())
            })
        )
    }
    logger = winston.createLogger(loggerConfig)
}

export function log(string: any, level?: string) {
    logger.log(level || 'info', string)
}

export function logPacket(packet: any, packetMeta: PacketMeta, toServer: boolean) {
    if (!logger.isSillyEnabled()) {
        return
    }
    let hidePackets = [
        'world_particles',
        'entity_teleport',
        'scoreboard_team',
        'keep_alive',
        'transaction',
        'flying',
        'position',
        'look',
        'update_time',
        'entity_velocity',
        'rel_entity_move',
        'entity_metadata',
        'map_chunk',
        'spawn_entity',
        'update_attributes',
        'entity_equipment',
        'named_entity_spawn',
        'scoreboard_objective',
        'animation',
        'player_info',
        'update_sign',
        'tile_entity_data',
        'entity_look',
        'named_sound_effect',
        'update_health',
        'scoreboard_score',
        'scoreboard_display_objective',
        'statistics',
        'respawn',
        'spawn_entity_living',
        'entity_destroy',
        'entity_effect',
        'block_change'
    ]

    if (hidePackets.indexOf(packetMeta.name) !== -1) {
        return
    }
    if (packetMeta.name !== 'window_click' && packetMeta.name !== 'open_window' && packetMeta.name !== 'window_items') {
        return
    }
    logger.debug(`${toServer ? 'toServer' : 'toClient'}: ${JSON.stringify(packet)}`)
    logger.debug(`${JSON.stringify(packetMeta)}`)
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
