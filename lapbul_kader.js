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

// --- 4. RENDER BAGIAN V (SINKRON DENGAN KUMULATIF MURNI) ---
function renderBagianV() {
    const pembagi = DATA_INIT_LAPBUL.target_pembagi || 1;
    document.getElementById("label-pembagi").innerText = pembagi;
    document.getElementById("label-pembagi2").innerText = pembagi;

    // Ambil data yang sudah dipisah dari server
    const capBln = DATA_V_SERVER.capaian_bulan || {};
    const capSd = DATA_V_SERVER.capaian_sd || {};
    const ref = DATA_V_SERVER.referensi || {};
    const ppm = ref.ppm || {};

    const totalPUS = Math.round((parseInt(ref.pus) || 0) / pembagi);
    
    let totalPPM = 0;
    let listAlkon = [];
    const alkonKeys = ["iud", "mow", "mop", "kdm", "imp", "stk", "pil"];

    alkonKeys.forEach(k => {
        const targetKader = Math.round((parseInt(ppm[k]) || 0) / pembagi);
        const baruBlnIni = Math.round((parseInt(capBln[k]) || 0) / pembagi);
        
        // JURUS PAMUNGKAS: Kumulatif Murni!
        const baruSDIni = Math.round((parseInt(capSd[k]) || 0) / pembagi); 

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
// A. FUNGSI UNTUK MEMBUKA PREVIEW (FORMAT RESMI 100% ORI)
function siapkanCetakPDF() {
    const bln = document.getElementById("lap-bulan").value;
    const thn = document.getElementById("lap-tahun").value;
    const ttd = DATA_INIT_LAPBUL.ttd_admin || {};
    const namaKader = localStorage.getItem("nama");
    const desa = localStorage.getItem("desa").toUpperCase();
    const kec = localStorage.getItem("kecamatan").toUpperCase();
    
    const getVal = (id) => document.getElementById(id) ? document.getElementById(id).value : 0;
    const area = document.getElementById("area-kertas-preview");

    // Persiapan Hitung Baris Total (JUMLAH) di Bagian V
    let sumTarget = 0, sumBln = 0, sumSd = 0, sumSisa = 0;
    let barisAlkonHTML = "";
    
    const divAlkon = document.querySelectorAll("#v-tabel-alkon > div");
    divAlkon.forEach((div, i) => {
        const spans = div.querySelectorAll("span.text-xs");
        const namaAlkon = div.querySelector("span.text-left").innerText;
        
        // Custom nama alkon agar sama persis dengan blangko
        let namaAsli = namaAlkon;
        if(namaAlkon === "KDM") namaAsli = "KONDOM";
        if(namaAlkon === "IMP") namaAsli = "IMPLANT";
        if(namaAlkon === "STK") namaAsli = "SUNTIK";
        
        const tgt = parseInt(spans[0].innerText) || 0;
        const blnIni = parseInt(spans[1].innerText) || 0;
        const sdIni = parseInt(spans[2].innerText) || 0;
        const sisa = parseInt(spans[3].innerText) || 0;

        sumTarget += tgt; sumBln += blnIni; sumSd += sdIni; sumSisa += sisa;

        barisAlkonHTML += `
            <tr>
                <td style="border:1px solid black; padding:3px;">${i+1}</td>
                <td style="border:1px solid black; padding:3px; text-align:left;">${namaAsli}</td>
                <td style="border:1px solid black; padding:3px;">${tgt}</td>
                <td style="border:1px solid black; padding:3px;">${blnIni}</td>
                <td style="border:1px solid black; padding:3px;">${sdIni}</td>
                <td style="border:1px solid black; padding:3px;">${sisa}</td>
            </tr>
        `;
    });

    // DAFTAR PERTANYAAN BAGIAN III (Telah di-Transpose)
    const labelIII = [
        "Jumlah keluarga yang menjadi sasaran kelompok kegiatan",
        "Jumlah keluarga yang menjadi anggota kelompok kegiatan",
        "Jumlah anggota kelompok kegiatan yang berstatus PUS",
        "Jumlah PUS anggota kelompok kegiatan yang menjadi peserta KB",
        "Jumlah pertemuan/penyuluhan kelompok kegiatan"
    ];

    // DAFTAR PERTANYAAN BAGIAN IV
    const labelIV = [
        "Jumlah keluarga yang menjadi anggota kelompok UPPKA",
        "Jumlah Kelompok UPPKA yang masih PUS",
        "Jumlah Kelompok UPPKA yang masih PUS ber KB",
        "Jumlah pertemuan kelompok UPPKA"
    ];

    // MULAILAH MERAKIT KERTAS ORI
    area.innerHTML = `
        <div style="font-family: Arial, sans-serif; color: black; background: white; font-size: 10px;">
            
            <!-- HEADER -->
            <div style="text-align: center; border-bottom: 2px solid black; padding-bottom: 5px; margin-bottom: 10px;">
                <h2 style="margin: 0; font-size: 14px; font-weight: bold;">LAPORAN PENGELOLAAN PROGRAM KB</h2>
                <h2 style="margin: 0; font-size: 14px; font-weight: bold;">PEMBANTU PEMBINA KELUARGA BERENCANA DESA (PPKBD)</h2>
            </div>

            <!-- IDENTITAS -->
            <table style="width: 100%; font-size: 10px; margin-bottom: 10px;">
                <tr><td width="15%">NAMA</td><td width="40%">: ${namaKader}</td><td width="45%" rowspan="4" style="text-align:right; vertical-align:bottom;">BULAN:&nbsp;&nbsp;&nbsp;${bln} ${thn}</td></tr>
                <tr><td>DESA BINAAN</td><td>: ${desa}</td></tr>
                <tr><td>KECAMATAN</td><td>: ${kec}</td></tr>
                <tr><td>KABUPATEN</td><td>: BEKASI</td></tr>
            </table>

            <!-- I. KEADAAN UMUM -->
            <p style="margin: 5px 0 2px 0;">I. &nbsp;&nbsp; KEADAAN UMUM</p>
            <table style="width:100%; border-collapse:collapse; text-align:center;">
                <tr>
                    <td style="border:1px solid black; padding:3px; width: 5%;">NO</td>
                    <td style="border:1px solid black; padding:3px; text-align:center;">URAIAN</td>
                    <td style="border:1px solid black; padding:3px; width: 20%;">JUMLAH YANG ADA</td>
                    <td style="border:1px solid black; padding:3px; width: 20%;">JUMLAH YANG DILAPORKAN</td>
                </tr>
                ${["PPKBD", "SUB PPKBD", "Kelompok KB KS", "Kelompok BKB", "Kelompok BKR", "Kelompok BKL", "Kelompok UPPKA"].map((lab, i) => `
                    <tr>
                        <td style="border:1px solid black; padding:3px;">${i+1}</td>
                        <td style="border:1px solid black; padding:3px; text-align:left;">${lab}</td>
                        <td style="border:1px solid black; padding:3px;">${getVal(`i-ada-${i}`)}</td>
                        <td style="border:1px solid black; padding:3px;">${getVal(`i-lap-${i}`)}</td>
                    </tr>
                `).join('')}
            </table>

            <!-- II. KEGIATAN OPERASIONAL -->
            <p style="margin: 10px 0 2px 0;">II. &nbsp; KEGIATAN OPERASIONAL</p>
            <table style="width:100%; border-collapse:collapse; text-align:center;">
                <tr>
                    <td style="border:1px solid black; padding:3px; width: 5%;">NO</td>
                    <td style="border:1px solid black; padding:3px; text-align:center;">KEGIATAN</td>
                    <td style="border:1px solid black; padding:3px; width: 20%;">JUMLAH</td>
                </tr>
                <tr><td style="border:1px solid black; padding:3px;">1</td><td style="border:1px solid black; padding:3px; text-align:left;">Jumlah frekuensi rapat koordinasi tingkat Desa/Kelurahan</td><td style="border:1px solid black; padding:3px;">${getVal('ii-0')}</td></tr>
                <tr><td style="border:1px solid black; padding:3px;">2</td><td style="border:1px solid black; padding:3px; text-align:left;">Jumlah frekuensi KIE/Penyuluhan</td><td style="border:1px solid black; padding:3px;">${getVal('ii-1')}</td></tr>
                <tr><td style="border:1px solid black; padding:3px;">3</td><td style="border:1px solid black; padding:3px; text-align:left;">Jumlah Tokoh masyarakat/agama yang aktif melakukan KIE KB</td><td style="border:1px solid black; padding:3px;">${getVal('ii-2')}</td></tr>
            </table>

            <!-- III. PEMBINAAN KETAHANAN KELUARGA (VERSI TRANSPOSE ORI) -->
            <p style="margin: 10px 0 2px 0;">III. PEMBINAAN KETAHANAN KELUARGA</p>
            <table style="width:100%; border-collapse:collapse; text-align:center;">
                <tr>
                    <td style="border:1px solid black; padding:3px; width: 5%;">NO</td>
                    <td style="border:1px solid black; padding:3px; text-align:center;">URAIAN</td>
                    <td style="border:1px solid black; padding:3px; width: 10%;">BKB</td>
                    <td style="border:1px solid black; padding:3px; width: 10%;">BKR</td>
                    <td style="border:1px solid black; padding:3px; width: 10%;">BKL</td>
                </tr>
                ${labelIII.map((lab, i) => `
                    <tr>
                        <td style="border:1px solid black; padding:3px;">${i+1}</td>
                        <td style="border:1px solid black; padding:3px; text-align:left;">${lab}</td>
                        <td style="border:1px solid black; padding:3px;">${getVal(`iii-bkb_${i}`)}</td>
                        <td style="border:1px solid black; padding:3px;">${getVal(`iii-bkr_${i}`)}</td>
                        <td style="border:1px solid black; padding:3px;">${getVal(`iii-bkl_${i}`)}</td>
                    </tr>
                `).join('')}
            </table>

            <!-- IV. PEMBINAAN KESEJAHTERAAN KELUARGA -->
            <p style="margin: 10px 0 2px 0;">IV. PEMBINAAN KESEJAHTERAAN KELUARGA</p>
            <table style="width:100%; border-collapse:collapse; text-align:center;">
                <tr>
                    <td style="border:1px solid black; padding:3px; width: 5%;">NO</td>
                    <td style="border:1px solid black; padding:3px; text-align:center;">URAIAN</td>
                    <td style="border:1px solid black; padding:3px; width: 20%;">JUMLAH</td>
                </tr>
                ${labelIV.map((lab, i) => `
                    <tr>
                        <td style="border:1px solid black; padding:3px;">${i+1}</td>
                        <td style="border:1px solid black; padding:3px; text-align:left;">${lab}</td>
                        <td style="border:1px solid black; padding:3px;">${getVal(`iv-${i}`)}</td>
                    </tr>
                `).join('')}
            </table>

            <!-- V. PEMBINAAN PUS DAN KESERTAAN BER KB -->
            <p style="margin: 10px 0 2px 0;">V. &nbsp; PEMBINAAN PUS DAN KESERTAAN BER KB</p>
            <table style="width:100%; border:none; margin-bottom: 5px;">
                <tr><td width="3%">1.</td><td width="35%">Jumlah pasangan usia subur (PUS)</td><td>: ${document.getElementById("v-pus").innerText}</td></tr>
                <tr><td>2.</td><td>PPM/Target peserta KB Baru</td><td>: ${document.getElementById("v-ppm").innerText}</td></tr>
            </table>

            <table style="width:100%; border-collapse:collapse; text-align:center;">
                <tr>
                    <td style="border:1px solid black; padding:3px;">NO</td>
                    <td style="border:1px solid black; padding:3px;">JENIS KONTRASEPSI</td>
                    <td style="border:1px solid black; padding:3px;">TARGET AKSEPTOR BARU</td>
                    <td style="border:1px solid black; padding:3px;">PESERTA KB BARU BULAN INI</td>
                    <td style="border:1px solid black; padding:3px;">PESERTA KB BARU S/D BULAN INI</td>
                    <td style="border:1px solid black; padding:3px;">SISA TARGET</td>
                </tr>
                ${barisAlkonHTML}
                <!-- BARIS JUMLAH -->
                <tr>
                    <td colspan="2" style="border:1px solid black; padding:3px; font-weight:bold;">JUMLAH</td>
                    <td style="border:1px solid black; padding:3px;">${sumTarget}</td>
                    <td style="border:1px solid black; padding:3px;">${sumBln}</td>
                    <td style="border:1px solid black; padding:3px;">${sumSd}</td>
                    <td style="border:1px solid black; padding:3px;">${sumSisa}</td>
                </tr>
            </table>

            <!-- TANDA TANGAN -->
            <table style="width: 100%; margin-top: 15px; text-align: left;">
                <tr>
                    <td width="60%" style="vertical-align: top;">
                        Mengetahui<br>
                        ${ttd.jabatan || 'Kepala UPTD PP Wilayah V'}<br>
                        ${ttd.wilayah || 'Kecamatan Cikarang Barat - Setu'}<br><br><br><br>
                        <b><u>${ttd.nama || '................................'}</u></b><br>
                        <b>NIP. ${ttd.nip || '................................'}</b>
                    </td>
                    <td style="vertical-align: top;">
                        Bekasi,&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${bln} ${thn}<br>
                        PPKBD ${desa}<br><br><br><br><br>
                        <b><u>${namaKader}</u></b>
                    </td>
                </tr>
            </table>
        </div>
    `;

    document.getElementById("modal-preview").classList.remove("hidden");
    document.getElementById("wadah-download-pdf").classList.remove("hidden");
}

// B. FUNGSI EKSEKUSI DOWNLOAD (TRIK GANTI NAMA FILE & VISUM MODE)
function eksekusiDownloadPDF() {
    const bln = document.getElementById("lap-bulan").value;
    const desa = localStorage.getItem("desa").toUpperCase().replace(/\s+/g, '_');
    const namaKaderFile = localStorage.getItem("nama").replace(/\s+/g, '_'); 
    
    // 1. Simpan nama halaman web yang asli
    const judulAsli = document.title;
    
    // 2. Ganti judul web sementara jadi nama file yang kita mau
    document.title = `LAPBUL_${bln}_${desa}_${namaKaderFile}`;
    
    // 3. Panggil fungsi cetak bawaan browser
    window.print();
    
    // 4. Kasih jeda 2 detik, lalu kembalikan judul web ke aslinya
    setTimeout(() => {
        document.title = judulAsli;
    }, 2000);
}

// C. FUNGSI TUTUP MODAL
function tutupPreview() {
    document.getElementById("modal-preview").classList.add("hidden");
    document.getElementById("wadah-download-pdf").classList.add("hidden");
}

function toggleSection(id) {
    const el = document.getElementById(id);
    const icon = document.getElementById("icon-" + id);
    el.classList.toggle("hidden");
    icon.innerText = el.classList.contains("hidden") ? "🔽" : "🔼";
}
