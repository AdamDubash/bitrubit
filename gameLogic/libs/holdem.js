const Hand = require('pokersolver').Hand;
const Random = require('random-js')();

const values = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4','3', '2'];
const suits = ['c', 'd', 's', 'h'];
const rounds = ['preflop', 'flop', 'turn', 'river'];

/*          Holdem Engine for 2 players, desu       */

class Engine {
    constructor(smallBlaind, bigBlaind, callbacks) {
        this.sb = smallBlaind;
        this.bb = bigBlaind;

        this.dealer = null;

        for(let cb in callbacks) {
            this[cb] = callbacks[cb];
        }
    }

    start(players) {
        this.players = players;

        this.newRound();
    }

    newRound() {
        if(this.players.length < 2) {
            throw new Error('Game needs to have 2 or more players');
        }

        // очищаем игроков от данных предыдущих игр
        this.players.forEach(pl => pl.clear());

        this.roundIndex = 0;

        this.defineDealer();

        //если кто-то обанкротился, конец столу
        if(this.checkForBankrups()) {
            return;
        }

        //индекс текущего игрока.
        //при игре 1на1, дилер - СМ, следовательно начинается с него
        this.current = this.dealer;

        this.bank = 0;

        this.setBlainds();

        //собственно, карты лежащие на столе
        this.board = [];
        //массив всех розданных карт раунда. доска + игроки
        this.deckOut = [];

        //раздать карты игрокам
        this.giveCards();

        this.onnewRound && this.onnewRound(this);
    }

    defineDealer() {
        this.dealer = this.dealer === null
            ? 0 : this.getNextPlayerIndex(this.dealer);
    }

    //определяем блайнды
    setBlainds() {
        const _ = this;

        const dealer = this.players[this.dealer];
        const opp = this.players[this.getNextPlayerIndex()];

        dealer.doBet(this.sb);
        opp.doBet(this.bb);

        opp.move = {
            action: 'Bet',
            values: _.bb
        }
    }

    //выдает следующего игрока стола. по дефолту - от дилера
    getNextPlayerIndex(index = this.dealer) {
        index++;
        if(index >= this.players.length) {
            index = 0;
        }
        return index;
    }

    giveCards() {
        const _ = this;
        this.players.forEach(pl => pl.cards = [_.getCard(), _.getCard()]);
    }

    //проверка на банкротов.
    // если не хватает фишек на ББ - то поражение
    checkForBankrups() {
        for(let i = 0; i < this.players.length; i++) {
            if(this.players[i].chips <= this.bb) {
                const winnerIndex = this.getNextPlayerIndex(this.getNextPlayerIndex());
                const msg = `${this.players[i].name} банкрот!`;
                this.finish(winnerIndex, msg);

                return true
            }
        }

        return false;
    }

    // генерирует карту
    getCard() {
        const r = max => Random.integer(0, --max);

        const card = values[r(values.length)] + suits[r(suits.length)];

        //если карта уже была роздана, то генерируем рекурсивно дальше
        if(this.deckOut.indexOf(card) > -1) return this.getCard();

        this.deckOut.push(card);
        return card;
    }

    /*
    * Call, Flop, Raise, AllIn, Check
    * */
    move(action, value) {
        const pl = this.players[this.current];
        const opp = this.players[this.getNextPlayerIndex(this.current)];

        //фолд доступен всегда, так что нет смысла пропускать на корректность
        if(action === 'Fold') {
            this.folded();
            return null;
        }

        //проверяем на корректность
        if(!this.checkMoveable(action, value)) {
            throw new Error("Incorrenct move");
        }

        //рейз или бет на макс сумму == аллин
        if((action === 'Raise' || action === 'Bet') && value === pl.chips) {
            action = 'AllIn';
        }

        pl.move = {action, value};

        if(action === 'AllIn') {
            pl.doBet(pl.chips);
            //Если было поставлено все от безысходности - конец игры
            if(this.getMoves().length === 2) {
                return this.roundEnd();
            }

            this.current = this.getNextPlayerIndex(this.current);
            return true;
        }

        switch (action) {
            case 'Bet':
                pl.doBet(value);
                break;
            case 'Call':
                const callValue = opp.bet - pl.bet;
                pl.move.value = callValue;
                pl.doBet(callValue);
                break;
            case 'Raise':
                pl.doBet(value);
                break;
        }

        this.current = this.getNextPlayerIndex(this.current);

        //проверяем закончились ли торги
        //eсли все уравнено, значит новый круг
        if(this.tradesFinished()) {
            this.nextRound();

            this.onmoveEnd && this.onmoveEnd(this.getPublicData(), true);
        } else {
            this.onmoveEnd && this.onmoveEnd(this.getPublicData(), false);
        }

    }

    //проверяет возсожность текущего хода
    checkMoveable(action, value) {
        const availableMoves = this.getMoves();

        for(let move of availableMoves) {
            if(move.action === action) {
                if(move.min) {
                    // если у хода есть диапазон, проверяем вхождения ставки туда
                    if(move.min <= value &&  value <= move.max) {
                        return true;
                    } else {
                        return false;
                    }
                }

                return true;
            }
        }

        return null;
    }

    //вызывается, если игрок сложил карты
    // отдает выигрыш оппоненту, начинает новую игру
    folded(index = this.current) {
        this.givePrize(this.getNextPlayerIndex(index));

        this.newRound();

        this.onfolded && this.onfolded(this.players[index]);
    }

