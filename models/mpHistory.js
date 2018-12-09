const mongoose = require('../libs/mongoose');

const schema = mongoose.Schema({
    gameName: String,
    id: String,
    conc    : String,
    bank: Number,
    procents: [String],
    players: [String],
    winner: String,
    winnerTicket: Number,
    hash: String,
    creatingTime: Date,
    finishTime: Date,

    bets: [String]
});

schema.statics.add = async (room) => {
    const history = new History(room);

    return await history.save();
};

schema.statics.getLatestGames = async (id, limit) => {
    return History.find({players: id}, null, {
        skip: 0,
        limit,
        sort: {
            'finishTime': -1
        }
    })
};

schema.statics.clearPrivateFields = (history) => {
    return history.map(h => {
        delete h.log;
        delete h.players;
        return h;
    })
}

var History = mongoose.model('MpHistory', schema);

module.exports = History;