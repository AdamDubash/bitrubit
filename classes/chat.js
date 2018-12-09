class Chat {
    constructor(limit, title) {
        this.limit = limit
        this.title = title
        this.log = []
    }

    add(msg) {
        if (this.log.length < this.limit) {
            this.log.push(msg);
        } else {
            this.log.shift();
            this.log.push(msg);
        }

        return true
    }

    get() {
        return this.log
    }
}

module.exports = Chat