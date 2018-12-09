
function div(className, id, styles) {
    const el = document.createElement('div');
    el.className = className;
    if(id) el.id = id;
    if(styles) {
        for(let key in styles) {
            el.style[key] = styles[key];
        }
    }
    return el;
}

/*
* event 'start' - send forward data(also some object will send next with 'move' event) {
*   dices - first turn dices
*   color - current user color
* }
* */

class LongBackgammon {
    constructor(containerId, game = new Logic()) {
        this.container = document.getElementById(containerId);

        this.selected = null;
        this.cols = {};

        this.playerColor = null;
        this.currentColor = null;

        this.game = game;


        this.draw();

        this.initDices();
    }

    draw() {
        this.board = div('board');
        
        this.leftPart = div('board-part board-part_left');
        this.rightPart = div('board-part board-part_right');

        const bar = div('board-part board-part_bar');
        this.barTop = div('board-bar board-bar_top');
        this.barBottom = div('board-bar board-bar_bottom');
        bar.append(this.barTop);
        bar.append(this.barBottom);


        this.board.append(this.leftPart, this.rightPart, bar);

        this.initColumns();

        this.container.append(this.board);
    }

    start(dices, playerColor, currentColor, {cols} ) {
        // this.initDices();

        this.playerColor = this.game.playerColor = playerColor;
        this.currentColor = this.game.currentColor = currentColor;

        this.initPosition(cols);

        this._wcols = this.cols;
        this._bcols = this.game.getBlackBoard(this.cols);
        this.game.start();

        this.setClickHandler();

        this.nextTurn(dices, currentColor);
    }

    nextTurn(dices, currentColor) {

        this.game.dices = dices;

        (dices[0] === dices[1]) && (this.game._additionPoints = dices[0] * 2);

        this.currentColor = this.game.currentColor = currentColor;

        this.flipBoard();
        this.game.flipBoard();

        this.game.headOffed = false;
        this.throwDices(...dices);

        this.setMoveable();
    }

    initDices() {
        const dices = div('dices');
        this.dices = [
            div('dice'),
            div('dice')
        ];
        dices.append(...this.dices);
        this.rightPart.append(dices);
    }

    initPosition(cols) {
        // if(cols && this.currentColor === 'b') {
        //     cols = this.game.getBlackBoard(cols);
        // }

        if(cols) {
            for(let col in cols) {
                for(let i = 0; i < cols[col].checkers; i++) {
                    this.addChecker(col, cols[col].color);
                }
            }

            return
        }

        for(let i = 0; i < 15; i++) {
            this.addChecker(1, 'w');
            this.addChecker(13, 'b');
        }
    }
    
    setClickHandler() {
        const _this = this;

        const colHandler = function () {


            if(_this.currentColor !== _this.playerColor) {
                return;
            }

            const [gameCol, thisIndex] = _this.defineCol(this);

            if(gameCol.color !== null && _this.playerColor !== gameCol.color) {
                return;
            }

            if(!_this.selected && !this.classList.contains('board-column_moveable')) {
                return;
            }

            if(_this.selected) {
                const selectedIndex = _this.defineCol(_this.selected)[1];

                if(_this.selected !== this
                    && _this.game.move(selectedIndex, thisIndex)) {
                    // const ch = _this.selected.firstChild.cloneNode();
                    // _this.selected.removeChild(_this.selected.firstChild);
                    // this.append(ch);

                    _this.moveChecker(selectedIndex, thisIndex);
                }

                _this.selected.classList.remove('board-column_selected');
                _this.selected = null;

                _this.setMoveable();
                _this.resetColMoves();
                return;
            }

            if(this.lastChild) {
                _this.resetMoveable();
                this.classList.add('board-column_selected');
                _this.selected = this;
                _this.setColMoves(thisIndex);
            }
        };
        
        for(let col in this.cols) {
            this.cols[col].onclick = colHandler;
        }

        const barHandler = function () {
            if(!_this.selected) return;

            if(_this.currentColor !== _this.playerColor) {
                return;
            }

            let bar, barColor;

            if(this.classList.contains('board-bar_top')) {
                bar = _this.barTop;
                barColor = 'w';
            } else {
                bar = _this.barBottom;
                barColor = 'b';
            }

            if(!bar.classList.contains('bar_able')) {
                return;
            }

            if(_this.playerColor !== barColor) {
                return;
            }

            const selectedIndex = _this.defineCol(_this.selected)[1];

            const barIndex = barColor === 'w' ? 25 : 26;

            if(_this.selected !== this
                && _this.game.move(selectedIndex, barIndex)) {
                _this.incBar(barColor);
                _this.selected.removeChild(_this.selected.firstChild);
            }

            _this.selected.classList.remove('board-column_selected');
            _this.selected = null;

            _this.resetColMoves();
            _this.setMoveable();

        };

        this.barBottom.onclick = this.barTop.onclick = barHandler;

    }

