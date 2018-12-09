const emailjs = require('emailjs');

const config = require('../config');

const server = emailjs.server.connect({
    user: config.get('email:username'), 
    password: config.get('email:password'), 
    host: "smtp.yandex.ru",
    port: 465,
    ssl: true
});

exports.init = () => {
    const s = emailjs.server.connect({
        user: config.get('email:username'), 
        password: config.get('email:password'), 
        host: "smtp.yandex.ru",
        port: 465,
        ssl: true
    });

    return s;
}

exports.send = (email, id, code) => {
    const link = config.get('server:address') + `:3000/confirmemail/${id}/${code}`
    const from = `<${config.get('email:username')}@yandex.ru>`

    server.send({
        text:    "Перейдите по ссылке, чтобы подтвердить ваш почтовый адрес. " + link, 
        from, 
        to:      email,
        subject: config.get('server:sitename') + " Подтверждение почтового адреса"
     }, function(err, message) { console.log(err || message); });
}