class Tetris {
    constructor() {
        this.boardWidth = 10;
        this.boardHeight = 20;
        this.board = Array(this.boardHeight).fill().map(() => Array(this.boardWidth).fill(0));
        this.currentPiece = null;
        this.nextPiece = null;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameRunning = false;
        this.gamePaused = false;
        this.dropCounter = 0;
        this.dropInterval = 1000;
        this.lastTime = 0;
        
        this.pieces = {
            'I': [
                [[1,1,1,1]]
            ],
            'O': [
                [[1,1],
                 [1,1]]
            ],
            'T': [
                [[0,1,0],
                 [1,1,1]]
            ],
            'S': [
                [[0,1,1],
                 [1,1,0]]
            ],
            'Z': [
                [[1,1,0],
                 [0,1,1]]
            ],
            'J': [
                [[1,0,0],
                 [1,1,1]]
            ],
            'L': [
                [[0,0,1],
                 [1,1,1]]
            ]
        };
        
        this.colors = {
            'I': 'i',
            'O': 'o',
            'T': 't',
            'S': 's',
            'Z': 'z',
            'J': 'j',
            'L': 'l'
        };
        
        this.initBoard();
        this.initControls();
    }
    
    initBoard() {
        const board = document.getElementById('game-board');
        board.innerHTML = '';
        
        for (let y = 0; y < this.boardHeight; y++) {
            for (let x = 0; x < this.boardWidth; x++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.x = x;
                cell.dataset.y = y;
                board.appendChild(cell);
            }
        }
    }
    
    initControls() {
        document.getElementById('start-btn').addEventListener('click', () => this.start());
        document.getElementById('pause-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('restart-btn').addEventListener('click', () => this.restart());
        
        document.addEventListener('keydown', (e) => {
            if (!this.gameRunning || this.gamePaused) return;
            
            switch(e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.movePiece(-1, 0);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.movePiece(1, 0);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.movePiece(0, 1);
                    break;
                case 'ArrowUp':
                case ' ':
                    e.preventDefault();
                    this.rotatePiece();
                    break;
                case 'p':
                case 'P':
                    e.preventDefault();
                    this.togglePause();
                    break;
            }
        });
    }
    
    start() {
        if (this.gameRunning) return;
        
        this.gameRunning = true;
        this.gamePaused = false;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.dropInterval = 1000;
        this.board = Array(this.boardHeight).fill().map(() => Array(this.boardWidth).fill(0));
        
        document.getElementById('start-btn').disabled = true;
        document.getElementById('pause-btn').disabled = false;
        document.getElementById('game-over').classList.add('hidden');
        
        this.spawnPiece();
        this.updateScore();
        this.gameLoop();
    }
    
    restart() {
        this.gameRunning = false;
        this.gamePaused = false;
        document.getElementById('start-btn').disabled = false;
        document.getElementById('pause-btn').disabled = true;
        this.start();
    }
    
    togglePause() {
        if (!this.gameRunning) return;
        
        this.gamePaused = !this.gamePaused;
        const pauseBtn = document.getElementById('pause-btn');
        pauseBtn.textContent = this.gamePaused ? 'Продолжить' : 'Пауза';
        
        if (!this.gamePaused) {
            this.lastTime = performance.now();
            this.gameLoop();
        }
    }
    
    spawnPiece() {
        const types = Object.keys(this.pieces);
        const type = this.nextPiece ? this.nextPiece.type : types[Math.floor(Math.random() * types.length)];
        
        this.currentPiece = {
            type: type,
            shape: this.pieces[type][0],
            x: Math.floor(this.boardWidth / 2) - Math.floor(this.pieces[type][0][0].length / 2),
            y: 0
        };
        
        const nextType = types[Math.floor(Math.random() * types.length)];
        this.nextPiece = {
            type: nextType,
            shape: this.pieces[nextType][0]
        };
        
        this.updateNextPiece();
        
        if (this.checkCollision(this.currentPiece.x, this.currentPiece.y, this.currentPiece.shape)) {
            this.gameOver();
        }
    }
    
    updateNextPiece() {
        const nextPieceDiv = document.getElementById('next-piece');
        nextPieceDiv.innerHTML = '';
        nextPieceDiv.style.gridTemplateColumns = `repeat(${this.nextPiece.shape[0].length}, 1fr)`;
        nextPieceDiv.style.gridTemplateRows = `repeat(${this.nextPiece.shape.length}, 1fr)`;
        
        for (let y = 0; y < this.nextPiece.shape.length; y++) {
            for (let x = 0; x < this.nextPiece.shape[y].length; x++) {
                const cell = document.createElement('div');
                if (this.nextPiece.shape[y][x]) {
                    cell.className = `next-piece-cell cell ${this.colors[this.nextPiece.type]}`;
                } else {
                    cell.className = 'next-piece-cell';
                }
                nextPieceDiv.appendChild(cell);
            }
        }
    }
    
    rotatePiece() {
        if (!this.currentPiece) return;
        
        const rotated = this.rotateMatrix(this.currentPiece.shape);
        if (!this.checkCollision(this.currentPiece.x, this.currentPiece.y, rotated)) {
            this.currentPiece.shape = rotated;
        }
    }
    
    rotateMatrix(matrix) {
        const rows = matrix.length;
        const cols = matrix[0].length;
        const rotated = Array(cols).fill().map(() => Array(rows).fill(0));
        
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                rotated[x][rows - 1 - y] = matrix[y][x];
            }
        }
        
