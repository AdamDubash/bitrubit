const showMoves = (moves) => {
    /*move is {name, action}
    * example: { 'колл': {action: 'Call', value: 50}};
    * */
    clearMoves();

    const buttons = [];
    for(let m of moves) {
        const button = document.createElement('button');

        if(m.action === 'Raise' || m.action === 'Bet') {
            button.innerHTML = `${m.name} <span id="betButtonValue">${m.min}</span>`
            $('#betSizer')[0].min = m.min;
            $('#betSizer')[0].max = m.max;
            $('#betSizer')[0].value = m.min;
            $('.betRanger').show();
        } else {
            button.innerText = m.name;
        }

        button.setAttribute('onclick', `move(${JSON.stringify(m.action)})`);

        buttons.push(button);
    }

    $('.actions')[0].append(...buttons);
};

const showPublicData = data => {
    showPlayerChips(`pl${1}`, {bank: data.chips[INDEX], bet: data.bets[INDEX]})
    showPlayerChips(`pl${2}`, {bank: data.chips[~~!INDEX], bet: data.bets[~~!INDEX]})

    $('#pot')[0].innerText = data.bank;

    showBoardCards(data.cards);

    showDealer(data.dealer);
}

const showDealer = (id) => {
    try {
        $('.player-dealer')[0].classList.remove('player-dealer');
    } catch (e) {}

    id = INDEX === id ? 1 : 2;
    $(`#pl${id}cards`)[0].classList.add('player-dealer');
};

const showBoardCards = (cards) => {
    cards.forEach((card, i) => {
        $(`#card${i + 1}`).attr("src", getCardImage(card.toUpperCase()));
    });
};

const move = (action) => {
    console.log(action);
    const data = {
        action
    };

    if(action === 'Bet' || action === 'Raise') {
        data.value = $('#betSizer')[0].value;
    }

    socket.emit('move', data);

    clearMoves();
}

const clearMoves = () => {
    $('.betRanger').hide();
    $('.actions')[0].innerHTML = '';
}

const getCardImage = (card) => {
    return `/poker/images/${card.toUpperCase()}.png`
};

const showPlayerCards = (playerId, cards) => {
    $(`#${playerId}card1`).attr("src", getCardImage(cards[0]));
    $(`#${playerId}card2`).attr("src", getCardImage(cards[1]));
};

const showPlayerChips = (playerId, {bank, bet}) => {
    $(`#${playerId}bank`)[0].innerText = bank;
    $(`#${playerId}bet`)[0].innerText = bet;
};

const updatePot = (pot) => {
    $('#pot')[0].innerText = pot;
};

const showNames = names => {
    $('#pl1username')[0].innerText = names[INDEX];
    $('#pl2username')[0].innerText = names[~~!INDEX];
};

const shuffle = function(){

    for(let i = 1; i < 6; i++) {
        $("#card" + i).attr("src", "/poker/images/b2fv.png");
    }
    $("#pl1card1").attr("src", "/poker/images/b2fv.png");
    $("#pl1card2").attr("src", "/poker/images/b2fv.png");
    $("#pl2card1").attr("src", "/poker/images/b2fv.png");
    $("#pl2card2").attr("src", "/poker/images/b2fv.png");
    updatePot(0);
};