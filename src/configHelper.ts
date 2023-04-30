let fs = require('fs')
const filePath = './config.toml'
var json2toml = require('json2toml')
var toml = require('toml')
let config: Config = {
    INGAME_NAME: null,
    WEBHOOK_URL: null,
    SESSIONS: {}
}

json2toml({ simple: true })

export function initConfigHelper() {
    return new Promise(() => {
        if (fs.existsSync(filePath)) {
            config = toml.parse(fs.readFileSync(filePath, { encoding: 'utf8', flag: 'r' }))
        }
    })
}

export function updatePersistentConfigProperty(property: string, value: any) {
    config[property] = value
    fs.writeFileSync(filePath, json2toml(config))
}

export function getConfigProperty(property: string): any {
    return config[property] || process.env[property]
}
