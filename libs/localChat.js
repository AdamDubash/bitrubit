const ChatMessage = require('../classes/chatMessage');

module.exports = (saveLimit = 10) => {
    return {
        _chat: [],

        add(user, msg) {
            const m = new ChatMessage(user, msg);

            if(this._chat.length < saveLimit) {
                this._chat.push(m);
            } else {
                this._chat.shift();
                this._chat.push(m);
            }

            return m;
        },

        get history() {
            return this._chat;
        }
    };
}
