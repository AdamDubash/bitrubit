const crypto = require('crypto');
const randomString = require('randomstring');
const debug = require('debug')('jackpot');

const MPInterface = require('./mpInterface');
const User = require('../models/user');
const Comm = require('../models/comm');
const MpHistory = require('../models/mpHistory');
const snuffle = require('../libs/snuffle');

const satoshi = 100000000;

class JackpotRoulette extends MPInterface {
    constructor(io, {name, conc, time, minBet, maxBet}) {
        super(io, name);

        this.ticketPrice = conc === 'btc' ? satoshi : 1;
        this.conc = conc;

        this.gameLength = time;

        this.minBet = minBet;
        this.maxBet = maxBet;

        this.newGame();
    }

    newGame() {
        this.winner = null;
        this.bank = 0;
        this.bets = [];
        this.players = {};
        this.procents = [];
        this.timeout = null;
        this.endTime = null;
        //available states are bets, showdown
        this.state = 'bets';
        this.gameNumber = Math.random();
        this.hash = crypto.createHash('md5').update(this.gameNumber + '').digest('hex');
        this.gameId = randomString.generate(12);

        this.creatingTime = Date.now();

        this.sendState();

        debug('new game begun');
    }

    doBet({username, id, nid}, value) {
        const firstTicket = this.bank * this.ticketPrice;
        const lastTicket = firstTicket + value * this.ticketPrice - 1;

        const tickets = {first: firstTicket, last: lastTicket};

        this.bank += value;

        (!this.players[id]) && (this.players[id] = {id, username, betsSum: 0, nid});

        this.players[id].betsSum += value;

        if(!this.timeout && Object.keys(this.players).length === 2) {
            const timer = this.gameLength * 1000;
            this.endTime = Date.now() + timer;

            this.timeout = setTimeout(() => {
                this.finish();
            }, timer);

            this.nsp.emit('updateTimer', this.endTime);

            debug('timer activated');
        }

        const bet = new Bet({username, id, nid}, value, tickets);
        this.bets.push(bet);

        this.updateProcents();

        const _ = this;
        const updateData = {bet, bank: _.bank, procents: _.procents};
        this.nsp.emit('bet', updateData);

        debug('doBet', bet);
    }

    updateProcents() {
        const bank = this.bank;

        const procents = [];

        for(let userId in this.players) {
            const i = this.players[userId];

            procents.push({
                user: {
                    id: userId,
                    username: i.username,
                    nid: i.nid
                },
                procent: (i.betsSum * 100 / bank).toFixed(2)
            })
        }

        this.procents = procents;
    }

    sendState(socket) {
        const _ = this;
        let state =  {
            gameId: _.gameId,
            hash: _.hash,
            bets: _.bets,
            bank: _.bank,
            state: _.state,
            endTime: _.endTime,
            online: _.online,
            gameLength: _.gameLength,
            procents: _.procents
        };

        if(this.state === 'showdown') {
            state = Object.assign(state, {
                winner: _.winner,
                gameNumber: _.gameNumber,
                winnerTicket: _.winnerTicket,
                roulette: _.roulette,
                rouletteEndTime: _.rouletteEndTime
            });
        }

        if(socket) {
            state.chat = this.chat.history;
            socket.emit('state', state);
        } else {
            this.nsp.emit('state', state);
        }

    }

    finish() {
        this.state = 'showdown';
        this.winnerTicket = ~~(this.bank * this.ticketPrice * this.gameNumber);
        this.defineWinner();

        //TODO: сделай нормальное сохранение истории для мутльтиплеерных игр

        //время окончания showdown'a
        this.endTime = Date.now() + 22000;
        this.rouletteEndTime = Date.now() + 15000;

        this.generateRouletteData();

        this.sendState();

        this.saveGameToDB();

        setTimeout(() => {
            this.sendPrize(this.winner, this.bank);
            this.newGame();
        }, 22000);

        debug('finish game, winner is ', this.winner);
    }

