/* ---- Service Worker Cache Purge ---- */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => {
    for (const reg of regs) reg.unregister();
  });
  if (window.caches) {
    caches.keys().then(keys => {
      for (const key of keys) caches.delete(key);
    });
  }
}

/* ---- Utilities ---- */
const $ = (s, c) => (c || document).querySelector(s);
const $$ = (s, c) => [...(c || document).querySelectorAll(s)];
const $id = id => document.getElementById(id);
const rand = (mn, mx) => Math.floor(Math.random() * (mx - mn + 1)) + mn;
const clamp = (v, mn, mx) => Math.max(mn, Math.min(mx, v));

const LS = {
  get(k, def) { try { const d = localStorage.getItem('nah2_' + k); return d !== null ? JSON.parse(d) : def; } catch { return def; } },
  set(k, val) { try { localStorage.setItem('nah2_' + k, JSON.stringify(val)); } catch { } }
};

/* ---- Notifications System ---- */
const Notifications = {
  list: [],
  init() {
    this.list = LS.get('notifications', [
      { id: 1, msg: 'Welcome to GameVerse! Open the Command Palette (Ctrl+K) to quick navigate.', time: Date.now() }
    ]);
    this.updateUI();
  },
  add(msg) {
    this.list.unshift({ id: Date.now(), msg, time: Date.now() });
    if (this.list.length > 20) this.list.pop();
    LS.set('notifications', this.list);
    this.updateUI();
    const badge = $id('notif-badge');
    if (badge) badge.classList.remove('hidden');
  },
  clear() {
    this.list = [];
    LS.set('notifications', this.list);
    this.updateUI();
  },
  updateUI() {
    const listEl = $id('notif-list');
    if (!listEl) return;
    if (this.list.length === 0) {
      listEl.innerHTML = '<div class="p-3 text-xs text-white/40 text-center font-medium">No alerts logged</div>';
      return;
    }
    listEl.innerHTML = this.list.map(n => {
      const dt = new Date(n.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `<div class="p-3 text-xs flex justify-between gap-3 hover:bg-white/5 transition-all">
        <span class="text-white/80 font-medium">${n.msg}</span>
        <span class="text-[9px] text-white/30 whitespace-nowrap font-mono">${dt}</span>
      </div>`;
    }).join('');
  }
};

/* ---- Toast ---- */
const Toast = {
  show(msg, type) {
    const el = document.createElement('div');
    el.className = `pointer-events-auto px-4 py-3 rounded-xl text-sm font-semibold backdrop-blur-xl border ${type === 'achievement' ? 'bg-gradient-to-r from-[#FFD54A]/20 to-[#7C3AED]/20 border-[#FFD54A]/40 text-white' :
        type === 'error' ? 'bg-[#FF4D9D]/20 border-[#FF4D9D]/40 text-[#FF4D9D]' :
          type === 'success' ? 'bg-[#22C55E]/20 border-[#22C55E]/40 text-[#22C55E]' :
            'bg-white/10 border-white/20'
      } shadow-2xl animate-slide-in`;
    el.textContent = msg;
    const container = $id('toast-container');
    if (container) {
      container.appendChild(el);
      gsap.fromTo(el, { x: 150, opacity: 0 }, { x: 0, opacity: 1, duration: 0.35, ease: 'back.out(1.2)' });
      setTimeout(() => { gsap.to(el, { x: 150, opacity: 0, duration: 0.3, onComplete: () => el.remove() }); }, 3500);
    }
  }
};

/* ---- Confetti ---- */
function confetti(count) {
  if (LS.get('reduced_motion', true)) return;
  const colors = ['#00E5FF', '#7C3AED', '#FF4D9D', '#22C55E', '#FFD54A', '#fff'];
  for (let i = 0; i < (count || 45); i++) {
    const el = document.createElement('div');
    el.className = 'fixed pointer-events-none z-[9999]';
    const s = rand(6, 12);
    el.style.cssText = `width:${s}px;height:${s}px;left:${rand(0, 100)}%;top:-15px;background:${colors[rand(0, colors.length - 1)]};border-radius:${Math.random() > 0.5 ? '50%' : '2px'}`;
    document.body.appendChild(el);
    gsap.to(el, { y: window.innerHeight + 50, x: rand(-120, 120), rotation: rand(0, 720), duration: randF(1.6, 3.2), ease: 'power1.out', onComplete: () => el.remove() });
  }
}
function randF(mn, mx) { return Math.random() * (mx - mn) + mn; }

/* ---- Flying XP Particle Animation ---- */
const XpParticles = {
  spawn(amount, sourceEvent) {
    if (amount <= 0) return;

    // Determine start coordinate: cursor location or center viewport
    let sx = window.innerWidth / 2;
    let sy = window.innerHeight / 2;

    if (sourceEvent && sourceEvent.clientX !== undefined) {
      sx = sourceEvent.clientX;
      sy = sourceEvent.clientY;
    }

    // Find Target location (nav-player-avatar in navbar)
    const target = $id('profile-btn') || $id('nav-player-avatar');
    let tx = window.innerWidth - 60;
    let ty = 30;

    if (target) {
      const rect = target.getBoundingClientRect();
      tx = rect.left + rect.width / 2;
      ty = rect.top + rect.height / 2;
    }

    const count = Math.min(5, Math.max(2, Math.floor(amount / 50)));
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'xp-fly-item';
      p.textContent = `+${Math.round(amount / count)} XP`;

      const rx = (Math.random() - 0.5) * 80;
      const ry = (Math.random() - 0.5) * 80;
      p.style.left = `${sx + rx}px`;
      p.style.top = `${sy + ry}px`;
      p.style.setProperty('--target-path', `${tx - (sx + rx)}px, ${ty - (sy + ry)}px`);

      document.body.appendChild(p);

      // Delay particles slightly
      gsap.delayedCall(i * 0.12, () => {
        setTimeout(() => p.remove(), 1100);
      });
    }
  }
};

/* ---- Professional Sound Synthesizer ---- */
const Sound = {
  ctx: null, enabled: true, bgmPlaying: false,
  bgmVolume: 0.2, sfxVolume: 0.5, userInteracted: false,
  init() {
    this.enabled = LS.get('sound', true);
    this.bgmVolume = clamp(LS.get('bgmVolume', 0.2), 0, 1);
    this.sfxVolume = clamp(LS.get('sfxVolume', 0.5), 0, 1);

    $$('.sound-btn, #sound-btn').forEach(b => { if (b) b.textContent = this.enabled ? '🔊' : '🔇'; });
    this.updateSliderUI();
    const muteBtn = $id('sound-mute-btn');
    if (muteBtn) muteBtn.textContent = this.enabled ? 'Mute Synth' : 'Unmute Synth';

    const settingsToggle = $id('settings-audio-toggle');
    if (settingsToggle) settingsToggle.textContent = this.enabled ? 'Enabled' : 'Muted';
  },
  updateSliderUI() {
    const bgmInput = $id('bgm-volume');
    const sfxInput = $id('sfx-volume');
    const bgmVal = $id('bgm-value');
    const sfxVal = $id('sfx-value');
    const displayBgm = this.enabled ? this.bgmVolume : 0;
    const displaySfx = this.enabled ? this.sfxVolume : 0;
    if (bgmInput) bgmInput.value = Math.round(displayBgm * 100);
    if (sfxInput) sfxInput.value = Math.round(displaySfx * 100);
    if (bgmVal) bgmVal.textContent = Math.round(displayBgm * 100) + '%';
    if (sfxVal) sfxVal.textContent = Math.round(displaySfx * 100) + '%';
  },
  toggle() {
    this.enabled = !this.enabled;
    LS.set('sound', this.enabled);
    $$('.sound-btn, #sound-btn').forEach(b => { if (b) b.textContent = this.enabled ? '🔊' : '🔇'; });
    this.updateSliderUI();

    const muteBtn = $id('sound-mute-btn');
    if (muteBtn) muteBtn.textContent = this.enabled ? 'Mute Synth' : 'Unmute Synth';

    const settingsToggle = $id('settings-audio-toggle');
    if (settingsToggle) settingsToggle.textContent = this.enabled ? 'Enabled' : 'Muted';

    if (!this.enabled && this.bgmPlaying) this.stopBGM();
    else if (this.enabled && !this.bgmPlaying) this.startBGM();

    if (this.enabled) {
      Achievements.check('unmute_all');
    } else {
      Achievements.check('mute_all');
    }
  },
  _play(f, d, t, v) {
    if (!this.enabled || !this.userInteracted) return;
    try {
      if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => { });
      }
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = t || 'sine';
      o.frequency.setValueAtTime(f, this.ctx.currentTime);

      const multiplier = (t === 'triangle' || f < 300) ? this.bgmVolume : this.sfxVolume;
      g.gain.setValueAtTime((v || 0.05) * multiplier, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + d);
      o.connect(g); g.connect(this.ctx.destination);
      o.start(); o.stop(this.ctx.currentTime + d);
    } catch { }
  },
  click() { this._play(550, 0.07, 'sine', 0.08); },
  hover() { this._play(850, 0.03, 'sine', 0.02); },
  win() {
    this._play(440, 0.12, 'triangle', 0.06);
    setTimeout(() => this._play(554, 0.12, 'triangle', 0.06), 90);
    setTimeout(() => this._play(659, 0.22, 'triangle', 0.08), 180);
  },
  lose() {
    this._play(290, 0.25, 'sawtooth', 0.05);
    setTimeout(() => this._play(220, 0.35, 'sawtooth', 0.05), 120);
  },
  select() { this._play(494, 0.06, 'sine', 0.05); },
  reveal() { this._play(784, 0.06, 'triangle', 0.05); },
  tick() { this._play(1200, 0.02, 'sine', 0.02); },
  match() { this._play(660, 0.08, 'sine', 0.06); },
  levelUp() {
    const notes = [261.6, 329.6, 392.0, 523.3, 659.3, 784.0];
    notes.forEach((n, i) => {
      setTimeout(() => this._play(n, 0.15, 'sine', 0.06), i * 90);
    });
  },
  jackpot() {
    const notes = [523, 659, 784, 1047, 1318, 1568];
    notes.forEach((n, idx) => {
      setTimeout(() => this._play(n, 0.18, 'sine', 0.07), idx * 80);
    });
  },
  spinSound() { this._play(220, 0.06, 'triangle', 0.03); },
  startBGM() {
    if (!this.enabled || this.bgmPlaying || !this.userInteracted) return;
    try {
      if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => { });
      }

      // Cyber chords: Am, F, C, G slow pad sweep
      const chordProgression = [
        [220, 261.6, 329.6], // Am
        [174.6, 220, 261.6], // F
        [261.6, 329.6, 392], // C
        [196, 246.9, 293.7]  // G
      ];
      let bar = 0;

      const playChords = () => {
        if (!this.enabled || !this.bgmPlaying) return;
        const notes = chordProgression[bar % chordProgression.length];

        // play soft synth pad triad
        notes.forEach(f => {
          this._play(f, 4.0, 'sine', 0.012);
        });

        bar++;
        this._bgmTimer = setTimeout(playChords, 5000);
      };

      this.bgmPlaying = true;
      playChords();
    } catch { }
  },
  stopBGM() { this.bgmPlaying = false; if (this._bgmTimer) { clearTimeout(this._bgmTimer); this._bgmTimer = null; } }
};

