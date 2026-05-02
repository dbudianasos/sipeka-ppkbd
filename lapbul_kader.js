// ============================================================
// 📁 LAPBUL_KADER.JS - MESIN OTOMATIS LAPORAN PPKBD (SIPEKA)
// ============================================================

let DATA_INIT_LAPBUL = null;
let DATA_V_SERVER = []; // Menyimpan data AB dari Register_AB
const DAFTAR_BULAN = ["JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI", "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"];

// 1. INISIALISASI HALAMAN
document.addEventListener("DOMContentLoaded", () => {
    if (typeof cekLogin === "function") cekLogin();
    initFormLapbul();
});

function initFormLapbul() {
    const infoNama = document.getElementById("info-nama");
    const infoDesa = document.getElementById("info-desa");
    const infoKec = document.getElementById("info-kec");
    const selTahun = document.getElementById("lap-tahun");
    const selBulan = document.getElementById("lap-bulan");

    const nama = localStorage.getItem("nama");
    const desa = (localStorage.getItem("desa") || "").toUpperCase();
    const kec = (localStorage.getItem("kecamatan") || "").toUpperCase();
    const nik = localStorage.getItem("nik");

    if (infoNama) infoNama.innerText = nama;
    if (infoDesa) infoDesa.innerText = desa;
    if (infoKec) infoKec.innerText = kec;

    // Isi Tahun
    const thnSkg = new Date().getFullYear();
    let optThn = "";
    for(let y = thnSkg - 1; y <= thnSkg + 1; y++) {
        optThn += `<option value="${y}" ${y === thnSkg ? 'selected' : ''}>${y}</option>`;
    }
    selTahun.innerHTML = optThn;

    // Tarik Data Awal dari Server (Status AB, TTD, & Data Bulan Lalu)
    fetch(`${API_URL}?action=get_init_lapbul&tahun=${selTahun.value}&kecamatan=${kec}&desa=${desa}&nik=${nik}`)
    .then(res => res.json())
    .then(data => {
        DATA_INIT_LAPBUL = data;
        
        let optBln = `<option value="">-- PILIH BULAN --</option>`;
        DAFTAR_BULAN.forEach(b => {
            const status = data.status_bulan[b] || "Belum Ada";
            const isFinal = status === "Final";
            optBln += `<option value="${b}" ${!isFinal ? 'disabled class="text-slate-300"' : 'class="text-blue-900 font-bold"'}>
                ${b} ${isFinal ? '✅' : '(BELUM FINAL)'}
            </option>`;
        });
        
        selBulan.innerHTML = optBln;
        selBulan.disabled = false;
        selBulan.classList.remove("bg-slate-100", "cursor-wait");
        selBulan.classList.add("bg-white", "cursor-pointer");
    }).catch(err => {
        console.error("Gagal init form:", err);
        alert("Gagal mengambil status bulan dari server.");
    });
}

// 2. LOAD DATA SAAT BULAN DIPILIH (FIX KONEKSI BAGIAN V)
function loadDataBulanDipilih() {
    const bln = document.getElementById("lap-bulan").value;
    const thn = document.getElementById("lap-tahun").value;
    const kec = localStorage.getItem("kecamatan").toUpperCase();
    const desa = localStorage.getItem("desa").toUpperCase(); // Butuh desa untuk get_data_cetak_v

    if(!bln) {
        document.getElementById("area-form").classList.add("hidden");
        document.getElementById("wadah-tombol-cetak").classList.add("hidden");
        return;
    }

    // Tampilkan Loading
    document.getElementById("loader-lapbul").classList.remove("hidden");
    
    // SINTAKS YANG BENAR: Panggil get_data_cetak_v
    fetch(`${API_URL}?action=get_data_cetak_v&kecamatan=${kec}&desa=${desa}&tahun=${thn}&bulan=${bln}`)
    .then(res => res.json())
    .then(data => {
        DATA_V_SERVER = data; // Data masuk ke penampung
        renderSemuaSection();
        renderBagianV();
        
        // Munculkan Form
        document.getElementById("area-form").classList.remove("hidden");
        document.getElementById("wadah-tombol-cetak").classList.remove("hidden");
    })
    .catch(err => {
        console.error("Gagal load data bulan:", err);
        alert("Gagal menarik data. Pastikan koneksi stabil.");
    })
    .finally(() => {
        document.getElementById("loader-lapbul").classList.add("hidden");
    });
}

