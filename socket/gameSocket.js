const debug = require('debug')('GameSocket');

const chat = require('../socket/chat');

let mem = null;

module.exports = class GameSocket {
    constructor(io, name) {
        (!mem) && (mem = require('../libs/mem'));

        this.name = name;

        this.nsp = io.of('/' + name);

        this.nsp.use((socket, next) => {
            socket.user = socket.request.user;

            next();
        });

        this.nsp.on('connection', (socket) => {
            debug('new connection', socket.id);

            socket.on('room', (roomId) => {
                debug('joininig room', roomId);

                const username = (socket.request.user) && (socket.request.user.username);

                //для удобства сразу кидаем в запрашиваемую комнату
                // ибо в случае чего,все равно далее будет дисконнект
                socket.join(roomId);

                //выдача лобби(список комнат)
                if(roomId === 'main') {
                    this.initLobby(socket);
                } else {
                    //если юзер не залогинен - выкинуть его
                    if(!username) {
                        return socket.disconnect(true);
                    }

                    //ищем запрашиваемую комнату
                    const room = (mem.games[this.name])
                        && (mem.games[this.name].rooms[roomId]);

                    //если комнаты нет - дисконнект
                    if(!room) {
                        debug('undefined room - disconnect', username);
                        return socket.disconnect(true);
                    }

                    //реконнект, если конечно он должен быть
                    const disconnectedIndex = room.isDisconnected(socket.user.id);
                    //если все таки должен, то заменяем старую отключенную сессию
                    // на новую сохраняя прежний порядок ходов
                    if(disconnectedIndex !== null) {
                        socket.index = room.players[disconnectedIndex].index;
                        //подписываемся заного на события
                        socket._events = room.players[disconnectedIndex]._events;
                        room.players[disconnectedIndex] = socket;

                        // нужно рендерить текущее состояние игры
                        room.sendState(disconnectedIndex);
                        return;
                    } else {
                        // если реконнект не нужен, пытамся зайти в качестве нового игрока

                        //если комната уже заполнена - дисконнект
                        if(room.max <= room.players.length) {
                            debug('room full - disconnect', username);
                            return socket.disconnect(true);
                        }

                        //если пытается активировать 2 сессии
                        for(let p of room.players) {
                            if(username === p.user.username) {
                                return socket.disconnect(true);
                            }
                        }

                        // собственно, если все норм - добавляем сокет игрока в комнату
                        room.join(socket);
                    }


                }

                //если залогинен - слушаем его сообщения в чатеы
                /* (username) && (socket.on('chat', (text) => {
                    if(roomId !== 'main') {
                        chat.joinToPrivateRoom(+socket.user.nid);
                    }
                })); */

            });

            mem.games[name].online++;

            socket.on('disconnect', () => {
                debug('disconnect', socket.user ? socket.user.username : socket.id);
                mem.games[name].online--;
            });
        });

        this.sendOnline();
    }

    initLobby(socket) {
        //фильтр неактивиронных комнат
        const rooms = {};
        for(let roomId in mem.games[this.name].rooms) {
            if(mem.games[this.name].rooms[roomId].status != null) {
                rooms[roomId] = mem.games[this.name].rooms[roomId].getPublicFields();
            }
        }

        socket.emit('init', {
            online: mem.games[this.name].online,
            chat: mem.games[this.name].chat.history,
            rooms
        });
    }

    sendOnline() {
        //прошлое значение онлайна, дабы избежать лишних запросов
        this._prevOnline = 0;

        setInterval(() => {

            const nowOnline = (mem.games[this.name]) && (mem.games[this.name].online);
            if(nowOnline && nowOnline != this._prevOnline) {
                this._prevOnline = nowOnline;
                this.nsp.in('main').emit('online', nowOnline);
            }
        }, 5000);
    }

    addRoom(room) {
        this.nsp.in('main').emit('room:add', room.getPublicFields());
    }

    removeRoom(roomId) {
        delete mem.games[this.name].rooms[roomId];
        this.nsp.in('main').emit('room:remove', roomId);
    }


    // finish(room, result) {
    //     debug('finishing game', room, result.winner);
    //     this.nsp.in(room).emit('finish', result);
    // }

    //так будет проще... наверно
    emit(room, eventName, eventData) {
        debug('emitting', room, eventName, eventData);
        this.nsp.in(room).emit(eventName, eventData);
    }
}