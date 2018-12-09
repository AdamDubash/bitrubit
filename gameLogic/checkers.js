const GameInterface = require('./gameInterface');

class Checkers extends GameInterface{

    constructor(room) {
        super(room);
    }

    //переопределяем, как и требуется, в общем то...
    check(data) {
        console.log('check checkers', data)
        //place for your fucking game logic xD
        return data;
    }

    move(data) {
        super.move(data);

        this.room.emit('move', {
            //
        });
    }
}

module.exports = Checkers;