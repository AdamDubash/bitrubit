const debug = require('debug')('qiwi-webhook:init')
const config = require('../config')

const QiwiWebhook = require('../libs/qiwi-webhook')

exports.init = async () => {
    

    setHook(config.get("qiwi"), "/payments/qiwi-webhook", "qiwi")
    setHook(config.get("exchange:qiwi"), "/exchange/ipn/qiwi", "exchange:qiwi")
}

const setHook = async (qiwi, path, confpath) => {
    const { hostname, port } = config.get('server')

    //if hook is already exist - exit
    if (qiwi.hookId) {
        debug('Hook is already exist - Exit')
        return
    }

    const qw = new QiwiWebhook(config.get('qiwi:token'))

    const hookUrl = `http://${hostname}:${port}${path}`

    const res = await qw.regHook(hookUrl, 0)
    debug('tried reg new hook. res - ', res)

    if (!res) {
        console.log("unavailable reg hook")
        return
    }

    if (res && res.hookId) {
        await saveHook(res)
        return
    }

    debug('ERROR - hook is already exist')

    const oldhook = await qw.getHookInfo()
    debug('got old hook', oldhook)

    const deleteStatus = await qw.deleteHook(oldhook.hookId)
    debug('oldhook deleted', deleteStatus)

    const newHook = await qw.regHook(hookUrl, 0)
    debug('new hook created', newHook)

    await saveHook(confpath, newHook, qw)
}

const saveHook = async (path, data, qw) => {
    debug('hook registered')
    config.set(`${path}:hookId`, data.hookId)
    const secret = await qw.getSecret(data.hookId)
    debug('got secret key of new hook', secret)
    config.set(`${path}:secret`, secret.key)
    config.save()
}