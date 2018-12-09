const request = require("request-promise")

class Qiwi {

    constructor(token) {
        this.token = token
        this.headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + this.token
        }
        this.apiUri = "https://edge.qiwi.com/"
    }

    /**
     * @returns {object} account information
     */
    async getAccountInfo() {
        const options = {
            url: this.apiUri + 'person-profile/v1/profile/current',
            headers: this.headers,
            json: true
        }

        try {
            return await request.get(options)
        } catch (e) {
            console.error(e.message || e.body || e);
            return null;
        }
    }

    /**
     * return array of accounts
     * @returns {object} example: {accounts: [{..., balance:{amount:N, currency: 643}  }, ...]}
     */
    async getBalance() {
        const options = {
            url: this.apiUri + 'funding-sources/v1/accounts/current',
            headers: this.headers,
            json: true
        }

        try {
            return await request.get(options)
        } catch (e) {
            console.error(e.message || e.body || e)
            return null
        }
    }


    /**
     * Return latest transactions in current QIWI-Wallet
     * @param {object} requestOptions  
     * @param {int} requestOptions.rows - transacions count limit
     * @param {string} requestOptions.operation - (ALL, IN, OUT) filter by operation type
     * @param {[string]} requestOptions.sources - Operation sourses filtering
     * @param {} requestOptions.startDate - get operations begin from 'startDate'
     * @param {} requestOptions.endDate - get operations to 'endDate'
     * @param {} requestOptions.nextTxnDate - 
     * @param {} requestOptions.nextTxnId
     */
    async getOperationHistory(requestOptions) {
        const data = await this.getAccountInfo()

        if (!data && !data.authInfo) return null

        const options = {
            url: this.apiUri + 'payment-history/v1/persons/' + data.authInfo.personId + '/payments',
            headers: this.headers,
            qs: {
                rows: requestOptions.rows,
                operation: requestOptions.operation,
                sources: requestOptions.sources,
                startDate: requestOptions.startDate,
                endDate: requestOptions.endDate,
                nextTxnDate: requestOptions.nextTxnDate,
                nextTxnId: requestOptions.nextTxnId
            },
            json: true
        }

        try {
            return await request.get(options)
        } catch (e) {
            console.error(e.message || e.body || e)
            return null
        }

    }

    /**
     * Send wallet rubs to specified address
     * @param {object} requestOptions 
     * @param {int} requestOptions.amount - Sending rubs amount
     * @param {string} requestOptions.comment - [OPTIONAL]
     * @param {string} requestOptions.account - Receiver
     * 
     */
    async toWallet(requestOptions) {
        const options = {
            url: this.apiUri + 'sinap/terms/99/payments',
            headers: this.headers,
            body: {
                id: (1000 * Date.now()).toString(),
                sum: {
                    amount: +requestOptions.amount,
                    currency: "643"
                },
                source: "account_643",
                paymentMethod: {
                    type: "Account",
                    accountId: "643"
                },
                comment: requestOptions.comment,
                fields: {
                    account: requestOptions.account
                }
            },
            json: true,
            resolveWithFullResponse: true
        }

        try {
            return await request.post(options)
        } catch (e) {
            console.error(e.body || e.message || e)
            return null
        }
    }

    /**
     * Generate and returns payment form link
     * @param {object} options 
     * @param {string} account - 
     * @param {string} comment [OPTIONAL]
     * @param {int} amount
     */
    async generatePaymentFormLink(options) {
        const link = `https://qiwi.com/payment/form/99?extra%5B%27account%27%5D=${options.account}`
            + `&amountInteger=${options.amount}&extra%5B%27comment%27%5D=${options.comment | ""}&currency=643`; 
        return link;
    }
}

module.exports = Qiwi;