// 3. RENDER INPUT ROMAWI I - IV (FIX TAMPILAN, UX ANGKA 0, & ANTI-MINUS)
function renderSemuaSection() {
    const dLalu = DATA_INIT_LAPBUL.data_kader_lalu || {};
    
    // 💡 JURUS UX SULTAN: Hapus 0 saat fokus, balik 0 jika kosong, dan KUNCI MINIMAL 0
    const UX_ANGKA = `min="0" onfocus="if(this.value=='0') this.value='';" onblur="if(this.value=='') this.value='0';"`;

    // ==========================================
    // BAGIAN I: KEADAAN UMUM
    // ==========================================
    const labelI = ["PPKBD", "SUB PPKBD", "Kelompok KB KS", "Kelompok BKB", "Kelompok BKR", "Kelompok BKL", "Kelompok UPPKA"];
    
    let htmlI = `
        <div class="col-span-2 grid grid-cols-2 gap-3 mb-1">
            <div class="text-[9px] font-bold text-center text-slate-500 uppercase bg-slate-100 p-1.5 rounded-lg border border-slate-200">JUMLAH YANG ADA</div>
            <div class="text-[9px] font-bold text-center text-blue-600 uppercase bg-blue-50 p-1.5 rounded-lg border border-blue-200">YANG DILAPORKAN</div>
        </div>
    `;

    labelI.forEach((lab, i) => {
        const valAda = dLalu[`i_ada_${i}`] || 0;
        const valLap = dLalu[`i_lap_${i}`] || 0;
        htmlI += `
        <div class="col-span-2 text-[11px] font-black text-slate-700 uppercase mt-2 border-b border-slate-100 pb-1">${i+1}. ${lab}</div>
        <input type="number" id="i-ada-${i}" value="${valAda}" class="p-2 border border-slate-300 bg-slate-50 rounded-lg text-center font-bold text-slate-600 shadow-inner" placeholder="0" ${UX_ANGKA}>
        <input type="number" id="i-lap-${i}" value="${valLap}" class="p-2 border-2 border-blue-200 focus:border-blue-500 bg-white rounded-lg text-center font-black text-blue-900 shadow-sm" placeholder="0" ${UX_ANGKA}>`;
    });
    document.getElementById("sec-1").innerHTML = htmlI;

    // ==========================================
    // BAGIAN II: OPERASIONAL
    // ==========================================
    const labelII = ["Frekuensi Rakor Desa", "Frekuensi KIE/Penyuluhan", "Tokoh Masyarakat Aktif KIE"];
    let htmlII = "";
    labelII.forEach((lab, i) => {
        htmlII += `
        <div class="flex justify-between items-center gap-4 bg-slate-50 p-2 rounded-lg">
            <span class="text-[10px] font-bold text-slate-600 uppercase">${lab}</span>
            <input type="number" id="ii-${i}" value="${dLalu[`ii_${i}`] || 0}" class="w-16 p-2 border border-slate-300 rounded-lg text-center font-black text-blue-900" ${UX_ANGKA}>
        </div>`;
    });
    document.getElementById("sec-2").innerHTML = htmlII;

    // ==========================================
    // BAGIAN III: KETAHANAN (BKB, BKR, BKL)
    // ==========================================
    const tipeIII = ["BKB", "BKR", "BKL"];
    const labelIII = ["Sasaran Kelompok", "Anggota Kelompok", "Anggota Berstatus PUS", "PUS Anggota Peserta KB", "Frekuensi Pertemuan"];
    let htmlIII = "";
    tipeIII.forEach(t => {
        htmlIII += `<div class="bg-blue-50 p-3 rounded-xl border border-blue-100 mb-3">
            <h4 class="text-[10px] font-black text-blue-800 mb-2 uppercase">Kelompok ${t}</h4>
            <div class="space-y-2">`;
        labelIII.forEach((lab, i) => {
            const key = `${t.toLowerCase()}_${i}`;
            htmlIII += `<div class="flex justify-between items-center bg-white p-2 rounded-lg border border-blue-50 shadow-sm">
                <span class="text-[9px] font-bold text-slate-500 uppercase">${lab}</span>
                <input type="number" id="iii-${key}" value="${dLalu[`iii_${key}`] || 0}" class="w-16 p-1 border border-blue-200 rounded text-center font-bold text-blue-900" ${UX_ANGKA}>
            </div>`;
        });
        htmlIII += `</div></div>`;
    });
    document.getElementById("sec-3").innerHTML = htmlIII;

    // ==========================================
    // BAGIAN IV: UPPKA
    // ==========================================
    const labelIV = ["Anggota Kelompok UPPKA", "Kelompok UPPKA PUS", "Kelompok UPPKA PUS ber-KB", "Pertemuan UPPKA"];
    let htmlIV = "";
    labelIV.forEach((lab, i) => {
        htmlIV += `
        <div class="flex justify-between items-center bg-orange-50 p-2 rounded-lg border border-orange-100 mb-2">
            <span class="text-[10px] font-bold text-orange-800 uppercase">${lab}</span>
            <input type="number" id="iv-${i}" value="${dLalu[`iv_${i}`] || 0}" class="w-16 p-2 border border-orange-200 rounded-lg text-center font-black text-orange-900" ${UX_ANGKA}>
        </div>`;
    });
    document.getElementById("sec-4").innerHTML = htmlIV;
}

