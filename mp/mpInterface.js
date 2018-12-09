const debug = require('debug')('mpInterface');

const localChat = require('../libs/localChat');
let mem = null;

class MPInterface {
    constructor(io, name) {
        (!mem) && (mem = require('../libs/mem'));

        this.name = name;

        this.nsp = io.of('/' + name);

        this.chat = localChat(30);
        this.online = 0;

        this.nsp.use((socket, next) => {
            socket.user = socket.request.user;

            next();
        });

        this.nsp.on('connection', (socket) => {
            debug('new connection', socket.id);

            this.online++;

            // const username = (socket.user) && (socket.user.username);

            // (username) && (socket.on('chat', (text) => {
            //     const user = {id: socket.user.id, username, nid: socket.user.nid};
            //     const m = this.chat.add(user, text);
            //     this.sendMsg(m);
            // }));

            socket.on('disconnect', () => {
                debug('disconnect', socket.user ? socket.user.username : socket.id);
                this.online--;
            });

            this.bindHandlers(socket);

            this.sendState(socket);
        });

        this.sendOnline();
    }

    bindHandlers(socket) {
        /**/
    }

    sendState(socket) {
        // socket.emit('state', );
    }

    sendOnline() {
        //прошлое значение онлайна, дабы избежать лишних запросов
        this._prevOnline = 0;

        setInterval(() => {

            if(this.online && this.online !== this._prevOnline) {
                this._prevOnline = this.online;
                this.nsp.emit('online', this.online);
            }
        }, 5000);
    }


    emit(eventName, eventData) {
        debug('emitting', eventName, eventData);
        this.nsp.emit(eventName, eventData);
    }
}

module.exports = MPInterface;