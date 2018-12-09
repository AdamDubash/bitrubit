const Notification = require("../models/notification")
const redis = require("./redisClient")

const notifMask = dest => `unread-notifs:${dest}`

exports.add = async (text, dest) => {
    const n = await Notification.add(text, dest)

    if(!n) {
        return null
    }
    const key = notifMask(dest)
    const unread = await redis.getAsync(key)

    if(unread === null) {
        redis.set(key, 1)
    } else {
        redis.set(key, +unread + 1)
    }

    return true
    
}

exports.getUnreadCount = async dest => {
    const unread = await redis.getAsync(notifMask(dest))

    return unread === null ? 0 : +unread
}

exports.readAll = async dest => {
    redis.set(notifMask(dest), 0)

    return await Notification.updateMany({ destination: dest, read: false}, {$set: {read: true}})
}

