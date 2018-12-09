const request = require('request-promise')
const qs = require('querystring')
const debug = require('debug')('qiwi-webhook')
const crypto = require('crypto')

class QiwiWebhook {
    
    /**
     * @param {string} token - API's token for auth requests 
     */
    constructor(token) {
        this.token = token
        this.headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + this.token
        }
        this.apiUri = "https://edge.qiwi.com/payment-notifier/v1/hooks"
    }

    /**
     * Register new webhook
     * 
     * @param {string} hookUrl
     * @param {int} txtype
     */
    async regHook(hookUrl, txtype = 2) {
        const qstring = `?hookType=1&param=${qs.escape(hookUrl)}&txnType=${txtype}`
        const opts = {
            method: 'PUT',
            headers: this.headers,
            url: this.apiUri + qstring
        }

        return await req(opts)
    }

    /**
     * Delete current webhook
     * 
     * @param {string} hookId
     */
    async deleteHook(hookId) {
        const opts = {
            method: 'DELETE',
            url: `${this.apiUri}/${hookId}`,
            headers: this.headers 
        }

        return await req(opts)
    }

    /**
     * Returns active hook information
     */
    async getHookInfo() {
        const opts = {
            method: 'GET',
            url: `${this.apiUri}/active`,
            headers: this.headers
        }

       return await req(opts)
    }

    /**
     * Returns current secret key
     * 
     * @param {string} hookId
     */
    async getSecret(hookId) {
        const opts = {
            method: 'GET',
            url: `${this.apiUri}/${hookId}/key`,
            headers: this.headers
        }

        return await req(opts)
    }

    /**
     * Change current secret key on new key
     * 
     * @param {string} hookId
     */
    async changeSecret(hookId) {
        const opts = {
            method: 'POST',
            url: `${this.apiUri}/${hookId}/newkey`,
            headers: this.headers
        }

        return await req(opts)
    }

    static verify(ob, secret) {
        try {
            const signKeys = ob.payment.signFields.split(',')
            const signValues = []

            debug(signKeys)

            for (let key of signKeys) {
                const propPath = key.split('.')

                let val = ob.payment
                for(let p of propPath) {
                    val = val[p]
                }
                signValues.push(val)
            }

            const sign = signValues.join('|')
            debug(sign)
            const signEncrypted = crypto.createHmac('sha256', new Buffer(secret, 'base64')).update(sign).digest('hex')
            debug(signEncrypted)

            if (signEncrypted !== ob.hash) {
                return false
            }

            return true
        } catch(e) {
            console.log(e)
            return null
        }

    }

}

const req = async (opts) => {
    opts.json = true
    try {
        const res = await request(opts)
        return res
    } catch (e) {
        console.error(e.body)
        return null
    }
}

module.exports = QiwiWebhook