/* ---- XP / Level / Coins System ---- */
const XP = {
  data: null,
  init() {
    this.data = LS.get('xp_system', { xp: 500, lifetimeXp: 500, level: 1, history: [], coins: 150 });
    if (this.data.coins === undefined) this.data.coins = 150;
    if (this.data.lifetimeXp === undefined) this.data.lifetimeXp = this.data.xp || 500;
    if (!this.data.history) this.data.history = [];
    this.updateUI();
  },
  getLevel(lifetimeXp) {
    return Math.floor(Math.sqrt((lifetimeXp || 0) / 10)) + 1;
  },
  getProgress() {
    const cur = this.data.lifetimeXp || 0;
    const lvl = this.getLevel(cur);
    const curLvlXp = (lvl - 1) ** 2 * 10;
    const nextLvlXp = lvl ** 2 * 10;
    return { level: lvl, current: cur - curLvlXp, needed: nextLvlXp - curLvlXp, total: cur };
  },
  addXP(amount, event) {
    if (amount <= 0) return;
    const oldLvl = this.getLevel(this.data.lifetimeXp || 0);
    this.data.xp += amount;
    this.data.lifetimeXp = (this.data.lifetimeXp || 0) + amount;
    this.data.history.push({ amount, date: Date.now() });

    // Stats updates
    Stats.data.totalXpEarned = (Stats.data.totalXpEarned || 0) + amount;
    Stats.data.highestXpBalance = Math.max(Stats.data.highestXpBalance || 500, this.data.xp);
    Stats.save();

    this.save();
    XpParticles.spawn(amount, event);

    // Check level up
    const newLvl = this.getLevel(this.data.lifetimeXp);
    if (newLvl > oldLvl) {
      Sound.levelUp();
      const modal = $id('levelup-modal');
      const text = $id('levelup-text');
      if (modal && text) {
        text.textContent = `Level ${newLvl}`;
        modal.classList.remove('hidden');
        gsap.fromTo('#levelup-modal > div', { scale: 0.3, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.5)' });
      }
      confetti(60);
      Notifications.add(`Level Up! You reached Level ${newLvl}.`);

      // achievements checks
      Achievements.check('lvl_5', newLvl >= 5);
      Achievements.check('lvl_10', newLvl >= 10);
      Achievements.check('lvl_25', newLvl >= 25);
      Achievements.check('lvl_50', newLvl >= 50);
    }

    // Check XP achievements
    Achievements.check('xp_5k', this.data.lifetimeXp >= 5000);
    Achievements.check('xp_10k', this.data.lifetimeXp >= 10000);
    Achievements.check('xp_25k', this.data.lifetimeXp >= 25000);
    Achievements.check('xp_50k', this.data.lifetimeXp >= 50000);
    Achievements.check('xp_100k', this.data.lifetimeXp >= 100000);

    Toast.show(`+${amount} XP`, 'success');
    this.updateUI();
  },
  subtractXP(amount) {
    if (amount <= 0) return;
    this.data.xp = Math.max(0, this.data.xp - amount);
    this.data.history.push({ amount: -amount, date: Date.now() });

    Stats.data.totalXpSpent = (Stats.data.totalXpSpent || 0) + amount;
    Stats.save();
    this.save();

    this.updateUI();
    Toast.show(`-${amount} XP`, 'error');
  },
  addCoins(amount) {
    if (amount <= 0) return;
    this.data.coins += amount;
    this.save();
    this.updateUI();
    Toast.show(`+${amount} Coins 🪙`, 'success');

    // coins achievements
    Achievements.check('coins_1k', this.data.coins >= 1000);
    Achievements.check('coins_5k', this.data.coins >= 5000);
  },
  spendCoins(amount) {
    if (this.data.coins >= amount) {
      this.data.coins -= amount;
      this.save();
      this.updateUI();
      return true;
    }
    return false;
  },
  save() { LS.set('xp_system', this.data); },
  updateUI() {
    const p = this.getProgress();
    const pct = p.needed > 0 ? Math.round(p.current / p.needed * 100) : 100;

    // Profile updates
    const el = $id('profile-xp-bar'); if (el) el.style.width = pct + '%';
    const t1 = $id('profile-xp-text'); if (t1) t1.textContent = p.total + ' XP';
    const t2 = $id('profile-next-level'); if (t2) t2.textContent = `Level ${p.level + 1}`;
    const lvl = $id('profile-level'); if (lvl) lvl.textContent = `Level ${p.level}`;

    // Navbar dropdown
    const dropLvl = $id('dropdown-level'); if (dropLvl) dropLvl.textContent = `Level ${p.level}`;
    const dropCoins = $id('dropdown-coins'); if (dropCoins) dropCoins.textContent = `${this.data.coins} 🪙`;
    const dropXp = $id('dropdown-xp'); if (dropXp) dropXp.textContent = `${this.data.xp} XP`;
    const profCoins = $id('profile-coins'); if (profCoins) profCoins.textContent = this.data.coins;

    // Home Stats Widget
    const hxp = $id('home-stat-xp'); if (hxp) hxp.textContent = this.data.xp.toLocaleString() + ' XP';

    // Update active betting balances
    $$('.current-xp-val').forEach(valEl => {
      valEl.textContent = this.data.xp.toLocaleString() + ' XP';
    });
  }
};

/* ---- Achievement System (81 Achievements) ---- */
const Achievements = {
  un: null,
  LIST: [
    { id: 'first_play', name: 'First Game Launch', desc: 'Play your first game', icon: '🎮', rarity: 'common', xp: 50 },
    { id: 'first_win', name: 'First Victory', desc: 'Win your first game', icon: '🏆', rarity: 'common', xp: 100 },
    { id: 'play_5', name: '5 Games Played', desc: 'Play 5 total games', icon: '👾', rarity: 'common', xp: 150 },
    { id: 'play_10', name: '10 Games Played', desc: 'Play 10 total games', icon: '🕹️', rarity: 'rare', xp: 300 },
    { id: 'xp_100', name: '100 XP Earned', desc: 'Earn 100 total XP', icon: '⚡', rarity: 'common', xp: 50 },
    { id: 'snake_beginner', name: 'Snake Beginner', desc: 'Score 10+ points in Snake', icon: '🐍', rarity: 'common', xp: 100 },
    { id: 'snake_master', name: 'Snake Master', desc: 'Score 50+ points in Snake', icon: '🐉', rarity: 'epic', xp: 500 },
    { id: 'tictactoe_win', name: 'Tic Tac Toe Winner', desc: 'Defeat the CPU in Tic Tac Toe', icon: '❌', rarity: 'common', xp: 100 },
    { id: '2048_starter', name: '2048 Starter', desc: 'Merge tiles to 256 in 2048', icon: '🔢', rarity: 'rare', xp: 200 },
    { id: '2048_master', name: '2048 Master', desc: 'Merge tiles to 2048 in 2048', icon: '👑', rarity: 'legendary', xp: 500 },
    { id: 'minesweeper_win', name: 'Minesweeper Survivor', desc: 'Clear the Minesweeper field', icon: '💣', rarity: 'epic', xp: 300 },
    { id: 'aim_rookie', name: 'Aim Trainer Rookie', desc: 'Hit 20+ targets in Aim Trainer', icon: '🎯', rarity: 'rare', xp: 150 },
    { id: 'aim_master', name: 'Aim Trainer Master', desc: 'Hit 40+ targets in Aim Trainer', icon: '🎯', rarity: 'epic', xp: 300 },
    { id: 'reaction_fast', name: 'Fast Reaction', desc: 'Get reaction time below 250ms', icon: '⚡', rarity: 'rare', xp: 200 },
    { id: 'reaction_god', name: 'Reaction God', desc: 'Get reaction time below 180ms', icon: '⚡', rarity: 'legendary', xp: 500 },
    { id: 'pong_win', name: 'Pong Champion', desc: 'Defeat the CPU in Pong', icon: '🏓', rarity: 'rare', xp: 150 },
    { id: 'memory_win', name: 'Memory Match Complete', desc: 'Complete Memory Match', icon: '🃏', rarity: 'common', xp: 100 },
    { id: 'sudoku_win', name: 'Sudoku Solver', desc: 'Solve a Sudoku puzzle', icon: '🧩', rarity: 'epic', xp: 400 },
    { id: 'flappy_bronze', name: 'Flappy Cadet', desc: 'Score 10+ points in Flappy Bird', icon: '🥉', rarity: 'common', xp: 100 },
    { id: 'flappy_gold', name: 'Flappy Legend', desc: 'Score 30+ points in Flappy Bird', icon: '🥇', rarity: 'legendary', xp: 600 },
    { id: 'unmute_all', name: 'Audio Optimizer', desc: 'Configure sound settings', icon: '🔊', rarity: 'common', xp: 50 },
    { id: 'mute_all', name: 'Silent Protocol', desc: 'Silence the sound effects', icon: '🔇', rarity: 'common', xp: 50 },
    { id: 'lvl_5', name: 'Elite Cadet', desc: 'Reach level 5', icon: '🏅', rarity: 'common', xp: 100 },
    { id: 'lvl_10', name: 'Squad Commander', desc: 'Reach level 10', icon: '🎖️', rarity: 'rare', xp: 200 },
    { id: 'lvl_25', name: 'System Veteran', desc: 'Reach level 25', icon: '👑', rarity: 'epic', xp: 500 },
    { id: 'lvl_50', name: 'Ascended Entity', desc: 'Reach level 50', icon: '🌟', rarity: 'legendary', xp: 1000 },
    { id: 'xp_5k', name: 'XP Collector', desc: 'Amass 5,000 lifetime XP', icon: '⚡', rarity: 'common', xp: 100 },
    { id: 'xp_10k', name: 'XP Specialist', desc: 'Amass 10,000 lifetime XP', icon: '💎', rarity: 'rare', xp: 200 },
    { id: 'xp_25k', name: 'XP Millionaire', desc: 'Amass 25,000 lifetime XP', icon: '👑', rarity: 'epic', xp: 500 },
    { id: 'xp_50k', name: 'XP Overlord', desc: 'Amass 50,000 lifetime XP', icon: '🌟', rarity: 'legendary', xp: 1000 },
    { id: 'xp_100k', name: 'Platform Deity', desc: 'Amass 100,000 lifetime XP', icon: '🌌', rarity: 'secret', xp: 2000 },
    { id: 'coins_1k', name: 'Coin Collector', desc: 'Collect 1,000 shop coins', icon: '🪙', rarity: 'rare', xp: 150 },
    { id: 'coins_5k', name: 'Store Broker', desc: 'Collect 5,000 shop coins', icon: '💰', rarity: 'epic', xp: 300 },
    { id: 'daily_3', name: 'Daily Runner', desc: 'Complete 3 daily challenges', icon: '📅', rarity: 'common', xp: 100 },
    { id: 'weekly_3', name: 'Weekly Champion', desc: 'Complete 3 weekly challenges', icon: '🏆', rarity: 'rare', xp: 300 },
    { id: 'theme_unlock', name: 'Color Customizer', desc: 'Unlock a theme', icon: '🎨', rarity: 'common', xp: 50 },
    { id: 'theme_all', name: 'Theme Collector', desc: 'Unlock 8 total themes', icon: '🎭', rarity: 'epic', xp: 400 },
    { id: 'time_10m', name: 'Active Session', desc: 'Play for 10 minutes', icon: '⏱️', rarity: 'common', xp: 50 },
    { id: 'time_30m', name: 'Dedicated Player', desc: 'Play for 30 minutes', icon: '🕰️', rarity: 'rare', xp: 100 },
    { id: 'time_1h', name: 'Dedicated Pilot', desc: 'Play for 1 hour', icon: '⏳', rarity: 'epic', xp: 250 },
    { id: 'time_2h', name: 'Deep Space Entity', desc: 'Play for 2 hours', icon: '🌀', rarity: 'legendary', xp: 500 },
    { id: 'streak_2', name: 'Double Combo', desc: 'Achieve a 2 win streak', icon: '🔥', rarity: 'common', xp: 50 },
    { id: 'streak_3', name: 'Triple Threat', desc: 'Achieve a 3 win streak', icon: '⚡', rarity: 'rare', xp: 100 },
    { id: 'streak_5', name: 'Unstoppable Player', desc: 'Achieve a 5 win streak', icon: '💥', rarity: 'epic', xp: 250 },
    { id: 'streak_10', name: 'Absolute Entity', desc: 'Achieve a 10 win streak', icon: '🌟', rarity: 'legendary', xp: 500 },
    { id: 'spin_1', name: 'First Spin', desc: 'Spin the Daily Wheel once', icon: '🎡', rarity: 'common', xp: 50 },
    { id: 'spin_10', name: 'Wheel Veteran', desc: 'Spin the Daily Wheel 10 times', icon: '🌀', rarity: 'rare', xp: 200 },
    { id: 'chest_1', name: 'First Chest', desc: 'Open a Mystery Chest once', icon: '📦', rarity: 'common', xp: 50 },
    { id: 'chest_10', name: 'Vault Raider', desc: 'Open 10 Mystery Chests', icon: '💼', rarity: 'rare', xp: 200 },
    { id: 'mystery_chest_5', name: 'Chest Enthusiast', desc: 'Open 5 Mystery Chests', icon: '🧳', rarity: 'common', xp: 100 },
    { id: 'search_command', name: 'Terminal Operator', desc: 'Execute a command via keyboard palette', icon: '⌨️', rarity: 'common', xp: 50 },
    { id: 'fav_3', name: 'Curator', desc: 'Favorite 3 total games', icon: '❤️', rarity: 'common', xp: 50 },
    { id: 'reduced_motion_lock', name: 'Reduced Motion', desc: 'Enable reduced motion protocol', icon: '🛡️', rarity: 'common', xp: 50 },
    { id: 'lang_preset', name: 'Universal Translator', desc: 'Change interface language', icon: '🌐', rarity: 'common', xp: 50 },
    { id: 'avatar_pres_alien', name: 'Alien Identity', desc: 'Equip the Alien profile avatar', icon: '👽', rarity: 'secret', xp: 100 },
    { id: 'avatar_pres_robot', name: 'Robot Identity', desc: 'Equip the Robot profile avatar', icon: '🤖', rarity: 'secret', xp: 100 },
    { id: 'avatar_click_secret', name: 'Nose Boop', desc: 'Discover a profile avatar easter egg', icon: '👃', rarity: 'secret', xp: 100 },
    { id: 'secret_konami', name: 'Konami Code', desc: 'Unlock developer cheat codes', icon: '👾', rarity: 'secret', xp: 500 }
  ],
  init() { this.un = LS.get('achievements_trophies', []); this.render(); },
  check(id, cond) {
    if (cond !== undefined && !cond) return;
    if (this.un.includes(id)) return;
    const a = this.LIST.find(x => x.id === id);
    if (!a) return;
    this.un.push(id);
    LS.set('achievements_trophies', this.un);

    Toast.show(`🏆 Trophy Unlocked: ${a.name}`, 'achievement');
    Notifications.add(`Unlocked trophy badge: ${a.name} (${a.desc}).`);
    confetti(35);
    XP.addXP(a.xp);
    this.render();
  },
  isUnlocked(id) { return this.un.includes(id); },
  getAll() { return this.LIST.map(a => ({ ...a, unlocked: this.un.includes(a.id) })); },
  getCount() { return this.un.length; },
  render() {
    const unlocked = this.getCount();
    const total = this.LIST.length;
    const bar = $id('achieve-bar'); if (bar) bar.style.width = (total > 0 ? (unlocked / total * 100) : 0) + '%';
    const txt = $id('achieve-progress-text'); if (txt) txt.textContent = `${unlocked}/${total}`;

    const grid = $id('achieve-grid');
    if (!grid) return;
    const filter = $('.achieve-filter.active')?.dataset?.filter || 'all';
    const all = this.getAll();
    const filtered = filter === 'all' ? all : all.filter(a => a.rarity === filter || a.cat === filter);
    grid.innerHTML = filtered.map(a => `
      <div class="achievement-row ${a.unlocked ? '' : 'locked'}">
        <span class="text-3xl p-2 bg-white/5 border border-white/10 rounded-lg select-none">${a.icon}</span>
        <div class="min-w-0 flex-1">
          <div class="text-sm font-bold text-white font-display truncate">${a.name}</div>
          <div class="text-[10px] text-white/50 leading-tight">${a.desc}</div>
        </div>
        <div class="text-right">
          <span class="text-[9px] font-extrabold uppercase ${a.rarity === 'legendary' ? 'text-[#FFD54A]' :
        a.rarity === 'epic' ? 'text-[#FF4D9D]' :
          a.rarity === 'rare' ? 'text-[#00E5FF]' :
            a.rarity === 'secret' ? 'text-red-400' : 'text-white/40'
      }">${a.rarity}</span>
          <div class="text-[8px] text-white/30 font-bold font-mono">+${a.xp} XP</div>
        </div>
      </div>
    `).join('');
  }
};

/* ---- Missions (Daily + Weekly) ---- */
const Missions = {
  daily: [], weekly: [], completedDaily: [], completedWeekly: [],
  init() {
    this.completedDaily = LS.get('daily_done', []);
    this.completedWeekly = LS.get('weekly_done', []);
    this.generate();
  },
  generate() {
    const seed = Math.floor(Date.now() / 86400000);
    const wSeed = Math.floor(Date.now() / 604800000);
    const dailies = [
      { id: 'd_play', name: 'Play 3 Games', desc: 'Simulate any 3 games in the Store', icon: '🎮', xp: 50, check: () => Stats.data.gamesPlayed >= 3 },
      { id: 'd_win', name: 'Win 1 Game', desc: 'Achieve a multiplier win >= 1.0x', icon: '🏆', xp: 75, check: () => Stats.data.wins >= 1 },
      { id: 'd_bet', name: 'High Stake', desc: 'Place a single wager of 500 XP or more', icon: '💎', xp: 100, check: () => Stats.data.biggestBet >= 500 },
      { id: 'd_spin', name: 'Spin Daily Wheel', desc: 'Initiate a daily spin rotation', icon: '🎡', xp: 50, check: () => Stats.data.wheelSpins >= 1 },
      { id: 'd_chest', name: 'Open Cargo Chest', desc: 'Harvest mystery chest container once', icon: '📦', xp: 50, check: () => Stats.data.chestsOpened >= 1 },
    ];
    const weeklys = [
      { id: 'w_win10', name: 'Win 10 Games', desc: 'Complete 10 total victories', icon: '🏆', xp: 500, check: () => Stats.data.wins >= 10 },
      { id: 'w_play25', name: 'Simulate 25 Matches', desc: 'Launch games 25 times', icon: '🎮', xp: 400, check: () => Stats.data.gamesPlayed >= 25 },
      { id: 'w_achieve5', name: 'Unlock 5 Badges', desc: 'Unlock 5 visual trophies', icon: '🏆', xp: 600, check: () => Achievements.getCount() >= 5 },
    ];
    this.daily = [dailies[seed % dailies.length], dailies[(seed + 1) % dailies.length], dailies[(seed + 2) % dailies.length]];
    this.weekly = [weeklys[wSeed % weeklys.length], weeklys[(wSeed + 1) % weeklys.length]];
    this.render();
  },
  render() {
    const dc = $id('daily-card'); if (dc) {
      const m = this.daily[0];
      $id('daily-icon').textContent = m.icon;
      $id('daily-title').textContent = m.name;
      $id('daily-desc').textContent = m.desc;
      $id('daily-xp').textContent = `+${m.xp} XP`;
    }
    const wc = $id('weekly-card'); if (wc) {
      const m = this.weekly[0];
      $id('weekly-icon').textContent = m.icon;
      $id('weekly-title').textContent = m.name;
      $id('weekly-desc').textContent = m.desc;
      $id('weekly-xp').textContent = `+${m.xp} XP`;
    }
    const h = Math.floor((24 - new Date().getHours()) % 24);
    const dailyTimer = $id('daily-reset'); if (dailyTimer) dailyTimer.textContent = `Resets in ${h}h`;
    const weeklyTimer = $id('weekly-reset'); if (weeklyTimer) weeklyTimer.textContent = `Resets in ${7 - new Date().getDay()}d`;
  },
  completeDaily(id) {
    if (this.completedDaily.includes(id)) return;
    this.completedDaily.push(id); LS.set('daily_done', this.completedDaily);
    const m = this.daily.find(d => d.id === id);
    if (m) {
      XP.addXP(m.xp);
      XP.addCoins(50);
      Toast.show(`✅ Daily Mission Complete: ${m.name}`, 'success');
      Achievements.check('daily_3', this.completedDaily.length >= 3);
    }
  },
  completeWeekly(id) {
    if (this.completedWeekly.includes(id)) return;
    this.completedWeekly.push(id); LS.set('weekly_done', this.completedWeekly);
    const m = this.weekly.find(w => w.id === id);
    if (m) {
      XP.addXP(m.xp);
      XP.addCoins(250);
      Toast.show(`✅ Weekly Campaign Complete: ${m.name}`, 'success');
      Achievements.check('weekly_3', this.completedWeekly.length >= 3);
    }
  },
  checkDailyProgress() {
    this.daily.forEach(m => { if (m.check() && !this.completedDaily.includes(m.id)) this.completeDaily(m.id); });
    this.weekly.forEach(m => { if (m.check() && !this.completedWeekly.includes(m.id)) this.completeWeekly(m.id); });
    if (Nav.current === 'challenges') ChallengesPage.render();
  }
};

/* ---- Virtual Currency Shop ---- */
const Shop = {
  items: [
    { id: 'galaxy', name: 'Galaxy Cosmic', cost: 100, icon: '🌌' },
    { id: 'synthwave', name: 'Synthwave Dusk', cost: 150, icon: '🌴' },
    { id: 'emerald', name: 'Emerald Core', cost: 200, icon: '💚' },
    { id: 'inferno', name: 'Inferno Fury', cost: 250, icon: '🔥' },
    { id: 'ice', name: 'Ice Crystal', cost: 300, icon: '❄️' },
    { id: 'purplestorm', name: 'Purple Storm', cost: 350, icon: '⛈️' },
    { id: 'goldelite', name: 'Gold Elite', cost: 500, icon: '👑' }
  ],
  render() {
    const grid = $id('shop-themes-grid');
    if (!grid) return;
    const unlocked = LS.get('themes_purchased', ['neon']);

    grid.innerHTML = this.items.map(item => {
      const isUnlocked = unlocked.includes(item.id);
      return `
        <div class="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-between text-center relative overflow-hidden group">
          <span class="text-3xl mb-2">${item.icon}</span>
          <div class="text-xs font-bold font-display">${item.name}</div>
          <div class="text-[10px] text-[#FFD54A] mt-1 font-bold font-mono">${item.cost} Coins 🪙</div>
          ${isUnlocked ?
          `<span class="mt-3 px-3 py-1 bg-green-500/20 text-green-400 font-bold text-[10px] rounded-lg w-full">Owned</span>` :
          `<button class="buy-theme-btn mt-3 px-3 py-1 bg-[#00E5FF] hover:bg-[#00F5FF] text-black font-extrabold text-[10px] rounded-lg w-full transition-all" data-id="${item.id}" data-cost="${item.cost}">Buy</button>`
        }
        </div>
      `;
    }).join('');

    grid.querySelectorAll('.buy-theme-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.id;
        const cost = parseInt(btn.dataset.cost);
        if (XP.data.coins >= cost) {
          XP.spendCoins(cost);
          const unlocked = LS.get('themes_purchased', ['neon']);
          unlocked.push(id);
          LS.set('themes_purchased', unlocked);
          Toast.show(`Unlocked theme: ${id}!`, 'success');
          Notifications.add(`Purchased theme: ${id} from store.`);

          Achievements.check('theme_unlock');
          Achievements.check('theme_all', unlocked.length >= 8);

          this.render();
          Themes.renderModal();
        } else {
          Toast.show('Insufficient Coins! Complete more daily challenges.', 'error');
        }
      };
    });
  }
};

