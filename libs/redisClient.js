const redis = require('redis');
const debug = require('debug')('redisClient');

const client = redis.createClient();

client.on('connect', () => {
    debug('redis successful connected');
});

client.on('error', (err) => {
    console.error(`Redis client error: ${err}`);
});

client.getAsync = (key) => {
    return new Promise((resolve, reject) => {
        client.get(key, (err, result) => {
            if (err !== null) {
                reject(err)
            }

            resolve(result)
        })
    })
}

module.exports = client;