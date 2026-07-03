/**
 * GameVerse Arcade Games Engine
 * Implements the 10 original arcade mini-games.
 */

// Helper: Common elements selector
const $_id = (id) => document.getElementById(id);
const $_queryAll = (q) => document.querySelectorAll(q);

/* =================================================================
   1. TIC TAC TOE
   ================================================================= */
(function() {
  let board = Array(9).fill(null);
  let active = false;
  let playerTurn = true;
  let scorePlayer = 0;
  let scoreCpu = 0;

  function initBoard() {
    board = Array(9).fill(null);
    playerTurn = true;
    const grid = $_id('tictactoe-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    for (let i = 0; i < 9; i++) {
      const cell = document.createElement('button');
      cell.className = 'w-full h-full rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all font-display text-3xl font-black flex items-center justify-center';
      cell.dataset.index = i;
      cell.onclick = (e) => handleCellClick(i);
      grid.appendChild(cell);
    }
    updateStatus('Your Turn (X)');
  }

  function handleCellClick(idx) {
    if (!active || !playerTurn || board[idx] !== null) return;
    makeMove(idx, 'X');
    if (checkResult('X')) return;

    playerTurn = false;
    updateStatus('CPU thinking...');
    setTimeout(cpuMove, 600);
  }

  function makeMove(idx, symbol) {
    board[idx] = symbol;
    const grid = $_id('tictactoe-grid');
    if (!grid) return;
    const cell = grid.children[idx];
    if (!cell) return;
    
    cell.textContent = symbol;
    if (symbol === 'X') {
      cell.className += ' text-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.4)]';
      if (typeof Sound !== 'undefined') Sound.click();
    } else {
      cell.className += ' text-[#FF4D9D] shadow-[0_0_15px_rgba(255,77,157,0.4)]';
      if (typeof Sound !== 'undefined') Sound.reveal();
    }
  }

  function cpuMove() {
    if (!active) return;
    // Find empty spots
    const empties = board.map((c, i) => c === null ? i : null).filter(c => c !== null);
    if (empties.length === 0) return;

    // Simple AI: block win or take winning move if possible
    let moveIdx = empties[0];
    // Check if CPU can win
    for (const line of winLines) {
      const [a, b, c] = line;
      if (board[a] === 'O' && board[b] === 'O' && board[c] === null) { moveIdx = c; break; }
      if (board[a] === 'O' && board[c] === 'O' && board[b] === null) { moveIdx = b; break; }
      if (board[b] === 'O' && board[c] === 'O' && board[a] === null) { moveIdx = a; break; }
    }
    // Check if player can win to block
    for (const line of winLines) {
      const [a, b, c] = line;
      if (board[a] === 'X' && board[b] === 'X' && board[c] === null) { moveIdx = c; }
      if (board[a] === 'X' && board[c] === 'X' && board[b] === null) { moveIdx = b; }
      if (board[b] === 'X' && board[c] === 'X' && board[a] === null) { moveIdx = a; }
    }

    makeMove(moveIdx, 'O');
    if (checkResult('O')) return;

    playerTurn = true;
    updateStatus('Your Turn (X)');
  }

  const winLines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
    [0, 4, 8], [2, 4, 6]             // diagonals
  ];

  function checkResult(symbol) {
    for (const line of winLines) {
      const [a, b, c] = line;
      if (board[a] === symbol && board[b] === symbol && board[c] === symbol) {
        endGame(symbol, line);
        return true;
      }
    }

    if (board.every(cell => cell !== null)) {
      endGame('draw');
      return true;
    }
    return false;
  }

  function endGame(winner, line) {
    active = false;
    const grid = $_id('tictactoe-grid');
    
    if (winner === 'draw') {
      updateStatus('Draw Match!');
      if (typeof Sound !== 'undefined') Sound.lose();
      if (typeof Stats !== 'undefined') Stats.recordGameResult('tictactoe', 0, false);
    } else {
      updateStatus(winner === 'X' ? 'Victory!' : 'CPU Wins!');
      if (winner === 'X') {
        scorePlayer++;
        $_id('tictactoe-player-score').textContent = scorePlayer;
        
        // Highlight winning cells
        if (line && grid) {
          line.forEach(idx => {
            grid.children[idx].className += ' bg-green-500/25 border-green-500';
          });
        }
        
        if (typeof Sound !== 'undefined') Sound.win();
        if (typeof Stats !== 'undefined') Stats.recordGameResult('tictactoe', 1, true);
        if (typeof Achievements !== 'undefined') Achievements.check('tictactoe_win', true);
      } else {
        scoreCpu++;
        $_id('tictactoe-cpu-score').textContent = scoreCpu;
        if (line && grid) {
          line.forEach(idx => {
            grid.children[idx].className += ' bg-red-500/25 border-red-500';
          });
        }
        if (typeof Sound !== 'undefined') Sound.lose();
        if (typeof Stats !== 'undefined') Stats.recordGameResult('tictactoe', 0, false);
      }
    }
  }

  function updateStatus(txt) {
    const el = $_id('tictactoe-status');
    if (el) el.textContent = txt;
  }

  App.registerGame('tictactoe', {
    start() {
      active = true;
      initBoard();
    },
    stop() {
      active = false;
    },
    bind() {
      $_id('tictactoe-reset').onclick = () => {
        active = true;
        initBoard();
      };
    }
  });
})();

/* =================================================================
   2. SNAKE
   ================================================================= */
