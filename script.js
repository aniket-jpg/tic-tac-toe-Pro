document.addEventListener('DOMContentLoaded', () => {

    // --- CONSTANTS ---
    const X_CLASS = 'x';
    const O_CLASS = 'o';
    const WINNING_COMBINATIONS = [
        { combo: [0, 1, 2], name: 'h1' }, { combo: [3, 4, 5], name: 'h2' }, { combo: [6, 7, 8], name: 'h3' },
        { combo: [0, 3, 6], name: 'v1' }, { combo: [1, 4, 7], name: 'v2' }, { combo: [2, 5, 8], name: 'v3' },
        { combo: [0, 4, 8], name: 'd1' }, { combo: [2, 4, 6], name: 'd2' }
    ];

    // --- DOM ELEMENTS ---
    const dom = {
        views: document.querySelectorAll('.view'),
        cellElements: document.querySelectorAll('[data-cell-index]'),
        gameBoard: document.getElementById('gameBoard'),
        overlays: {
            winning: document.getElementById('winningMessage'),
            aiThinking: document.getElementById('aiThinkingOverlay'),
            exitConfirmation: document.getElementById('exitConfirmationOverlay')
        },
        winningMessageText: document.getElementById('winningMessage-text'),
        winningLine: {
            svg: document.getElementById('winning-line'),
            line: document.querySelector('#winning-line .line')
        },
        displays: {
            score: document.getElementById('score-display'),
            turn: document.getElementById('turn-display')
        },
        buttons: {
            pvc: document.getElementById('pvcButton'),
            pvp: document.getElementById('pvpButton'),
            symbolChoices: document.querySelectorAll('.symbol-choice'),
            easy: document.getElementById('easyButton'),
            hard: document.getElementById('hardButton'),
            restart: document.getElementById('restartButton'),
            universalBack: document.getElementById('universalBackButton'),
            confirmExit: document.getElementById('confirmExitButton'),
            cancelExit: document.getElementById('cancelExitButton')
        },
        ariaLiveRegion: document.getElementById('aria-live-region')
    };

    // --- STATE MANAGEMENT ---
    const state = {
        gameMode: 'pvp',
        difficulty: 'hard',
        playerMark: X_CLASS,
        aiMark: O_CLASS,
        isOTurn: false,
        board: Array(9).fill(null),
        score: { x: 0, o: 0 },
        isGameActive: false,
        gamesPlayed: 0,
        nextMistakeGame: 0
    };

    // --- ANIMATION & EFFECTS ---
    const effects = {
        createShatter(x, y, color) {
            const container = document.getElementById('shatter-container');
            const shardCount = 15;
            for (let i = 0; i < shardCount; i++) {
                const shard = document.createElement('div');
                shard.classList.add('shard');
                const size = Math.random() * 12 + 5;
                shard.style.setProperty('--tx', `${(Math.random() * 250 - 125)}px`);
                shard.style.setProperty('--ty', `${(Math.random() * 250 - 125)}px`);
                shard.style.setProperty('--rot', `${(Math.random() * 540 - 270)}deg`);
                shard.style.width = `${size}px`;
                shard.style.height = `${size}px`;
                shard.style.top = `${y}px`;
                shard.style.left = `${x}px`;
                shard.style.backgroundColor = color;
                container.appendChild(shard);
                setTimeout(() => shard.remove(), 700);
            }
        }
    };
    
    // --- UI & RENDER FUNCTIONS ---
    const ui = {
        toggleOverlay: (overlay, show) => overlay.classList.toggle('active', show),
        
        showView(viewId) {
            const backButton = dom.buttons.universalBack;
            const activeView = document.getElementById(viewId);
            
            dom.views.forEach(view => view.classList.remove('active'));
            activeView.classList.add('active');

            let backTarget = null;
            let isGameScreen = false;

            switch (viewId) {
                case 'mainMenu':
                    state.score = { x: 0, o: 0 };
                    state.gamesPlayed = 0;
                    state.nextMistakeGame = Math.floor(Math.random() * 3) + 3;
                    break;
                case 'symbolSelection':
                    backTarget = 'mainMenu';
                    break;
                case 'difficultySelection':
                    backTarget = 'symbolSelection';
                    break;
                case 'gameScreen':
                    backTarget = state.gameMode === 'pvp' ? 'mainMenu' : 'difficultySelection';
                    isGameScreen = true;
                    game.start();
                    break;
            }
            
            if (backTarget) {
                backButton.style.display = 'block';
                backButton.dataset.target = backTarget;
                backButton.classList.toggle('btn-header', isGameScreen);

                if (isGameScreen) {
                    document.querySelector('.game-header').prepend(backButton);
                } else {
                    activeView.appendChild(backButton);
                }
            } else {
                 backButton.style.display = 'none';
            }
        },
        update() {
            this.updateBoard();
            this.updateTurnIndicator();
            this.updateScoreDisplay();
        },
        updateBoard() {
            dom.cellElements.forEach((cell, index) => {
                cell.className = 'cell';
                if (state.board[index]) cell.classList.add(state.board[index]);
            });
        },
        updateTurnIndicator() {
            const currentClass = state.isOTurn ? O_CLASS : X_CLASS;
            dom.displays.turn.innerText = `${currentClass.toUpperCase()}'s Turn`;
            dom.displays.turn.className = `turn-display ${currentClass}`;
            dom.gameBoard.className = `turn-${currentClass}`;
        },
        updateScoreDisplay() {
            dom.displays.score.innerHTML = `X: <span class="score" id="score-x">${state.score.x}</span> | O: <span class="score" id="score-o">${state.score.o}</span>`;
        },
        flashScore(winner) {
            const scoreSpan = document.getElementById(`score-${winner}`);
            scoreSpan.classList.add('updated');
            setTimeout(() => scoreSpan.classList.remove('updated'), 400);
        },
        drawWinningLine(winningItem) {
            const boardRect = dom.gameBoard.getBoundingClientRect();
            const cellSize = boardRect.width / 3;
            const halfCell = cellSize / 2;
            const coords = {
                h1:{x1:halfCell,y1:halfCell,x2:boardRect.width-halfCell,y2:halfCell},h2:{x1:halfCell,y1:cellSize+halfCell,x2:boardRect.width-halfCell,y2:cellSize+halfCell},h3:{x1:halfCell,y1:cellSize*2+halfCell,x2:boardRect.width-halfCell,y2:cellSize*2+halfCell},v1:{x1:halfCell,y1:halfCell,x2:halfCell,y2:boardRect.height-halfCell},v2:{x1:cellSize+halfCell,y1:halfCell,x2:cellSize+halfCell,y2:boardRect.height-halfCell},v3:{x1:cellSize*2+halfCell,y1:halfCell,x2:cellSize*2+halfCell,y2:boardRect.height-halfCell},d1:{x1:halfCell,y1:halfCell,x2:boardRect.width-halfCell,y2:boardRect.height-halfCell},d2:{x1:boardRect.width-halfCell,y1:halfCell,x2:halfCell,y2:boardRect.height-halfCell}
            };
            const pos = coords[winningItem.name];
            const winnerColor = state.isOTurn ? 'var(--color-o)' : 'var(--color-x)';
            const line = dom.winningLine.line;
            line.setAttribute('x1',pos.x1);line.setAttribute('y1',pos.y1);line.setAttribute('x2',pos.x2);line.setAttribute('y2',pos.y2);
            line.style.stroke = winnerColor;
            dom.winningLine.svg.style.visibility = 'visible';
            winningItem.combo.forEach(index => dom.cellElements[index].classList.add('winning-cell'));
        },
        showEndGameMessage(draw) {
            let message = draw ? 'Draw!' : `${state.isOTurn ? 'O' : 'X'} Wins!`;
            dom.winningMessageText.innerText = message;
            this.toggleOverlay(dom.overlays.winning, true);
            this.announce(message + " Press Play Again to continue.");
        },
        announce: (message) => dom.ariaLiveRegion.textContent = message
    };

    // --- GAME LOGIC ---
    const game = {
        start() {
            state.isGameActive = true;
            state.isOTurn = false;
            state.board.fill(null);
            ui.toggleOverlay(dom.overlays.winning, false);
            dom.winningLine.svg.style.visibility = 'hidden';
            dom.gameBoard.style.pointerEvents = 'auto';
            ui.update();
            ui.announce(`New game started. X's turn.`);
            if (state.gameMode === 'pvc' && state.playerMark === O_CLASS) this.triggerAIMove();
        },
        handleCellClick(e) {
            if (!e.target.matches('[data-cell-index]')) return;
            const index = parseInt(e.target.dataset.cellIndex);
            if (!state.isGameActive || state.board[index] !== null) return;
            const currentClass = state.isOTurn ? O_CLASS : X_CLASS;
            if (state.gameMode === 'pvc' && currentClass === state.aiMark) return;
            this.placeMark(index, currentClass);
            ui.announce(`${currentClass.toUpperCase()} placed in cell ${index + 1}`);
            if (this.processMove(currentClass)) return;
            if (state.gameMode === 'pvc') this.triggerAIMove();
        },
        placeMark(index, currentClass) {
            state.board[index] = currentClass;
            ui.updateBoard();
        },
        swapTurns() {
            state.isOTurn = !state.isOTurn;
            ui.updateTurnIndicator();
            ui.announce(`${state.isOTurn ? 'O' : 'X'}'s turn.`);
        },
        processMove(currentClass) {
            const winningCombination = this.checkWin(currentClass);
            if (winningCombination) { this.end(false, winningCombination); return true; }
            if (this.isDraw()) { this.end(true); return true; }
            this.swapTurns();
            return false;
        },
        triggerAIMove() {
            ui.toggleOverlay(dom.overlays.aiThinking, true);
            // FASTER AI: Reduced delay for more robust feel
            setTimeout(() => { 
                ai.move(); 
                ui.toggleOverlay(dom.overlays.aiThinking, false);
            }, Math.random() * 250 + 200); 
        },
        end(draw, winningCombination = null) {
            state.isGameActive = false;
            dom.gameBoard.style.pointerEvents = 'none';
            if (!draw) {
                const winner = state.isOTurn ? O_CLASS : X_CLASS;
                state.score[winner]++;
                ui.updateScoreDisplay();
                ui.flashScore(winner);
                ui.drawWinningLine(winningCombination);
            }
            if (state.gameMode === 'pvc') state.gamesPlayed++;
            setTimeout(() => ui.showEndGameMessage(draw), winningCombination ? 800 : 100);
        },
        checkWin: (player, board = state.board) => WINNING_COMBINATIONS.find(item => item.combo.every(index => board[index] === player)),
        isDraw: () => state.board.every(cell => cell !== null)
    };
    
    // --- AI LOGIC ---
    const ai = {
        move() {
            if (!state.isGameActive) return;
            if (state.difficulty === 'easy') {
                const emptyCells = state.board.map((v, i) => v === null ? i : null).filter(v => v !== null);
                const randomIndex = emptyCells[Math.floor(Math.random() * emptyCells.length)];
                game.placeMark(randomIndex, state.aiMark);
                this.announceMove(randomIndex); game.processMove(state.aiMark); return;
            }
            const isMistakeTime = state.gamesPlayed >= state.nextMistakeGame;
            const aiWinningMove = this.findWinningMove(state.aiMark);
            if (aiWinningMove !== null) { game.placeMark(aiWinningMove, state.aiMark); this.announceMove(aiWinningMove); game.processMove(state.aiMark); return; }
            const playerWinningMove = this.findWinningMove(state.playerMark);
            if (playerWinningMove !== null) {
                if (isMistakeTime) {
                    const alternativeMove = this.findPlausibleAlternativeMove(playerWinningMove);
                    game.placeMark(alternativeMove, state.aiMark); this.announceMove(alternativeMove);
                    state.nextMistakeGame = state.gamesPlayed + Math.floor(Math.random() * 3) + 3;
                } else { game.placeMark(playerWinningMove, state.aiMark); this.announceMove(playerWinningMove); }
                game.processMove(state.aiMark); return;
            }
            const bestMove = this.minimax(state.board, state.aiMark).index;
            game.placeMark(bestMove, state.aiMark); this.announceMove(bestMove); game.processMove(state.aiMark);
        },
        announceMove: (index) => ui.announce(`AI placed ${state.aiMark.toUpperCase()} in cell ${index + 1}`),
        findWinningMove(player) {
            for (let i = 0; i < 9; i++) {
                if (state.board[i] === null) {
                    const tempBoard = [...state.board]; tempBoard[i] = player;
                    if (game.checkWin(player, tempBoard)) return i;
                }
            }
            return null;
        },
        findPlausibleAlternativeMove(blockingMoveIndex) {
            const availableSpots = state.board.map((v, i) => v === null ? i : null).filter(v => v !== null);
            const alternatives = availableSpots.filter(index => index !== blockingMoveIndex);
            return alternatives.length > 0 ? alternatives[Math.floor(Math.random() * alternatives.length)] : blockingMoveIndex;
        },
        minimax(newBoard, player) {
            const availableSpots = newBoard.map((v, i) => v === null ? i : null).filter(v => v !== null);
            if (game.checkWin(state.playerMark, newBoard)) return { score: -10 };
            if (game.checkWin(state.aiMark, newBoard)) return { score: 10 };
            if (availableSpots.length === 0) return { score: 0 };
            const moves = availableSpots.map(index => {
                const move = { index }; newBoard[index] = player;
                move.score = this.minimax(newBoard, player === state.aiMark ? state.playerMark : state.aiMark).score;
                newBoard[index] = null; return move;
            });
            return player === state.aiMark ? moves.reduce((a, b) => a.score > b.score ? a : b) : moves.reduce((a, b) => a.score < b.score ? a : b);
        }
    };

    // --- EVENT LISTENERS ---
    function setupEventListeners() {
        dom.buttons.pvp.addEventListener('click', () => { state.gameMode = 'pvp'; ui.showView('gameScreen'); });
        dom.buttons.pvc.addEventListener('click', () => { state.gameMode = 'pvc'; ui.showView('symbolSelection'); });
        dom.buttons.symbolChoices.forEach(btn => btn.addEventListener('click', (e) => {
            state.playerMark = e.target.dataset.symbol;
            state.aiMark = state.playerMark === X_CLASS ? O_CLASS : X_CLASS;
            ui.showView('difficultySelection');
        }));
        [dom.buttons.easy, dom.buttons.hard].forEach(btn => btn.addEventListener('click', (e) => {
            state.difficulty = e.target.dataset.difficulty;
            ui.showView('gameScreen');
        }));
        
        dom.buttons.universalBack.addEventListener('click', (e) => {
            const targetViewId = e.target.dataset.target;
            if (state.isGameActive && document.getElementById('gameScreen').classList.contains('active')) {
                dom.overlays.exitConfirmation.dataset.target = targetViewId;
                ui.toggleOverlay(dom.overlays.exitConfirmation, true);
            } else {
                ui.showView(targetViewId);
            }
        });
        
        dom.buttons.cancelExit.addEventListener('click', () => ui.toggleOverlay(dom.overlays.exitConfirmation, false));

        dom.buttons.confirmExit.addEventListener('click', () => {
            const targetViewId = dom.overlays.exitConfirmation.dataset.target;
            state.isGameActive = false;
            ui.toggleOverlay(dom.overlays.exitConfirmation, false);
            ui.showView(targetViewId);
        });

        dom.buttons.restart.addEventListener('click', () => game.start());
        dom.gameBoard.addEventListener('click', game.handleCellClick.bind(game));

        document.querySelectorAll('.btn').forEach(button => {
            button.addEventListener('click', (e).