    //вызывается при окончании игры
    roundEnd() {
        //открывает оставшиеся карты
        this.openCards();

        const winners = this.getWinners();

        //выдаем победителям их фишки
        this.givePrize(...winners.map(winner => winner.pl.index));

        let msg = `Раунд окончен.\n`;

        msg += winners.length === 1
            ? `Победил ${winners[0].pl.name} собрав ${winners[0].descr}`
            : `Победили оба игрока собрав ${winners[0].descr} и ${winners[0].descr}`;

        const _ = this;
        const showDownData = {
            board: _.board,
            cards: [_.players[0].cards, _.players[1].cards]
        };

        this.onroundEnd && this.onroundEnd(msg, showDownData);

        this.newRound();
    }

    //определяет победителей игры
    getWinners() {
        const hands = [];
        const board = this.board;

        this.players.forEach((pl, index) => {
           const cards = [...pl.cards, ...board];
           const hand = Hand.solve(cards);
           hand.pl = {
               name: pl.name,
               index
           };
           hands.push(hand);
        });

        return Hand.winners(hands);
    }

    //выдает текущий банк победителю, если их несоклько - то поровну
    givePrize(...winnners) {
        this.betsToBank();

        const prize = this.bank / winnners.length;

        for(let winner of winnners) {
            this.players[winner].chips += prize;
        }

        this.bank = 0;
    }

    nextRound() {
        //ставки идут в банк
        this.betsToBank();

        //следующий раунд
        this.roundIndex++;

        //если уже на доске все карты и торги закончилсь - конец игры.
        if(this.roundIndex === 4) {
            this.roundEnd();
            return;
        }

        //очищаем прежние ходы
        this.players.forEach(pl => pl.move = {});

        //открываем следующую карту
        this.openCards(this.roundIndex === 1 ? 3 : 1);

        this.onnextRound && this.onnextRound(this);
    }

    //открывает указанное кол-во карт, либо все остальные
    openCards(count) {
        count = count || 5 - this.board.length;

        for(let i = 0; i < count; i++) {
            this.board.push(this.getCard());
        }
    }

    //переводит все ставки в банк
    betsToBank() {
        let sum = 0;

        this.players.forEach(pl => {
            sum += pl.bet;
            pl.bet = 0;
        });

        this.bank += sum;
    }

    //определяет, закончился ли круг торгов
    tradesFinished() {
        const [pl1, pl2] = this.players;

        //да, если оба чекнули
        if(pl1.move.action === 'Check' || pl2.move.action === 'Check') {
            return pl1.move.action === pl2.move.action;
        }

        //если ставки равны
        if(pl1.bet === pl2.bet) {
            return true;
        }

        //если кто-то поставил все
        if(pl1.move.action === 'AllIn' || pl2.move.action === 'AllIn') {
            return true;
        }

        return false;
    }

    //вызывается при заверешении сеанса
    finish(winnerIndex, msg) {
        this.onfinish && this.onfinish(winnerIndex, msg);
    }

    //Выдает допустимые ходы для конкретного игрока, дефолт - текущий
    getMoves(index = this.current) {
        //фолд доступен всегда
        const moves = [{name:'Фолд', action: 'Fold'}];

        const pl = this.players[index];
        const op = this.players[this.getNextPlayerIndex(index)];
        const opAction = op.move.action;

        const allin = {action: 'AllIn', name: 'All in'};
        const check = {name: 'Чек', action: 'Check'};
        const call = value => {
            return {name:`Колл ${value}`,  action: 'Call'};
        };
        const raise = (min, max) => {
            return {
                name: 'Рейз',
                action: 'Raise',
                min, max
            }
        };

        const bet = (min, max) => {
            return {
                name: 'Бет',
                action: 'Bet',
                min, max
            }
        };

        //если новый раунд торгов
        if(!opAction) {
            moves.push(check);
            if(this.bb < pl.chips) {
                moves.push(bet(this.bb, pl.chips));
            } else {
                moves.push(allin);
            }

        }

        if(opAction === 'Check') {
            moves.push(check);

            if(this.bb < pl.chips) {
                moves.push(bet(this.bb, pl.chips));
            } else {
                moves.push(allin);
            }

        }

        if(opAction === 'Raise' || opAction === 'Bet' || opAction === 'AllIn') {
            const callValue = op.bet - pl.bet;
            if(callValue < pl.chips) {
                moves.push(call(callValue));

                const raiseMin = callValue > this.bb ? callValue + 1 : callValue + (this.bb - callValue) + 1;
                if(opAction !== 'AllIn' && raiseMin < pl.chips) {
                    moves.push(raise(raiseMin, pl.chips));
                }

            } else {
                moves.push(allin);
            }

        }

        return moves;
    }

    getPublicData() {
        const _ = this;
        const bets = this.players.map(pl => pl.bet);

        const chips = this.players.map(pl => pl.chips);

        return {
            bets,
            chips,
            bank: _.bank,
            cards: _.board,
            dealer: _.dealer
        };
    }
}

class Player {
    constructor(name, chips) {
        this.name = name;
        this.chips = chips;

        //карты на руке
        this.cards = [];

        //последний ход
        this.move = {};

        //ставка текущего круга
        this.bet = 0;
    }

    clear() {
        this.move = {};
        this.cards = [];
        this.bet = 0;
    }

    doBet(value) {
        if(this.chips < value) {
            throw new Error('Not enough chips to do bet!');
        }

        this.chips -= value;
        this.bet += value;
    }

}

module.exports = {
    Engine,
    Player
};