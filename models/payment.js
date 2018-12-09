const mongoose = require('../libs/mongoose');

const schema = mongoose.Schema({
    userNid: String,
    operation: String, // 'IN', or 'OUT'
    conc: String,
    amount: Number,
    address: String,
    status: {
        type: Number,
        default: 0
    },
    date: {
        type: Date,
        default: Date.now()
    },
    txid: String
});

schema.statics.add = async (userNid, operation, conc, amount, address, status = 0, txid = '') => {
    const payment = new Payment({
        userNid: userNid + '',
        operation,
        conc,
        amount,
        address,
        status,
        date: Date.now(),
        txid
    });

    return await payment.save();
};

schema.statics.getLatestPayments = async (userNid, operation, limit) => {
    return Payment.find({ userNid, operation }, null, {
        skip: 0,
        limit,
        sort: {
            'date': -1
        }
    })
};



var Payment = mongoose.model('Payment', schema);

module.exports = Payment;