// --- 4. RENDER BAGIAN V (SINKRON DENGAN get_data_cetak_v) ---
function renderBagianV() {
    // Ambil pembagi dari data awal yang ditarik saat halaman buka
    const pembagi = DATA_INIT_LAPBUL.target_pembagi || 1;
    document.getElementById("label-pembagi").innerText = pembagi;
    document.getElementById("label-pembagi2").innerText = pembagi;

    // DATA_V_SERVER sekarang isinya adalah { capaian: {...}, referensi: {...} }
    const cap = DATA_V_SERVER.capaian || {};
    const ref = DATA_V_SERVER.referensi || {};
    const ppm = ref.ppm || {};

    // 1. Hitung PUS & Total Target yang sudah dibagi jumlah PPKBD
    const totalPUS = Math.round((parseInt(ref.pus) || 0) / pembagi);
    
    let totalPPM = 0;
    let listAlkon = [];
    const alkonKeys = ["iud", "mow", "mop", "kdm", "imp", "stk", "pil"];

    // 2. Olah data tiap Alkon
    alkonKeys.forEach(k => {
        const targetKader = Math.round((parseInt(ppm[k]) || 0) / pembagi);
        const baruBlnIni = Math.round((parseInt(cap[k]) || 0) / pembagi);
        
        // Sementara S/D ini kita samakan dengan bulan ini 
        // (Nanti bisa dikembangkan untuk tarik kumulatif murni)
        const baruSDIni = baruBlnIni; 

        listAlkon.push({
            nama: k.toUpperCase(),
            target: targetKader,
            bln_ini: baruBlnIni,
            sd_ini: baruSDIni,
            sisa: Math.max(0, targetKader - baruSDIni)
        });
        totalPPM += targetKader;
    });

    // 3. Tampilkan ke Layar
    document.getElementById("v-pus").innerText = totalPUS;
    document.getElementById("v-ppm").innerText = totalPPM;

    let htmlV = "";
    listAlkon.forEach(a => {
        htmlV += `
        <div class="bg-white p-3 rounded-xl border border-slate-100 grid grid-cols-5 text-center items-center shadow-sm mb-2">
            <span class="text-[10px] font-black text-slate-800 text-left">${a.nama}</span>
            <div class="flex flex-col"><span class="text-[7px] text-slate-400 font-bold uppercase tracking-tighter">TGT</span><span class="text-xs font-bold">${a.target}</span></div>
            <div class="flex flex-col"><span class="text-[7px] text-blue-400 font-bold uppercase tracking-tighter">BLN</span><span class="text-xs font-bold text-blue-600">${a.bln_ini}</span></div>
            <div class="flex flex-col"><span class="text-[7px] text-emerald-400 font-bold uppercase tracking-tighter">S/D</span><span class="text-xs font-bold text-emerald-600">${a.sd_ini}</span></div>
            <div class="flex flex-col"><span class="text-[7px] text-red-400 font-bold uppercase tracking-tighter">SISA</span><span class="text-xs font-bold text-red-500">${a.sisa}</span></div>
        </div>`;
    });
    document.getElementById("v-tabel-alkon").innerHTML = htmlV;
}

