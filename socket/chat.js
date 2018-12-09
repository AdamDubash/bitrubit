const xtend = require('xtend')

const Chat = require('../classes/chat')
const ChatMessage = require("../classes/chatMessage")

const rooms = {
    common: new Chat(30, "Общий"),
    chess: new Chat(30, "Шахмат"),
    bl: new Chat(30, "Нарды"),
    poker: new Chat(30, "Покер 1х1"),
    "jackpot-rub": new Chat(30, "Джекпот RUB"),
    "jackpot-btc": new Chat(30, "Джекпот BTC")
}

const  privateRooms = {

}

exports.joinToPrivateRoom = (id, ...users) => {
    if(privateRooms[id]) {
        privateRooms[id].users.push(...users)
        return
    }

    console.log(id, users)
    privateRooms[id] = {
        users,
        chat: new Chat(30, "Приватный чат игры")
    }
}



exports.deletePrivateRoom = id => { delete privateRooms[id] }

const getWithPrivateRooms = (socket, nid) => {
    const found = {}

    for(let id in privateRooms) {
        if(privateRooms[id].users.indexOf(nid) > -1) {
            found[id] = privateRooms[id].chat
            socket.join(id)
        }
    }

    return xtend(rooms, found)
}

exports.sendToRoom = (room, msg) => {
    nsp.in(room).emit('msg', {room, msg})
}

var nsp

exports.init = (io) => {

    nsp = io.of('/chat')

    nsp.use((socket, next) => {
        socket.user = socket.request.user

        next()
    });

    nsp.on('connection', socket => {
        console.log('new connection', socket.id)

        const user = socket.user

        socket.join("public")

        if(user && user.nid) {
            // TODO: add check for ban

            socket.emit('init', getWithPrivateRooms(socket, user.nid))
            
            console.log(privateRooms)

            socket.on('msg', ({ room, text }) => {
                if(!rooms[room] && !privateRooms[room]) {
                    return socket.emit('chat-error', "Комната не найдена!")
                }

                if(text.length > 100) {
                    return socket.emit("chat-error", "Слишком длинный текст!")
                }

                const msg = new ChatMessage(user.nid, user.username, text)

                if(rooms[room]) {
                    rooms[room].add(msg)
                    nsp.in("public").emit('msg', { room, msg })
                } else {
                    privateRooms[room].chat.add(msg)
                    nsp.in(room).emit("msg", {room, msg})
                }

                
            })
        } else {
            socket.emit('init', rooms)
        }

    })
}