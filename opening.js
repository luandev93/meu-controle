(function () {
  const SOUND_KEY = 'meu-controle-opening-sound-v1';

  function playChime() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const now = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.0001, now);
      master.gain.exponentialRampToValueAtTime(0.055, now + 0.025);
      master.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);
      master.connect(ctx.destination);

      [660, 990].forEach((frequency, index) => {
        const oscillator = ctx.createOscillator();
        oscillator.type = index === 0 ? 'sine' : 'triangle';
        oscillator.frequency.value = frequency;
        oscillator.connect(master);
        oscillator.start(now);
        oscillator.stop(now + 0.34);
      });

      setTimeout(() => ctx.close().catch(() => {}), 450);
    } catch (_) {}
  }

  function showOpening() {
    if (document.getElementById('opening-screen')) return;

    const screen = document.createElement('div');
    screen.id = 'opening-screen';
    screen.innerHTML = `
      <div class="opening-mark">
        <img src="/icon-192.png" alt="">
        <div class="opening-name">MEU CONTROLE</div>
        <div class="opening-rule"></div>
      </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      #opening-screen{
        position:fixed;inset:0;z-index:99999;
        display:flex;align-items:center;justify-content:center;
        background:#050812;color:#E8EEFA;
        opacity:1;transition:opacity .28s ease;
        pointer-events:none;
      }
      #opening-screen.is-leaving{opacity:0;}
      .opening-mark{text-align:center;transform:translateY(4px) scale(.96);opacity:0;animation:opening-in .38s ease forwards;}
      .opening-mark img{width:72px;height:72px;border-radius:16px;display:block;margin:0 auto 16px;box-shadow:0 12px 35px rgba(0,0,0,.42);}
      .opening-name{font:600 11px/1 'IBM Plex Mono',monospace;letter-spacing:.22em;color:#9AA9C3;margin-left:.22em;}
      .opening-rule{width:34px;height:1px;background:#5B82C4;margin:12px auto 0;opacity:.8;}
      @keyframes opening-in{to{transform:translateY(0) scale(1);opacity:1;}}
      @media (prefers-reduced-motion:reduce){.opening-mark{animation:none;opacity:1;transform:none;}#opening-screen{transition:none;}}
    `;
    document.head.appendChild(style);
    document.body.appendChild(screen);

    playChime();

    window.setTimeout(() => {
      screen.classList.add('is-leaving');
      window.setTimeout(() => screen.remove(), 300);
    }, 520);
  }

  document.addEventListener('DOMContentLoaded', showOpening, { once: true });
})();