/* ---- Challenges Page Render ---- */
const ChallengesPage = {
  render() {
    const dailyGrid = $id('daily-missions-list');
    const weeklyGrid = $id('weekly-missions-list');
    if (!dailyGrid || !weeklyGrid) return;

    const completedDaily = LS.get('daily_done', []);
    const completedWeekly = LS.get('weekly_done', []);

    $id('challenge-daily-timer').textContent = `Resets in ${Math.floor((24 - new Date().getHours()) % 24)}h`;
    $id('challenge-weekly-timer').textContent = `Resets in ${7 - new Date().getDay()}d`;

    dailyGrid.innerHTML = Missions.daily.map(m => {
      const isCompleted = completedDaily.includes(m.id) || m.check();

      return `
        <div class="glass-card p-4 rounded-xl border border-white/5 space-y-3">
          <div class="flex items-center gap-3">
            <span class="text-2xl">${m.icon}</span>
            <div class="flex-1 min-w-0">
              <h4 class="font-bold text-xs truncate text-white font-display">${m.name}</h4>
              <p class="text-[10px] text-white/50 truncate font-medium">${m.desc}</p>
            </div>
            <div class="text-right whitespace-nowrap">
              <span class="text-[10px] text-[#FFD54A] font-bold">+50 Coins</span>
              <div class="text-[9px] text-white/40 font-mono">+${m.xp} XP</div>
            </div>
          </div>
          
          <div class="flex items-center gap-3 pt-2 border-t border-white/5">
            <div class="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div class="h-full bg-[#00E5FF] rounded-full" style="width: ${isCompleted ? '100%' : '33%'}"></div>
            </div>
            ${isCompleted ?
          `<span class="text-[10px] text-[#22C55E] font-bold uppercase font-display">Completed</span>` :
          `<span class="text-[10px] text-white/30 font-bold font-display">In Progress</span>`
        }
          </div>
        </div>
      `;
    }).join('');

    weeklyGrid.innerHTML = Missions.weekly.map(m => {
      const isCompleted = completedWeekly.includes(m.id) || m.check();

      return `
        <div class="glass-card p-4 rounded-xl border border-white/5 space-y-3">
          <div class="flex items-center gap-3">
            <span class="text-2xl">${m.icon}</span>
            <div class="flex-1 min-w-0">
              <h4 class="font-bold text-xs truncate text-white font-display">${m.name}</h4>
              <p class="text-[10px] text-white/50 truncate font-medium">${m.desc}</p>
            </div>
            <div class="text-right whitespace-nowrap">
              <span class="text-[10px] text-[#FFD54A] font-bold">+250 Coins</span>
              <div class="text-[9px] text-[#FF4D9D] font-bold font-mono">+${m.xp} XP</div>
            </div>
          </div>
          
          <div class="flex items-center gap-3 pt-2 border-t border-white/5">
            <div class="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div class="h-full bg-[#FF4D9D] rounded-full" style="width: ${isCompleted ? '100%' : '10%'}"></div>
            </div>
            ${isCompleted ?
          `<span class="text-[10px] text-[#22C55E] font-bold uppercase font-display">Completed</span>` :
          `<span class="text-[10px] text-white/30 font-bold font-display">In Progress</span>`
        }
          </div>
        </div>
      `;
    }).join('');

    DailySpinWheel.draw();
  }
};

/* ---- Stats Tracking & Local Analytics ---- */
const Stats = {
  data: null,
  init() {
    this.data = LS.get('stats_analytics', {
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      highestWin: 0,
      highestXpBalance: 500,
      longestWinStreak: 0,
      currentWinStreak: 0,
      biggestBet: 0,
      totalXpEarned: 0,
      totalXpSpent: 0,
      wheelSpins: 0,
      chestsOpened: 0,
      timeSpent: 0,
      firstSession: Date.now(),
      lastSession: Date.now(),
      perGame: {}
    });

    // Playtime accumulator
    setInterval(() => {
      this.data.timeSpent += 5;
      this.data.lastSession = Date.now();

      const mins = this.data.timeSpent / 60;
      Achievements.check('time_10m', mins >= 10);
      Achievements.check('time_30m', mins >= 30);
      Achievements.check('time_1h', mins >= 60);
      Achievements.check('time_2h', mins >= 120);

      if (Math.random() < 0.05) this.save();
    }, 5000);

    this.updateUI();
  },
  save() { LS.set('stats_analytics', this.data); },
  recordGameResult(gameId, score, won) {
    this.data.gamesPlayed++;
    if (!this.data.perGame[gameId]) this.data.perGame[gameId] = { played: 0, wins: 0, bestScore: 0 };
    this.data.perGame[gameId].played++;

    if (won) {
      this.data.wins++;
      this.data.perGame[gameId].wins++;
    } else {
      this.data.losses++;
    }

    // Update best score logic
    if (gameId === 'reaction') {
      if (won) {
        const best = this.data.perGame[gameId].bestScore;
        if (best === 0 || score < best) {
          this.data.perGame[gameId].bestScore = score;
        }
      }
    } else if (gameId === 'minesweeper' || gameId === 'memory') {
      if (won) {
        const best = this.data.perGame[gameId].bestScore;
        if (best === 0 || score < best) {
          this.data.perGame[gameId].bestScore = score;
        }
      }
    } else {
      this.data.perGame[gameId].bestScore = Math.max(this.data.perGame[gameId].bestScore || 0, score);
    }

    // Reward calculations (XP and Coins)
    let xpReward = 0;
    let coinReward = 0;
    
    if (gameId === 'tictactoe') {
      if (won) { xpReward = 100; coinReward = 30; }
      else { xpReward = 20; coinReward = 10; }
    } else if (gameId === 'snake') {
      xpReward = score * 4 + 20;
      coinReward = Math.floor(score / 2) + 10;
    } else if (gameId === '2048') {
      xpReward = Math.floor(score / 8) + 20;
      coinReward = Math.floor(score / 40) + 10;
    } else if (gameId === 'minesweeper') {
      if (won) { xpReward = 250; coinReward = 80; }
      else { xpReward = 30; coinReward = 15; }
    } else if (gameId === 'pong') {
      if (won) { xpReward = 120; coinReward = 40; }
      else { xpReward = 20; coinReward = 10; }
    } else if (gameId === 'memory') {
      const bonus = Math.max(5, 30 - score);
      xpReward = bonus * 5 + 50;
      coinReward = bonus * 2 + 15;
    } else if (gameId === 'aim') {
      xpReward = score * 6 + 20;
      coinReward = Math.floor(score / 2) + 10;
    } else if (gameId === 'reaction') {
      if (won) {
        const bonus = Math.max(10, Math.floor((500 - score) / 10));
        xpReward = bonus * 5 + 50;
        coinReward = bonus * 2 + 15;
      } else {
        xpReward = 15;
        coinReward = 5;
      }
    } else if (gameId === 'sudoku') {
      if (won) { xpReward = 300; coinReward = 100; }
      else { xpReward = 30; coinReward = 15; }
    } else if (gameId === 'flappy') {
      xpReward = score * 8 + 20;
      coinReward = score * 2 + 10;
    }

    XP.addXP(xpReward);
    XP.addCoins(coinReward);

    // Achievements checks
    Achievements.check(`play_${gameId}`, this.data.perGame[gameId].played >= 5);
    if (won) {
      Achievements.check(`win_${gameId}`, this.data.perGame[gameId].wins >= 5);
      Achievements.check('first_win', this.data.wins >= 1);
    }
    
    // Total count checks
    Achievements.check('play_5', this.data.gamesPlayed >= 5);
    Achievements.check('play_10', this.data.gamesPlayed >= 10);

    Missions.checkDailyProgress();
    this.save();
    this.updateUI();
  },
  updateUI() {
    const hg = $id('home-stat-games'); if (hg) hg.textContent = this.data.gamesPlayed;
    const hw = $id('home-stat-wins'); if (hw) hw.textContent = this.data.wins;
    const hs = $id('home-stat-score'); if (hs) hs.textContent = this.data.highestWin + ' XP';

    // Rank updates
    const rankEl = $id('profile-rank');
    if (rankEl) {
      const totalXP = XP.data.lifetimeXp || 500;
      rankEl.textContent = totalXP >= 100000 ? 'LEGEND' : totalXP >= 50000 ? 'ELITE' : totalXP >= 20000 ? 'GOLD' : totalXP >= 10000 ? 'SILVER' : 'BRONZE';
    }

    const heroGames = $id('stat-hero-games'); if (heroGames) heroGames.textContent = `${GameGrid.games.length}+`;
    const heroXp = $id('stat-hero-xp'); if (heroXp) {
      const exp = this.data.totalXpEarned || 0;
      heroXp.textContent = exp > 100000 ? `${(exp / 1000).toFixed(0)}K+` : exp.toLocaleString() + '+';
    }
    const heroBadges = $id('stat-hero-badges'); if (heroBadges) heroBadges.textContent = `${Achievements.LIST.length}+`;

    drawGenreChart();
    drawProgressionTimeline();
  }
};

/* ---- Profile SVG Charts Emitters ---- */
function drawGenreChart() {
  const svg = $id('genre-svg-chart');
  const legend = $id('genre-chart-legend');
  if (!svg || !legend) return;

  const cats = { arcade: 0, puzzle: 0, classic: 0, skill: 0, strategy: 0 };
  let total = 0;
  const gameCats = {
    crystalvault: 'puzzle',
    treasuregrid: 'puzzle',
    luckyorbs: 'arcade',
    neontowers: 'strategy',
    mysterydoors: 'classic',
    spacecapsules: 'skill',
    fortunecards: 'classic',
    cosmicmines: 'strategy',
    galaxywheel: 'classic',
    luckyrocket: 'skill'
  };

  Object.entries(Stats.data.perGame || {}).forEach(([k, v]) => {
    const c = gameCats[k];
    if (c && cats[c] !== undefined) {
      cats[c] += v.played;
      total += v.played;
    }
  });

  const totalDisplay = $id('chart-total-played');
  if (totalDisplay) totalDisplay.textContent = total;

  if (total === 0) {
    svg.innerHTML = `<circle cx="100" cy="100" r="70" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="15" />`;
    legend.innerHTML = '<span class="text-white/40 col-span-3 text-[10px] font-semibold">No simulation metrics logged.</span>';
    return;
  }

  const colors = { arcade: '#00E5FF', puzzle: '#7C3AED', classic: '#FF4D9D', skill: '#22C55E', strategy: '#FFD54A' };
  let accumulatedAngle = 0;
  let paths = '';

  Object.entries(cats).forEach(([cat, val]) => {
    if (val === 0) return;
    const percentage = val / total;
    const angle = percentage * 360;

    const x1 = 100 + 70 * Math.cos((accumulatedAngle - 90) * Math.PI / 180);
    const y1 = 100 + 70 * Math.sin((accumulatedAngle - 90) * Math.PI / 180);
    accumulatedAngle += angle;
    const x2 = 100 + 70 * Math.cos((accumulatedAngle - 90) * Math.PI / 180);
    const y2 = 100 + 70 * Math.sin((accumulatedAngle - 90) * Math.PI / 180);

    const largeArcFlag = angle > 180 ? 1 : 0;

    paths += `<path d="M ${x1} ${y1} A 70 70 0 ${largeArcFlag} 1 ${x2} ${y2}" fill="none" stroke="${colors[cat]}" stroke-width="15" />`;
  });

  svg.innerHTML = paths;
  legend.innerHTML = Object.entries(cats).map(([cat, val]) => `
    <div class="flex items-center gap-1.5 justify-center">
      <span class="w-2.5 h-2.5 rounded-full" style="background: ${colors[cat]}"></span>
      <span class="uppercase text-[9px] font-bold font-mono text-white/70">${cat} (${val})</span>
    </div>
  `).join('');
}