(function() {
  let canvas, ctx;
  let active = false;
  let snake = [];
  let dir = 'right';
  let nextDir = 'right';
  let food = { x: 0, y: 0 };
  let score = 0;
  let timer = null;
  let speed = 120;
  const gridCount = 20;
  const cellSize = 20;

  function initGame() {
    snake = [
      { x: 5, y: 10 },
      { x: 4, y: 10 },
      { x: 3, y: 10 }
    ];
    dir = 'right';
    nextDir = 'right';
    score = 0;
    speed = 120;
    $_id('snake-score').textContent = score;
    
    if (typeof Stats !== 'undefined') {
      const best = Stats.data.perGame['snake']?.bestScore || 0;
      $_id('snake-highscore').textContent = best;
    }
    
    spawnFood();
    active = true;
    $_id('snake-start-prompt').classList.add('hidden');
    
    if (timer) clearInterval(timer);
    timer = setInterval(loop, speed);
  }

  function spawnFood() {
    let attempts = 0;
    while (attempts < 100) {
      const rx = Math.floor(Math.random() * gridCount);
      const ry = Math.floor(Math.random() * gridCount);
      
      const onSnake = snake.some(s => s.x === rx && s.y === ry);
      if (!onSnake) {
        food = { x: rx, y: ry };
        break;
      }
      attempts++;
    }
  }

  function loop() {
    if (!active) return;
    dir = nextDir;
    
    const head = { ...snake[0] };
    if (dir === 'right') head.x++;
    else if (dir === 'left') head.x--;
    else if (dir === 'up') head.y--;
    else if (dir === 'down') head.y++;

    // Check bounds / self collision
    if (head.x < 0 || head.x >= gridCount || head.y < 0 || head.y >= gridCount || checkSelfCollision(head)) {
      gameOver();
      return;
    }

    snake.unshift(head);

    // Check food collision
    if (head.x === food.x && head.y === food.y) {
      score++;
      $_id('snake-score').textContent = score;
      if (typeof Sound !== 'undefined') Sound.match();
      
      spawnFood();
      // Increase speed slightly
      if (score % 5 === 0 && speed > 60) {
        speed -= 8;
        clearInterval(timer);
        timer = setInterval(loop, speed);
      }
    } else {
      snake.pop();
    }

    draw();
  }

  function checkSelfCollision(p) {
    return snake.some(s => s.x === p.x && s.y === p.y);
  }

  function draw() {
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid background grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= gridCount; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, canvas.height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(canvas.width, i * cellSize);
      ctx.stroke();
    }

    // Draw snake
    snake.forEach((s, idx) => {
      ctx.fillStyle = idx === 0 ? '#00E5FF' : 'rgba(0, 229, 255, 0.6)';
      ctx.shadowColor = '#00E5FF';
      ctx.shadowBlur = idx === 0 ? 10 : 0;
      
      ctx.beginPath();
      ctx.roundRect(s.x * cellSize + 1, s.y * cellSize + 1, cellSize - 2, cellSize - 2, 4);
      ctx.fill();
    });
    ctx.shadowBlur = 0; // reset

    // Draw food
    ctx.fillStyle = '#FF4D9D';
    ctx.shadowColor = '#FF4D9D';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(food.x * cellSize + cellSize / 2, food.y * cellSize + cellSize / 2, cellSize / 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  function gameOver() {
    active = false;
    if (timer) clearInterval(timer);
    
    if (typeof Sound !== 'undefined') Sound.lose();
    if (typeof Stats !== 'undefined') Stats.recordGameResult('snake', score, score > 0);
    
    $_id('snake-start-prompt').classList.remove('hidden');
    $_id('snake-start-prompt').querySelector('h3').textContent = 'Game Over';
    $_id('snake-start-prompt').querySelector('p').textContent = `Final Score: ${score}`;
    
    if (typeof Achievements !== 'undefined') {
      Achievements.check('snake_beginner', score >= 10);
      Achievements.check('snake_master', score >= 50);
    }
  }

  App.registerGame('snake', {
    start() {
      canvas = $_id('snake-canvas');
      if (canvas) ctx = canvas.getContext('2d');
      draw();
    },
    stop() {
      active = false;
      if (timer) clearInterval(timer);
      window.removeEventListener('keydown', handleSnakeKeydown);
      if (canvas) {
        canvas.removeEventListener('touchstart', handleSnakeTouchStart);
        canvas.removeEventListener('touchend', handleSnakeTouchEnd);
      }
    },
    pause() {
      if (timer) clearInterval(timer);
    },
    resume() {
      if (active) timer = setInterval(loop, speed);
    },
    bind() {
      $_id('snake-reset').onclick = () => initGame();
      $_id('snake-start-btn').onclick = () => initGame();

      // Keyboard Controls
      window.addEventListener('keydown', handleSnakeKeydown);
      
      // Swipe controls
      let touchStartX = 0;
      let touchStartY = 0;
      canvas = $_id('snake-canvas');
      if (canvas) {
        canvas.addEventListener('touchstart', handleSnakeTouchStart, { passive: true });
        canvas.addEventListener('touchend', handleSnakeTouchEnd, { passive: true });
      }
    }
  });

function handleSnakeKeydown(e) {
  if (!active) return;
  if (e.key === 'ArrowUp' && dir !== 'down') nextDir = 'up';
  if (e.key === 'ArrowDown' && dir !== 'up') nextDir = 'down';
  if (e.key === 'ArrowLeft' && dir !== 'right') nextDir = 'left';
  if (e.key === 'ArrowRight' && dir !== 'left') nextDir = 'right';
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
    e.preventDefault();
  }
}

function handleSnakeTouchStart(e) {
  touchStartX = e.changedTouches[0].screenX;
  touchStartY = e.changedTouches[0].screenY;
}

function handleSnakeTouchEnd(e) {
  if (!active) return;
  const dx = e.changedTouches[0].screenX - touchStartX;
  const dy = e.changedTouches[0].screenY - touchStartY;
  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 40 && dir !== 'left') nextDir = 'right';
    if (dx < -40 && dir !== 'right') nextDir = 'left';
  } else {
    if (dy > 40 && dir !== 'up') nextDir = 'down';
    if (dy < -40 && dir !== 'down') nextDir = 'up';
  }
}
})();

/* =================================================================
   3. 2048
   ================================================================= */
