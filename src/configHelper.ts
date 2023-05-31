let fs = require('fs')
let path = require('path')
let filePath = path.join((process as any).pkg ? process.argv[0] : process.argv[1], '..', 'config.toml')

var json2toml = require('json2toml')
var toml = require('toml')
let config: Config = {
    INGAME_NAME: '',
    WEBHOOK_URL: '',
    FLIP_ACTION_DELAY: 100,
    USE_COFL_CHAT: true,
    SESSIONS: {}
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
            fs.writeFileSync(filePath, json2toml(existingConfig))
        }

        config = existingConfig
    }
}

export function updatePersistentConfigProperty(property: string, value: any) {
    config[property] = value
    fs.writeFileSync(filePath, json2toml(config))
}

export function getConfigProperty(property: string): any {
    return config[property]
}
