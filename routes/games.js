const express = require('express');
const router = express.Router();
const qs = require('querystring');
const debug = require('debug')('router:games');

const Room = require('../classes/room');
const mem = require('../libs/mem');
const socket = require('../socket');
const passport = require('../auths/passport');
const config = require('../config');
const chat = require('../socket/chat');

const games = config.get('titles');

router.get('/', (req, res) => {

    res.render('games')
});

router.get('/info', (req, res) => {
    res.send(JSON.stringify(mem.getPublicInfo()))
});

router.get('/:name', (req, res, next) => {
    const name = req.params.name;

    if (!mem.games[name]) {
        return next();
    }

    const betsConfig = config.get('gameBet');

    res.render('index', {game: {name, title: games[name]}, msg: req.query, betsConfig});
});

router.get('/mp/:name', (req, res, next) => {
    const {name} = req.params;
    const game = mem.games.mp[name];

    if (!game) {
        return next();
    }

    game.isRoom = true;

    res.render('mp', {game})
});

router.post('/:game/create', passport.isConfirmed, (req, res, next) => {
    const game = req.params.game;
    
    const sendError = (msg) => {
        res.status(400).send(msg);
    }

    if (!games[game]) return sendError("Game not found!")

    const {bet, conc, time, link, descr} = req.body;
    const betConfigs = config.get('gameBet');

    console.log(req.body)

    // const sendError = msg => {
    //     const redirectLink = `/games/${game}/?type=error&s=${qs.escape(msg)}`;
    //     return res.redirect(redirectLink);
    // };

    if (!betConfigs[conc]) {
        return sendError("Эта валюта не доступна!");
    }

    const {min, max} = betConfigs[conc];

    if (isNaN(bet) || !(min <= (+bet).toFixed(5) && (+bet).toFixed(5) <= max)) {
        return sendError("Ваша ставка за рамками допустимых значений!");
    }

    if (bet > req.user.cash[conc]) {
        return sendError('Ставка не может превышать баланс!');
    }

    const room = new Room(game, req.user.username, +(+bet).toFixed(5), conc, time, descr);

    mem.games[game].rooms[room.id] = room;

    // socket.addRoom(game, room);
    debug('created room ', room.id, room.owner);

    chat.joinToPrivateRoom(`${game}:${room.id}`, +req.user.nid)

    res.send(`/games/${game}/room/${room.id}`);
});


router.get('/:game/room/:roomId', passport.isConfirmed, (req, res, next) => {

    const {game, roomId} = req.params;

    const room = (mem.games[game]) && (mem.games[game].rooms[roomId]);

    //если комныт нет - выкинуть 404
    if (!room) {
        debug('room not found');
        return next();
    }

    const renderData = {room, game: {name: game, title: games[game], isRoom: true}};

    //определяем, есть ли он уже в комнате и отключен ли сокет
    // на данный момент, если да - то значит реконнект
    if (room.isDisconnected(req.user.id) !== null) {
        return res.render('room', renderData);
    }

    //Достаточно ли средств у бомжа
    if (room.bet > req.user.cash[room.conc]) {
        debug('not enough money', req.user.username);
        const redirectLink = `/games/${game}/?type=error&s=${qs.escape('У вас недостаточно средств!')}`;
        return res.redirect(redirectLink);
    }

    //если один и тот же пользователь пытается зайти дважды
    //тоже самое должно быть и на уровне сокетов
    for (let s of room.players) {
        if (s.user.username === req.user.username) {
            return res.redirect(`/games/${game}`)
        }
    }

    //если еще не активирована и
    // зашел не создатель комнаты - выкинуть 404
    // если создатель - активировать комнату
    if (!room.status) {
        if (req.user.username !== room.owner) {
            debug('room is not activated yet');
            return next();
        } else {
            debug('activating room');
            room.activate();
            socket.addRoom(game, room);

            //визуально изменяем кэш(по фатку изменится при коннекте через сокет)
            req.user.cash[room.conc] -= room.bet;

            return res.render('room', renderData);
        }
    }

    //если комната уже занята || игра началась
    if (room.status === 'Играют' || room.players.length >= room.max) {
        debug('room is full');
        const link = `/games/${game}/?type=error&s=${qs.escape('В комнате больше нет свободных мест')}`;
        return res.redirect(link);
    }

    //далее идет коннект при помощи сокета и присоединение в комнату
    debug('joining room', req.user.username);
    // room.join(req.user.username);

    //вычитать ставку на этом уровне опасно - лучше после коннекта через сокет!
    //сделаем это визуально,дабы в шапке было уже измененное значение
    req.user.cash[room.conc] -= room.bet;

    chat.joinToPrivateRoom(`${game}:${room.id}`, +req.user.nid)

    res.render('room', renderData);
});

module.exports = router;