const router = require('express').Router();

const User = require('../../models/user');
const notif = require('../../libs/notification');

router.get('/', async (req, res, next) => {
    const {username} = req.query;

    const users = username && username.length > 0 
        ? await User.find({username: {$regex: new RegExp(`.*${username}.*`, 'i')}}) 
        : await User.find({});
    const cleared = User.clearPrivateFields(users);

    res.json( cleared)
});



const create = async ({email, username, password}, res) => {
    await User.register(email, username, password);

    res.redirect('/admin');
};

router.post('/sendnotif', async (req, res, next) => {
    const { destination, message } = req.body

    console.log(destination, message)

    await notif.add(message, +destination)

    res.send("Sended")
})

router.post('/update/:id', async (req, res, next) => {
   const id = req.params.id;

   console.log(req.body)

   const {nid, username, btc, rub,virt, btcAddr, isAdmin, newPass} = req.body;

   const user = await User.findOne({nid: +nid});

   if(!user) return next();

   user.username = username;
   user.cash.rub = +rub;
   user.cash.btc = +btc;
   user.cash.virt = +virt;
   user.cashAddrs.btc = btcAddr;
   user.isAdmin = isAdmin;

   if(newPass) {
       user.strategies.local.password = newPass;
   }

   await user.save();

   res.send("ok")
});


module.exports = router;