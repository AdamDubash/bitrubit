const socketPassport = require('passport.socketio');
const xtend = require('xtend');

const GameSocket = require('./gameSocket');

let io;

const gameList = {

};

exports.init = (server, sessionConfig) => {
    const mem = require('../libs/mem');
    io = require('socket.io').listen(server);

    const authConfig = xtend(sessionConfig, {
        success: function(data, accept) {
            accept();
        },
        fail: function(data, message, error, accept) {
            accept();
        }
    });

    io.use(socketPassport.authorize(authConfig));

    for(let gameName in mem.games) {
        if(gameName === 'mp') {
            const mpGames = mem.games['mp'];
            for(let mpName in mpGames) {
                const Engine = require(`../mp/${mpGames[mpName].engine}`);
                gameList[mpName] = new Engine(io, mpGames[mpName]);

                gameList[mpName].type = 'mp';
            }

            continue;
        }

        gameList[gameName] = new GameSocket(io, gameName);
        gameList[gameName].type = '1x1';
        gameList[gameName].lobby = mem.games[gameName]
    }

    require('./chat').init(io)

};

/*
* позже УДАЛИ все ненужное и оставиь только emit!
* все равно не выполняеют особой логики кроме банального эмита...
* */

exports.addRoom = (name, room) => {
  gameList[name].addRoom(room);
};

exports.removeRoom = (name, room) => {
    gameList[name].removeRoom(room);
};

exports.emit = (name, room, eventName, eventData) => {
    gameList[name].emit(room, eventName, eventData);
};

exports.finish = (name, room, result) => {
    gameList[name].finish(name, result);
};


exports.getGameList = () => { return gameList }