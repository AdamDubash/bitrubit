

async function run() {
    await require('../libs/mongoose');
    const User = require('../models/user');

    const users = await User.findByPage(2, 20);

    console.log(users);

}

run();