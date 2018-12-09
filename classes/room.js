const randomstring = require('randomstring');
const debug = require('debug')('Room');
const Random = require('random-js');

const socket = require('../socket');
const User = require('../models/user');
const History = require('../models/history');
const Comm = require('../models/comm');
const localChat = require('../libs/localChat');
const chat = require('../socket/chat');
const ChatMessage = require('../classes/chatMessage');

module.exports = class Room {
    //game - соотвествующий класс. Будут соотвестовать API интерфейса
    // GameInterface

    constructor(/* game, */gameName, owner, bet, conc, time, descr, status=null, max=2) {
        this.gameName = gameName;

        this.status = status;
        this.owner = owner;
        this.bet = bet;
        this.conc = conc;
        this.time = time;
        this.descr = descr;
        this.id = randomstring.generate(12);

        //на тот случай, если будут не только игры на 2ух игроков
        this.max = max;

        //массив подключенных к комнате игроков(!сокеты)
        this.players = [];

        //у каждой игры ведь своя логика
        this.game = new (require('../gameLogic')(gameName))(this);

        this.creatingTime = new Date();

    }

    activate() {
        this.status = 'Ожидает';
    }

    play() {
        this.status = 'Играют';

        //переключает game-header'ы
        this.emit('play', {});

        // Дальше передаем управление логике определенной игры
        this.game.start();

        this.sendSysMsg('Игра началась!');

    }

    async join(playerSocket) {
        const username = playerSocket.request.user.username;
        debug('pushing player', username);

        chat.joinToPrivateRoom(`${this.gameName}:${this.id}`, playerSocket.user.nid);

        //определяем индекс игрока в массиве
        // нужно при проверке возможности хода
        playerSocket.index = this.players.length;

        this.players.push(playerSocket);

        //вычитаем из кэша нашу ставку
        await User.updateCash(username, this.conc, -this.bet);

        this.sendSysMsg(`${username} вошел в комнату!`);

        //на тот случай, если создатель комнаты решит сразу выйти
        // тогда уже комната сразу ремов и никаких реконнектов не
        // будет, десу
        const disconnetCallback = () => {
            if(this.status === null) return;

            if(this.players.length !== 1) return;

            //возращаем ставку
            User.updateCash(username, this.conc, this.bet);
            this.remove();
        };

        //если игрок признает поражение
        const loseCallback = () => {
            debug(this.id, username, 'lose emitted');

            //ничего не делать, если игра не идет на данный момент
            if(this.status !== 'Играют') return;

            this.sendSysMsg(`${username} признал поражение!`);

            //определяем победителя.
            // это будет работать только с 2 игроками!!!
            // что будем делать с 2+ игроками - хз, пока так сойдет
            const winnerIndex = ~~!playerSocket.index;

            //todo: добавить в GameInterface метод defineWinner(...)

            this.finish(this.players[winnerIndex].user.username);
        };

        playerSocket.on('disconnect', disconnetCallback);
        playerSocket.on('lose', loseCallback);

        if(this.players.length >= this.max) {
            this.play();
        }
    }

    //окончание игры. вызывается при выходе одного из игроков/поражении
    async finish(winner, msg) {
        //теперь уже не играем. это убережет от последующих вызовов каллбэков
        this.status = null;

        chat.deletePrivateRoom(`${this.gameName}:${this.id}`)

        const bank = this.bet  * 2;
        this.sendResult({bank, winner: winner, msg});

        //высчитываем комиссию и сохраняем профит в бд
        const comm = this.conc !== 'btc'
            ? ~~(bank * 0.05)
            : bank * 0.05;

        Comm.add(this.conc, comm);

        //выплатить победителю награду с вычетом коммисиии
        await User.updateCash(winner, this.conc, bank - comm);

        this.winner = winner;

        //сохраняем результаты игры в бд
        await this.saveToDB();

        //убираем комнату из списка
        this.remove();

        //отключаем всех
        // this.players.forEach(s => s.disconnect(true));
    }

    async saveToDB() {

        //обовляем статистику
        this.players.forEach(s => {
            // ну и за одно отключим сокет, больше в этом нужнды нет...
            s.disconnect();

            const isWinner = this.winner === s.user.username;
            User.updateStat(s.user.id, isWinner, this.conc, this.bet * 2 * ~~isWinner);
        });

        //сохраним отдельно их юзернеймы, чтобы в будущем не искать их по отдельности
        this.playersUsernames = this.players.map(socket => socket.user.username);
        //в бд нам сокеты не нужны, сохраним только id
        this.players = this.players.map(socket => socket.user.id);

        this.finishTime = new Date();

        this.log = this.game.log;
        await History.add(this);
    }

    sendResult(result) {
        socket.emit(this.gameName, this.id, 'finish', result);
    }

    updateRoomHeader() {
        //время истечения конца хода, сделано так, чтобы было проще вычислить
        // из-за блокирующих страницу алертов
        // const time = Date.now() + this.time * 1000;
        const time = this.game.turnEndTime;
        const currentTurnUsername = this.players[this.game.turnIndex].user.username;

        this.emit('header', {
            time,
            currentTurnUsername
        });
    }

    getPublicFields() {
        const bet = this.bet + ' ' + this.conc.toUpperCase();
        return {
            id: this.id,
            status: this.status,
            owner: this.owner,
            bet,
            time: this.time,
            descr: this.descr
        }
    }

    sendSysMsg(text) {
        const msg = new ChatMessage(0, "SYSTEM", text)

        chat.sendToRoom(`${this.gameName}:${this.id}`, msg)
    }

    remove() {
        socket.removeRoom(this.gameName, this.id);
    }

    emit(eventName, eventData) {
        socket.emit(this.gameName, this.id, eventName, eventData);
    }

    //проверяет есть ли юзер в бд, и если он отключек - возращает индекс
    isDisconnected(userId) {
        debugger
        for(let i = 0; i < this.players.length; i++) {
            const p = this.players[i];
            if(p.user.id === userId && p.disconnected) {
                return i;
            }
        }

        return null;
    }

    sendState(index) {
        const data = {};

        data.time = this.game.turnEndTime;
        data.currentTurnUsername = this.players[this.game.turnIndex].user.username;
        data.game = this.game.getGameState(index);

        this.players[index].emit('render', data);
    }

};