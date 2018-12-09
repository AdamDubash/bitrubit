const Room = require('../classes/room');
const localChat = require('../libs/localChat');
const config = require('../config');

class MemGame {
    constructor() {
        this.online = 0;
        this.rooms = {};
        this.chat = localChat(30);
    }

}

const mem = {
    captcha: {},
    games: {

    },

    freeVirt: {

    },

    init() {
        //эту хуйню передалать, конечно же
        const gameList = ['chess', 'bl', 'poker1x1'];

        gameList.forEach(name => {
            this.games[name] = new MemGame();
        });

        this.games['mp'] = {
            'jackpot-rub1': {
                name: 'jackpot-rub1',
                conc: 'rub',
                title: 'Рулетка #1',
                engine: 'jp',
                time: 60,
                minBet: 50,
                maxBet: 200
            },
            'jackpot-rub2': {
                name: 'jackpot-rub2',
                conc: 'rub',
                title: 'Рулетка #2',
                engine: 'jp',
                time: 300,
                minBet: 100,
                maxBet: 10000
            },
            'jackpot-rub3': {
                name: 'jackpot-rub3',
                conc: 'rub',
                title: 'Рулетка #3',
                engine: 'jp',
                time: 300,
                minBet: 500,
                maxBet: 0
            },
            'jackpot-btc1': {
                name: 'jackpot-btc1',
                conc: 'btc',
                title: 'Рулетка #1',
                engine: 'jp',
                time: 60,
                minBet: 0.0001, 
                maxBet: 0.01
            },
            'jackpot-btc2': {
                name: 'jackpot-btc2',
                conc: 'btc',
                title: 'Рулетка #2',
                engine: 'jp',
                time: 600,
                minBet: 0.001,
                maxBet: 1
            }
        };
    }
};



const getPairGamesInfo = () => {
    const titles = config.get('titles')
    const result = { }

    for(let game in mem.games) {
        if (game === 'mp') continue

        const roomsCount = Object.keys(mem.games[game].rooms).length
        let inGame = 0, inPending = 0
        if(roomsCount) {
            for (let room of Object.values(mem.games[game].rooms)) {
                if(room.status == 'Играют') {
                    inGame++
                } else {
                    inPending++
                }
            }
        }

        result[game] = {
            online: mem.games[game].online,
            rooms: roomsCount,
            inGame, inPending,
            title: titles[game]
        }
    }

    return result
}

const getMpGamesInfo = () => {
    const info = require('../socket').getGameList()

    const result = {}

    for (let game of Object.values(info)) {
        if(game.type !== 'mp') continue

        result[game.name] = {
            online: game.online,
            bank: game.bank,
            players: game.procents.length,
            conc: game.conc,
            title: mem.games.mp[game.name].title
        }
    }

    return result
}

mem.getPublicInfo = () => {
    return {
        '1x1': getPairGamesInfo(),
        'mp': getMpGamesInfo()
    }
}

module.exports = mem;