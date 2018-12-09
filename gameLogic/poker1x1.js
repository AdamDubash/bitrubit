const GameInterface = require('./gameInterface');
const {Engine, Player} = require('./libs/holdem');

class Poker1x1 extends GameInterface {
    constructor(room) {
        super(room);

        const _ = this;

        const cbs = {
            onfolded: (pl) => {
                _.boardAlert(`Игрок ${pl.name} сложил карты. Новая игра начнется через несколько секунд.`);
                _.roundEnded = true;
            },
            onroundEnd: (msg, data) => {
                _.boardAlert(msg + '.Новая игра начнется через несколько секунд.');
                _.room.emit('showdown', data);
                _.roundEnded = true;
            },
            onnewRound: (game) => {
                const initNewRound = () => {
                    _.updateTurn();

                    game.players.forEach( (p, i) => {
                        const data = {cards: p.cards, dealer: game.dealer, pdata: game.getPublicData()};
                        _.room.players[i].emit('new-round', data);
                    } );

                    _.sendMoves();
                };

                //если начался не первый раунд, то даем время проанализировать все карты
                if(_.roundEnded) {
                    setTimeout(initNewRound, 4000);
                    _.roundEnded = false;
                } else {
                    initNewRound();
                }


            },
            onnextRound: () => {
              _.sendMoves();
            },
            onmoveEnd: (data, nextRound) => {
                _.room.emit('move', data);
                !nextRound && _.sendMoves();
            },
            onfinish: (winner, msg) => {
                _.finish(winner, msg);
            },
        };

        this.game = new Engine(25, 50, cbs);
    }

    initTurn() {
        this.turnIndex = 0;
    }

    changeTurn() {
        this.turnIndex = this.game.current;
    }

    start() {
        super.start();

        const players = this.room.players.map(pl => {
           return new Player(pl.user.username, 300);
        });

        this.game.start(players);

        this.sendOpponentName();

        this.updateTurn();
    }

    sendOpponentName() {
        for(let i = 0; i < this.room.players.length; i++) {
            this.room.players[i].emit('opponentName', this.room.players[~~!i].user.username);
        }
    }

    sendMoves() {
        const moves = this.game.getMoves();

        this.room.players[this.game.current].emit('moves', moves);
    }

    move(data) {
        this.logger(data);


        const {action, value} = data.moves;
        const current = this.game.current;

        try {
            if(this.game.move(action, +value) === null) {
                return null;
            }
        } catch (e) {
            return false;
        }

        const msg = this.msgGenerator(this.room.players[current].user.username, action, value);
        this.notifyOpponent(this.game.getNextPlayerIndex(current), msg);

        return true;
    }

    msgGenerator(name, action, value) {
        switch (action) {
            case 'Bet':
                return `${name} сделал ставку ${value} фишек`;
            case 'Raise':
                return `${name} повысил ставку на ${value} фишек`;
            case 'Check':
                return `${name} производит чек`;
            case 'AllIN':
                return `${name} поставил все! All in!`;
            case 'Call':
                return `${name} коллировал ставку`;
            case 'Fold':
                return `${name} сложил карты`;
            default:
                return `${name} ${action} ${value}`
        }
    }

    notifyOpponent(index = this.game.getNextPlayerIndex(), msg) {
        this.room.players[index].emit('board-alert', msg);
    }

    boardAlert(msg) {
        this.room.emit('board-alert', msg);
    }


    finish(winnerIndex, msg) {
        const winnerUsername = this.room.players[winnerIndex].user.username;
        this.room.finish(winnerUsername, msg || '' );
    }

    getGameState(index) {
        const state = this.game.getPublicData();

        state.names = this.game.players.map(pl => pl.name);

        if(!isNaN(index)) {
            state.plCards = this.game.players[index].cards;

            if(index === this.turnIndex) {
                state.moves = this.game.getMoves(index);
            }
        }

        return state;
    }

}

module.exports = Poker1x1;