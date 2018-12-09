const svgCaptcha = require('svg-captcha');
const randomstring = require('randomstring');
const debug = require('debug')('captcha');

const redis = require('./redisClient');

const SETNAME = 'captcha';

exports.generate = () => {
    const captcha = svgCaptcha.create({size: 6, color: '#fff', noise: 2});

    const id = randomstring.generate(20);
    captcha.id = id;
    
    //Время жизни капчи - 5 мин = 300сек
    redis.set(`${SETNAME}:${id}`, captcha.text, 'EX', 300);

    return captcha;
};

exports.compare = async (id, text) => {
    debug('compare:', id, text);

    return new Promise(resolve => {
        redis.get(`${SETNAME}:${id}`, (err, result) => {
            if(err) {
                console.error(err);
                resolve(false);
            }

            if(result && result.toLowerCase() === text.toLowerCase()) {
                resolve(true);
            } else {
                resolve(false);
            }
        });
    });
}

exports.delete = (id) => {
    redis.del(`${SETNAME}:${id}`, (err, result) => {
        if(err) {
            return console.error(err);
        }

        debug(`Deleted ${result} keys by id=${id}`);
    });
};