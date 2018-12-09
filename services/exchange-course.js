const shedule = require('node-schedule')
const request = require("request-promise")

const config = require('../config')
const redis = require('../libs/redisClient')

const BTCWallet = require('../libs/btcw');
const btcw = new BTCWallet(config.get('exchange:btc:url'), config.get('exchange:btc:token'));

const QiwiApi = require('../libs/qiwi-api')

const updateCourse = async () => {
    try {
        const res = await request.get('https://blockchain.info/ticker', {json: true})

        const course = res["RUB"].buy

        const procent = config.get("exchange:procent")

        const ourCourse = course + course * procent / 100

        redis.set("exchange:btc-course", ourCourse.toFixed(2))
    } catch(e) {
        console.error(e)
        return
    }
}

const updateBalances = async () => {
    const qiwi = new QiwiApi(config.get('exchange:qiwi:token'))
    
    try {
        const response = await qiwi.getBalance()
        if (response && response.accounts[0] && response.accounts[0].balance) {
            redis.set("exchange:qiwi:balance", response.accounts[0].balance.amount)
        }
    } catch (e) {
        console.error(e)
    }

    try {
        const response = await btcw.getBalance()

        redis.set("exchange:btc:balance", response.result)
    } catch (e) {
        console.error(e);
    }
}

const setReserved = async () => {
    const btcReserver = redis.get("exchange:btc:reserved")
    
    if (btcReserver === false) {
        redis.set("exchange:btc:reserved", 0)
    }

    const qiwiReserved = redis.get("exchange:qiwi:reserved")

    if(qiwiReserved === false) {
        redis.set("exchange:qiwi:reserved", 0)
    }
}

updateCourse()
updateBalances()
setReserved()

shedule.scheduleJob("* */1 * * *", updateCourse)
shedule.scheduleJob("* */1 * * *", updateBalances)