(function() {
  let board = Array(16).fill(0);
  let active = false;
  let score = 0;
  let bestScore = 0;

  function initBoard() {
    board = Array(16).fill(0);
    score = 0;
    $_id('score-2048').textContent = score;
    $_id('gameover-2048').classList.add('hidden');
    
    if (typeof Stats !== 'undefined') {
      bestScore = Stats.data.perGame['2048']?.bestScore || 0;
      $_id('best-2048').textContent = bestScore;
    }
    
    addRandom();
    addRandom();
    render();
    active = true;
  }

  function addRandom() {
    const empties = board.map((v, i) => v === 0 ? i : null).filter(v => v !== null);
    if (empties.length > 0) {
      const idx = empties[Math.floor(Math.random() * empties.length)];
      board[idx] = Math.random() < 0.9 ? 2 : 4;
    }
  }

  function render() {
    const grid = $_id('grid-2048-container');
    if (!grid) return;
    grid.innerHTML = '';
    
    board.forEach(val => {
      const cell = document.createElement('div');
      cell.className = 'w-full h-full rounded-xl bg-white/5 border border-white/5 flex items-center justify-center font-display font-black text-xl select-none transition-all duration-100';
      if (val > 0) {
        cell.textContent = val;
        // Neon color gradients
        if (val === 2) cell.className += ' bg-[#00E5FF]/20 text-[#00E5FF] border-[#00E5FF]/30 shadow-[0_0_10px_rgba(0,229,255,0.2)]';
        else if (val === 4) cell.className += ' bg-[#3B82F6]/20 text-[#3B82F6] border-[#3B82F6]/30 shadow-[0_0_10px_rgba(59,130,246,0.2)]';
        else if (val === 8) cell.className += ' bg-[#7C3AED]/20 text-[#7C3AED] border-[#7C3AED]/30 shadow-[0_0_10px_rgba(124,58,237,0.2)]';
        else if (val === 16) cell.className += ' bg-[#FF4D9D]/20 text-[#FF4D9D] border-[#FF4D9D]/30 shadow-[0_0_10px_rgba(255,77,157,0.2)]';
        else if (val === 32) cell.className += ' bg-[#FFD54A]/20 text-[#FFD54A] border-[#FFD54A]/30 shadow-[0_0_10px_rgba(255,213,74,0.2)]';
        else if (val === 64) cell.className += ' bg-[#22C55E]/20 text-[#22C55E] border-[#22C55E]/30 shadow-[0_0_10px_rgba(34,197,94,0.2)]';
        else cell.className += ' bg-[#7C3AED] text-white border-white/40 shadow-[0_0_15px_rgba(255,255,255,0.3)]';
      }
      grid.appendChild(cell);
    });
  }

  function slide(row) {
    let filtered = row.filter(x => x !== 0);
    for (let i = 0; i < filtered.length - 1; i++) {
      if (filtered[i] === filtered[i + 1]) {
        filtered[i] *= 2;
        score += filtered[i];
        filtered.splice(i + 1, 1);
        if (typeof Sound !== 'undefined') Sound.click();
      }
    }
    while (filtered.length < 4) filtered.push(0);
    return filtered;
  }

  function handleInput(dir) {
    if (!active) return;
    let moved = false;
    let oldBoard = [...board];

    if (dir === 'left') {
      for (let i = 0; i < 4; i++) {
        let row = board.slice(i * 4, i * 4 + 4);
        let slid = slide(row);
        for (let j = 0; j < 4; j++) board[i * 4 + j] = slid[j];
      }
    } else if (dir === 'right') {
      for (let i = 0; i < 4; i++) {
        let row = board.slice(i * 4, i * 4 + 4).reverse();
        let slid = slide(row).reverse();
        for (let j = 0; j < 4; j++) board[i * 4 + j] = slid[j];
      }
    } else if (dir === 'up') {
      for (let j = 0; j < 4; j++) {
        let row = [board[j], board[j + 4], board[j + 8], board[j + 12]];
        let slid = slide(row);
        for (let i = 0; i < 4; i++) board[i * 4 + j] = slid[i];
      }
    } else if (dir === 'down') {
      for (let j = 0; j < 4; j++) {
        let row = [board[j], board[j + 4], board[j + 8], board[j + 12]].reverse();
        let slid = slide(row).reverse();
        for (let i = 0; i < 4; i++) board[i * 4 + j] = slid[i];
      }
    }

    moved = board.some((v, i) => v !== oldBoard[i]);
    if (moved) {
      addRandom();
      render();
      $_id('score-2048').textContent = score;
      checkGameOver();
    }
  }

  function checkGameOver() {
    const hasEmpty = board.includes(0);
    if (hasEmpty) return;

    // Check horizontal moves
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[i * 4 + j] === board[i * 4 + j + 1]) return;
      }
    }
    // Check vertical moves
    for (let j = 0; j < 4; j++) {
      for (let i = 0; i < 3; i++) {
        if (board[i * 4 + j] === board[(i + 1) * 4 + j]) return;
      }
    }

    // Really game over
    active = false;
    $_id('gameover-2048').classList.remove('hidden');
    if (typeof Sound !== 'undefined') Sound.lose();
    
    const maxTile = Math.max(...board);
    if (typeof Achievements !== 'undefined') {
      Achievements.check('2048_starter', maxTile >= 256);
      Achievements.check('2048_master', maxTile >= 2048);
    }
    if (typeof Stats !== 'undefined') {
      Stats.recordGameResult('2048', score, maxTile >= 1024);
    }
  }

  App.registerGame('2048', {
    start() {
      initBoard();
    },
    stop() {
      active = false;
      window.removeEventListener('keydown', handleKeydown);
    },
    bind() {
      $_id('reset-2048').onclick = () => initBoard();
      $_id('retry-2048').onclick = () => initBoard();

      window.addEventListener('keydown', handleKeydown);
    }
  });

function handleKeydown(e) {
  if (!active) return;
  if (e.key === 'ArrowLeft') handleInput('left');
  if (e.key === 'ArrowRight') handleInput('right');
  if (e.key === 'ArrowUp') handleInput('up');
  if (e.key === 'ArrowDown') handleInput('down');
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
    e.preventDefault();
  }
}
})();

/* =================================================================
   4. MINESWEEPER
   ================================================================= */