function drawProgressionTimeline() {
  const svg = $id('timeline-svg-chart');
  if (!svg) return;

  const history = XP.data.history || [];
  if (history.length === 0) {
    svg.innerHTML = `
      <line x1="10" y1="140" x2="290" y2="140" stroke="rgba(255,255,255,0.08)" stroke-width="2" />
      <text x="150" y="75" fill="rgba(255,255,255,0.2)" text-anchor="middle" font-size="10">Record wagers to initialize graph.</text>
    `;
    return;
  }

  let currentXP = 0;
  const points = [{ xp: 0, date: 0 }];
  history.slice(-12).forEach(h => {
    currentXP += h.amount;
    points.push({ xp: currentXP, date: h.date });
  });

  const maxX = points.length - 1;
  const maxY = Math.max(100, currentXP);

  let pathD = `M 10 140`;
  let dots = '';

  points.forEach((p, i) => {
    const x = 10 + (i / maxX) * 280;
    const y = 140 - (p.xp / maxY) * 110;

    if (i === 0) pathD = `M ${x} ${y}`;
    else pathD += ` L ${x} ${y}`;

    dots += `<circle cx="${x}" cy="${y}" r="4" fill="#00E5FF" stroke="#09090B" stroke-width="1.5" />`;
  });

  svg.innerHTML = `
    <line x1="10" y1="30" x2="290" y2="30" stroke="rgba(255,255,255,0.03)" stroke-width="1" />
    <line x1="10" y1="85" x2="290" y2="85" stroke="rgba(255,255,255,0.03)" stroke-width="1" />
    <line x1="10" y1="140" x2="290" y2="140" stroke="rgba(255,255,255,0.08)" stroke-width="2" />
    <path d="${pathD}" fill="none" stroke="url(#line-gradient)" stroke-width="3" stroke-linecap="round" />
    ${dots}
    <defs>
      <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#00E5FF" />
        <stop offset="100%" stop-color="#7C3AED" />
      </linearGradient>
    </defs>
  `;
}

/* ---- Theme System ---- */
const Themes = {
  current: 'neon',
  list: [
    { id: 'neon', name: 'Cyber Neon', icon: '⚡', colors: { bg: '#09090B', primary: '#7C3AED', secondary: '#00E5FF', accent: '#FF4D9D' } },
    { id: 'galaxy', name: 'Galaxy Cosmic', icon: '🌌', colors: { bg: '#0A0518', primary: '#8B5CF6', secondary: '#ec4899', accent: '#00E5FF' } },
    { id: 'synthwave', name: 'Synthwave Dusk', icon: '🌴', colors: { bg: '#18042C', primary: '#f43f5e', secondary: '#fb923c', accent: '#2dd4bf' } },
    { id: 'emerald', name: 'Emerald Core', icon: '💚', colors: { bg: '#03100B', primary: '#10B981', secondary: '#34d399', accent: '#fbbf24' } },
    { id: 'inferno', name: 'Inferno Fury', icon: '🔥', colors: { bg: '#0F0202', primary: '#EF4444', secondary: '#F97316', accent: '#FACC15' } },
    { id: 'ice', name: 'Ice Crystal', icon: '❄️', colors: { bg: '#0B131A', primary: '#38bdf8', secondary: '#06b6d4', accent: '#ffffff' } },
    { id: 'purplestorm', name: 'Purple Storm', icon: '⛈️', colors: { bg: '#0F051D', primary: '#7c3aed', secondary: '#a78bfa', accent: '#f472b6' } },
    { id: 'goldelite', name: 'Gold Elite', icon: '👑', colors: { bg: '#0B0A07', primary: '#fbbf24', secondary: '#d97706', accent: '#e2e8f0' } }
  ],
  init() {
    this.current = LS.get('theme_config', 'neon');
    this.apply(this.current, true);
    this.renderModal();
    Shop.render();
  },
  apply(id, skipNotify) {
    const t = this.list.find(x => x.id === id);
    if (!t) return;
    this.current = id; LS.set('theme_config', id);

    document.documentElement.setAttribute('data-theme-preset', id);

    const r = document.documentElement;
    r.style.setProperty('--bg-dark', t.colors.bg);
    r.style.setProperty('--primary', t.colors.primary);
    r.style.setProperty('--secondary', t.colors.secondary);
    r.style.setProperty('--accent', t.colors.accent);
    document.body.style.backgroundColor = t.colors.bg;

    if (!skipNotify) {
      Toast.show(`Display preset updated: ${t.name}`, 'success');
      Notifications.add(`Loaded display preset theme: ${t.name}.`);
      Achievements.check(`theme_pres_${id}`);
    }
  },
  renderModal() {
    const grid = $id('theme-grid');
    if (!grid) return;
    const unlocked = LS.get('themes_purchased', ['neon']);

    grid.innerHTML = this.list.map(t => {
      const isLocked = !unlocked.includes(t.id);
      return `
        <button class="theme-option p-3.5 rounded-xl border ${t.id === this.current ? 'border-[#00E5FF] bg-[#00E5FF]/10 shadow-[0_0_15px_rgba(0,229,255,0.2)]' : 'border-white/10 bg-white/5'} hover:border-white/30 transition-all text-left ${isLocked ? 'opacity-40' : ''}" data-theme="${t.id}" ${isLocked ? 'disabled' : ''}>
          <div class="flex items-center gap-3">
            <span class="text-xl">${t.icon}</span>
            <div class="min-w-0">
              <div class="text-xs font-bold font-display text-white truncate">${t.name}</div>
              <div class="text-[9px] text-white/40 font-bold">${isLocked ? 'Locked (Shop)' : 'Authorized'}</div>
            </div>
          </div>
        </button>
      `;
    }).join('');

    grid.querySelectorAll('.theme-option').forEach(b => {
      b.onclick = () => {
        if (!b.disabled) {
          this.apply(b.dataset.theme);
          this.renderModal();
          $id('theme-modal').classList.add('hidden');
        }
      };
    });
  }
};

/* ---- Interactive Daily Spin Wheel ---- */
const DailySpinWheel = {
  prizes: [
    { type: 'coins', val: 50, color: '#7C3AED', label: '50 Coins' },
    { type: 'xp', val: 100, color: '#00E5FF', label: '100 XP' },
    { type: 'coins', val: 100, color: '#FF4D9D', label: '100 Coins' },
    { type: 'xp', val: 200, color: '#22C55E', label: '200 XP' },
    { type: 'coins', val: 20, color: '#FFD54A', label: '20 Coins' },
    { type: 'xp', val: 50, color: '#7C3AED', label: '50 XP' },
    { type: 'coins', val: 250, color: '#00E5FF', label: '250 Coins' },
    { type: 'xp', val: 500, color: '#FF4D9D', label: '500 XP' }
  ],
  angle: 0,
  speed: 0,
  isSpinning: false,
  canvas: null,
  ctx: null,

  init() {
    this.canvas = $id('daily-wheel-canvas');
    if (this.canvas) this.ctx = this.canvas.getContext('2d');

    const spinBtn = $id('spin-wheel-btn');
    if (spinBtn) {
      spinBtn.onclick = () => {
        if (this.isSpinning) return;

        const lastSpin = LS.get('last_wheel_spin', 0);
        const freeCooldown = 24 * 3600 * 1000;
        const now = Date.now();
        const needsPay = (now - lastSpin < freeCooldown);

        if (needsPay) {
          if (XP.data.coins >= 50) {
            XP.spendCoins(50);
            this.spin();
          } else {
            Toast.show('Insufficient Coins to Spin! Cost: 50 coins.', 'error');
          }
        } else {
          this.spin();
          LS.set('last_wheel_spin', now);
        }
      };
    }

    this.updateButtonText();
    this.draw();
  },

  updateButtonText() {
    const spinBtn = $id('spin-wheel-btn');
    if (!spinBtn) return;

    const lastSpin = LS.get('last_wheel_spin', 0);
    const freeCooldown = 24 * 3600 * 1000;
    const now = Date.now();
    const needsPay = (now - lastSpin < freeCooldown);

    if (needsPay) {
      spinBtn.textContent = 'SPIN COCKPIT (50 Coins 🪙)';
      spinBtn.className = 'btn-premium px-8 py-2.5 rounded-xl text-xs w-full bg-gradient-to-r from-orange-500 to-red-500';
    } else {
      spinBtn.textContent = 'SPIN FOR FREE! 🎡';
      spinBtn.className = 'btn-premium px-8 py-2.5 rounded-xl text-xs w-full';
    }
  },

  spin() {
    this.isSpinning = true;
    this.speed = 0.45 + Math.random() * 0.15;

    Stats.data.wheelSpins = (Stats.data.wheelSpins || 0) + 1;
    Stats.save();
    Achievements.check('spin_1');
    Achievements.check('spin_10', Stats.data.wheelSpins >= 10);

    const rotate = () => {
      this.angle += this.speed;
      this.speed *= 0.982;

      const slice = (Math.PI * 2) / this.prizes.length;
      const prev = Math.floor((this.angle - this.speed) / slice);
      const cur = Math.floor(this.angle / slice);
      if (prev !== cur) {
        Sound.spinSound();
      }

      this.draw();

      if (this.speed > 0.002) {
        requestAnimationFrame(rotate);
      } else {
        this.stop();
      }
    };

    rotate();
  },

  stop() {
    this.isSpinning = false;
    const slice = (Math.PI * 2) / this.prizes.length;

    let corrected = (3 * Math.PI / 2 - this.angle) % (Math.PI * 2);
    if (corrected < 0) corrected += Math.PI * 2;

    const winIdx = Math.floor(corrected / slice) % this.prizes.length;
    const reward = this.prizes[winIdx];

    Sound.win();
    confetti(30);

    if (reward.type === 'coins') {
      XP.addCoins(reward.val);
    } else {
      XP.addXP(reward.val);
    }

    Notifications.add(`Daily wheel spun and rewarded: ${reward.label}.`);
    this.updateButtonText();
    Missions.checkDailyProgress();
  },

  draw() {
    if (!this.ctx || !this.canvas) return;

    const size = 260;
    const cx = 130;
    const cy = 130;
    const r = 120;

    this.ctx.clearRect(0, 0, size, size);

    const count = this.prizes.length;
    const slice = (Math.PI * 2) / count;

    this.ctx.save();
    this.ctx.translate(cx, cy);
    this.ctx.rotate(this.angle);

    for (let i = 0; i < count; i++) {
      const sa = i * slice;
      const ea = (i + 1) * slice;
      const p = this.prizes[i];

      this.ctx.beginPath();
      this.ctx.moveTo(0, 0);
      this.ctx.arc(0, 0, r, sa, ea);
      this.ctx.fillStyle = p.color + '15';
      this.ctx.strokeStyle = p.color;
      this.ctx.lineWidth = 2.5;
      this.ctx.fill();
      this.ctx.stroke();

      this.ctx.save();
      this.ctx.rotate(sa + slice / 2);
      this.ctx.font = 'bold 8px Sora, sans-serif';
      this.ctx.fillStyle = '#fff';
      this.ctx.textAlign = 'right';
      this.ctx.fillText(p.label, r - 15, 3);
      this.ctx.restore();
    }

    this.ctx.restore();

    this.ctx.beginPath();
    this.ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    this.ctx.fillStyle = '#09090B';
    this.ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    this.ctx.lineWidth = 2;
    this.ctx.fill();
    this.ctx.stroke();
  }
};

/* ---- Interactive Daily Mystery Chest ---- */
const MysteryChest = {
  cooldown: 4 * 3600 * 1000,
  init() {
    const claimBtn = $id('claim-chest-btn');
    if (claimBtn) {
      claimBtn.onclick = () => this.open();
    }
    this.updateCooldownUI();
    setInterval(() => this.updateCooldownUI(), 1000);
  },
  updateCooldownUI() {
    const claimBtn = $id('claim-chest-btn');
    const cooldownTxt = $id('chest-cooldown-text');
    if (!claimBtn || !cooldownTxt) return;

    const lastClaim = LS.get('last_chest_claim', 0);
    const now = Date.now();
    const timeLeft = Math.max(0, lastClaim + this.cooldown - now);

    if (timeLeft > 0) {
      claimBtn.disabled = true;
      claimBtn.classList.add('hidden');
      cooldownTxt.classList.remove('hidden');

      const h = Math.floor(timeLeft / 3600000);
      const m = Math.floor((timeLeft % 3600000) / 60000);
      const s = Math.floor((timeLeft % 60000) / 1000);
      cooldownTxt.textContent = `Ready in ${h}h ${m}m ${s}s`;

      const graphic = $id('mystery-chest-graphic');
      if (graphic) graphic.className = 'chest-box';
    } else {
      claimBtn.disabled = false;
      claimBtn.classList.remove('hidden');
      cooldownTxt.classList.add('hidden');

      const graphic = $id('mystery-chest-graphic');
      if (graphic && !graphic.classList.contains('shake')) {
        graphic.className = 'chest-box shake';
      }
    }
  },
  open() {
    const graphic = $id('mystery-chest-graphic');
    if (!graphic) return;

    graphic.className = 'chest-box';
    Sound.reveal();

    setTimeout(() => {
      graphic.className = 'chest-box open';
      Sound.win();
      confetti(25);

      const xpAmt = rand(100, 500);
      const coinAmt = rand(20, 100);

      XP.addXP(xpAmt);
      XP.addCoins(coinAmt);

      Toast.show(`Opened Chest: +${xpAmt} XP & +${coinAmt} Coins 🪙!`, 'success');
      Notifications.add(`Opened mystery cargo container chest.`);

      Stats.data.chestsOpened = (Stats.data.chestsOpened || 0) + 1;
      Stats.save();

      Achievements.check('chest_1');
      Achievements.check('chest_10', Stats.data.chestsOpened >= 10);
      Achievements.check('mystery_chest_5', Stats.data.chestsOpened >= 5);

      LS.set('last_chest_claim', Date.now());
      this.updateCooldownUI();
      Missions.checkDailyProgress();
    }, 400);
  }
};

