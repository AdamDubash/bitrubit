const mongoose = require('../libs/mongoose');

const schema = mongoose.Schema({
    currentValue : {
        rub: {
            type: Number,
            default: 0
        },
        btc: {
            type: Number,
            default: 0
        }
    },
    summaryIn : {
        rub: {
            type: Number,
            default: 0
        },
        btc: {
            type: Number,
            default: 0
        }
    }
});

schema.statics.add = async (conc, value) => {
    return await Comm.update({}, {$inc: {['currentValue.' + conc]: value, ['summaryIn.' + conc]: value}});
};

schema.statics.out = async (conc, value) => {
    (value > 0) && (value = -value);

    await Comm.update({}, {$inc: {['currentValue.' + conc]: value}})
};

schema.statics.initComm = async () => {

    const comms = await Comm.find({});

    if(comms.length === 0) {
        const comm = new Comm();

        await comm.save();
    }

    return true;
};


var Comm = mongoose.model('Comm', schema);

module.exports = Comm;