(function() {
  let rows = 8, cols = 8, minesCount = 10;
  let grid = [];
  let active = false;
  let minesLeft = 10;
  let time = 0;
  let timerInterval = null;

  function initGrid() {
    const diff = $_id('mines-diff')?.value || 'easy';
    if (diff === 'easy') { rows = 8; cols = 8; minesCount = 10; }
    else if (diff === 'medium') { rows = 10; cols = 10; minesCount = 20; }
    else if (diff === 'hard') { rows = 12; cols = 12; minesCount = 35; }

    minesLeft = minesCount;
    time = 0;
    $_id('mines-left').textContent = minesLeft;
    $_id('mines-timer').textContent = '000';
    
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (!active) return;
      time++;
      $_id('mines-timer').textContent = String(time).padStart(3, '0');
    }, 1000);

    // Build grid memory
    grid = [];
    for (let r = 0; r < rows; r++) {
      grid[r] = [];
      for (let c = 0; c < cols; c++) {
        grid[r][c] = { r, c, mine: false, revealed: false, flagged: false, count: 0 };
      }
    }

    // Place mines
    let placed = 0;
    while (placed < minesCount) {
      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);
      if (!grid[r][c].mine) {
        grid[r][c].mine = true;
        placed++;
      }
    }

    // Calculate neighboring counts
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c].mine) continue;
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc].mine) {
              count++;
            }
          }
        }
        grid[r][c].count = count;
      }
    }

    active = true;
    renderGrid();
  }

  function renderGrid() {
    const container = $_id('mines-grid');
    if (!container) return;
    container.innerHTML = '';
    
    // Style column width
    container.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
    
    for (let r = 0; r < rows; r++) {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'flex gap-1';
      for (let c = 0; c < cols; c++) {
        const cell = grid[r][c];
        const btn = document.createElement('button');
        btn.className = 'w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-display text-sm font-black transition-all hover:bg-white/10';
        btn.dataset.r = r;
        btn.dataset.c = c;
        
        btn.onclick = (e) => leftClick(r, c);
        btn.oncontextmenu = (e) => { e.preventDefault(); rightClick(r, c); };
        
        if (cell.revealed) {
          btn.className += ' bg-white/10 hover:bg-white/10 border-white/5';
          if (cell.mine) {
            btn.textContent = '💣';
            btn.className += ' text-red-500 bg-red-500/20 border-red-500';
          } else if (cell.count > 0) {
            btn.textContent = cell.count;
            const colors = ['', 'text-blue-400', 'text-green-400', 'text-red-400', 'text-purple-400', 'text-yellow-400', 'text-pink-400', 'text-cyan-400'];
            btn.className += ' ' + colors[cell.count];
          }
        } else if (cell.flagged) {
          btn.textContent = '🚩';
          btn.className += ' text-yellow-400 border-yellow-400/30';
        }
        rowDiv.appendChild(btn);
      }
      container.appendChild(rowDiv);
    }
  }

  function leftClick(r, c) {
    if (!active) return;
    const cell = grid[r][c];
    if (cell.revealed || cell.flagged) return;

    cell.revealed = true;
    if (cell.mine) {
      revealAllMines();
      gameOver(false);
      return;
    }

    if (typeof Sound !== 'undefined') Sound.click();

    if (cell.count === 0) {
      revealEmptyNeighbors(r, c);
    }

    checkWin();
    renderGrid();
  }

  function revealEmptyNeighbors(r, c) {
    const queue = [[r, c]];
    while (queue.length > 0) {
      const [currR, currC] = queue.shift();
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = currR + dr, nc = currC + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
            const next = grid[nr][nc];
            if (!next.revealed && !next.mine && !next.flagged) {
              next.revealed = true;
              if (next.count === 0) queue.push([nr, nc]);
            }
          }
        }
      }
    }
  }

  function rightClick(r, c) {
    if (!active) return;
    const cell = grid[r][c];
    if (cell.revealed) return;

    cell.flagged = !cell.flagged;
    minesLeft += cell.flagged ? -1 : 1;
    $_id('mines-left').textContent = minesLeft;
    if (typeof Sound !== 'undefined') Sound.reveal();
    renderGrid();
  }

  function revealAllMines() {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c].mine) grid[r][c].revealed = true;
      }
    }
    renderGrid();
  }

  function checkWin() {
    let unrevealedClean = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!grid[r][c].mine && !grid[r][c].revealed) unrevealedClean++;
      }
    }
    if (unrevealedClean === 0) {
      gameOver(true);
    }
  }

  function gameOver(won) {
    active = false;
    if (timerInterval) clearInterval(timerInterval);
    
    if (won) {
      if (typeof Sound !== 'undefined') Sound.win();
      if (typeof Stats !== 'undefined') Stats.recordGameResult('minesweeper', time, true);
      if (typeof Achievements !== 'undefined') Achievements.check('minesweeper_win', true);
      Toast.show('Field Disarmed!', 'success');
    } else {
      if (typeof Sound !== 'undefined') Sound.lose();
      if (typeof Stats !== 'undefined') Stats.recordGameResult('minesweeper', 0, false);
      Toast.show('Triggered Combusted Mine!', 'error');
    }
  }

  App.registerGame('minesweeper', {
    start() {
      initGrid();
    },
    stop() {
      active = false;
      if (timerInterval) clearInterval(timerInterval);
    },
    bind() {
      $_id('mines-reset').onclick = () => initGrid();
      $_id('mines-diff').onchange = () => initGrid();
    }
  });
})();

/* =================================================================
   5. PONG
   ================================================================= */
