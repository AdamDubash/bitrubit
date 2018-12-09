class ChatMessage {
    constructor(nid, username, text) {
        this.user = { nid, username };
        this.text = text;
        this.date = Date.now();
    }
}

module.exports = ChatMessage;