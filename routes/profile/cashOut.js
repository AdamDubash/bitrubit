const express = require('express');
const debug = require('debug')('router:profile/cashOut');
const router = express.Router();

const User = require('../../models/user');
const Payment = require('../../models/payment');
const config = require('../../config');

const BTCWallet = require('../../libs/btcw');
const btcw = new BTCWallet(config.get('btcw:url'), config.get('btcw:token'));

const QIWIWallet = require('../../libs/qiwi-api');

router.get('/', async (req, res) => {
    const renderData = config.get(`cashOut`);
    renderData.payments = await Payment.getLatestPayments(req.user.nid, 'OUT', 10);
    res.render('profile/cashout', renderData);
});

const sendError = (res, msg) => {
    res.status(400).send(msg);
};

/** Middleware for checking
 * form inputs valid and 
 *  balance enough */
const isCorrectRequest = (req, res, next) => {
    const { conc, amount, address } = req.body;

    const cashConfig = config.get(`cashOut:${conc}`);

    if (!cashConfig) {
        return sendError(res, `Неизвестная валюта ${conc}`);
    }

    if (isNaN(amount)) {
        return sendError(res, "Введите корректную сумму!");
    }

    const { min, max } = cashConfig;

    if (+amount > max || +amount < min) {
        const m = `Сумма вывода должна быть в пределах от ${min}${conc.toUpperCase()} и до ${max}${conc.toUpperCase()}`;
        return sendError(res, m);
    }

    if (!outIsValid(conc, address)) {
        return sendError(res, "Введите корректный адрес для вывода!");
    }

    if (amount > req.user.cash[conc]) {
        return sendError(res, "Сумма вывода не должна превышать текущий баланс!");
    }

    next();
}

const outIsValid = (conc, out) => {

    if(!out) {
        return false
    }

    switch (conc) {
        case 'btc':
            if (out.length < 24) {
                return false;
            }
            break;
        case 'rub':
            if(isNaN(out) || out.length < 10 || out.length > 12) {
                return false;
            }

            break;
        default:
            return false;
    }

    return true;
}

const outBtc = async (req, res, next) => {
    const { conc, amount, address } = req.body;

    if(conc !== 'btc') {
        return next();
    }

    try {
        const wdrwl = await btcw.withdrawal(address, amount, req.user.username);
        if (!wdrwl || wdrwl.error) {
            throw new Error("empty or error response from btcw.withdrawal " + JSON.stringify(wdrwl));
        }

        debug('success withdrawal', wdrwl.result);
        await User.updateCash(req.user.username, 'btc', -amount);
        Payment.add(req.user.nid, 'OUT', 'btc', amount, address, 1, wdrwl.result);

        res.send(200, `Средства отправлены на указанный адрес. Ваша транзакция: ${wdrwl.result}`);
    } catch(e) {
        console.error(e);
        sendError(res, "Произошла ошибка на стороне сервера... Попробуйте позже или обратитесь в поддержку.")
    }

};

const outRub = async (req, res, next) => {
    const { conc, amount, address } = req.body;
    
    if (conc !== 'rub') {
        return next();
    }

    try {
        const opts = {
            amount,
            account: address,
            comment: ``
        };

        const qiwi = new QIWIWallet(config.get('qiwi:token'));

        const result = await qiwi.toWallet(opts);

        if(!result) {
            throw new Error(`Empty response from qiwi api...`);
        }

        if(result.statusCode !== 200) {
            throw new Error(`Payment not accepted. Code - ${result.statusCode}`)
        }

        debug('success withdrawal qiwi', address, amount);
        await User.updateCash(req.user.username, 'rub', -amount);
        Payment.add(req.user.nid, 'OUT', 'rub', amount, address, 1, result.body.transaction.id);

        res.send(200, `Средства успешно отправлены на указанный адрес.`);
    } catch(e) {
        console.error(e);
        sendError(res, "Ошибка на стороне сервера. Попробуйте запрос позже.");
    }
}

router.post('/', isCorrectRequest, outBtc, outRub);

module.exports = router;