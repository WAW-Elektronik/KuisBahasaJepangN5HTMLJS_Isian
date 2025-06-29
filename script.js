let soalSekarang = 0;
let soalData = [];
let skor = 0;

['selectKataKerja', 'selectKataSifat', 'selectKataBenda', 'selectKanji'].forEach(id => {
  document.getElementById(id).addEventListener('change', function () {
    if (this.value) {
      const container = document.getElementById('soal-container');
      container.innerHTML = '<p>Memuat soal...</p>';
      document.getElementById('skor-akhir').innerHTML = '';
      window.soalKuis = [];
      loadSoal(this.value);
    }
  });
});

function loadSoal(kategoriPath) {
  const script = document.createElement('script');
  script.src = `Questions/${kategoriPath}.js`;
  script.onload = () => {
    const soalData = shuffleArray(window.soalKuis);
    tampilkanSoal(soalData);
  };
  document.body.appendChild(script);
}

document.addEventListener("DOMContentLoaded", () => {
  setupKeypadPopup();

  const kategoriSelect = document.getElementById("kategori");
  kategoriSelect.addEventListener("change", async () => {
    const value = kategoriSelect.value;
    if (!value) return;

    const modulePath = `./Questions/${value}`;
    try {
      const soalModule = await import(modulePath);
      if (soalModule && soalModule.default) {
        tampilkanSoal(soalModule.default);
      } else {
        console.error("Format soal tidak dikenali.");
      }
    } catch (err) {
      console.error("Gagal memuat soal:", err);
    }
  });
});

function tampilkanSoal(soalData) {
  const container = document.getElementById('soal-container');
  container.innerHTML = '';
  let skor = 0;

  soalData.forEach((soal, index) => {
    const card = document.createElement('div');
    card.className = 'soal-card';
    card.style.border = '1px solid #ccc';
    card.style.padding = '10px';
    card.style.marginBottom = '15px';

    let html = `<p><strong>Soal ${index + 1}:</strong> ${soal.pertanyaan}</p>`;
    html += `<form onsubmit="return false;" data-index="${index}">`;

    if (soal.bentukTe !== undefined) {
      html += `
        <label>Bentuk Te: <input type="text" name="bentukTe"></label><br>
        <label>Bentuk Ta: <input type="text" name="bentukTa"></label><br>
        <label>Bentuk U: <input type="text" name="bentukU"></label><br>
        <label>Bentuk Masu: <input type="text" name="bentukMasu"></label><br>
        <label>Bentuk Nai: <input type="text" name="bentukNai"></label><br>
        <label>Bentuk Volitional: <input type="text" name="bentukVolitional"></label><br>
        <label>Bentuk Imperative: <input type="text" name="bentukImperative"></label><br>
        <label>Bentuk Conditional: <input type="text" name="bentukConditional"></label><br>
      `;
    } else if (soal.kunyomi !== undefined) {
      html += `
        <label>Kunyomi: <input type="text" name="kunyomi"></label><br>
        <label>Onyomi: <input type="text" name="onyomi"></label><br>
      `;
    } else {
      html += `<label>Jawaban: <input type="text" name="jawaban"></label><br>`;
    }

    html += `<button type="button" onclick="periksaJawaban(${index})">Periksa</button>`;
    html += `</form><div id="feedback-${index}" class="feedback"></div>`;
    card.innerHTML = html;
    container.appendChild(card);
  });

  document.querySelectorAll('#soal-container input[type="text"]').forEach(input => {
    input.addEventListener('focus', () => tampilkanKeypad(input));
  });

  // simpan data untuk digunakan global
  window.__kuisSoal = soalData;
  window.__skorTotal = 0;
  window.__skorMaksimum = soalData.length;
}

