const updateBank = (value) => {
    $('#gameHeaderBank')[0].innerText = value;
};

const updateId = id => {
    $('#gameId')[0].innerText = id;
};

const updateHash = hash => {
    $('#gameHash')[0].innerText = hash;
}

const updateProcents = (procents) => {
    $('.jackpot-procents')[0].innerHTML = '';

    if(!procents || procents.length === 0) {
        $('.jackpot-procents')[0].innerHTML = '<h5 class="center">На данный момент ставки отсутствуют!</h5>';
        return;
    }

    $('.jackpot-procents')[0].append( ...procents.map(p => {
       return getProcentElement(p);
    }));

};

const updateOnline = (online) => {
    $('.lobby_header_title_online span')[0].innerText = online;
}

const addBet = (bet) => {
    const betEl = getBetElement(bet);

    $('.jackpot-log ')[0].append(betEl);
};

let intervalId;

const updateTimer = (data) => {

    $('#gameHeaderTimerTitle')[0].innerHTML = data.state === 'showdown'
        ? 'Новая игра через' : 'До конца';

    if(!data.endTime) {
        $('#gameHeaderTimer')[0].innerText = data.gameLength;
        return;
    }

    (intervalId) && (clearInterval(intervalId));

    intervalId = setInterval(() => {
        let now = ~~((data.endTime - Date.now()) / 1000);

        if(now - 1 <= 0) {
            clearInterval(intervalId);
            now = 0;
        }

        $('#gameHeaderTimer')[0].innerText = now;
    }, 1000);
};

const clear = () => {
    $('.jackpot-procents')[0].innerHTML = '';
    $('.jackpot-log ')[0].innerHTML = '';

    $('.roulette-content')[0].innerHTML = '';
    $('.roulette-content')[0].removeAttribute('style');

    $('#showdownUsername')[0].innerText = '???';
    $('#showdownTicket')[0].innerText = '???';
    $('#showdownGameNumber')[0].innerText = '???';
};


const getProcentElement = data => {
    const el = `<figure class="jackpot-procents-item">
        <div style="background-image: url('/avatars/${data.user.nid}.png')" class="avatar procent-avatar">
            <p>${data.procent}%</p>
        </div>
    </figure>`;

    return $(el)[0];
};

const getBetElement = data => {
    const el = ` <li class="jackpot-log-item list-group-item">
        <div>
            <div style="background-image: url('/avatars/${data.user.nid}.png')" class="avatar list-group-avatar"></div>
            <h5>${data.user.username}</h5>
            <p>Билеты: <b>${data.tickets.first} - ${data.tickets.last}</b></p>
        </div>
        <h4>${data.value} ${CONC}</h4>
     </li>`;


    return $(el)[0];

};

const doBet = () => {
    const bet = betValue.value;

    if(isNaN(bet)) {
        alert('Некорректное число');
        return
    }

    socket.emit('bet', bet);
}

const showState = state => {
    if(state === 'bets') {
        $('.state_bet').show();
        $('.state_showdown').hide();
    } else {
        $('.state_bet').hide();
        $('.state_showdown').show();
    }
};

const showdown = data => {
    const showWinnerData = () => {
        $('#showdownUsername')[0].innerText = data.winner.username;
        $('#showdownTicket')[0].innerText = data.winnerTicket;
        $('#showdownGameNumber')[0].innerText = data.gameNumber;
    };

    $('.roulette-content')[0].addEventListener("transitionend", showWinnerData, false);

    const rouletteContent = data.roulette.avatars.map(r => {
       const s = `<div style="background-image: url('/avatars/${r}.png')" class="avatar procent-avatar"></div>`;
       return $(s)[0];
    });

    $('.roulette-content')[0].append(...rouletteContent);

    $('.roulette-content')[0].style.transition = `all 15000ms cubic-bezier(0.32, 0.64, 0.45, 1) ${data.rouletteEndTime - Date.now() - 15000}ms`;
    setTimeout(() => {
        $('.roulette-content')[0].style.transform = `translate3d(-${data.roulette.cursor}px, 0px, 0px)`;
    }, 100);
};