// 5. SIMPAN DATA I-IV KE SERVER
function simpanDraftKader() {
    const dataJSON = {};
    document.querySelectorAll('#area-form input').forEach(inp => {
        dataJSON[inp.id.replace(/-/g, '_')] = inp.value;
    });

    const payload = {
        action: "save_lapbul_kader",
        tahun: document.getElementById("lap-tahun").value,
        bulan: document.getElementById("lap-bulan").value,
        nik: localStorage.getItem("nik"),
        nama: localStorage.getItem("nama"),
        desa: localStorage.getItem("desa"),
        kecamatan: localStorage.getItem("kecamatan"),
        data_json: JSON.stringify(dataJSON)
    };

    document.getElementById("loader-lapbul").classList.remove("hidden");

    fetch(API_URL, { method: "POST", body: new URLSearchParams(payload) })
    .then(res => res.text())
    .then(res => {
        if(res === "success") alert("✅ Data Bagian I - IV Berhasil Disimpan!");
    })
    .finally(() => {
        document.getElementById("loader-lapbul").classList.add("hidden");
    });
}

// 6. GENERATE PDF (FORMAT F4)
function siapkanCetakPDF() {
    const bln = document.getElementById("lap-bulan").value;
    const thn = document.getElementById("lap-tahun").value;
    
    const area = document.getElementById("area-print");
    area.innerHTML = `
        <div style="text-align: center; border-bottom: 2px solid black; padding-bottom: 10px; margin-bottom: 20px;">
            <h2 style="margin: 0; font-size: 14px; font-weight: bold;">LAPORAN PENGELOLAAN PROGRAM KB</h2>
            <h2 style="margin: 0; font-size: 14px; font-weight: bold;">PEMBANTU PEMBINA KELUARGA BERENCANA DESA (PPKBD)</h2>
        </div>
        <table style="width: 100%; font-size: 11px; margin-bottom: 15px;">
            <tr><td width="20%">NAMA</td><td>: ${localStorage.getItem("nama")}</td><td width="20%">BULAN</td><td>: ${bln} ${thn}</td></tr>
            <tr><td>DESA BINAAN</td><td>: ${localStorage.getItem("desa")}</td></tr>
            <tr><td>KECAMATAN</td><td>: ${localStorage.getItem("kecamatan")}</td></tr>
            <tr><td>KABUPATEN</td><td>: BEKASI</td></tr>
        </table>
        <p style="text-align: center; font-weight: bold; font-size: 12px;">(Draft Laporan F4 siPeKa)</p>
    `;

    const opt = {
        margin: [10, 10],
        filename: `Lapbul_${bln}_${localStorage.getItem("desa")}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'legal', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(area).save();
}

function toggleSection(id) {
    const el = document.getElementById(id);
    const icon = document.getElementById("icon-" + id);
    el.classList.toggle("hidden");
    icon.innerText = el.classList.contains("hidden") ? "🔽" : "🔼";
}
