const mongoose = require('../libs/mongoose');
const crypto = require('crypto');
const randomstring = require('randomstring');
const identicon = require('identicon');
const fs = require('fs');
const debug = require('debug')('user-model');

const config = require('../config');
const BTCWallet = require('../libs/btcw');

const btcw = new BTCWallet(config.get('btcw:url'), config.get('btcw:token'));

const schema = mongoose.Schema({
    //numeric id
    nid: {
        type: Number,
        required: true,
        unique: true
    },

    cash: {
        rub: {
            type: Number,
            required: true,
            default: 0
        },
        btc: {
            type: Number,
            required: true,
            default: 0
        },
        virt: {
            type: Number,
            default: 1000
        }
    },

    cashAddrs: {
        btc: {
            type: String,
            default: "Пока вы не получили адреса."
        }
    },

    strategies: {
        local: {
            confirmed: {
                type: Boolean,
                default: false
            },
            code: {
                type: String,
                default: null
            },
            hash: String,
            salt: String,
            email: {
                type: String,
                default: null
            }
        },
        telegram: {
            id: {
                type: String,
                default: null
            }
        }
    },

    username: {
        type: String,
        unique: true,
        default: null
    },

    registered: {
        type: Date,
        default: Date.now()
    },

    isAdmin: {
        type: Boolean,
        default: false
    },

    stat: {
        games: {
            type: Number,
            default: 0
        },
        wins: {
            type: Number,
            default: 0
        },

        winBank: {
            rub: {type: Number, default: 0},
            btc: {type: Number, default: 0},
            virt: {type: Number, default: 0}
        }
    }
});

const encryptPassword = (salt, password) => {
    return crypto.createHmac('sha1', salt).update(password).digest('hex');
};

schema.methods.encryptPassword = function(password) {
    // return crypto.createHmac('sha1', this.strategies.local.salt).update(password).digest('hex');
    return encryptPassword(this.strategies.local.salt, password);
};

schema.virtual('strategies.local.password')
    .set(function(password) {
        this.strategies.local._plainPassword = password;
        this.strategies.local.salt = Math.random() + '';
        this.strategies.local.hash = this.encryptPassword(password);
    })
    .get(function() { return this.strategies.local._plainPassword; });

schema.statics.getAll = async (option={}) => {
    return await User.find(option);
};

schema.statics.getOne = async (option) => {
    return await User.findOne(option);
};

schema.methods.checkPassword = function(password) {
    return this.encryptPassword(password) === this.strategies.local.hash;
};

schema.statics.login = async (username, password) => {

    const user = await User.getOne({'strategies.local.email': username});

    if(!user) return null;

    return user.checkPassword(password) ? user : false;

};

/**
 * random NID generator
 */
const generateNID = async () => {
    let nid, user;
    
    do {
        nid = ~~(Math.random() * 1000000);

        try {
            user = await User.findOne({ nid });
        } catch(e) {
            console.error(e);
            continue;
        }
    } while(user != null);

    return nid
}

schema.statics.register = async (email, username, password, isAdmin) => {
    
    const nid = await generateNID();
    console.log(nid)
    const user = new User({
        nid,
        username,
        strategies: {
            local: {
                email,
                password,
                code: randomstring.generate(10)
            },
            telegram: null
        },
        isAdmin
    });

    generateRandomPic(nid, username);
    getAndSetAddr(nid);

    return await user.save();
};

const getAndSetAddr = async (userId, timeout = 5) => {

    try {
        const res = await btcw.reguser(userId.toString());

        if (res && res.error) {
            throw new Error(res || res.error || "Empty response from btcw");
        }

        debug(res)

        const addr = res.result.address;

        User.setAddr(userId, addr);
    } catch (e) {
        console.error(e);

        setTimeout(() => {
            getAndSetAddr(userId, timeout * 2);
        }, timeout * 1000);

    }
}

function generateRandomPic(id, username) {
    username = username || id + '';

    identicon.generate({ id: username, size: 200 }, function (err, buffer) {
        if (err) {
            return console.error(err);
        }

        fs.writeFile(__dirname + `/../public/avatars/${id}.png`, buffer, (err) => {
            if (err) {
                console.error(err);
            }
        });
    });
}

schema.statics.setAddr = async (nid, addr) => {
    debug('setaddr', nid, addr);
    return await User.update({ nid }, {'cashAddrs.btc':addr});
}

schema.statics.regTelegram = async (id, tgusername) => {
    const nid = await generateNID()

    const user = new User({
        nid, 
        strategies: {
            telegram: {
                id
            },
            local: null
        }
    });

    user.markModified('strategies');
    getAndSetAddr(nid);
    generateRandomPic(nid, tgusername);

    return await user.save();
};

schema.methods.updatePassword = async function (newPass) {
    this.strategies.local.password = newPass;

    return await this.save();
};

schema.statics.updatePassword = async (email, password) => {
    const user = await User.findOne({'strategies.local.email': email});

    if(!user) {
        return null;
    }

    return await user.updatePassword(password);
};

schema.statics.authTelegram = async id => {

    const user = await User.getOne({'strategies.telegram.id': id});

    if(user) return user;

    return await User.regTelegram(id);

};

schema.statics.confirmEmail = async (id, code) => {
    const user = await User.findById(id);

    if(!user) return null;


    if(user.strategies.local.confirmed || user.strategies.local.code !== code) {
        return false;
    }

    user.strategies.local.confirmed = true;

    // user.markModified('strategies.local');
    await user.save();
    return true;
};

schema.statics.updateCash = async (username, conc, value) => {
    value = +value;
    if(conc === 'btc') {
        value = +value.toFixed(7);
    }
    return await User.update({username}, {$inc: {['cash.' + conc]: value}});
};

schema.statics.updateCashById = async (id, conc, value) => {
    value = +value;
    if (conc === 'btc') {
        value = +value.toFixed(7);
    }
    return await User.update({ _id:id }, { $inc: { ['cash.' + conc]: value } });
};

schema.statics.updateCashByNid = async (nid, conc, value) => {
    value = +value;
    if (conc === 'btc') {
        value = +value.toFixed(7);
    }
    return await User.update({ nid }, { $inc: { ['cash.' + conc]: value } });
};

schema.statics.findByPage = async (page, limit) => {

    return await User.find({}, null, {
        skip: --page * limit,
        limit
    });
};

schema.statics.clearPrivateFields = users => {
    return users.map(user => {
        const newUser = {
            id: user.nid,
            email: user.strategies.local.email,
            confirmed: user.strategies.local.confirmed,
            username: user.username,
            cash: user.cash,
            telegram: user.strategies.telegram.id,
            isAdmin: user.isAdmin,
            registered: user.registered
        };

        return newUser;
    });
};

schema.statics.updateStat = async (id, isWin = false, conc, bank) => {
    return await User.update({_id: id}, {
        $inc: {
            'stat.games': 1,
            'stat.wins': ~~isWin,
            [`stat.winBank.${conc}`]: isWin ? bank : 0
        }
    })
};

schema.statics.setUsername = async (id, username) => {
    return await User.updateOne({_id: id}, {$set: {username}});
}

var User = mongoose.model('User', schema);

module.exports = User;
