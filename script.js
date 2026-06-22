const URL = "https://script.google.com/macros/s/AKfycbyAb8zvGBRMQnEqU3YaCZC3Ceme71v9cJPG-ZpgNJzodbgrx8gIqveXGEfKeuzC7Uwfrg/exec"; 

let user = {}, questions = [], kunci = [], idx = 0, answers = {}, time = 3600;

async function api(payload) {
    const r = await fetch(URL, { method: 'POST', body: JSON.stringify(payload) });
    return await r.json();
}

// DETEKSI CURANG
document.addEventListener('visibilitychange', () => {
    if (document.hidden && time > 0) alert("PERINGATAN: Dilarang pindah tab!");
});

async function auth(role) {
    const kls = document.getElementById('kelas').value;
    const res = await api({ action: 'login', kelas: kls, username: document.getElementById('username').value, password: document.getElementById('password').value, role: role });
    if (res.success) {
        user = res;
        document.getElementById('loginPage').classList.add('hidden');
        loadExam();
    } else alert(res.msg);
}

async function loadExam() {
    const config = await api({ action: 'getExamConfig', mapel: 'Informatika', tingkat: user.kelas.substring(0,1) });
    questions = await api({ action: 'fetchQuestions', url: config.pgUrl, type: 'PG' });
    kunci = questions.map(q => q.kunci);
    document.getElementById('examPage').classList.remove('hidden');
    render(0);
    startTimer();
}

function render(n) {
    idx = n; const q = questions[n];
    document.getElementById('noSoal').innerText = `Nomor ${n+1}`;
    let h = `<p class="text-xl mb-6">${q.soal}</p>`;
    ['a','b','c','d'].forEach(o => {
        const val = o.toUpperCase();
        h += `<label class="block p-3 border rounded-xl mb-2 cursor-pointer hover:bg-blue-50">
            <input type="radio" name="q" value="${val}" ${answers["PG_"+n] === val ? 'checked' : ''} onchange="save('${val}')"> ${val}. ${q[o]}
        </label>`;
    });
    document.getElementById('soalBox').innerHTML = h;
    
    document.getElementById('prev').classList.toggle('hidden', n === 0);
    document.getElementById('next').classList.toggle('hidden', n === questions.length-1);
    document.getElementById('finish').classList.toggle('hidden', n !== questions.length-1);
    
    // Peta Soal
    let p = '';
    questions.forEach((_, i) => {
        p += `<div onclick="render(${i})" class="btn-nav ${i===idx?'active':''} ${answers['PG_'+i]?'done':''}">${i+1}</div>`;
    });
    document.getElementById('petaSoal').innerHTML = p;
}

function save(v) { answers["PG_"+idx] = v; render(idx); }
function nav(s) { render(idx + s); }

function startTimer() {
    setInterval(() => {
        let m = Math.floor(time/60), s = time%60;
        document.getElementById('timer').innerText = `${m}:${s<10?'0'+s:s}`;
        if(time-- <= 0) selesai();
    }, 1000);
}

async function selesai() {
    if(confirm("Kirim jawaban sekarang?")) {
        await api({ action: 'submit', kelas: user.kelas, row: user.row, answers: answers, pgKunci: kunci });
        alert("Terima kasih, jawaban tersimpan!");
        location.reload();
    }
}