class Logic {
    constructor(moveHandler, {cols, barWhite, barBlack}) {
        this.initCols(cols);

        this.currentColor = 'w';
        this.playerColor = 'w';

        //set true if in current turn checker headoffed
        this.headOffed = false;
        this.currentMoves = [];
        // this.throwDices();

        this.barWhite = barWhite || 0;
        this.barBlack = barBlack || 0;

        this.customMoveHandler = moveHandler;

    }

    initCols(cols) {

        if(cols) {
            this.cols = cols;
            return;
        }

        this.cols = {};

        for(let i = 1; i < 25; i++) {
            this.cols[i] = {
                color: null,
                checkers: 0
            };
        }

        this.cols[1].color = 'w';
        this.cols[1].checkers = 15;

        this.cols[13].color = 'b';
        this.cols[13].checkers = 15;

    }

    start() {
        this._wcols = this.cols;
        this._bcols = this.getBlackBoard(this.cols);

        this.flipBoard();
    }

    getMoveableCols(color = this.currentColor) {
        const result = [];
        const [d1, d2] = this.dices;

        for(let i in this.cols) {
            if(this.cols[i].color !== color) continue;

            if(this.colMoves(+i).length > 0) result.push(+i);

        }

        return result;
    }

    inHome(color = this.currentColor) {

        // const [d1, d2] = this.dices;

        let inHome = this.currentColor === 'w'
            ? this.barWhite : this.barBlack;

        for(let i = 19; i < 25; i++) {
            inHome += this.cols[i].color === color
                ? this.cols[i].checkers : 0;
        }

        return inHome === 15;
    }



    canMove(from, d, color = this.currentColor) {
        if(!d) return false;

        const diffColor = this.getDifferentColor(color);

        if(this.inHome(color)) {
            if(from + d === 25) return true;
            if(d && d > 6) return false;

            const homeIndex = 25 - from;

            if(d === homeIndex) return true;

            for(let i = 19; i < from; i++) {
                // const colIndex = 25 - i;
                if(this.cols[i].color === color
                    && this.cols[i].checkers > 0) {
                    return false;
                }
            }

            return true;

        }

        if(this.headOffed && from === 1) {
            return false;
        }

        if(d && this.cols[from + d] && this.cols[from + d].color !== diffColor) {
            return true
        }

        return false;
    }

    colMoves(from, color = this.currentColor) {
        const diffColor = this.getDifferentColor(color);
        const [d1, d2] = this.dices;

        const moves = [];

        // for()

        d1 && (this.canMove(from, d1)) && (moves.push(from + d1));
        d2 && (this.canMove(from, d2)) && (moves.push(from + d2));
        (d1 && d2 && this.canMove(from, d1 + d2)) && (moves.push(from + d1 + d2));



        return [...new Set(moves.map(e => {
            if(e > 24) return 25;
            return e;
        }))];
    }

    getDifferentColor(color) {
        return color === 'w' ? 'b' : 'w';
    }


    onMoved() {
        (this.customMoveHandler) && (this.customMoveHandler());

        this.currentMoves = [];
        this.headOffed = false;
    }

    move(from, to, fromSide) {
        const wrapped = () => {
            from = +from; to = +to;

            //if young hacker send invalid data
            if(from < 1 || from > 24) return false;
            if(to !== 25 && to !== 26 ) {
                if(to < 1 || to > 24) return false;
            }

            if(to === 25 && this.currentColor !== 'w'
                || to === 26 && this.currentColor !== 'b') {
                return false;
            }

            const fromCol = this.cols[from];

            //if not current color checkers was selected
            if(fromCol.color !== this.currentColor || fromCol.checkers < 1) return false;

            if(to === 25) {
                this.barWhite++;
                fromCol.checkers--;
                this.updateDices(to - from);
                return true;
            } else if(to === 26) {
                this.barBlack++;
                fromCol.checkers--;
                this.updateDices(to - 1 - from);
                return true;
            }

            const toCol = this.cols[to];

            if(toCol.color && toCol.color !== this.currentColor) {
                return false;
            }

            if(this.headOffed && from === 1) {
                return false;
            }

            const fromMoves = this.colMoves(+from);

            for(let i of fromMoves) {
                if(i === to) {
                    // debugger
                    this.updateDices(to - from);

                    if(from === 1 && !this.headOffed) {
                        this.headOffed = true;
                        if(this.dices[0] === this.dices[1] && fromCol.checkers === 15) this.headOffed = false;
                    }

                    fromCol.checkers--;
                    if(fromCol.checkers === 0) fromCol.color = null;
                    toCol.checkers++;
                    toCol.color = this.currentColor;

                    return true;
                }
            }

            return false;
        };

        const isMoved = wrapped();

        if(!fromSide && isMoved) {
            this.currentMoves.push({
                from, to
            });
        }

        if(!fromSide
            &&( this.dices[0] + this.dices[1] === 0
            || this.barsFull()
            || this.getMoveableCols().length === 0)) {
            this.onMoved();
        }

        return isMoved;
    }

    barsFull() {
        return this.barWhite === 15 || this.barBlack === 15;
    }

    updateDices(d) {
        const [d1, d2] = this.dices;

        if(this.inHome()) {
            if(d1 && d < d1) d = d1;
            if(d2 && d < d2) d = d2;
        }


        if(d1 && d1 === d2) {

            if(this._additionPoints && this._additionPoints >= d1) {
                if(d === d1 * 2) {
                    this._additionPoints -= d;
                    if(this._additionPoints < 0) {
                        this.dices[1] = 0;
                    }

                    return;
                } else {
                    this._additionPoints -= d1;
                    return;
                }
            }

        }

        if(d1 === d) {
            this.dices[0] = 0;
            return;
        }
        if(d2 === d) {
            this.dices[1] = 0;
            return;
        }
        if(d1 + d2 === d) this.dices = [0, 0];

    }


    changeColor() {
        this.currentMoves = [];
        this.headOffed = false;
        this.currentColor = this.currentColor === 'w'
            ? 'b' : 'w';
    }

    flipBoard() {
        if(this.currentColor === 'w') {
            this.cols = this._wcols;
        } else {
            this.cols = this._bcols;
        }
    }

    getBlackBoard(board = this.cols) {
        const black = {};

        // debugger
        for(let i = 1; i < 25; i++) {
            if(i < 13) {
                black[i] = board[i + 12];
            } else {
                black[i] = board[i - 12];
            }
        }

        return black;

    }
}