    async saveGameToDB() {

        for(let i in this.players) {
            await User.updateStat(i, i === this.winner.id, this.conc, this.bank);
        }

        const _ = Object.assign({}, this);

        const jsonify = e => JSON.stringify(e);

        _.procents = _.procents.map(jsonify);
        _.bets = _.bets.map(jsonify);
        _.players = JSON.stringify(Object.values(_.players));
        _.gameName = _.name;
        _.id = _.gameId;
        _.finishTime = Date.now();
        _.winner = _.winner.username;

        await MpHistory.add( _ );

    }

    async sendPrize(winner, bank) {
        const comm = this.conc !== 'btc'
            ? ~~(bank * 0.05)
            : this.bank * 0.05;

        await Comm.add(this.conc, comm);

        await User.updateCash(winner.username, this.conc, bank - comm);

        await this.updateWinnerHeader(winner);
        debug('prize sended');
    }

    async updateWinnerHeader(winner) {
        const id = winner.id;
        const user = await User.findById(id);

        if(!user) return false;

        const sockets = this.nsp.connected;
        for(let i in sockets) {
            if(sockets[i].user && sockets[i].user.id === id) {
                sockets[i].emit('updateHeaderCash', user.cash);
                return true;
            }
        }
    }

    generateRouletteData() {
        let avatars = [];

        for(let p of this.procents) {
            for(let i=0; i < ~~p.procent; i++) {
                avatars.push(p.user.nid);
            }
        }

        avatars = snuffle(avatars);

        avatars[93] = this.winner.nid;

        this.roulette = {
            avatars,
            cursor: 8900 + Math.floor((Math.random() * 94) + 6)
        };
    }

    defineWinner() {
        for(let bet of this.bets) {
            const {first, last} = bet.tickets;

            if(first <= this.winnerTicket && this.winnerTicket <= last) {
                this.winner = bet.user;
                return
            }
        }

        throw new Error("Could'n find user");
    }

    bindHandlers(socket) {
        if(!socket.user.logged_in) return;

        const sendAlert = (type, msg) => {
            socket.emit('alert', {type, msg});
        };

        socket.on('bet', async (bet) => {
            debug('bet', socket.user.nid, bet);

            if(this.state !== 'bets') {
                return sendAlert('danger', 'Прием ставок закрыт!');
            }

            let user = null;
            try{
                user = await User.findById(socket.user.id);
                if(!user) throw new Error("User not found " + socket.user.id);
            } catch (e) {
                console.error(e);
                sendAlert('danger', 'HTTP 500. Что-то пошло не так...');
                return;
            }

            if(isNaN(bet)) {
                sendAlert('danger', 'Вы ввели некорректное значение!');
                return;
            }

            bet = +bet;

            if (bet > user.cash[this.conc]) {
                return sendAlert('danger', "Ваша ставка превышает баланс!");
            }

            if(bet < this.minBet) {
                return sendAlert('danger', 'Ваша ставка меньше минимума!');
            }

            if(this.maxBet) {
                if (bet > this.maxBet) {
                    return sendAlert('danger', 'Ваша ставка больше максимума!');
                }

                if ((this.players[user.id]) && (this.maxBet < bet + this.players[user.id].betsSum)) {
                    return sendAlert('danger', 'Общая сумма ставок превышает лимит!');
                }
            }

            try{
                await User.updateCash(socket.user.username, this.conc, -bet);
            }catch (e) {
                console.error(e);
                return sendAlert('danger', 'HTTP 500. Опс, что-то пошло не так.');
            }

            this.doBet(user, bet);

            user.cash[this.conc] -= bet;
            socket.emit('updateHeaderCash', user.cash);

            sendAlert('success', 'Ваша ставка принята!');
        });
    }

}

class Bet {
    constructor(user, value, tickets) {
        this.user = user;
        this.value = value;
        this.tickets = tickets;
    }
}

module.exports = JackpotRoulette;