(function() {
  let canvas, ctx;
  let active = false;
  let animId = null;

  const paddleWidth = 10;
  const paddleHeight = 70;
  
  let playerY = 140;
  let cpuY = 140;
  let ball = { x: 250, y: 175, vx: 3.5, vy: 2, r: 6 };
  
  let pScore = 0;
  let cScore = 0;

  function initGame() {
    pScore = 0;
    cScore = 0;
    $_id('pong-player-score').textContent = 0;
    $_id('pong-cpu-score').textContent = 0;
    $_id('pong-overlay').classList.add('hidden');
    resetBall();
    active = true;
    
    if (animId) cancelAnimationFrame(animId);
    animId = requestAnimationFrame(loop);
  }

  function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.vx = (Math.random() > 0.5 ? 3.5 : -3.5);
    ball.vy = (Math.random() * 3) - 1.5;
  }

  function loop() {
    if (!active) return;
    update();
    draw();
    animId = requestAnimationFrame(loop);
  }

  function update() {
    // Move ball
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Bounce wall
    if (ball.y - ball.r <= 0 || ball.y + ball.r >= canvas.height) {
      ball.vy = -ball.vy;
      if (typeof Sound !== 'undefined') Sound.click();
    }

    // CPU follow ball
    const cpuSpeed = 2.8;
    const cpuTarget = ball.y - paddleHeight / 2;
    cpuY += (cpuTarget - cpuY) * 0.12;
    cpuY = Math.max(0, Math.min(canvas.height - paddleHeight, cpuY));

    // Bounces Player paddle (left)
    if (ball.vx < 0 && ball.x - ball.r <= 25 && ball.x - ball.r >= 15) {
      if (ball.y >= playerY && ball.y <= playerY + paddleHeight) {
        ball.vx = -ball.vx;
        const relativeHit = (ball.y - (playerY + paddleHeight / 2)) / (paddleHeight / 2);
        ball.vy = relativeHit * 3.5;
        if (typeof Sound !== 'undefined') Sound.reveal();
      }
    }

    // Bounces CPU paddle (right)
    if (ball.vx > 0 && ball.x + ball.r >= canvas.width - 25 && ball.x + ball.r <= canvas.width - 15) {
      if (ball.y >= cpuY && ball.y <= cpuY + paddleHeight) {
        ball.vx = -ball.vx;
        const relativeHit = (ball.y - (cpuY + paddleHeight / 2)) / (paddleHeight / 2);
        ball.vy = relativeHit * 3.5;
        if (typeof Sound !== 'undefined') Sound.reveal();
      }
    }

    // Score checks
    if (ball.x < 0) {
      cScore++;
      $_id('pong-cpu-score').textContent = cScore;
      if (typeof Sound !== 'undefined') Sound.lose();
      checkMatchEnd();
    } else if (ball.x > canvas.width) {
      pScore++;
      $_id('pong-player-score').textContent = pScore;
      if (typeof Sound !== 'undefined') Sound.win();
      checkMatchEnd();
    }
  }

  function checkMatchEnd() {
    if (pScore >= 5 || cScore >= 5) {
      active = false;
      $_id('pong-overlay').classList.remove('hidden');
      $_id('pong-overlay').querySelector('h3').textContent = pScore >= 5 ? 'Match Win' : 'Match Defeat';
      $_id('pong-overlay').querySelector('p').textContent = `Final Score: ${pScore} - ${cScore}`;
      
      if (typeof Stats !== 'undefined') {
        Stats.recordGameResult('pong', pScore, pScore >= 5);
      }
      if (typeof Achievements !== 'undefined') {
        Achievements.check('pong_win', pScore >= 5);
      }
    } else {
      resetBall();
    }
  }

  function draw() {
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Center divider dotted line
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width, canvas.height); // wait, should go straight down
    ctx.stroke();
    // Correction: line to (width/2, height)
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]); // clear

    // Player paddle
    ctx.fillStyle = '#00E5FF';
    ctx.shadowColor = '#00E5FF';
    ctx.shadowBlur = 8;
    ctx.fillRect(15, playerY, paddleWidth, paddleHeight);

    // CPU paddle
    ctx.fillStyle = '#FF4D9D';
    ctx.shadowColor = '#FF4D9D';
    ctx.shadowBlur = 8;
    ctx.fillRect(canvas.width - 25, cpuY, paddleWidth, paddleHeight);

    // Ball
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = '#FFFFFF';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  App.registerGame('pong', {
    start() {
      canvas = $_id('pong-canvas');
      if (canvas) ctx = canvas.getContext('2d');
      draw();
    },
    stop() {
      active = false;
      if (animId) cancelAnimationFrame(animId);
      if (canvas) {
        canvas.onmousemove = null;
        canvas.ontouchmove = null;
      }
    },
    pause() {
      if (animId) cancelAnimationFrame(animId);
    },
    resume() {
      if (active) animId = requestAnimationFrame(loop);
    },
    bind() {
      $_id('pong-reset').onclick = () => initGame();
      $_id('pong-start-btn').onclick = () => initGame();

      canvas = $_id('pong-canvas');
      if (canvas) {
        canvas.onmousemove = (e) => {
          if (!active) return;
          const rect = canvas.getBoundingClientRect();
          const rootY = e.clientY - rect.top;
          playerY = rootY - paddleHeight / 2;
          playerY = Math.max(0, Math.min(canvas.height - paddleHeight, playerY));
        };
        
        canvas.ontouchmove = (e) => {
          if (!active) return;
          const rect = canvas.getBoundingClientRect();
          const rootY = e.touches[0].clientY - rect.top;
          playerY = rootY - paddleHeight / 2;
          playerY = Math.max(0, Math.min(canvas.height - paddleHeight, playerY));
          e.preventDefault();
        };
      }
    }
  });
})();

/* =================================================================
   6. MEMORY MATCH
   ================================================================= */
(function() {
  const icons = ['🌌', '👽', '🛸', '🛰️', '☄️', '🚀', '🌟', '🌙'];
  let deck = [];
  let selected = [];
  let turns = 0;
  let matches = 0;
  let active = false;

  function initDeck() {
    turns = 0;
    matches = 0;
    selected = [];
    $_id('memory-turns').textContent = turns;
    $_id('memory-matches').textContent = '0/8';
    
    // Duplicate icons list to create matches deck
    deck = [...icons, ...icons]
      .map((icon, idx) => ({ id: idx, icon, revealed: false, matched: false }))
      .sort(() => Math.random() - 0.5);

    render();
    active = true;
  }

  function render() {
    const grid = $_id('memory-grid');
    if (!grid) return;
    grid.innerHTML = '';

    deck.forEach(card => {
      const btn = document.createElement('button');
      btn.className = 'w-full h-full rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-display text-2xl flex items-center justify-center';
      
      btn.onclick = () => handleCardClick(card.id);
      
      if (card.revealed || card.matched) {
        btn.textContent = card.icon;
        btn.className += ' bg-[#7C3AED]/20 border-[#7C3AED]/40 text-white shadow-[0_0_15px_rgba(124,58,237,0.3)] scale-[0.96]';
      } else {
        btn.textContent = '❓';
      }
      grid.appendChild(btn);
    });
  }

  function handleCardClick(id) {
    if (!active || selected.length >= 2) return;
    const card = deck.find(c => c.id === id);
    if (card.revealed || card.matched) return;

    card.revealed = true;
    selected.push(card);
    if (typeof Sound !== 'undefined') Sound.click();
    render();

    if (selected.length === 2) {
      turns++;
      $_id('memory-turns').textContent = turns;
      setTimeout(checkMatch, 850);
    }
  }

  function checkMatch() {
    const [c1, c2] = selected;
    if (c1.icon === c2.icon) {
      c1.matched = true;
      c2.matched = true;
      matches++;
      $_id('memory-matches').textContent = `${matches}/8`;
      if (typeof Sound !== 'undefined') Sound.match();
      
      if (matches === 8) {
        endGame();
      }
    } else {
      c1.revealed = false;
      c2.revealed = false;
      if (typeof Sound !== 'undefined') Sound.lose();
    }
    selected = [];
    render();
  }

  function endGame() {
    active = false;
    if (typeof Sound !== 'undefined') Sound.win();
    if (typeof Stats !== 'undefined') Stats.recordGameResult('memory', turns, true);
    if (typeof Achievements !== 'undefined') Achievements.check('memory_win', true);
    Toast.show('Matrix Sync Synchronized!', 'success');
  }

  App.registerGame('memory', {
    start() {
      initDeck();
    },
    stop() {
      active = false;
    },
    bind() {
      $_id('memory-reset').onclick = () => initDeck();
    }
  });
})();

