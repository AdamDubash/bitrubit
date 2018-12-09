const mongoose = require('../libs/mongoose')

const schema = mongoose.Schema({
    text: {
        type: String,
        required: true
    },
    date: Date,
    read: {
        type: Boolean,
        default: false
    },
    destination: {
        type: Number,
        required: true
    }
});

schema.statics.add = async (text, destination) => {
    try {
        const notif = new Notification({ text, destination, date: Date.now() })
        
        return notif.save()
    } catch(e) {
        console.error("Notif add error", e.message)
        return null
    }
}

schema.statics.getPage = async (page, limit, nid) => {
    try {
        const notifs = await Notification.find({destination: +nid}, null, { 
            sort: { "date": -1 },
            limit,
            skip: page * limit
        } )

        return notifs
    } catch(e) {
        console.error("notif get error", e.message)
        return null
    }
}

var Notification = mongoose.model('Notification', schema);

module.exports = Notification;