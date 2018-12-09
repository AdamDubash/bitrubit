const GameInterface = require('./gameInterface');

const ChessJS = require('chess.js').Chess;

class Chess extends GameInterface{

    constructor(room) {
        super(room);

        this.game = new ChessJS();
    }

    initTurn() {
        super.initTurn();

        this.replacePlayersByTurn();

        // 0 - w, 1 - b;
        this.turnIndex = 0;
    }

    start() {
        super.start();

        this.room.players.forEach((p, i) => {
           p.emit('start', {
               orientation: !i ? 'w' : 'b'
           })
        });

        this.updateTimeout();
        this.room.updateRoomHeader();
    }

    move(data) {
        //для логгирования
        super.logger(data);

        const tryMove = this.game.move({
            from: data.moves.source,
            to: data.moves.target,
            promotion: 'q' // NOTE: always promote to a queen for example simplicity
        });

        // illegal move
        if (tryMove === null) {
            return false;
        }

        if(this.game.in_checkmate()) {
            this.room.finish(this.room.players[this.turnIndex].user.username);
        }

        const moveData = data.moves;
        moveData.fen = this.game.fen();

        this.room.players[~~!this.turnIndex].emit('move', moveData);

        return true;
    }


    getGameState(index) {
        const data = {};
        data.orientation = index === 0 ? 'w' : 'b';
        data.fen = this.game.fen();
        return data;
    }
}

module.exports = Chess;