/* =================================================================
   7. AIM TRAINER
   ================================================================= */
(function() {
  let canvas, ctx;
  let active = false;
  let hits = 0;
  let target = { x: 0, y: 0, r: 20 };
  let timeLeft = 30;
  let timerInterval = null;

  function safeGetId(id) {
    const el = $_id(id);
    if (!el) console.warn(`[Aim Trainer] Missing DOM element: #${id}`);
    return el;
  }

  function initGame() {
    hits = 0;
    timeLeft = 30;

    const hitsEl = safeGetId('aim-hits');
    const timerEl = safeGetId('aim-timer');
    const overlayEl = safeGetId('aim-overlay');
    const promptEl = safeGetId('aim-prompt') || (overlayEl?.querySelector('h3'));
    const subEl = safeGetId('aim-sub') || (overlayEl?.querySelector('p'));

    if (hitsEl) hitsEl.textContent = hits;
    if (timerEl) timerEl.textContent = '30s';
    if (overlayEl) overlayEl.classList.add('hidden');

    // Reset overlay text to initial state
    if (promptEl) promptEl.textContent = 'Aim Practice';
    if (subEl) subEl.textContent = 'Click targets as fast as possible in 30 seconds.';

    spawnTarget();
    active = true;

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (!active) return;
      timeLeft--;
      const timerEl2 = safeGetId('aim-timer');
      if (timerEl2) timerEl2.textContent = timeLeft + 's';
      if (timeLeft <= 0) {
        endGame();
      }
    }, 1000);

    draw();
  }

  function spawnTarget() {
    if (!canvas) return;
    const minPadding = 40;
    target.x = minPadding + Math.random() * (canvas.width - minPadding * 2);
    target.y = minPadding + Math.random() * (canvas.height - minPadding * 2);
    target.r = Math.max(12, 25 - hits * 0.4);
  }

  function draw() {
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (active) {
      const glowGrad = ctx.createRadialGradient(target.x, target.y, 2, target.x, target.y, target.r + 10);
      glowGrad.addColorStop(0, 'rgba(0, 229, 255, 0.4)');
      glowGrad.addColorStop(1, 'rgba(0, 229, 255, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(target.x, target.y, target.r + 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#00E5FF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(target.x, target.y, target.r, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(target.x, target.y, target.r / 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function handleCanvasClick(e) {
    if (!active) return;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const dist = Math.hypot(clickX - target.x, clickY - target.y);
    if (dist <= target.r + 3) {
      hits++;
      const hitsEl = safeGetId('aim-hits');
      if (hitsEl) hitsEl.textContent = hits;
      if (typeof Sound !== 'undefined') Sound.click();
      spawnTarget();
    } else {
      if (typeof Sound !== 'undefined') Sound.tick();
    }
    draw();
  }

  function endGame() {
    active = false;
    if (timerInterval) clearInterval(timerInterval);

    const overlayEl = safeGetId('aim-overlay');
    const promptEl = overlayEl?.querySelector('h3');
    const subEl = overlayEl?.querySelector('p');

    if (overlayEl) overlayEl.classList.remove('hidden');
    if (promptEl) promptEl.textContent = 'Sequence Complete';
    if (subEl) subEl.textContent = `Total Targets Hit: ${hits}`;

    if (typeof Sound !== 'undefined') Sound.win();
    if (typeof Stats !== 'undefined') Stats.recordGameResult('aim', hits, hits >= 15);
    if (typeof Achievements !== 'undefined') {
      Achievements.check('aim_rookie', hits >= 20);
      Achievements.check('aim_master', hits >= 40);
    }
  }

  App.registerGame('aim', {
    start() {
      canvas = $_id('aim-canvas');
      if (!canvas) {
        console.warn('[Aim Trainer] Canvas #aim-canvas not found');
        return;
      }
      ctx = canvas.getContext('2d');

      // Reset UI to initial "Start Sequence" state
      const overlayEl = safeGetId('aim-overlay');
      const promptEl = overlayEl?.querySelector('h3');
      const subEl = overlayEl?.querySelector('p');
      const hitsEl = safeGetId('aim-hits');
      const timerEl = safeGetId('aim-timer');

      if (hitsEl) hitsEl.textContent = '0';
      if (timerEl) timerEl.textContent = '30s';
      if (overlayEl) overlayEl.classList.remove('hidden');
      if (promptEl) promptEl.textContent = 'Aim Practice';
      if (subEl) subEl.textContent = 'Click targets as fast as possible in 30 seconds.';

      // Clear any existing target
      active = false;
      if (timerInterval) clearInterval(timerInterval);
      timerInterval = null;

      draw();
    },
    stop() {
      active = false;
      if (timerInterval) clearInterval(timerInterval);
      timerInterval = null;
      if (canvas) canvas.onclick = null;
    },
    pause() {
      if (timerInterval) clearInterval(timerInterval);
    },
    resume() {
      if (active) {
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(() => {
          if (!active) return;
          timeLeft--;
          const timerEl = safeGetId('aim-timer');
          if (timerEl) timerEl.textContent = timeLeft + 's';
          if (timeLeft <= 0) {
            endGame();
          }
        }, 1000);
      }
    },
    bind() {
      const resetBtn = safeGetId('aim-reset');
      const startBtn = safeGetId('aim-start-btn');
      const canvasEl = safeGetId('aim-canvas');

      if (resetBtn) resetBtn.onclick = () => initGame();
      if (startBtn) startBtn.onclick = () => initGame();
      if (canvasEl) canvasEl.onclick = (e) => handleCanvasClick(e);
    }
  });
})();

/* =================================================================
   8. REACTION TIME
   ================================================================= */