        return rotated;
    }
    
    movePiece(dx, dy) {
        if (!this.currentPiece) return;
        
        const newX = this.currentPiece.x + dx;
        const newY = this.currentPiece.y + dy;
        
        if (!this.checkCollision(newX, newY, this.currentPiece.shape)) {
            this.currentPiece.x = newX;
            this.currentPiece.y = newY;
            
            if (dy > 0) {
                this.score += 1;
                this.updateScore();
            }
        } else if (dy > 0) {
            this.placePiece();
            this.clearLines();
            this.spawnPiece();
        }
    }
    
    checkCollision(x, y, shape) {
        for (let py = 0; py < shape.length; py++) {
            for (let px = 0; px < shape[py].length; px++) {
                if (shape[py][px]) {
                    const newX = x + px;
                    const newY = y + py;
                    
                    if (newX < 0 || newX >= this.boardWidth || 
                        newY >= this.boardHeight ||
                        (newY >= 0 && this.board[newY][newX])) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    placePiece() {
        if (!this.currentPiece) return;
        
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const boardY = this.currentPiece.y + y;
                    const boardX = this.currentPiece.x + x;
                    
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = this.currentPiece.type;
                    }
                }
            }
        }
    }
    
    clearLines() {
        let linesCleared = 0;
        
        for (let y = this.boardHeight - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                this.board.splice(y, 1);
                this.board.unshift(Array(this.boardWidth).fill(0));
                linesCleared++;
                y++;
            }
        }
        
        if (linesCleared > 0) {
            this.lines += linesCleared;
            const points = [0, 100, 300, 500, 800][linesCleared] * this.level;
            this.score += points;
            
            this.level = Math.floor(this.lines / 10) + 1;
            this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
            
            this.updateScore();
        }
    }
    
    updateScore() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('lines').textContent = this.lines;
    }
    
    draw() {
        this.initBoard();
        
        for (let y = 0; y < this.boardHeight; y++) {
            for (let x = 0; x < this.boardWidth; x++) {
                const cell = document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
                if (this.board[y][x]) {
                    cell.classList.add('filled', this.colors[this.board[y][x]]);
                }
            }
        }
        
        if (this.currentPiece) {
            for (let y = 0; y < this.currentPiece.shape.length; y++) {
                for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                    if (this.currentPiece.shape[y][x]) {
                        const boardX = this.currentPiece.x + x;
                        const boardY = this.currentPiece.y + y;
                        
                        if (boardY >= 0 && boardY < this.boardHeight && 
                            boardX >= 0 && boardX < this.boardWidth) {
                            const cell = document.querySelector(`[data-x="${boardX}"][data-y="${boardY}"]`);
                            if (cell) {
                                cell.classList.add('filled', this.colors[this.currentPiece.type]);
                            }
                        }
                    }
                }
            }
        }
    }
    
    gameLoop(time = 0) {
        if (!this.gameRunning || this.gamePaused) return;
        
        const deltaTime = time - this.lastTime;
        this.lastTime = time;
        
        this.dropCounter += deltaTime;
        
        if (this.dropCounter > this.dropInterval) {
            this.movePiece(0, 1);
            this.dropCounter = 0;
        }
        
        this.draw();
        requestAnimationFrame((t) => this.gameLoop(t));
    }
    
    gameOver() {
        this.gameRunning = false;
        document.getElementById('start-btn').disabled = false;
        document.getElementById('pause-btn').disabled = true;
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('game-over').classList.remove('hidden');
    }
}

const game = new Tetris();

