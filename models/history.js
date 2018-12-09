const mongoose = require('../libs/mongoose');

const schema = mongoose.Schema({
    gameName: String,
    id: String,
    conc    : String,
    bet: Number,
    owner: String,
    players: [String],
    playersUsernames: [String],
    winner: String,
    creatingTime: Date,
    finishTime: Date,

    log: [],
    descr: String
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

var History = mongoose.model('History', schema);

module.exports = History;