/* ---- Three.js Background Particle simulation ---- */
let particleMesh, threeRenderer, threeScene, threeCamera, threeAnimId, isThreeActive = true;
function initThreeBG() {
  if (typeof THREE === 'undefined') return;
  const c = $id('three-bg'); if (!c) return;

  if (threeRenderer) {
    c.innerHTML = '';
    if (threeAnimId) cancelAnimationFrame(threeAnimId);
  }

  if (LS.get('reduced_motion', true)) return;

  threeScene = new THREE.Scene();
  threeCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  threeRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  threeRenderer.setSize(window.innerWidth, window.innerHeight);
  threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  c.appendChild(threeRenderer.domElement);

  const particles = new THREE.BufferGeometry();
  const count = 1000;
  const pos = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 35;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 35;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 35 - 5;
    sizes[i] = Math.random() * 2.5 + 0.5;
  }
  particles.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  particles.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const material = new THREE.PointsMaterial({
    color: 0x00E5FF,
    size: 0.08,
    transparent: true,
    opacity: 0.45,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
  particleMesh = new THREE.Points(particles, material);
  threeScene.add(particleMesh);

  threeCamera.position.z = 8;
  let mouseX = 0, mouseY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  function animate() {
    if (!isThreeActive) return;
    threeAnimId = requestAnimationFrame(animate);
    if (document.hidden) return;
    if (particleMesh) {
      particleMesh.rotation.x += (mouseY * 0.015 - particleMesh.rotation.x) * 0.02;
      particleMesh.rotation.y += (mouseX * 0.015 - particleMesh.rotation.y) * 0.02;
      particleMesh.rotation.z += 0.0006;
    }
    threeRenderer.render(threeScene, threeCamera);
  }
  animate();

  window.addEventListener('resize', () => {
    if (!threeCamera || !threeRenderer) return;
    threeCamera.aspect = window.innerWidth / window.innerHeight;
    threeCamera.updateProjectionMatrix();
    threeRenderer.setSize(window.innerWidth, window.innerHeight);
  });
}

/* ---- Navigation Routing ---- */
/* ---- Unified AAA PageHeader ---- */
const PageHeader = {
  config: {
    'games': { title: 'Game Store', back: 'home', widthClass: 'max-w-6xl' },
    'game-detail': { title: 'Game Details', back: 'games', widthClass: 'max-w-4xl' },
    'leaderboard': { title: 'Leaderboards', back: 'home', widthClass: 'max-w-4xl' },
    'achievements': { title: 'Achievements', back: 'home', widthClass: 'max-w-4xl' },
    'challenges': { title: 'Challenges & Rewards', back: 'home', widthClass: 'max-w-4xl' },
    'blog': { title: 'Platform News', back: 'home', widthClass: 'max-w-4xl' },
    'profile': { title: 'Player Profile', back: 'home', widthClass: 'max-w-4xl' },
    'about': { title: 'About GameVerse', back: 'home', widthClass: 'max-w-3xl' },
    'settings': { title: 'Settings Dashboard', back: 'home', widthClass: 'max-w-2xl' },
    'faq': { title: 'Frequently Asked Questions', back: 'home', widthClass: 'max-w-3xl' },
    'contact': { title: 'Contact Support', back: 'home', widthClass: 'max-w-3xl' },
    'privacy': { title: 'Privacy Policy', back: 'home', widthClass: 'max-w-3xl' },
    'terms': { title: 'Terms of Service', back: 'home', widthClass: 'max-w-3xl' },
    'disclaimer': { title: 'Disclaimer', back: 'home', widthClass: 'max-w-3xl' },
    '404': { title: 'Grid System Glitch', back: 'home', widthClass: 'max-w-xl' },

    // Game modules (Arcade)
    'tictactoe': { title: 'Tic Tac Toe', back: 'games', widthClass: 'max-w-6xl' },
    'snake': { title: 'Snake', back: 'games', widthClass: 'max-w-6xl' },
    '2048': { title: '2048', back: 'games', widthClass: 'max-w-6xl' },
    'minesweeper': { title: 'Minesweeper', back: 'games', widthClass: 'max-w-6xl' },
    'pong': { title: 'Pong', back: 'games', widthClass: 'max-w-6xl' },
    'memory': { title: 'Memory Match', back: 'games', widthClass: 'max-w-6xl' },
    'aim': { title: 'Aim Trainer', back: 'games', widthClass: 'max-w-6xl' },
    'reaction': { title: 'Reaction Time', back: 'games', widthClass: 'max-w-6xl' },
    'sudoku': { title: 'Sudoku', back: 'games', widthClass: 'max-w-6xl' },
    'flappy': { title: 'Flappy Bird', back: 'games', widthClass: 'max-w-6xl' }
  },

  init() {
    Object.entries(this.config).forEach(([pageId, cfg]) => {
      const pageEl = $id('page-' + pageId);
      if (!pageEl) return;

      const backText = cfg.back === 'home' ? '← Back to Dashboard' : (cfg.back === 'games' ? '← Back to Store' : '← Back');
      const headerEl = document.createElement('header');
      headerEl.className = `unified-page-header ${cfg.widthClass} mx-auto text-left`;
      headerEl.innerHTML = `
        <div class="gameverse-brand-title">GAMEVERSE</div>
        <button class="back-btn-unified" aria-label="Go back">
          ${backText}
        </button>
        <h1 class="unified-page-title text-4xl font-black font-display text-white uppercase mt-5">${cfg.title}</h1>
      `;

      const backBtn = headerEl.querySelector('.back-btn-unified');
      backBtn.onclick = (e) => {
        e.preventDefault();
        Sound.click();

        let target = cfg.back;
        if (target === 'game-detail' && GameDetail.activeGameId) {
          GameDetail.open(GameDetail.activeGameId);
        } else {
          Nav.go(target);
        }
      };

      pageEl.prepend(headerEl);
      this.cleanLegacyHeaders(pageEl, pageId);
    });
  },

  cleanLegacyHeaders(pageEl, pageId) {
    const h1s = pageEl.querySelectorAll('h1:not(.unified-page-title), h2.text-3xl');
    h1s.forEach(h => {
      if (!h.closest('.unified-page-header') && !h.closest('#game-detail-banner') && !h.closest('.glass-card')) {
        h.style.display = 'none';
      }
    });

    const subtitles = pageEl.querySelectorAll('p.text-white\\/40, p.text-white\\/50');
    subtitles.forEach(p => {
      if (!p.closest('.unified-page-header') && !p.closest('.glass-card') && !p.closest('#game-detail-banner')) {
        p.style.display = 'none';
      }
    });

    // We only target the inner left panel of details/back to keep right aligned payout status boxes intact!
    const legacyBars = pageEl.querySelectorAll('.flex.items-center.gap-3');
    legacyBars.forEach(bar => {
      if (bar.querySelector('.back-to-detail, .back-to-home') || bar.querySelector('span.text-lg.font-bold')) {
        bar.style.display = 'none';
      }
    });
  },

  animateEntrance(pageId) {
    const pageEl = $id('page-' + pageId);
    if (!pageEl) return;

    const isMotionReduced = LS.get('reduced_motion', true);
    if (isMotionReduced) {
      $$('.unified-page-header', pageEl).forEach(h => h.style.opacity = 1);
      return;
    }

    const header = pageEl.querySelector('.unified-page-header');
    if (!header) {
      gsap.fromTo(pageEl, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' });
      return;
    }

    const brand = header.querySelector('.gameverse-brand-title');
    const backBtn = header.querySelector('.back-btn-unified');
    const title = header.querySelector('.unified-page-title');

    const contentNodes = [...pageEl.children].filter(c => c !== header);

    gsap.set(header, { opacity: 1 });
    gsap.set(brand, { opacity: 0 });
    gsap.set(backBtn, { opacity: 0, x: -12 });
    gsap.set(title, { opacity: 0, y: 15 });
    gsap.set(contentNodes, { opacity: 0 });

    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
    tl.to(brand, { opacity: 1, duration: 0.15 })
      .to(backBtn, { opacity: 1, x: 0, duration: 0.25 }, '-=0.08')
      .to(title, { opacity: 1, y: 0, duration: 0.25 }, '-=0.15')
      .to(contentNodes, { opacity: 1, duration: 0.3 }, '+=0.1');
  }
};

const Nav = {
  current: 'home',
  scrollPositions: {},
  init() {
    $$('[data-page]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        this.go(el.dataset.page);
      });
    });
    $$('.back-to-home').forEach(el => {
      el.addEventListener('click', () => this.go('home'));
    });

    $id('mobile-menu-btn').addEventListener('click', () => {
      $id('mobile-drawer').classList.remove('hidden');
      gsap.fromTo('#mobile-drawer > div:last-child', { x: '-100%' }, { x: '0%', duration: 0.3, ease: 'power2.out' });
    });
    $id('drawer-overlay').addEventListener('click', () => this.closeDrawer());
    $$('.mobile-nav-link').forEach(el => {
      el.addEventListener('click', () => { this.go(el.dataset.page); this.closeDrawer(); });
    });

    $id('search-toggle').addEventListener('click', () => CommandPalette.toggle());

    $id('theme-btn').addEventListener('click', () => {
      $id('theme-modal').classList.remove('hidden');
      Themes.renderModal();
    });
    $id('theme-close').addEventListener('click', () => $id('theme-modal').classList.add('hidden'));
    $id('theme-modal-overlay').addEventListener('click', () => $id('theme-modal').classList.add('hidden'));

    $id('profile-btn').addEventListener('click', () => this.go('profile'));
    $id('quick-profile-link').onclick = () => this.go('profile');
    $id('levelup-close').addEventListener('click', () => $id('levelup-modal').classList.add('hidden'));

    $id('notif-bell-btn').onclick = (e) => {
      e.stopPropagation();
      $id('notif-popover').classList.toggle('hidden');
      $id('notif-badge').classList.add('hidden');
    };
    $id('clear-notif-btn').onclick = () => Notifications.clear();

    document.addEventListener('click', () => {
      $id('notif-popover').classList.add('hidden');
    });

    $$('.back-to-store-btn').forEach(btn => {
      btn.onclick = () => {
        Sound.click();
        Nav.go('games');
      };
    });
  },
  go(page) {
    if (this.current === page) return;
    const old = $id('page-' + this.current);
    const next = $id('page-' + page);
    if (!next) {
      this.go('404');
      return;
    }

    this.scrollPositions[this.current] = window.scrollY;

    const isMotionReduced = LS.get('reduced_motion', true);

    // Manage WebGL background rendering to prevent performance lag inside games
    const gamePages = ['tictactoe', 'snake', '2048', 'minesweeper', 'pong', 'memory', 'aim', 'reaction', 'sudoku', 'flappy'];
    if (gamePages.includes(page)) {
      isThreeActive = false;
      if (threeAnimId) { cancelAnimationFrame(threeAnimId); threeAnimId = null; }
      const container = $id('three-bg');
      if (container) container.style.display = 'none';
    } else {
      if (!isThreeActive) {
        isThreeActive = true;
        const container = $id('three-bg');
        if (container) container.style.display = 'block';
        if (!LS.get('reduced_motion', true)) {
          initThreeBG();
        }
      }
    }

    if (old) {
      if (isMotionReduced) {
        old.classList.remove('active');
        next.classList.add('active');
        window.scrollTo(0, this.scrollPositions[page] || 0);
      } else {
        gsap.to(old, {
          opacity: 0, duration: 0.12, onComplete: () => {
            old.classList.remove('active');
            next.classList.add('active');
            PageHeader.animateEntrance(page);
            window.scrollTo(0, this.scrollPositions[page] || 0);
          }
        });
      }
    } else {
      next.classList.add('active');
      if (!isMotionReduced) {
        PageHeader.animateEntrance(page);
      }
      window.scrollTo(0, this.scrollPositions[page] || 0);
    }
    this.current = page;

    $$('.sidebar-link').forEach(l => {
      l.classList.toggle('active', l.dataset.page === page);
    });

    if (page === 'home') { XP.updateUI(); Stats.updateUI(); }
    if (page === 'achievements') Achievements.render();
    if (page === 'challenges') { ChallengesPage.render(); Shop.render(); DailySpinWheel.init(); MysteryChest.init(); }
    if (page === 'profile') this.refreshProfile();
    if (page === 'games') GameGrid.renderAll();
    if (page === 'leaderboard') Leaderboard.render();
    if (page === 'settings') SettingsPage.init();

    if (old && App._lastGame && App.games[App._lastGame] && App.games[App._lastGame].stop) {
      App.games[App._lastGame].stop(); App._lastGame = null;
    }
  },
  closeDrawer() {
    const d = $id('mobile-drawer');
    gsap.to('#mobile-drawer > div:last-child', { x: '-100%', duration: 0.3, onComplete: () => d.classList.add('hidden') });
  },
  refreshProfile() {
    const p = XP.getProgress();
    const favs = LS.get('favorites', []);
    $id('profile-name').textContent = LS.get('profileName', 'Player');
    XP.updateUI();

    const f = $id('profile-favorites');
    if (f) f.innerHTML = favs.length ? favs.map(id => `<span class="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg font-bold">${GameGrid.getIcon(id)} ${GameGrid.getName(id)}</span>`).join('') : '<span class="text-white/40">No favorites selected.</span>';

    const r = $id('profile-recent');
    if (r) {
      const recent = LS.get('recent', []);
      r.innerHTML = recent.length ? recent.slice(0, 5).map(id => `<span class="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg font-bold">${GameGrid.getIcon(id)} ${GameGrid.getName(id)}</span>`).join('') : '<span class="text-white/40">No matches recorded.</span>';
    }
  }
};

