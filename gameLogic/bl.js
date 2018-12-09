const GameInterface = require('./gameInterface');
const Logic = require('./libs/blLogic');

class BL extends GameInterface{

    constructor(room) {
        super(room);

        this.game = new Logic();
    }

    initTurn() {
        super.initTurn();

        this.replacePlayersByTurn();

        // 0 - w, 1 - b;
        this.turnIndex = 0;
    }

    start() {
        super.start();

        this.game.start();

        this.game.throwDices();
        // const turnColor = this.getTurnColor();

        const dices = this.game.dices;

        this.room.players[0].emit('start', {
            dices, currentColor: 'w', playerColor: 'w'
        });

        this.room.players[1].emit('start', {
            dices, currentColor: 'w', playerColor: 'b'
        });


        this.updateTimeout();
        this.room.updateRoomHeader();
    }

    checkWin() {
        if(this.game.barBlack === 15) {
            this.room.finish(this.room.players[1].user.username);
            return
        }

        if(this.game.barWhite === 15) {
            this.room.finish(this.room.players[0].user.username);
        }
    }

    move(data) {
        //для логгирования
        this.logger(data);

        if(!data.moves || data.moves.length === 0) return false;

        for(let move of data.moves) {
            const result = this.game.move(move.from, move.to);
            if(!result) return false;
        }

        this.checkWin();

        this.room.players[~~!this.turnIndex].emit('move', data.moves);

        let moveable;
        do{
            this.game.throwDices();
            moveable = this.game.getMoveableCols();

            if(moveable.length === 0) {
                this.room.players[this.game.getIndexByColor()]
                    .emit('alert', `Выпало: ${this.game.dices}. Вы пропускаете ход.`);
            }

        } while(moveable.length === 0);

        const dices = this.game.dices;
        const currentColor = this.game.currentColor;

        this.room.emit('turn', {
            dices, currentColor
        });

        return true;
    }

    updateTurn() {
        this.turnIndex = this.game.currentColor === 'w'
            ? 0 : 1;

        this.updateTimeout();

        this.room.updateRoomHeader();
    }

    getGameState(index = null) {
        const _ = this;
        const data = {
            currentColor: _.game.currentColor,
            barWhite: _.game.barWhite,
            barBlack: _.game.barBlack,
            cols: _.game._wcols,
            dices: _.game.dices
        };

        if(index !== null) {
            data.playerColor = !index ? 'w' : 'b';
        }

        return data;
    }
}

module.exports = BL;