(function() {
  let state = 'idle'; // idle, waiting, clickMe, result
  let startTime = 0;
  let timerId = null;
  let bestTime = '---';

  function handleBoxClick() {
    const box = $_id('reaction-box');
    const prompt = $_id('reaction-prompt');
    const emoji = $_id('reaction-emoji');
    if (!box) return;

    if (state === 'idle' || state === 'result') {
      state = 'waiting';
      box.className = 'w-full h-80 rounded-2xl border border-white/10 bg-red-500/25 transition-colors flex flex-col items-center justify-center cursor-pointer select-none space-y-2';
      prompt.textContent = 'Wait for GREEN...';
      emoji.textContent = '🔴';
      
      const delay = 1500 + Math.random() * 3000;
      timerId = setTimeout(triggerGreen, delay);
    } else if (state === 'waiting') {
      // Too early click
      clearTimeout(timerId);
      state = 'result';
      box.className = 'w-full h-80 rounded-2xl border border-white/10 bg-yellow-500/20 transition-colors flex flex-col items-center justify-center cursor-pointer select-none space-y-2';
      prompt.textContent = 'Too Early! Click to restart.';
      emoji.textContent = '⚠️';
      if (typeof Sound !== 'undefined') Sound.lose();
    } else if (state === 'clickMe') {
      const diff = Date.now() - startTime;
      state = 'result';
      box.className = 'w-full h-80 rounded-2xl border border-white/10 bg-green-500/25 transition-colors flex flex-col items-center justify-center cursor-pointer select-none space-y-2';
      prompt.textContent = `${diff} ms! Click to restart.`;
      emoji.textContent = '⚡';
      
      $_id('reaction-last').textContent = diff + ' ms';
      
      if (bestTime === '---' || diff < bestTime) {
        bestTime = diff;
        $_id('reaction-best').textContent = bestTime + ' ms';
      }
      
      if (typeof Sound !== 'undefined') Sound.win();
      if (typeof Achievements !== 'undefined') {
        Achievements.check('reaction_fast', diff <= 250);
        Achievements.check('reaction_god', diff <= 180);
      }
      if (typeof Stats !== 'undefined') {
        Stats.recordGameResult('reaction', diff, diff <= 300);
      }
    }
  }

  function triggerGreen() {
    state = 'clickMe';
    startTime = Date.now();
    const box = $_id('reaction-box');
    const prompt = $_id('reaction-prompt');
    const emoji = $_id('reaction-emoji');
    if (!box) return;

    box.className = 'w-full h-80 rounded-2xl border border-green-500/50 bg-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.4)] flex flex-col items-center justify-center cursor-pointer select-none space-y-2';
    prompt.textContent = 'CLICK NOW!';
    emoji.textContent = '🟢';
    if (typeof Sound !== 'undefined') Sound.click();
  }

  App.registerGame('reaction', {
    start() {
      state = 'idle';
      bestTime = '---';
      $_id('reaction-best').textContent = '---';
      $_id('reaction-last').textContent = '---';
    },
    stop() {
      state = 'idle';
      if (timerId) clearTimeout(timerId);
    },
    bind() {
      $_id('reaction-box').onclick = () => handleBoxClick();
      $_id('reaction-reset').onclick = () => {
        state = 'idle';
        bestTime = '---';
        $_id('reaction-best').textContent = '---';
        $_id('reaction-last').textContent = '---';
        const box = $_id('reaction-box');
        if (box) {
          box.className = 'w-full h-80 rounded-2xl border border-white/10 bg-red-600/35 flex flex-col items-center justify-center cursor-pointer select-none space-y-2';
          $_id('reaction-prompt').textContent = 'Wait for Green';
          $_id('reaction-emoji').textContent = '🔴';
        }
      };
    }
  });
})();

/* =================================================================
   9. SUDOKU
   ================================================================= */
(function() {
  const puzzle = [
    5, 3, 0, 0, 7, 0, 0, 0, 0,
    6, 0, 0, 1, 9, 5, 0, 0, 0,
    0, 9, 8, 0, 0, 0, 0, 6, 0,
    8, 0, 0, 0, 6, 0, 0, 0, 3,
    4, 0, 0, 8, 0, 3, 0, 0, 1,
    7, 0, 0, 0, 2, 0, 0, 0, 6,
    0, 6, 0, 0, 0, 0, 2, 8, 0,
    0, 0, 0, 4, 1, 9, 0, 0, 5,
    0, 0, 0, 0, 8, 0, 0, 7, 9
  ];
  const solution = [
    5, 3, 4, 6, 7, 8, 9, 1, 2,
    6, 7, 2, 1, 9, 5, 3, 4, 8,
    1, 9, 8, 3, 4, 2, 5, 6, 7,
    8, 5, 9, 7, 6, 1, 4, 2, 3,
    4, 2, 6, 8, 5, 3, 7, 9, 1,
    7, 1, 3, 9, 2, 4, 8, 5, 6,
    9, 6, 1, 5, 3, 7, 2, 8, 4,
    2, 8, 7, 4, 1, 9, 6, 3, 5,
    3, 4, 5, 2, 8, 6, 1, 7, 9
  ];

  let board = [];
  let mistakes = 0;
  let active = false;
  let selectedIdx = null;

  function initSudoku() {
    board = [...puzzle];
    mistakes = 0;
    selectedIdx = null;
    $_id('sudoku-mistakes').textContent = '0/3';
    
    renderGrid();
    active = true;
  }

  function renderGrid() {
    const grid = $_id('sudoku-grid');
    if (!grid) return;
    grid.innerHTML = '';

    for (let i = 0; i < 81; i++) {
      const cell = document.createElement('div');
      const val = board[i];
      const isPreset = puzzle[i] !== 0;
      
      cell.className = 'w-full h-full flex items-center justify-center border font-display text-sm font-bold transition-all cursor-pointer select-none';
      
      // Calculate coordinates to draw 3x3 grids border
      const r = Math.floor(i / 9);
      const c = i % 9;
      let borders = 'border-white/5';
      if (r === 2 || r === 5) borders += ' border-b-white/30';
      if (c === 2 || c === 5) borders += ' border-r-white/30';
      cell.className += ' ' + borders;

      if (val > 0) {
        cell.textContent = val;
        if (isPreset) {
          cell.className += ' text-white font-black bg-white/5';
        } else {
          cell.className += ' text-[#00E5FF] bg-[#00E5FF]/5';
        }
      }

      if (selectedIdx === i) {
        cell.className += ' bg-[#00E5FF]/20 border-[#00E5FF]/60';
      }

      cell.onclick = () => {
        if (!active || isPreset) return;
        selectedIdx = i;
        renderGrid();
      };
      
      grid.appendChild(cell);
    }
  }

  function handleInput(num) {
    if (!active || selectedIdx === null) return;
    
    const correctVal = solution[selectedIdx];
    if (num === correctVal) {
      board[selectedIdx] = num;
      if (typeof Sound !== 'undefined') Sound.click();
      selectedIdx = null;
      renderGrid();
      checkWin();
    } else {
      mistakes++;
      $_id('sudoku-mistakes').textContent = mistakes + '/3';
      if (typeof Sound !== 'undefined') Sound.lose();
      
      if (mistakes >= 3) {
        active = false;
        if (typeof Stats !== 'undefined') Stats.recordGameResult('sudoku', 0, false);
        Toast.show('Mistake Threshold Reached!', 'error');
      } else {
        Toast.show('Incorrect Value!', 'error');
      }
    }
  }

  function checkWin() {
    if (board.every((v, i) => v === solution[i])) {
      active = false;
      if (typeof Sound !== 'undefined') Sound.win();
      if (typeof Stats !== 'undefined') Stats.recordGameResult('sudoku', 1, true);
      if (typeof Achievements !== 'undefined') Achievements.check('sudoku_win', true);
      Toast.show('Puzzle Solved!', 'success');
    }
  }

  App.registerGame('sudoku', {
    start() {
      initSudoku();
    },
    stop() {
      active = false;
      window.removeEventListener('keydown', handleSudokuKeydown);
    },
    bind() {
      $_id('sudoku-reset').onclick = () => initSudoku();

      window.addEventListener('keydown', handleSudokuKeydown);
    }
  });

function handleSudokuKeydown(e) {
  if (!active || selectedIdx === null) return;
  const num = parseInt(e.key);
  if (num >= 1 && num <= 9) {
    handleInput(num);
    e.preventDefault();
  }
}
})();

