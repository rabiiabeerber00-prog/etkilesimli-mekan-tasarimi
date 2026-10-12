// ================= TEZ SİTESİ — ETKİLEŞİMLER =================
// Bölüm sayısını değiştirirseniz (index.html'e .bolum/.stage ekler/çıkarırsanız)
// scrollytelling kısmı otomatik çalışır. Metinleri index.html'den düzenleyin.

(function () {
  'use strict';

  // --- üst ilerleme çubuğu ---
  var bar = document.getElementById('progress');

  // --- scrollytelling ---
  var bolumler = document.querySelectorAll('.bolum');
  var stages = document.querySelectorAll('.stage');
  var counter = document.getElementById('stageNow');
  var activeN = 1;

  function activate(n) {
    activeN = n;
    stages.forEach(function (s) {
      s.classList.toggle('active', s.getAttribute('data-stage') === String(n));
    });
    if (counter) counter.textContent = ('0' + n).slice(-2);
    updateSeq();
  }

  // scroll ile tek tek beliren öğeler (ör. Bölüm 4 boyutları)
  function updateSeq() {
    var stage = document.querySelector('.stage[data-stage="' + activeN + '"]');
    if (!stage) return;
    var seq = stage.querySelectorAll('.seq');
    if (!seq.length) return;
    var b = document.querySelector('.bolum[data-bolum="' + activeN + '"]');
    if (!b) return;
    var r = b.getBoundingClientRect();
    var vh = window.innerHeight;
    // bölüm merkeze yaklaşırken 0 → bölüm sonu merkezden çıkarken 1
    var prog = (vh * 0.58 - r.top) / (r.height - vh * 0.15);
    prog = Math.max(0, Math.min(1, prog));
    var show = Math.ceil(prog * seq.length);
    if (show < 1) show = 1; // ilk öğe aktifken hep görünür
    seq.forEach(function (el, i) { el.classList.toggle('show', i < show); });
  }

  function onScroll() {
    if (bar) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? (window.scrollY / h * 100) : 0) + '%';
    }
    updateSeq();
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        activate(parseInt(e.target.getAttribute('data-bolum'), 10));
      }
    });
  }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });

  bolumler.forEach(function (b) { io.observe(b); });
  activate(1);
  onScroll();

  // --- dokunmatik cihazlarda kartları tıklayınca çevir ---
  document.querySelectorAll('.flip-card').forEach(function (card) {
    card.addEventListener('click', function () {
      var inner = card.querySelector('.flip-inner');
      inner.style.transform =
        inner.style.transform === 'rotateY(180deg)' ? 'rotateY(0deg)' : 'rotateY(180deg)';
    });
  });
})();


// ================= BÖLÜM 6 — ARAÇ (etkileşimli ön-gösterim) =================
// Karşılama pop-up'ı → "Başla" → arayüz. 6 boyut, her biri iki uçlu.
// Kaydırıcı bir uca kayınca o ucun DENEYİM açıklaması görünür (reçete değil).
(function () {
  'use strict';

  // --- karşılama pop-up'ı ---
  var welcome = document.getElementById('toolWelcome');
  var startBtn = document.getElementById('toolStart');
  var ui = document.getElementById('toolUi');
  if (startBtn && welcome && ui) {
    startBtn.addEventListener('click', function () {
      welcome.classList.add('hide');
      ui.classList.add('go');
      ui.setAttribute('aria-hidden', 'false');
    });
  }

  var box = document.getElementById('selectors');
  if (!box) return;

  // value 0 = sol uç, 1 = sağ uç
  var DIMS = [
    { q:'Sistem fark edilsin mi?',             l:'fark edilir', r:'fark edilmez',
      el:'Kullanıcı girince ışık belirgin şekilde değişir, dikkatini çeker',
      er:'Kullanıcı yaklaşınca ışık, o fark etmeden yavaşça değişir' },
    { q:'Tepkiyi kim başlatır?',               l:'kullanıcı',   r:'sistem',
      el:'Kullanıcı hareket edince sistem tepki verir',
      er:'Sistem kimse yokken de kendi kendine değişmeye devam eder' },
    { q:'Aynı hareket aynı sonucu mu verir?',  l:'hep aynı',    r:'değişir',
      el:'Aynı hareketi yapan herkes aynı tepkiyi görür',
      er:'Aynı hareket her seferinde farklı bir sonuç doğurur, sürpriz vardır' },
    { q:'Tepki ne hızda gelir?',               l:'anında',      r:'yavaşça',
      el:'Hareketin anında, hemen karşılığını görürsün',
      er:'Tepki yavaşça belirir, zamanla gelişir' },
    { q:'Kullanıcıyla ilişki ne kadar derin?', l:'tek yönlü',   r:'karşılıklı',
      el:'Sistem gösterir, kullanıcı izler — basit bir tepki',
      er:'Kullanıcı ile sistem birbirini besler, deneyim birlikte şekillenir' },
    { q:'Mekânla ilişkisi nasıl?',             l:'ayrı durur',  r:'gömülü',
      el:'Sistem mekâna eklenmiş bir ekran/cihaz gibi durur',
      er:'Sistem duvara, zemine, ışığa karışır — mekânın parçası olur' }
  ];

  var state = [0, 0, 0, 0, 0, 0];

  DIMS.forEach(function (d, i) {
    var row = document.createElement('div');
    row.className = 'dim';
    row.innerHTML =
      '<div class="dim-q">' + d.q + '</div>' +
      '<div class="dim-slider">' +
        '<span class="end left on">' + d.l + '</span>' +
        '<input type="range" min="0" max="1" step="1" value="0" aria-label="' + d.q + '">' +
        '<span class="end right">' + d.r + '</span>' +
      '</div>' +
      '<div class="dim-exp">' + d.el + '</div>';
    box.appendChild(row);

    var input = row.querySelector('input');
    var exp = row.querySelector('.dim-exp');
    var leftEnd = row.querySelector('.end.left');
    var rightEnd = row.querySelector('.end.right');

    input.addEventListener('input', function () {
      var v = parseInt(input.value, 10);
      state[i] = v;
      exp.textContent = v === 0 ? d.el : d.er;
      leftEnd.classList.toggle('on', v === 0);
      rightEnd.classList.toggle('on', v === 1);
      render();
    });
  });

  var glow = document.getElementById('glow');
  var device = document.getElementById('device');
  var cap = document.getElementById('sceneCap');
  var mmDot = document.getElementById('mmDot');

  function render() {
    if (glow) {
      glow.setAttribute('opacity', state[0] === 0 ? '0.42' : '0.14');
      glow.setAttribute('r', state[0] === 0 ? '52' : '66');
      glow.classList.remove('slow', 'fast');
      glow.classList.add(state[3] === 0 ? 'fast' : 'slow');
    }
    if (device) device.style.opacity = state[5] === 0 ? '1' : '0';
    if (cap) cap.textContent = state[0] === 0 ? DIMS[0].el : DIMS[0].er;
    if (mmDot) {
      mmDot.setAttribute('cx', state[0] === 0 ? 42 : 122);
      mmDot.setAttribute('cy', state[3] === 0 ? 40 : 120);
    }
  }
  render();

  var mm = document.getElementById('minimap');
  var mmToggle = document.getElementById('mmToggle');
  if (mmToggle && mm) {
    mmToggle.addEventListener('click', function () {
      mm.classList.toggle('big');
      mmToggle.textContent = mm.classList.contains('big') ? '⤡' : '⤢';
    });
  }
})();
