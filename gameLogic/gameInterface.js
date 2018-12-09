const Random = require('random-js');
const xtend = require('xtend');

class GameInterface {
    constructor(room) {
        this.room = room;

        //индекс(массива .players) ходящего на данный момент игрока
        this.turnIndex = null;

        //таймер текущего хода
        this.turnTimeout = null;

        //логгирование ходов
        this.log = [];
    }

    start() {
        //определяем, кто начинает ходить
        this.initTurn();

        //ставим обработчик ходов на игроков
        this.setMoveHandlers();

        // this.updateTurn();
    }

    initTurn() {
        this.turnIndex = Random.integer(0, this.room.players.length)(Random.engines.nativeMath);
    }

    setMoveHandlers() {
        this.room.players.forEach(socket => {
            socket.on('move', data => {

                //подпишем события с сокетов, чтобы можно было читать логи в будущем
                data = xtend({moves: data}, {
                    username: socket.user.username
                });

                //если игрок пытается сделать ход не в свою очередь
                if(this.turnIndex !== socket.index) {
                    //сюда можно добавить логгирование. потом вернусь к этому
                    socket.emit('alert', 'Сейчас не ваш ход!');
                    return;
                }

                //проверка возможности хода.
                // каждый потомок интерфейса должен будет реализовывать по своему, логично же епта
                const moveResult = this.move(data);

                //если null, значит логика игры завершин событие самостоятельно.
                if(moveResult === null) return;

                if (!moveResult) {
                    socket.emit('alert', 'Невозможный ход!');
                    return;
                }

                this.updateTurn();
            });
        });
    }

    logger(data) {
        this.log.push(JSON.stringify(data));
    }

    changeTurn() {
        this.turnIndex = ~~!this.turnIndex;
    }

    //обновляем индекс хода на другого игрока и перезапускаем таймер.
    updateTurn() {
        this.changeTurn();

        this.updateTimeout();

        this.room.updateRoomHeader();
    }

    //обновляет таймер хода, при истечении генерирует конец игры
    updateTimeout() {
        (this.turnTimeout) && (clearTimeout(this.turnTimeout));

        //сохраняем дату конца хода, нужно для получения текущего состояния
        this.turnEndTime = Date.now() + this.room.time * 1000;

        this.turnTimeout = setTimeout(() => {
            this.room.sendSysMsg('Истекло время хода! Игра закончена!');

            //проверка на null - на тот случай, если игра завершилась раньше,
            // чем сработал таймаут... хотя можно было и удалить просто, но похуй
            if(this.room.status !== null) {
                this.room.finish(this.defineWinner(~~!this.turnIndex));
            }

        }, this.room.time * 1000);
    }

    defineWinner(index) {
        return this.room.players[index].user.username;
    }

    //это надо наследовать!!
    check(data) {
        return data;
    }

    //тоже надо наследовать, ибо логика хода отлична в играх!
    move(data) {
        return false;
    }

    //сапостовляем индексы игроков с их цветами,
    // вызывается в начале игры, после рандомного назначения порядка ходов
    replacePlayersByTurn() {
        // если ходит первый - то все ок, ничего не трогаем
        if(this.turnIndex === 0) return;

        const [pl1, pl2] = this.room.players;

        pl2.index = 0;
        pl1.index = 1;

        this.room.players = [pl2, pl1];
    }

    //текущее состояние доски, расположение объектов и тд
    // надо наследовать обязательно!
    getGameState(index) {
        //todo: for public information, it's useful for stream viewers
        if(index === null) {
            return {}
        }

        return {}
    }

    //определяет индекс победителя в массиве
  /*  getWinnerIndex(loserId) {
        for(let i = 0; i < this.room.players.length; i++) {
            if(this.room.players[i].user.id === loserId) {
                return i;
            }
        }

        return null;
    }*/
}

module.exports = GameInterface;