/* ---- Command Palette Overlay (HUD Ctrl+K) ---- */
const CommandPalette = {
  active: false,
  focusedIndex: -1,
  commands: [
    { title: 'Play Tic Tac Toe', action: () => { Nav.go('tictactoe'); App.goToGame('tictactoe'); }, shortcut: 'P T' },
    { title: 'Play Snake', action: () => { Nav.go('snake'); App.goToGame('snake'); }, shortcut: 'P S' },
    { title: 'Play 2048', action: () => { Nav.go('2048'); App.goToGame('2048'); }, shortcut: 'P 2' },
    { title: 'Play Minesweeper', action: () => { Nav.go('minesweeper'); App.goToGame('minesweeper'); }, shortcut: 'P M' },
    { title: 'Play Pong', action: () => { Nav.go('pong'); App.goToGame('pong'); }, shortcut: 'P P' },
    { title: 'Play Memory Match', action: () => { Nav.go('memory'); App.goToGame('memory'); }, shortcut: 'P G' },
    { title: 'Play Aim Trainer', action: () => { Nav.go('aim'); App.goToGame('aim'); }, shortcut: 'P A' },
    { title: 'Play Reaction Time', action: () => { Nav.go('reaction'); App.goToGame('reaction'); }, shortcut: 'P R' },
    { title: 'Play Sudoku', action: () => { Nav.go('sudoku'); App.goToGame('sudoku'); }, shortcut: 'P K' },
    { title: 'Play Flappy Bird', action: () => { Nav.go('flappy'); App.goToGame('flappy'); }, shortcut: 'P F' },

    { title: 'Mute Audio Synth Sweep', action: () => { if (Sound.enabled) Sound.toggle(); }, shortcut: 'S M' },
    { title: 'Unmute Audio Synth Sweep', action: () => { if (!Sound.enabled) Sound.toggle(); }, shortcut: 'S U' },
    { title: 'Reset Progress Data', action: () => $id('settings-reset-btn').click(), shortcut: 'D R' }
  ],

  toggle() {
    this.active = !this.active;
    const overlay = $id('command-palette');
    if (!overlay) return;

    overlay.classList.toggle('active', this.active);
    if (this.active) {
      $id('command-input').value = '';
      this.filter('');
      setTimeout(() => $id('command-input').focus(), 150);
    }
  },

  bind() {
    const input = $id('command-input');
    const closeBtn = $id('command-close-btn');
    if (input) {
      input.oninput = (e) => this.filter(e.target.value);
      input.onkeydown = (e) => this.handleKey(e);
    }
    if (closeBtn) closeBtn.onclick = () => this.toggle();
  },

  filter(q) {
    const resultsEl = $id('command-results');
    if (!resultsEl) return;

    const filterList = q.trim() === '' ? this.commands.slice(0, 8) : this.commands.filter(c =>
      c.title.toLowerCase().includes(q.toLowerCase())
    );

    this.focusedIndex = -1;

    if (filterList.length === 0) {
      resultsEl.innerHTML = '<div class="p-4 text-xs text-white/40 text-center font-medium">No simulation actions matching query</div>';
      return;
    }

    resultsEl.innerHTML = filterList.map((c, i) => {
      let titleStr = c.title;
      if (q) {
        const regex = new RegExp(`(${q})`, 'gi');
        titleStr = titleStr.replace(regex, `<span class="highlight-match">$1</span>`);
      }

      return `
        <button class="command-item" data-index="${i}">
          <span>${titleStr}</span>
          <span class="command-shortcut font-mono">${c.shortcut}</span>
        </button>
      `;
    }).join('');

    $$('.command-item', resultsEl).forEach((btn, i) => {
      btn.onclick = () => {
        const cmd = filterList[i];
        this.toggle();
        cmd.action();
        Achievements.check('search_command');
      };
    });

    this._currentFiltered = filterList;
  },

  handleKey(e) {
    const items = $$('.command-item', $id('command-results'));
    if (items.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.focusedIndex = (this.focusedIndex + 1) % items.length;
      this.focusItem(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.focusedIndex = (this.focusedIndex - 1 + items.length) % items.length;
      this.focusItem(items);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (this.focusedIndex >= 0 && this.focusedIndex < items.length) {
        items[this.focusedIndex].click();
      } else if (items.length > 0) {
        items[0].click();
      }
    }
  },

  focusItem(items) {
    items.forEach((item, idx) => {
      item.classList.toggle('focused', idx === this.focusedIndex);
      if (idx === this.focusedIndex) item.scrollIntoView({ block: 'nearest' });
    });
  }
};

/* ---- Game Card Grid & Dynamic Details Page ---- */
const GameGrid = {
  activeCategory: 'all',
  games: [
    { id: 'tictactoe', icon: '❌', name: 'Tic Tac Toe', desc: 'Test your strategy in this classic board game. Challenge the computer to align three symbols on a grid to win.', cat: 'classic', difficulty: 'Easy', playtime: '2m', xp: 100, popular: 85 },
    { id: 'snake', icon: '🐍', name: 'Snake', desc: 'Devour grid energy elements to grow longer. Steer carefully and avoid hitting walls or your own tail.', cat: 'arcade', difficulty: 'Medium', playtime: '3m', xp: 150, popular: 95 },
    { id: '2048', icon: '🔢', name: '2048', desc: 'Slide grid tiles to merge matching numerical values and double their size. Reach the 2048 tile to win.', cat: 'puzzle', difficulty: 'Medium', playtime: '5m', xp: 200, popular: 90 },
    { id: 'minesweeper', icon: '💣', name: 'Minesweeper', desc: 'Deduce hidden bomb placements using adjacent numbers. Clear the logic minefield without trigger events.', cat: 'strategy', difficulty: 'Hard', playtime: '4m', xp: 250, popular: 80 },
    { id: 'pong', icon: '🏓', name: 'Pong', desc: 'Enjoy classic vector table tennis. Control your paddle, block CPU returns, and score 5 points to win.', cat: 'arcade', difficulty: 'Easy', playtime: '2m', xp: 100, popular: 88 },
    { id: 'memory', icon: '🃏', name: 'Memory Match', desc: 'Train your brain by flipping cards to pair matching graphic symbols in minimum moves.', cat: 'puzzle', difficulty: 'Easy', playtime: '2m', xp: 120, popular: 82 },
    { id: 'aim', icon: '🎯', name: 'Aim Trainer', desc: 'Measure your click velocity by hitting neon targets as fast as possible in 30 seconds.', cat: 'skill', difficulty: 'Medium', playtime: '1m', xp: 180, popular: 92 },
    { id: 'reaction', icon: '⚡', name: 'Reaction Time', desc: 'Test your timing delay! Wait for the screen to transition from red to green and click immediately.', cat: 'skill', difficulty: 'Easy', playtime: '1m', xp: 100, popular: 86 },
    { id: 'sudoku', icon: '🧩', name: 'Sudoku', desc: 'Solve classic math placement grids. Place digits 1-9 without duplicates per row, column, or block.', cat: 'puzzle', difficulty: 'Hard', playtime: '6m', xp: 300, popular: 78 },
    { id: 'flappy', icon: '🐦', name: 'Flappy Bird', desc: 'Tap screen to flap and guide your vector bird through narrow pipeline corridors without crashing.', cat: 'arcade', difficulty: 'Hard', playtime: '3m', xp: 200, popular: 94 }
  ],
  getIcon(id) { const g = this.games.find(x => x.id === id); return g ? g.icon : '🎮'; },
  getName(id) { const g = this.games.find(x => x.id === id); return g ? g.name : id; },
  renderAll(filter, sort) {
    const grids = ['home-game-grid', 'games-grid', 'home-featured-grid'];
    if (filter) this.activeCategory = filter;
    const activeCat = this.activeCategory;
    const activeSort = sort || $id('games-sort')?.value || 'name';

    grids.forEach(gridId => {
      const grid = $id(gridId); if (!grid) return;
      let list = [...this.games];

      if (gridId === 'home-game-grid') {
        list = list.sort((a, b) => b.popular - a.popular).slice(0, 6);
      } else if (gridId === 'home-featured-grid') {
        list = list.sort((a, b) => b.xp - a.xp).slice(0, 3);
      } else {
        if (activeCat !== 'all') list = list.filter(g => g.cat === activeCat);

        const searchVal = $id('games-search')?.value?.trim().toLowerCase() || '';
        if (searchVal) {
          list = list.filter(g =>
            g.name.toLowerCase().includes(searchVal) ||
            g.cat.toLowerCase().includes(searchVal) ||
            g.desc.toLowerCase().includes(searchVal)
          );
        }

        if (activeSort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
        else if (activeSort === 'popular') list.sort((a, b) => b.popular - a.popular);
        else if (activeSort === 'newest') list.reverse();
      }

      const favs = LS.get('favorites', []);
      const perGame = Stats.data.perGame || {};

      grid.innerHTML = list.map(g => {
        const stats = perGame[g.id];
        const best = stats ? stats.bestScore : 0;
        const isFav = favs.includes(g.id);

        if (gridId === 'games-grid') {
          const emptyEl = $id('games-empty');
          if (emptyEl) {
            if (list.length === 0) emptyEl.classList.remove('hidden');
            else emptyEl.classList.add('hidden');
          }
        }

        return `
          <div class="game-card-premium group" data-game="${g.id}">
            <div class="game-card-banner select-none">
              <button class="fav-btn-style ${isFav ? 'favorited' : ''}" data-game="${g.id}" aria-label="Favorite game">❤️</button>
              <span class="banner-icon">${g.icon}</span>
              <div class="glow-overlay"></div>
            </div>
            
            <div class="game-card-details">
              <div>
                <div class="flex items-center justify-between text-[8px] font-bold text-white/40 uppercase tracking-widest mb-1.5 font-mono">
                  <span>${g.cat}</span>
                  <span>${g.playtime} · ${g.difficulty}</span>
                </div>
                <h3 class="text-sm font-black truncate text-white leading-tight font-display group-hover:text-[#00E5FF] transition-colors">${g.name}</h3>
                <p class="text-[10px] text-white/50 truncate mt-0.5 leading-relaxed font-medium">${g.desc}</p>
              </div>
              
              <div class="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                <span class="text-[#FFD54A] font-extrabold text-[9px] font-mono">+${g.xp} XP</span>
                <div class="flex gap-1.5">
                  <button class="details-btn-card px-2.5 py-1 bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all rounded-lg font-bold text-[8px] uppercase tracking-wider font-display">Details</button>
                  <button class="play-btn-card px-4 py-1.5 bg-[#7C3AED]/15 border border-[#7C3AED]/30 text-white group-hover:bg-[#7C3AED] group-hover:text-white transition-all rounded-lg font-bold text-[8px] uppercase tracking-wider font-display">Play</button>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('');

      $$('.game-card-premium', grid).forEach(card => {
        card.onclick = (e) => {
          if (e.target.closest('.fav-btn-style') || e.target.closest('.play-btn-card')) return;
          GameDetail.open(card.dataset.game);
        };

        const playBtn = card.querySelector('.play-btn-card');
        if (playBtn) {
          playBtn.onclick = (e) => {
            e.stopPropagation();
            const id = card.dataset.game;
            Sound.click();
            Nav.go(id);
            App.goToGame(id);
          };
        }

        const detailsBtn = card.querySelector('.details-btn-card');
        if (detailsBtn) {
          detailsBtn.onclick = (e) => {
            e.stopPropagation();
            Sound.click();
            GameDetail.open(card.dataset.game);
          };
        }

        const favBtn = card.querySelector('.fav-btn-style');
        if (favBtn) {
          favBtn.onclick = (e) => {
            e.stopPropagation();
            const id = favBtn.dataset.game;
            const favs = LS.get('favorites', []);
            const idx = favs.indexOf(id);
            if (idx >= 0) {
              favs.splice(idx, 1);
              favBtn.classList.remove('favorited');
              Toast.show('Removed from favorites', 'error');
            } else {
              favs.push(id);
              favBtn.classList.add('favorited');
              Toast.show('Added to favorites!', 'success');
              Achievements.check('fav_3', favs.length >= 3);
            }
            LS.set('favorites', favs);
            this.renderAll();
          };
        }
      });
    });
  }
};

/* ---- Game Detail Page Population Module ---- */
const GameDetail = {
  activeGameId: null,

  open(gameId) {
    const game = GameGrid.games.find(g => g.id === gameId);
    if (!game) return;

    this.activeGameId = gameId;

    $id('game-detail-icon').textContent = game.icon;
    $id('game-detail-title').textContent = game.name;
    $id('game-detail-difficulty').textContent = game.difficulty;
    $id('game-detail-xp-reward').textContent = `+${game.xp} XP`;
    $id('game-detail-category').textContent = game.cat.toUpperCase();
    $id('game-detail-play-time').textContent = game.playtime;
    $id('game-detail-desc').textContent = game.desc;

    const instructions = {
      tictactoe: {
        how: 'Match three of your symbols (X) in a horizontal, vertical, or diagonal line before the CPU (O) does.',
        controls: 'Click/Tap empty grid cells.'
      },
      snake: {
        how: 'Steer the snake, eat neon food cubes, grow your length, and avoid hitting borders or your own tail.',
        controls: 'Use Arrow Keys (keyboard) or Swipe (mobile touch).'
      },
      '2048': {
        how: 'Slide tiles and merge matching numbers to combine them. Goal is to create the legendary 2048 tile.',
        controls: 'Use Arrow Keys or Swipe to slide tiles.'
      },
      minesweeper: {
        how: 'Examine grid cells to find mines. Numbers show count of mines adjacent to the cell. Reveal all clean cells to win.',
        controls: 'Left Click to reveal, Right Click to flag 🚩 a mine.'
      },
      pong: {
        how: 'Steer the neon paddle to bounce the ball back into the CPU zone. Scoring 5 points wins the match.',
        controls: 'Move cursor or touch drag paddle vertically.'
      },
      memory: {
        how: 'Turn over cards to find matching pairs of cosmic symbols. Match all pairs in minimum turns.',
        controls: 'Click/Tap card panels to flip.'
      },
      aim: {
        how: 'Neon target nodes spawn randomly in the reflex field. Click as many as you can before the 30s timer runs out.',
        controls: 'Click/Tap directly on targets.'
      },
      reaction: {
        how: 'Wait for the red screen indicator to turn green, then click instantly to measure your sensory latency.',
        controls: 'Click/Tap the box indicator when green.'
      },
      sudoku: {
        how: 'Fill the 9x9 grid with numbers 1-9. Each number must appear exactly once per row, column, and 3x3 block.',
        controls: 'Click empty cell, type number 1-9 (keyboard).'
      },
      flappy: {
        how: 'Maintain height velocity by flapping to pass through narrow pipe gaps. Crashing ends the flight.',
        controls: 'Spacebar, Click, or Tap screen to flap.'
      }
    }

    const info = instructions[gameId] || { how: 'Launch game to view rules.', controls: 'Mouse click / Tap vectors.' };
    $id('game-detail-howtoplay').textContent = info.how;
    $id('game-detail-controls').textContent = info.controls;

    const perGame = Stats.data.perGame[gameId] || { played: 0, wins: 0, bestScore: 0 };
    $id('game-detail-popularity').textContent = `${game.popular}%`;
    $id('game-detail-best-multiplier').textContent = (gameId === 'reaction' && perGame.bestScore) ? perGame.bestScore + ' ms' : (perGame.bestScore || '0');
    const bestLabel = $id('game-detail-best-multiplier').previousElementSibling;
    if (bestLabel) bestLabel.textContent = (gameId === 'reaction') ? 'Best Latency' : 'Best Score';
    $id('game-detail-times-played').textContent = perGame.played;

    const favs = LS.get('favorites', []);
    const favBtn = $id('game-detail-fav-btn');
    if (favBtn) {
      const isFav = favs.includes(gameId);
      favBtn.textContent = isFav ? '❤️ Favorited' : '🤍 Favorite';
      favBtn.onclick = () => {
        const idx = favs.indexOf(gameId);
        if (idx >= 0) {
          favs.splice(idx, 1);
          favBtn.textContent = '🤍 Favorite';
          Toast.show('Removed from favorites', 'error');
        } else {
          favs.push(gameId);
          favBtn.textContent = '❤️ Favorited';
          Toast.show('Added to favorites!', 'success');
        }
        LS.set('favorites', favs);
        GameGrid.renderAll();
      };
    }

    const shareBtn = $id('game-detail-share-btn');
    if (shareBtn) {
      shareBtn.onclick = () => {
        navigator.clipboard.writeText(window.location.origin + '#' + gameId);
        Toast.show('Game URL copied to clipboard!', 'success');
      };
    }

    $id('game-detail-play-btn').onclick = () => {
      Nav.go(gameId);
      App.goToGame(gameId);
    };

    const commentsList = $id('game-detail-comments');
    if (commentsList) {
      const logs = LS.get(`comments_${gameId}`, [
        { author: 'EliteArcader', msg: 'Loving the multiplier volatility on this game!', time: Date.now() - 3600000 },
        { author: 'CyberPioneer', msg: 'My current max multi is 6.5x. Can anyone beat that?', time: Date.now() - 100000 }
      ]);

      const renderComments = () => {
        if (logs.length === 0) {
          commentsList.innerHTML = '<div class="text-white/40 text-center py-2">No player transmissions. Be the first!</div>';
        } else {
          commentsList.innerHTML = logs.map(c => `
            <div class="p-3 bg-white/5 border border-white/5 rounded-xl">
              <span class="font-bold text-[#00E5FF] font-display">${c.author}</span>: 
              <span class="text-white/80">${c.msg}</span>
            </div>
          `).join('');
        }
        commentsList.scrollTop = commentsList.scrollHeight;
      };

      renderComments();

      const input = $id('game-detail-comment-input');
      const submit = $id('game-detail-comment-submit');
      if (submit && input) {
        submit.onclick = () => {
          const text = input.value.trim();
          if (!text) return;

          logs.push({ author: LS.get('profileName', 'Player'), msg: text, time: Date.now() });
          LS.set(`comments_${gameId}`, logs);
          input.value = '';
          Sound.click();
          renderComments();
          Toast.show('Log transmitted!', 'success');
        };
        input.onkeydown = (e) => {
          if (e.key === 'Enter') submit.click();
        };
      }
    }

    const relatedGrid = $id('game-detail-related');
    if (relatedGrid) {
      const related = GameGrid.games.filter(g => g.cat === game.cat && g.id !== gameId).slice(0, 4);
      relatedGrid.innerHTML = related.map(g => `
        <div class="p-4 bg-white/5 border border-white/10 rounded-2xl cursor-pointer hover:border-cyan-400 hover:scale-[1.02] transition-all text-center group" onclick="GameDetail.open('${g.id}')">
          <span class="text-3xl block mb-2 group-hover:rotate-6 transition-transform">${g.icon}</span>
          <div class="text-xs font-bold font-display text-white truncate">${g.name}</div>
          <div class="text-[9px] text-[#00E5FF] mt-1 uppercase font-bold tracking-wider">${g.cat}</div>
        </div>
      `).join('');
    }

    const badgesGrid = $id('game-detail-badges');
    if (badgesGrid) {
      const gameBadges = Achievements.LIST.filter(a => a.id.includes(gameId) || (a.desc.toLowerCase().includes(gameId)));
      badgesGrid.innerHTML = gameBadges.map(b => {
        const unlocked = Achievements.isUnlocked(b.id);
        return `
          <div class="flex items-center gap-2.5 p-2 bg-white/5 border border-white/5 rounded-xl ${unlocked ? '' : 'opacity-40'}">
            <span class="text-xl select-none">${b.icon}</span>
            <div class="min-w-0">
              <div class="text-[10px] font-bold text-white leading-tight truncate">${b.name}</div>
              <div class="text-[8px] text-white/40 leading-none truncate">${b.desc}</div>
            </div>
          </div>
        `;
      }).join('');
    }

    Nav.go('game-detail');
  }
};

/* ---- Settings Management Dashboard ---- */
const SettingsPage = {
  init() {
    const motionBtn = $id('settings-motion-btn');
    if (motionBtn) {
      const status = LS.get('reduced_motion', true);
      motionBtn.textContent = status ? 'On' : 'Off';
      motionBtn.onclick = () => {
        const cur = !LS.get('reduced_motion', true);
        LS.set('reduced_motion', cur);
        motionBtn.textContent = cur ? 'On' : 'Off';
        Toast.show(`Reduced motion: ${cur ? 'Enabled' : 'Disabled'}`, 'success');

        Achievements.check('reduced_motion_lock', cur);
        initThreeBG();
      };
    }

    const langSelect = $id('settings-lang-select');
    if (langSelect) {
      langSelect.value = LS.get('lang', 'en');
      langSelect.onchange = (e) => {
        LS.set('lang', e.target.value);
        this.applyLanguage(e.target.value);
        Toast.show('Language options loaded!', 'success');
        Achievements.check('lang_preset');
      };
    }

    this.setupPwaInstall();
  },

  applyLanguage(code) {
    const dictionary = {
      en: {
        dashboard: 'Dashboard', store: 'Store', leaderboards: 'Leaderboards',
        achievements: 'Achievements', challenges: 'Challenges', news: 'News'
      },
      ja: {
        dashboard: 'ダッシュボード', store: 'ストア', leaderboards: 'ランキング',
        achievements: 'トロフィー', challenges: 'ミッション', news: 'ニュース'
      },
      es: {
        dashboard: 'Consola', store: 'Tienda', leaderboards: 'Tableros',
        achievements: 'Logros', challenges: 'Misiones', news: 'Noticias'
      },
      de: {
        dashboard: 'Dashboard', store: 'Marktplatz', leaderboards: 'Rangliste',
        achievements: 'Erfolge', challenges: 'Aufgaben', news: 'News'
      },
      fr: {
        dashboard: 'Tableau', store: 'Boutique', leaderboards: 'Classement',
        achievements: 'Trophées', challenges: 'Défis', news: 'Actus'
      }
    };

    const trans = dictionary[code] || dictionary['en'];
    const links = $$('.sidebar-link');
    const textEls = $$('.sidebar-link-text');
    if (textEls.length >= 6) {
      textEls[0].textContent = trans.dashboard;
      textEls[1].textContent = trans.store;
      textEls[2].textContent = trans.leaderboards;
      textEls[3].textContent = trans.achievements;
      textEls[4].textContent = trans.challenges;
      textEls[5].textContent = trans.news;
    }

    const bannerTitle = $('#banner-drawer h3');
    if (bannerTitle && code === 'ja') bannerTitle.textContent = 'バナーカラープリセットを選択';
  },

  setupPwaInstall() {
    const block = $id('pwa-settings-block');
    const btn = $id('pwa-install-btn');
    if (!block || !btn) return;

    if (window.deferredPrompt) {
      block.classList.remove('hidden');
      btn.onclick = () => {
        window.deferredPrompt.prompt();
        window.deferredPrompt.userChoice.then(choice => {
          if (choice.outcome === 'accepted') {
            Toast.show('GameVerse installed!', 'success');
            block.classList.add('hidden');
          }
          window.deferredPrompt = null;
        });
      };
    } else {
      block.classList.add('hidden');
    }
  }
};

/* ---- Leaderboard Sync Module ---- */
const Leaderboard = {
  data: [],
  init() {
    this.data = LS.get('lb_data_v3', []);
    if (this.data.length === 0) {
      this.data = [
        { name: 'NeonMaster', xp: 45000, avatar: '👑', wins: 145, games: 320, gameScores: { tictactoe: 35, snake: 180, '2048': 16384, minesweeper: 42, pong: 15, memory: 9, aim: 62, reaction: 175, sudoku: 3, flappy: 85 } },
        { name: 'PixelWarrior', xp: 32000, avatar: '⚔️', wins: 98, games: 220, gameScores: { tictactoe: 22, snake: 115, '2048': 8192, minesweeper: 65, pong: 11, memory: 12, aim: 48, reaction: 210, sudoku: 2, flappy: 52 } },
        { name: 'GameQueen', xp: 21500, avatar: '👸', wins: 78, games: 195, gameScores: { tictactoe: 15, snake: 75, '2048': 4096, minesweeper: 88, pong: 8, memory: 15, aim: 35, reaction: 245, sudoku: 1, flappy: 38 } },
        { name: 'SpeedDemon', xp: 14800, avatar: '⚡', wins: 62, games: 160, gameScores: { tictactoe: 10, snake: 50, '2048': 2048, minesweeper: 110, pong: 6, memory: 18, aim: 28, reaction: 195, sudoku: 1, flappy: 25 } },
        { name: 'ArcadeKing', xp: 8200, avatar: '👾', wins: 45, games: 110, gameScores: { tictactoe: 5, snake: 32, '2048': 1024, minesweeper: 145, pong: 4, memory: 22, aim: 20, reaction: 280, sudoku: 0, flappy: 15 } },
        { name: 'PuzzlePro', xp: 4100, avatar: '🧩', wins: 32, games: 90, gameScores: { tictactoe: 3, snake: 20, '2048': 512, minesweeper: 190, pong: 2, memory: 28, aim: 12, reaction: 320, sudoku: 0, flappy: 8 } },
        { name: 'AcePlayer', xp: 2500, avatar: '🎯', wins: 18, games: 50, gameScores: { tictactoe: 1, snake: 12, '2048': 256, minesweeper: 240, pong: 1, memory: 35, aim: 8, reaction: 380, sudoku: 0, flappy: 4 } },
      ];
      LS.set('lb_data_v3', this.data);
    }
    this.syncPlayer();
  },
  syncPlayer() {
    const playerXp = XP.data.lifetimeXp;
    const name = LS.get('profileName', 'Player');
    const avatar = LS.get('profileAvatar', '👤');
    const wins = Stats.data.wins;
    const games = Stats.data.gamesPlayed;

    // Sync all game scores of player
    const gameScores = {};
    GameGrid.games.forEach(g => {
      gameScores[g.id] = Stats.data.perGame[g.id]?.bestScore || 0;
    });

    const idx = this.data.findIndex(d => d.name === name || d.isPlayer);
    if (idx >= 0) {
      this.data[idx].name = name;
      this.data[idx].xp = playerXp;
      this.data[idx].avatar = avatar;
      this.data[idx].wins = wins;
      this.data[idx].games = games;
      this.data[idx].gameScores = gameScores;
      this.data[idx].isPlayer = true;
    } else {
      this.data.push({ name, xp: playerXp, avatar, wins, games, gameScores, isPlayer: true });
    }
    this.data.sort((a, b) => b.xp - a.xp);
    LS.set('lb_data_v3', this.data);
  },
  render() {
    this.syncPlayer();
    const list = $id('lb-list');
    const top3 = $id('lb-top3');
    if (!list) return;

    const gameId = $id('lb-game')?.value || 'all';
    const isGameLeaderboard = gameId !== 'all';

    let sorted = [];
    if (!isGameLeaderboard) {
      sorted = [...this.data].sort((a, b) => b.xp - a.xp);
    } else {
      sorted = [...this.data].sort((a, b) => {
        const scoreA = a.gameScores?.[gameId] || 0;
        const scoreB = b.gameScores?.[gameId] || 0;
        
        if (scoreA === 0 && scoreB === 0) return 0;
        if (scoreA === 0) return 1;
        if (scoreB === 0) return -1;

        if (gameId === 'reaction' || gameId === 'minesweeper' || gameId === 'memory') {
          return scoreA - scoreB; // lower is better
        } else {
          return scoreB - scoreA; // higher is better
        }
      });
    }

    // Check empty state
    const topScore = isGameLeaderboard ? (sorted[0]?.gameScores?.[gameId] || 0) : sorted[0]?.xp;
    if (topScore === 0) {
      if (top3) top3.innerHTML = '';
      list.innerHTML = `
        <div class="flex flex-col items-center justify-center py-16 text-center text-white/40">
          <span class="text-5xl mb-3">🏆</span>
          <p class="text-sm font-semibold">No rankings available yet</p>
          <p class="text-xs text-white/30 mt-1">Be the first to play this game and submit a score!</p>
        </div>
      `;
      return;
    }

    const formatVal = (gid, val) => {
      if (val === 0) return '---';
      if (gid === 'reaction') return val + ' ms';
      if (gid === 'minesweeper') return val + 's';
      if (gid === 'memory') return val + ' turns';
      return val + ' pts';
    };

    if (top3 && sorted.length >= 3) {
      const top = [sorted[1], sorted[0], sorted[2]];
      const heights = ['h-24', 'h-36', 'h-18'];
      const textColors = ['text-[#00E5FF]', 'text-[#FFD54A]', 'text-[#FF4D9D]'];
      const podiumColors = ['bg-[#00E5FF]/10 border-[#00E5FF]/30', 'bg-[#FFD54A]/10 border-[#FFD54A]/30', 'bg-[#FF4D9D]/10 border-[#FF4D9D]/30'];
      const labels = ['2nd', '1st', '3rd'];

      top3.innerHTML = top.map((d, i) => {
        const scoreStr = isGameLeaderboard ? formatVal(gameId, d.gameScores?.[gameId] || 0) : d.xp.toLocaleString() + ' XP';
        return `
          <div class="flex flex-col items-center justify-end">
            <span class="text-3xl filter drop-shadow-md select-none">${d.avatar}</span>
            <span class="text-xs font-bold text-white truncate max-w-[80px] mt-1">${d.name}</span>
            <span class="text-[9px] font-bold font-mono ${textColors[i]}">${scoreStr}</span>
            <div class="w-full mt-2 rounded-t-xl border border-b-0 flex items-center justify-center font-display font-black text-lg ${heights[i]} ${podiumColors[i]} select-none shadow-lg">
              ${labels[i]}
            </div>
          </div>
        `;
      }).join('');
    }

    list.innerHTML = sorted.map((d, i) => {
      const isPlayer = d.isPlayer || d.name === LS.get('profileName', 'Player');
      const scoreStr = isGameLeaderboard ? formatVal(gameId, d.gameScores?.[gameId] || 0) : d.xp.toLocaleString() + ' XP';
      return `
        <div class="grid grid-cols-12 gap-3 px-6 py-4 items-center ${isPlayer ? 'bg-[#00E5FF]/5 border-y border-[#00E5FF]/20 shadow-inner' : ''}">
          <div class="col-span-2 text-xs font-bold text-white/50 font-mono">#${i + 1}</div>
          <div class="col-span-5 flex items-center gap-3">
            <span class="text-2xl select-none">${d.avatar}</span>
            <span class="text-xs font-bold text-white truncate font-display">${d.name}</span>
          </div>
          <div class="col-span-3 text-center text-xs text-white/40 font-bold font-mono">${d.games} games</div>
          <div class="col-span-2 text-right text-xs font-bold text-[#00E5FF] font-mono">${scoreStr}</div>
        </div>
      `;
    }).join('');

    const miniGrid = $id('mini-lb-list');
    if (miniGrid) {
      miniGrid.innerHTML = sorted.slice(0, 4).map((d, i) => {
        const scoreStr = isGameLeaderboard ? formatVal(gameId, d.gameScores?.[gameId] || 0) : d.xp.toLocaleString() + ' XP';
        return `
          <div class="flex justify-between items-center py-1.5 text-xs">
            <div class="flex items-center gap-2">
              <span class="text-white/40 font-mono">#${i + 1}</span>
              <span class="select-none">${d.avatar}</span>
              <span class="font-bold text-white max-w-[90px] truncate">${d.name}</span>
            </div>
            <span class="text-[#00E5FF] font-bold font-mono">${scoreStr}</span>
          </div>
        `;
      }).join('');
    }
  }
};

/* ---- Profile Customizer ---- */
function initProfileCustomizer() {
  const emojis = ['👤', '👾', '🚀', '👑', '🐱', '🦊', '🦁', '🐼', '🤖', '👽', '💀', '🔥', '🛡️', '⚔️', '🔮', '⚡', '🛸', '💎', '🎮', '🍀', '🌟', '🍹', '🕶️', '🪐'];
  const grid = $id('avatar-options-grid');
  if (grid) {
    grid.innerHTML = emojis.map(em => `
      <button class="avatar-opt-btn p-2 rounded-xl bg-white/5 border border-white/10 hover:border-[#00E5FF] text-2xl transition-all select-none hover:scale-110" data-emoji="${em}">${em}</button>
    `).join('');
    grid.querySelectorAll('.avatar-opt-btn').forEach(btn => {
      btn.onclick = () => {
        const em = btn.dataset.emoji;
        LS.set('profileAvatar', em);

        const pAvatar = $id('profile-avatar'); if (pAvatar) pAvatar.textContent = em;
        const dAvatar = $id('dropdown-avatar'); if (dAvatar) dAvatar.textContent = em;
        const nAvatar = $id('nav-player-avatar'); if (nAvatar) nAvatar.textContent = em;

        $id('avatar-drawer').classList.add('hidden');
        Toast.show('Avatar updated!', 'success');

        const unlockedAvatars = LS.get('purchased_avatars', []);
        if (!unlockedAvatars.includes(em)) {
          unlockedAvatars.push(em);
          LS.set('purchased_avatars', unlockedAvatars);
        }

        Achievements.check('avatar_pres_alien', em === '👽');
        Achievements.check('avatar_pres_robot', em === '🤖');
      };
    });
  }

  $id('customize-avatar-btn').onclick = () => {
    $id('avatar-drawer').classList.toggle('hidden');
    $id('banner-drawer').classList.add('hidden');
  };

  $id('customize-banner-btn').onclick = () => {
    $id('banner-drawer').classList.toggle('hidden');
    $id('avatar-drawer').classList.add('hidden');
  };

  $$('#banner-options-list button').forEach(btn => {
    btn.onclick = () => {
      const banner = $id('profile-bg-banner');
      if (banner) {
        banner.className = `h-32 bg-gradient-to-r ${btn.dataset.banner}`;
        LS.set('profile_banner', btn.dataset.banner);
        $id('banner-drawer').classList.add('hidden');
        Toast.show('Profile banner updated!', 'success');
      }
    };
  });

  let avatarClicks = 0;
  const avatarEl = $id('profile-avatar');
  if (avatarEl) {
    avatarEl.onclick = () => {
      avatarClicks++;
      Sound.reveal();
      if (avatarClicks >= 10) {
        avatarClicks = 0;
        Achievements.check('avatar_click_secret');
      }
    };
  }
}

/* ---- Game Comments Binder ---- */
function bindComments() {
  $$('.page').forEach(page => {
    const input = page.querySelector('input[placeholder="Add message..."]');
    const sendBtn = page.querySelector('button.bg-\\[\\#00D4FF\\], button.bg-\\[\\#00E5FF\\]');
    const commentBox = page.querySelector('.space-y-3.max-h-48');
    if (!input || !commentBox || !sendBtn) return;

    sendBtn.onclick = () => {
      const txt = input.value.trim();
      if (!txt) return;

      const newComment = document.createElement('div');
      newComment.className = 'p-3 bg-[#00E5FF]/10 border border-[#00E5FF]/20 rounded-xl animate-slide-in';
      newComment.innerHTML = `<span class="font-bold text-[#00E5FF] font-display">${LS.get('profileName', 'Player')}</span>: <span class="text-white/90">${txt}</span>`;

      commentBox.appendChild(newComment);
      commentBox.scrollTop = commentBox.scrollHeight;
      input.value = '';
      Sound.click();
      Toast.show('Log transmitted!', 'success');
    };

    input.onkeydown = (e) => {
      if (e.key === 'Enter') sendBtn.click();
    };
  });
}

/* ---- App Controller ---- */
const App = {
  games: {}, _lastGame: null,
  init() {
    $id('nav-player-avatar').textContent = LS.get('profileAvatar', '👤');
    $id('nav-player-name').textContent = LS.get('profileName', 'Player');
    $id('dropdown-username').textContent = LS.get('profileName', 'Player');
    $id('dropdown-avatar').textContent = LS.get('profileAvatar', '👤');

    const savedBanner = LS.get('profile_banner', 'from-[#7C3AED] via-[#00E5FF] to-[#FF4D9D]');
    const banner = $id('profile-bg-banner');
    if (banner) banner.className = `h-32 bg-gradient-to-r ${savedBanner}`;

    PageHeader.init();

    XP.init(); Stats.init(); Achievements.init(); Missions.init(); Themes.init();
    Leaderboard.init(); Sound.init(); Notifications.init(); CommandPalette.bind();
    Nav.init(); GameGrid.renderAll();

    this._bindGlobal();
    initThreeBG();
    initProfileCustomizer();
    bindComments();

    SettingsPage.applyLanguage(LS.get('lang', 'en'));

    if (typeof gsap !== 'undefined') {
      gsap.from('#sidebar', { x: -80, opacity: 0, duration: 0.6, ease: 'power3.out' });
      gsap.from('#topbar', { y: -40, opacity: 0, duration: 0.5, ease: 'power3.out', delay: 0.15 });
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      window.deferredPrompt = e;
      if (Nav.current === 'settings') SettingsPage.setupPwaInstall();
    });

    this._loading();
  },
  _loading() {
    const bar = $id('loading-bar');
    const pct = $id('loading-percentage');
    let p = 0;
    const tips = [
      'Synchronizing neural links...',
      'Calibrating neon sweeps...',
      'Populating trophies cabinet...',
      'Preheating Audio oscillator pads...',
      'Constructing command telemetry...'
    ];
    const iv = setInterval(() => {
      p += rand(4, 15);
      if (p > 100) p = 100;
      if (bar) bar.style.width = p + '%';
      if (pct) pct.textContent = p + '%';

      const tip = $id('loading-tip');
      if (tip) tip.textContent = tips[Math.floor(p / 21) % tips.length];

      if (p >= 100) {
        clearInterval(iv);
        setTimeout(() => {
          gsap.to('#loading-screen', { opacity: 0, duration: 0.5, onComplete: () => { $id('loading-screen').style.display = 'none'; } });
          Sound.startBGM();
        }, 300);
      }
    }, 120);
  },
  _bindGlobal() {
    $id('sound-btn').onclick = () => Sound.toggle();

    const handleFirstInteraction = () => {
      if (Sound.userInteracted) return;
      Sound.userInteracted = true;
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
      document.removeEventListener('pointerdown', handleFirstInteraction);

      try {
        if (!Sound.ctx) {
          Sound.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (Sound.ctx && Sound.ctx.state === 'suspended') {
          Sound.ctx.resume().catch(() => { });
        }
      } catch (e) {
        console.error("Failed to initialize AudioContext", e);
      }

      if (Sound.enabled && !Sound.bgmPlaying) {
        Sound.startBGM();
      }
    };
    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);
    document.addEventListener('pointerdown', handleFirstInteraction);

    const soundDropdown = $id('sound-dropdown');
    const soundPanel = $id('sound-panel');
    const soundBtn = $id('sound-btn');
    soundBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      soundPanel.classList.toggle('hidden');
    });
    document.addEventListener('click', (e) => {
      if (!soundDropdown.contains(e.target)) {
        soundPanel.classList.add('hidden');
      }
    });

    Sound.updateSliderUI();
    $id('bgm-volume').addEventListener('input', (e) => {
      const val = parseFloat(e.target.value) / 100;
      Sound.bgmVolume = clamp(val, 0, 1);
      LS.set('bgmVolume', Sound.bgmVolume);
      Sound.updateSliderUI();
      if (!Sound.enabled && Sound.bgmVolume > 0) {
        Sound.enabled = true;
        LS.set('sound', true);
        $$('.sound-btn, #sound-btn').forEach(b => { if (b) b.textContent = '🔊'; });
        const muteBtn = $id('sound-mute-btn');
        if (muteBtn) muteBtn.textContent = 'Mute Synth';
        if (!Sound.bgmPlaying) Sound.startBGM();
      }
    });
    $id('sfx-volume').addEventListener('input', (e) => {
      const val = parseFloat(e.target.value) / 100;
      Sound.sfxVolume = clamp(val, 0, 1);
      LS.set('sfxVolume', Sound.sfxVolume);
      Sound.updateSliderUI();
      if (!Sound.enabled && Sound.sfxVolume > 0) {
        Sound.enabled = true;
        LS.set('sound', true);
        $$('.sound-btn, #sound-btn').forEach(b => { if (b) b.textContent = '🔊'; });
        const muteBtn = $id('sound-mute-btn');
        if (muteBtn) muteBtn.textContent = 'Mute Synth';
        if (!Sound.bgmPlaying) Sound.startBGM();
      }
    });

    $id('sound-mute-btn').onclick = () => Sound.toggle();

    let searchDebounceTimer = null;
    $id('games-search')?.addEventListener('input', () => {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => GameGrid.renderAll(), 250);
    });
    $id('games-sort')?.addEventListener('change', (e) => GameGrid.renderAll(null, e.target.value));

    $$('.game-cat-btn').forEach(btn => {
      btn.onclick = () => {
        $$('.game-cat-btn').forEach(x => {
          x.className = 'game-cat-btn px-4 py-2 rounded-xl text-xs font-bold text-white/60 hover:text-white transition-all hover:bg-white/5';
        });
        btn.className = 'game-cat-btn px-4 py-2 rounded-xl text-xs font-bold text-black transition-all bg-[#00E5FF]';
        GameGrid.activeCategory = btn.dataset.cat;
        GameGrid.renderAll();
      };
    });

    $$('.achieve-filter').forEach(b => b.addEventListener('click', () => {
      $$('.achieve-filter').forEach(x => x.className = 'achieve-filter px-4 py-2 rounded-lg text-xs font-bold text-white/60 hover:text-white hover:bg-white/5 transition-all');
      b.className = 'achieve-filter px-4 py-2 rounded-lg text-xs font-bold text-white transition-all bg-white/10 active';
      Achievements.render();
    }));

    $id('settings-username-save').onclick = () => {
      const name = $id('settings-username-input').value.trim();
      if (name) {
        LS.set('profileName', name);
        $id('nav-player-name').textContent = name;
        $id('dropdown-username').textContent = name;
        $id('profile-name').textContent = name;
        Toast.show('Display credentials updated!', 'success');
        Notifications.add(`Modified profile display username to: ${name}.`);
      }
    };

    $id('settings-reset-btn').onclick = () => {
      if (confirm('Erase all progression parameters? This action is permanent.')) {
        localStorage.clear();
        Toast.show('Cockpit erased, rebooting platform...', 'success');
        setTimeout(() => location.reload(), 1000);
      }
    };

    $id('settings-export-btn').onclick = () => {
      const data = {
        xp: LS.get('xp_system'),
        achievements: LS.get('achievements_trophies'),
        stats: LS.get('stats_analytics'),
        themes: LS.get('themes_purchased'),
        avatar: LS.get('profileAvatar'),
        name: LS.get('profileName')
      };
      const json = btoa(JSON.stringify(data));
      const textarea = $id('settings-import-area');
      textarea.value = json;
      textarea.classList.remove('hidden');
      textarea.select();
      Toast.show('Backup string generated! Copy text area contents.', 'success');
    };

    $id('settings-import-btn').onclick = () => {
      const textarea = $id('settings-import-area');
      textarea.classList.remove('hidden');
      const val = textarea.value.trim();
      if (!val) {
        Toast.show('Paste export string first!', 'error');
        return;
      }
      try {
        const decoded = JSON.parse(atob(val));
        if (decoded.xp) LS.set('xp_system', decoded.xp);
        if (decoded.achievements) LS.set('achievements_trophies', decoded.achievements);
        if (decoded.stats) LS.set('stats_analytics', decoded.stats);
        if (decoded.themes) LS.set('themes_purchased', decoded.themes);
        if (decoded.avatar) LS.set('profileAvatar', decoded.avatar);
        if (decoded.name) LS.set('profileName', decoded.name);

        Toast.show('Restore successful! Re-routing platform...', 'success');
        setTimeout(() => location.reload(), 1200);
      } catch {
        Toast.show('Invalid backup string sequence!', 'error');
      }
    };

    const audioToggle = $id('settings-audio-toggle');
    if (audioToggle) {
      audioToggle.onclick = () => Sound.toggle();
    }

    $$('.faq-item').forEach(item => {
      item.onclick = () => {
        const a = item.querySelector('.faq-answer');
        const s = item.querySelector('span:last-child');
        a.classList.toggle('hidden');
        s.textContent = a.classList.contains('hidden') ? '+' : '−';
      };
    });

    $id('send-contact-btn').onclick = () => {
      Toast.show('Support request transmitted successfully!', 'success');
    };

    let kc = '';
    document.addEventListener('keydown', (e) => {
      kc += e.key; if (kc.length > 10) kc = kc.slice(-10);
      if (kc.includes('ArrowUpArrowUpArrowDownArrowDownArrowLeftArrowRightArrowLeftArrowRightba') || kc.toLowerCase().includes('arrowuparrowuparrowdownarrowdownarrowleftarrowrightarrowleftarrowrightba')) {
        kc = '';
        Achievements.check('secret_konami');
        confetti(80);
        Toast.show('🕹️ Konami Code simulation activated!', 'achievement');
      }
    });

    document.addEventListener('keydown', (e) => {
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName);

      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        CommandPalette.toggle();
      }

      if (e.key === '/' && !isInput) {
        e.preventDefault();
        CommandPalette.toggle();
      }

      if (e.key === 'Escape') {
        $id('command-palette')?.classList.remove('active');
        CommandPalette.active = false;
        $id('theme-modal')?.classList.add('hidden');
        $id('levelup-modal')?.classList.add('hidden');
      }
    });

    $$('.back-to-detail').forEach(el => {
      el.addEventListener('click', () => {
        if (GameDetail.activeGameId) {
          GameDetail.open(GameDetail.activeGameId);
        } else {
          Nav.go('games');
        }
      });
    });

    document.addEventListener('mousemove', (e) => {
      $$('.game-card-premium').forEach(card => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--x', `${x}px`);
        card.style.setProperty('--y', `${y}px`);
      });
    });
  },
  registerGame(id, impl) { this.games[id] = impl; },
  goToGame(id) {
    this._lastGame = id;
    const recent = LS.get('recent', []);
    const idx = recent.indexOf(id);
    if (idx >= 0) recent.splice(idx, 1);
    recent.unshift(id);
    LS.set('recent', recent.slice(0, 20));

    setTimeout(() => {
      Achievements.check('first_play');
      if (this.games[id]) {
        if (this.games[id].bind) this.games[id].bind();
        if (this.games[id].start) this.games[id].start();
      }
    }, 100);
  }
};

function updateGameMetaStats(gameId) {
  const page = $id(`page-${gameId}`);
  if (!page) return;
  const pgData = Stats.data.perGame[gameId] || { played: 0, wins: 0, bestScore: 0 };
  const playedEl = page.querySelector('.stat-games-played');
  if (playedEl) playedEl.textContent = pgData.played;
  const bestEl = page.querySelector('.stat-best-win') || page.querySelector('.snake-highscore') || page.querySelector('.aim-hits') || page.querySelector('.reaction-best') || page.querySelector('#tictactoe-player-score');
  if (bestEl) bestEl.textContent = pgData.bestScore;
}

// Pause all game loops when tab is hidden, resume when visible
let wasTabVisible = true;
document.addEventListener('visibilitychange', () => {
  const nowHidden = document.hidden;
  if (nowHidden && wasTabVisible) {
    // Tab became hidden - pause all active games
    Object.keys(App.games).forEach(gameId => {
      if (App.games[gameId] && App.games[gameId].pause) {
        App.games[gameId].pause();
      }
    });
  } else if (!nowHidden && !wasTabVisible) {
    // Tab became visible - resume all active games
    Object.keys(App.games).forEach(gameId => {
      if (App.games[gameId] && App.games[gameId].resume) {
        App.games[gameId].resume();
      }
    });
  }
  wasTabVisible = !nowHidden;
});

// Router Callback Hook to stop all active game loops when switching pages
window.addEventListener('hashchange', () => {
  // Stop all active games when routing away
  Object.keys(App.games).forEach(gameId => {
    if (App.games[gameId] && App.games[gameId].stop) {
      App.games[gameId].stop();
    }
  });
});

/* ---- Init all ---- */
document.addEventListener('DOMContentLoaded', () => App.init());

