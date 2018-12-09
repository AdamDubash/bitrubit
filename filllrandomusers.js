
const randomstring = require('randomstring');

async function run() {
    await require('./libs/mongoose');
    const User = require('./models/user');

    // await User.register('ADMIN@ADMIN.ADMIN', 'ADMIN', 'dskfSDfsdfEdfn33q', true);
    await User.register('q@q.q', 'rrrainy', 'q', true); 

    //     const username = randomstring.generate(10);
    // for(let i =0; i < 100; i++) {
    //     const email = `${username}@tester.com`;
    //     const password = randomstring.generate(5);
    //     await User.register(email, username, password);
    // }

    console.log('complete');

    return
}

run();