    initColumns(cols){

        for(let i = 1; i < 13; i++) {
            const style = {
                left: (i < 7 ? (i - 1)*50 : (i - 7) * 50) + 'px'
            };

            const top = div('board-column board-column_top', `col${25 - i}`, style);
            const bottom = div('board-column board-column_bottom', `col${i}`, style);


            //define board side
            // if i less than 7 - left side, else right side
            const parent = i < 7 ? this.leftPart : this.rightPart;
            parent.append(top, bottom);

            this.cols[25 - i] = top;
            this.cols[i] = bottom;
        }
    }

    setMoveable() {
        if(this.currentColor !== this.playerColor) return;

        this.resetMoveable();

        const moves = this.game.getMoveableCols(this.currentColor);

        if(moves.length === 0) return;

        for(let i of moves) {
            this.cols[i].classList.add('board-column_moveable');
        }
    }

    resetMoveable() {
        for(let i in this.cols) {
            this.cols[i].classList && this.cols[i].classList.remove('board-column_moveable');
        }
    }

    setColMoves(i) {
        if(this._colMoves && this._colMoves.length > 0) {
            this.resetColMoves();
        }

        this._colMoves = [];

        const moves = this.game.colMoves(+i);

        for(let colId of moves) {

            if(colId === 25) {
                (this.currentColor === 'w'
                    ? this.barTop
                    : this.barBottom).classList.add('bar_able')
                continue;
            }

            this.cols[colId].classList.add('board-column_able');
            this.addChecker(colId)

            this._colMoves.push(this.cols[colId]);
        }
    }

    resetColMoves() {
        this.barBottom.classList.remove('bar_able');
        this.barTop.classList.remove('bar_able');

        for(let col of this._colMoves) {
            col.classList.remove('board-column_able');
            // debugger
            col.removeChild(col.lastChild);
        }

        this._colMoves = [];
    }

    defineCol(col) {
        const id = +col.id.slice(3);
        if(this.currentColor === 'w') {

            return [this.game.cols[id], id];
        } else {
            let index;

            if(+id < 13) {
                index = id + 12;
            } else {
                index = id - 12;
            }
            // debugger
            return [this.game._bcols[index], index];
        }

    }

    addChecker(columnId, color = this.currentColor) {
        const classes = color === 'w'
            ? 'checker' : 'checker checker_black ';

        const checker = div(classes);
        this.cols[columnId].append(checker);
    }

    moveChecker(from, to) {
        if(to > 24) {
            const bar = to === 25 ? 'w' : 'b';
            this.incBar(bar);
        } else {
            const ch = this.cols[from].firstChild.cloneNode();
            this.cols[to].append(ch);
        }

        this.cols[from].removeChild(this.cols[from].lastChild);
    }

    incBar(color) {
        if(color === 'w') {
            const item = div('board-item');
            this.barTop.append(item);
        } else {
            const item = div('board-item board-item_black');
            this.barBottom.append(item);
        }
    }

    throwDices(d1, d2) {
        this.dices[0].innerText = d1;
        this.dices[1].innerText = d2;
    }

    flipBoard() {
        if(this.currentColor === 'w') {
            this.cols = this._wcols;
        } else {
            this.cols = this._bcols;
        }
    }

    clear() {
        $('.board-item').remove();
        $('.checker').remove();
    }

    render(data) {
        for(let i = 0; i < data.barWhite; i++ ) {
            this.incBar('w');
        }

        for(let i = 0; i < data.barBlack; i++ ) {
            this.incBar('b');
        }

        this.initPosition(data.cols);
    }

}
