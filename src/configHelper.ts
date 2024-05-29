let fs = require('fs')
let path = require('path')
let filePath = path.join((process as any).pkg ? process.argv[0] : process.argv[1], '..', 'config.toml')

var json2toml = require('json2toml')
var toml = require('toml')
let config: Config = {
    INGAME_NAME: '',
    WEBHOOK_URL: '',
    FLIP_ACTION_DELAY: 100,
    ENABLE_CONSOLE_INPUT: true,
    USE_COFL_CHAT: true,
    SESSIONS: {},
    WEBSOCKET_URL: 'wss://sky.coflnet.com/modsocket',
    BED_MULTIPLE_CLICKS_DELAY: 50
}

json2toml({ simple: true })

export function initConfigHelper() {
    if (fs.existsSync(filePath)) {
        let existingConfig = toml.parse(fs.readFileSync(filePath, { encoding: 'utf8', flag: 'r' }))

        // add new default values to existing config if new property was added in newer version
        let hadChange = false
        Object.keys(config).forEach(key => {
            if (existingConfig[key] === undefined) {
                existingConfig[key] = config[key]
                hadChange = true
            }
        })
        if (hadChange) {
            fs.writeFileSync(filePath, prepareTomlBeforeWrite(json2toml(existingConfig)))
        }

        config = existingConfig
    }
}

export function updatePersistentConfigProperty(property: keyof Config, value: any) {
    config[property as string] = value
    fs.writeFileSync(filePath, prepareTomlBeforeWrite(json2toml(config)))
}

export function getConfigProperty(property: keyof Config): any {
    return config[property]
}

function prepareTomlBeforeWrite(tomlString: string): string {
    let lines = tomlString.split('\n')
    let index = lines.findIndex(l => l.startsWith('BED_MULTIPLE_CLICKS_DELAY = '))
    lines.splice(
        index,
        0,
        '# Bed flips are clicked 3 times with this setting. First delay in milliseconds before it should mathematically work. Once exactly at the time and once after the time. Disable it with a value less than 0.'
    )

    return lines.join('\n')
}