/* =================================================================
   10. FLAPPY BIRD
   ================================================================= */
(function() {
  let canvas, ctx;
  let active = false;
  let animId = null;

  let bird = { y: 150, vy: 0, r: 12 };
  let pipes = [];
  let score = 0;
  let frameCount = 0;
  const birdX = 80;

  function initGame() {
    bird.y = 150;
    bird.vy = 0;
    pipes = [];
    score = 0;
    frameCount = 0;
    
    $_id('flappy-score').textContent = 0;
    $_id('flappy-overlay').classList.add('hidden');
    
    if (typeof Stats !== 'undefined') {
      const best = Stats.data.perGame['flappy']?.bestScore || 0;
      $_id('flappy-highscore').textContent = best;
    }

    active = true;
    if (animId) cancelAnimationFrame(animId);
    animId = requestAnimationFrame(loop);
  }

  function loop() {
    if (!active) return;
    update();
    draw();
    animId = requestAnimationFrame(loop);
  }

  function update() {
    frameCount++;

    // Bird gravity physics
    bird.vy += 0.23;
    bird.y += bird.vy;

    // Canvas floor collision
    if (bird.y + bird.r >= canvas.height || bird.y - bird.r <= 0) {
      gameOver();
      return;
    }

    // Spawn pipes every 120 frames
    if (frameCount % 120 === 0) {
      const gap = 100;
      const minHeight = 40;
      const maxHeight = canvas.height - gap - minHeight;
      const topHeight = minHeight + Math.random() * (maxHeight - minHeight);
      
      pipes.push({
        x: canvas.width,
        top: topHeight,
        bottom: topHeight + gap,
        width: 45,
        passed: false
      });
    }

    // Move and filter pipes
    for (let i = pipes.length - 1; i >= 0; i--) {
      const p = pipes[i];
      p.x -= 2;

      // Collisions check
      if (bird.y - bird.r < p.top || bird.y + bird.r > p.bottom) {
        if (bird.x + bird.r > p.x && bird.x - bird.r < p.x + p.width) {
          gameOver();
          return;
        }
      }

      // Passed check
      if (!p.passed && p.x + p.width < birdX) {
        p.passed = true;
        score++;
        $_id('flappy-score').textContent = score;
        if (typeof Sound !== 'undefined') Sound.match();
      }

      // Remove offscreen
      if (p.x + p.width < 0) {
        pipes.splice(i, 1);
      }
    }
  }

  function draw() {
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw pipes
    pipes.forEach(p => {
      // Top pipe
      const topGrad = ctx.createLinearGradient(p.x, 0, p.x + p.width, 0);
      topGrad.addColorStop(0, '#FF4D9D');
      topGrad.addColorStop(1, '#7C3AED');
      ctx.fillStyle = topGrad;
      ctx.fillRect(p.x, 0, p.width, p.top);

      // Bottom pipe
      const bottomGrad = ctx.createLinearGradient(p.x, p.bottom, p.x + p.width, p.bottom);
      bottomGrad.addColorStop(0, '#FF4D9D');
      bottomGrad.addColorStop(1, '#7C3AED');
      ctx.fillStyle = bottomGrad;
      ctx.fillRect(p.x, p.bottom, p.width, canvas.height - p.bottom);
    });

    // Draw bird vector sphere
    ctx.fillStyle = '#00E5FF';
    ctx.shadowColor = '#00E5FF';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(birdX, bird.y, bird.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  function gameOver() {
    active = false;
    if (animId) cancelAnimationFrame(animId);
    
    if (typeof Sound !== 'undefined') Sound.lose();
    if (typeof Stats !== 'undefined') Stats.recordGameResult('flappy', score, score > 0);
    
    $_id('flappy-overlay').classList.remove('hidden');
    $_id('flappy-overlay').querySelector('h3').textContent = 'Game Over';
    $_id('flappy-overlay').querySelector('p').textContent = `Pipes Cleared: ${score}`;
    
    if (typeof Achievements !== 'undefined') {
      Achievements.check('flappy_bronze', score >= 10);
      Achievements.check('flappy_gold', score >= 30);
    }
  }

  function flap() {
    if (!active) return;
    bird.vy = -4.8;
    if (typeof Sound !== 'undefined') Sound.click();
  }

  App.registerGame('flappy', {
    start() {
      canvas = $_id('flappy-canvas');
      if (canvas) ctx = canvas.getContext('2d');
      draw();
    },
    stop() {
      active = false;
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleFlappyKeydown);
    },
    pause() {
      if (animId) cancelAnimationFrame(animId);
    },
    resume() {
      if (active) animId = requestAnimationFrame(loop);
    },
    bind() {
      $_id('flappy-reset').onclick = () => initGame();
      $_id('flappy-start-btn').onclick = () => initGame();

      canvas = $_id('flappy-canvas');
      if (canvas) {
        canvas.onclick = () => flap();
        canvas.ontouchstart = (e) => { flap(); e.preventDefault(); };
      }

      window.addEventListener('keydown', handleFlappyKeydown);
    }
  });

function handleFlappyKeydown(e) {
  if (!active) return;
  if (e.key === ' ' || e.key === 'ArrowUp') {
    flap();
    e.preventDefault();
  }
}
})();
