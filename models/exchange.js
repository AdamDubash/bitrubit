const mongoose = require('../libs/mongoose')

const config = require('../config')

const schema = mongoose.Schema({
    id: {
        type: Number,
        required: true,
        unique: true
    },
    course: {
        type: String, 
        required: true
    },
    owner: {
        type: Number,
        required: true
    },
    sourceAddress: {
        type: String
    },
    destAddress: {
        type: String
    },
    amount: {
        qiwi: Number,
        btc: Number
    },
    status: {
        code: {
            type: Number,
            default: 0
        },
        msg: {
            type: String,
            default: "Ожидаем платежа"
        }
    },
    createdTime: Date,
    waitingStopTime: Date,
    finishTime: Date
})

schema.statics.add = async (excParams) => {
    try {
        excParams.id = await Exchange.countDocuments({})
        excParams.createdTime = Date.now()
        excParams.waitingStopTime = excParams.createdTime + 1000 * 60 * config.get("exchange:waitingMinutes")

        const exc = new Exchange(excParams)

        return await exc.save()
    } catch(e) {
        console.error("Exchange add error", e)
        return null
    }
}

schema.statics.getById = async id => {
    try {
        return await Exchange.findOne({ id })
    } catch(e) {
        console.error("Exchange get error", e)
        return null
    }
}

schema.statics.getByAddress = async(addrName, value) => {
    try {
        return await Exchange.findOne({ [addrName]: value, 'status.code': 0 })
    } catch (e) {
        console.error("Exchange get error", e)
        return null
    }
}

var Exchange = mongoose.model('Exchange', schema)

module.exports = Exchange