const router = require('express').Router()
const debug = require('debug')('btc-ipn')

const User = require('../../models/user')
const Payment = require('../../models/payment')
const config = require('../../config')
const BTCWallet = require('../../libs/btcw')
const btcw = new BTCWallet(config.get('btcw:url'), config.get('btcw:token'))
const notify = require('../../libs/notification')

//TODO: add more security
router.post('/', async (req, res, next) => {
    debug(req.body)
    const {event, account, address, amount, newaddress, transaction} = req.body
    
    if( event === "receive") {
        debug("get receive event")

        notify.add(`BTC | Обнаружена входящая транзакция: ${transaction.txid}`, +account)

        res.sendStatus(200)
    }

    if( event === "first-confirm" ) {
        debug("get first confirm event")

        notify.add(`BTC | Обнаружена первое подтверждение транзакции: ${transaction.txid}`, +account)

        res.sendStatus(200)
    }

    if( event === "confirmed") {
        //todo: update by userid and oldaddr
        User.updateCashByNid(+account, 'btc', amount)
        User.setAddr(+account, newaddress)

        Payment.add(+account, 'IN', 'btc', +amount, address, 1)
        notify.add(`BTC | Зачислено ${amount}BTC`, +account)

        res.sendStatus(200)
    }

    res.sendStatus(400)
});

module.exports = router;
