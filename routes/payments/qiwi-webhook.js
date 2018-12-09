const router = require('express').Router()
const debug = require('debug')('qiwi-webhook:router')

const QiwiWebhook = require('../../libs/qiwi-webhook')
const config = require('../../config')
const User = require('../../models/user')
const Payment = require('../../models/payment')
const notify = require('../../libs/notification')

router.post('/', async (req, res, next) => {
    debug(req.body) 

    if(QiwiWebhook.verify(req.body, config.get('qiwi:secret'))) {
        debug('hash verified')
        try {
            const { payment } = req.body

            if (payment.type === 'IN' && payment.status === 'SUCCESS') {
                const nid = payment.comment

                Payment.add(nid, 'IN', 'rub', payment.sum.amount, payment.account, 1, payment.txnId)

                if (isNaN(nid)) {
                    throw new Error('NID not specified in payment.comment')
                }

                await User.updateCashByNid( +nid, 'rub', payment.sum.amount)
                
                notify(`Зачислено ${payment.sum.amount}RUB через QIWI`, +nid)
            }
        } catch(e) {
            console.error(e)
            console.error(req.body)
        }

        res.send(200)
    } else {
        debug('hash not verified!')
        res.send(401)
    }


})

module.exports = router