function periksaJawaban(index) {
  const soal = window.__kuisSoal[index];
  const form = document.querySelector(`form[data-index="${index}"]`);
  const feedback = document.getElementById(`feedback-${index}`);
  let benar = false;

  if (soal.bentukTe !== undefined) {
    benar =
      bandingkan(form.bentukTe.value, soal.bentukTe) &&
      bandingkan(form.bentukTa.value, soal.bentukTa) &&
      bandingkan(form.bentukU.value, soal.bentukU) &&
      bandingkan(form.bentukMasu.value, soal.bentukMasu) &&
      bandingkan(form.bentukNai.value, soal.bentukNai) &&
      bandingkan(form.bentukVolitional.value, soal.bentukVolitional) &&
      bandingkan(form.bentukImperative.value, soal.bentukImperative) &&
      bandingkan(form.bentukConditional.value, soal.bentukConditional);
  } else if (soal.kunyomi !== undefined) {
    benar =
      bandingkan(form.kunyomi.value, soal.kunyomi) &&
      bandingkan(form.onyomi.value, soal.onyomi);
  } else {
    benar = bandingkan(form.jawaban.value, soal.jawaban);
  }

  if (feedback.getAttribute('data-checked')) return; // sudah diperiksa

  if (benar) {
    feedback.innerHTML = `<span style="color: green;">✔ Jawaban benar!</span>`;
    window.__skorTotal++;
  } else {
    feedback.innerHTML = `<span style="color: red;">✘ Jawaban salah.<br>Jawaban benar:<br>${jawabanBenar(soal)}</span>`;
  }

  feedback.setAttribute('data-checked', 'true');

  // Jika semua soal sudah dicek, tampilkan total skor
  const totalCek = document.querySelectorAll('.feedback[data-checked]').length;
  if (totalCek === window.__skorMaksimum) {
    const skorContainer = document.getElementById('skor-akhir');
    skorContainer.innerHTML = `<strong>Skor Akhir: ${window.__skorTotal} / ${window.__skorMaksimum}</strong>`;
  }
}

function jawabanBenar(soal) {
  if (soal.bentukTe !== undefined) {
    return `
      Te: ${soal.bentukTe}, Ta: ${soal.bentukTa}, U: ${soal.bentukU},<br>
      Masu: ${soal.bentukMasu}, Nai: ${soal.bentukNai},<br>
      Volitional: ${soal.bentukVolitional}, Imperative: ${soal.bentukImperative},<br>
      Conditional: ${soal.bentukConditional}
    `;
  } else if (soal.kunyomi !== undefined) {
    return `Kunyomi: ${soal.kunyomi}, Onyomi: ${soal.onyomi}`;
  } else {
    return soal.jawaban;
  }
}

function bandingkan(input, kunci) {
  if (!input || !kunci) return false;
  return input.trim().toLowerCase() === kunci.trim().toLowerCase();
}

function shuffleArray(array) {
  return array.sort(() => Math.random() - 0.5);
}

