let fs = require('fs')
const path = require('path')
const filePath = path.join(process.argv[0], '..', 'config.toml')
var json2toml = require('json2toml')
var toml = require('toml')
let config: Config = {
    INGAME_NAME: '',
    WEBHOOK_URL: '',
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
