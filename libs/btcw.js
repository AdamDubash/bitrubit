const request = require('request-promise');
const xtend = require('xtend');

class btcWallet {
    constructor(url, token) {
        this.options = {
            url: url,
            json: true,
            headers : {
                'authorization': token
            }
        }
    }

    async reguser(userId) {
        const reqOptions = this.xtendOpts({
            body: {
                userId
            }
        }, "/reguser");

        try {
            let res = await request.post(reqOptions);
            return res;
        } catch(e) {
            return null
        }
    }

    async getBalance() {
        const reqOptions = this.xtendOpts({}, '/getbalance');

        try {
            return await request.get(reqOptions)
        } catch (e) {
            return null;
        }
    }

    async withdrawal(addr, amount, account) {
        const regOptions = this.xtendOpts({
            body: {
                addr,
                amount: +amount,
                account
            }
        }, '/withdrawal');

        try {
            let res = await request.post(regOptions);
            return res;
        } catch (e) {
            console.error(e.body || e.statusMessage || e);
            return null;
        }
    }

    xtendOpts(opts, path) {
        const xtended = xtend(this.options, opts);
        xtended.url += path;

        return xtended;
    }

}

module.exports = btcWallet;