// Keypad Logic
const aksara = {
  hiragana: [
  'あ','い','う','え','お',
  'か','き','く','け','こ',
  'さ','し','す','せ','そ',
  'た','ち','つ','て','と',
  'な','に','ぬ','ね','の',
  'は','ひ','ふ','へ','ほ',
  'ま','み','む','め','も',
  'や','ゆ','よ',
  'ら','り','る','れ','ろ',
  'わ','を','ん',
  'が','ぎ','ぐ','げ','ご',
  'ざ','じ','ず','ぜ','ぞ',
  'だ','ぢ','づ','で','ど',
  'ば','び','ぶ','べ','ぼ',
  'ぱ','ぴ','ぷ','ぺ','ぽ',
  'ゃ','ゅ','ょ','っ','ー'
],
  katakana: [
  'ア','イ','ウ','エ','オ',
  'カ','キ','ク','ケ','コ',
  'サ','シ','ス','セ','ソ',
  'タ','チ','ツ','テ','ト',
  'ナ','ニ','ヌ','ネ','ノ',
  'ハ','ヒ','フ','ヘ','ホ',
  'マ','ミ','ム','メ','モ',
  'ヤ','ユ','ヨ',
  'ラ','リ','ル','レ','ロ',
  'ワ','ヲ','ン',
  'ガ','ギ','グ','ゲ','ゴ',
  'ザ','ジ','ズ','ゼ','ゾ',
  'ダ','ヂ','ヅ','デ','ド',
  'バ','ビ','ブ','ベ','ボ',
  'パ','ピ','プ','ペ','ポ',
  'ャ','ュ','ョ','ッ','ー'
],
  kanji: [
    '一','二','三','四','五','六','七','八','九','十','百','千','万','円','口','目','耳','手','足','力',
    '男','女','子','人','父','母','先','生','友','名','本','学','校','時','分','今','何','日','月','火',
    '水','木','金','土','曜','上','下','中','外','左','右','大','小','山','川','田','空','天','気','雨',
    '電','車','駅','社','会','国','語','読','書','聞','見','行','来','帰','食','飲','買','売','話','言',
    '立','休','入','出','開','閉','長','間','毎','週','年','先','後','高','安','新','古','白','黒','赤',
    '青','黄','南','北','東','西','前','後','朝','昼','夜','晩','時','分','秒','親','兄','姉','弟','妹',

    '医','者','病','院','所','働','仕','事','始','終','勉','強','習','遊','泳','走','歩','起','寝','着',
    '使','作','思','知','考','教','研','究','映','画','写','真','楽','歌','絵','紙','色','黒','白','茶',
    '肉','魚','鳥','牛','馬','犬','猫','虫','花','草','木','林','森','竹','石','岩','光','音','風','雪',
    '雲','星','空','海','池','湖','川','島','橋','道','門','家','屋','部','室','窓','床','机','椅','皿',
    '茶','酒','米','麦','豆','油','塩','魚','肉','野','菜','果','物','牛','豚','鳥','犬','猫','馬','虫',

    '以','界','度','建','化','制','初','助','割','費','済','税','調','談','識','験','観','議','資','産',
    '増','減','比','表','要','興','達','際','役','決','断','解','断','管','展','査','裁','党','策','論',
    '務','務','権','認','応','況','態','情','想','愛','感','憲','戦','争','戦','兵','軍','警','察','禁',
    '令','冷','苦','難','悲','笑','怒','楽','喜','変','静','眠','怖','望','夢','信','念','助','任','使',
    '便','値','貸','借','貯','費','給','財','貨','販','輸','返','届','送','迎','連','追','進','退','逃',
    '通','過','造','建','築','設','改','整','置','収','支','払','料','費','価','商','業','農','漁','製',

    '陸','港','飛','機','船','道','鉄','線','駅','速','遅','光','暗','明','暖','寒','暑','冷','重','軽',
    '低','高','短','長','浅','深','広','狭','弱','強','太','細','古','新','若','老','丸','角','直','曲',
    '画','線','点','形','色','白','黒','赤','青','黄','茶','緑','数','量','計','算','答','問','学','校'
]
};

function setupKeypadPopup() {
  const popup = document.getElementById('keypad-popup');
  popup.innerHTML = `
    <div style="margin-bottom:8px;">
      <button onclick="switchAksara('hiragana')">Hiragana</button>
      <button onclick="switchAksara('katakana')">Katakana</button>
      <button onclick="switchAksara('kanji')">Kanji</button>
    </div>
    <div id="keypad-buttons" style="display:flex; flex-wrap:wrap; gap:5px;"></div>
  `;
  switchAksara('hiragana');
}

function switchAksara(tipe) {
  const container = document.getElementById('keypad-buttons');
  container.innerHTML = '';
  aksara[tipe].forEach(char => {
    const btn = document.createElement('button');
    btn.textContent = char;
    btn.style.padding = '5px 10px';
    btn.onclick = () => {
      if (window.__inputAktif) {
        const input = window.__inputAktif;
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const value = input.value;
        input.value = value.substring(0, start) + char + value.substring(end);
        input.selectionStart = input.selectionEnd = start + 1;
        input.focus();
      }
    };
    container.appendChild(btn);
  });
}

function tampilkanKeypad(inputElem) {
  const popup = document.getElementById('keypad-popup');
  const rect = inputElem.getBoundingClientRect();
  popup.style.top = `${rect.top + window.scrollY}px`;
  popup.style.left = `${rect.right + 10 + window.scrollX}px`;
  popup.style.display = 'block';
  window.__inputAktif = inputElem;
}

// Tutup keypad jika klik di luar
document.addEventListener('click', (e) => {
  const popup = document.getElementById('keypad-popup');
  if (!popup.contains(e.target) && e.target.tagName !== 'INPUT') {
    popup.style.display = 'none';
    window.__inputAktif = null;
  }
});

document.getElementById('kategoriSelect').addEventListener('change', function () {
  const value = this.value;
  if (value) {
    const container = document.getElementById('soal-container');
    container.innerHTML = '<p>Memuat soal...</p>';
    const skorContainer = document.getElementById('skor-akhir');
    skorContainer.innerHTML = '';
    window.soalKuis = [];
    loadSoal(value);
  }
});

