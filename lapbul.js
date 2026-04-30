// ============================================================
// 📁 LAPBUL.JS - MODUL LENGKAP (MENU, AB, CU, SETTING)
// ============================================================

// --- VARIABEL GLOBAL ---
const METODE_KB = ["IUD", "MOW", "MOP", "KONDOM", "IMPLANT", "SUNTIK", "PIL"];
const METODE_CU = ["IUD", "MOW", "MOP", "KONDOM", "IMPLANT", "SUNTIK", "PIL", "HAMIL", "IAS", "IAT", "TIAL"];
let TARGET_PPM_SAAT_INI = {};

// --- INISIALISASI HALAMAN ---
document.addEventListener("DOMContentLoaded", () => {
    if (typeof cekLogin === "function") cekLogin();

    const role = localStorage.getItem("role");

    // 1. DETEKSI HALAMAN: MENU LAPBUL
    if (document.getElementById("menu-cetak")) {
        aturTampilanMenu(role);
    }

    // 2. DETEKSI HALAMAN: FORM AB & FORM CU
    if (document.getElementById("ab-bulan") || document.getElementById("cu-bulan")) {
        // Tolak Kader masuk ke form input
        if (role === "kader") {
            alert("⚠️ Akses Ditolak! Halaman input hanya untuk Admin.");
            window.location.href = "menu-lapbul.html";
            return;
        }

        document.getElementById("main-content").classList.remove("hidden");
        
        // Set tahun aktif otomatis
        if (document.getElementById("ab-tahun")) document.getElementById("ab-tahun").value = new Date().getFullYear();
        if (document.getElementById("cu-tahun")) document.getElementById("cu-tahun").value = new Date().getFullYear();
        
        // Isi dropdown desa
        isiDropdownDesaLapbul(role);
    }

    // 3. DETEKSI HALAMAN: MASTER REFERENSI (SETTING)
    if (document.getElementById("body-referensi")) {
        if (role !== "super_admin") {
            alert("⚠️ Akses Ditolak! Hanya Super Admin yang bisa mengatur Target.");
            window.location.href = "menu-lapbul.html";
            return;
        }
        loadMasterReferensi();
    }
});


// ============================================================
// A. LOGIKA MENU AKSES (ANTI-ERROR)
// ============================================================
function aturTampilanMenu() {
    const rawRole = localStorage.getItem("role") || "";
    const role = rawRole.toLowerCase().trim();
    
    console.log("Sistem mendeteksi akses sebagai:", role);

    const menuSetting = document.getElementById("menu-setting-target");
    const menuAB = document.getElementById("menu-ab");
    const menuCU = document.getElementById("menu-cu");
    const menuCetak = document.getElementById("menu-cetak");

    // 1. Logika Super Admin (Buka Semua)
    if (role === "super_admin") {
        if (menuSetting) menuSetting.classList.remove("hidden");
        if (menuAB) menuAB.classList.remove("hidden");
        if (menuCU) menuCU.classList.remove("hidden");
    } 
    // 2. Logika Admin Kecamatan (Buka Setting, AB, & CU)
    else if (role === "admin_kec" || role === "admin_kecamatan") {
        if (menuSetting) menuSetting.classList.remove("hidden"); // Pintu Setting Dibuka
        if (menuAB) menuAB.classList.remove("hidden");
        if (menuCU) menuCU.classList.remove("hidden");
    }
    // 3. Logika Admin Desa (Hanya AB & CU)
    else if (role === "admin_desa") {
        if (menuAB) menuAB.classList.remove("hidden");
        if (menuCU) menuCU.classList.remove("hidden");
    }

    if (menuCetak) menuCetak.classList.remove("hidden");
}


// ============================================================
// B. FUNGSI BERSAMA (AB & CU)
// ============================================================
function isiDropdownDesaLapbul(role) {
    const selAB = document.getElementById("ab-desa");
    const selCU = document.getElementById("cu-desa");
    const targetSel = selAB || selCU; 
    
    if (!targetSel) return;

    const myDesa = localStorage.getItem("desa");
    const listDesa = ["CIJENGKOL", "BURANGKENG", "CIBENING", "CILEDUG", "LUBANG BUAYA", "TAMAN SARI", "RAGEMANUNGGAL", "MUKTI JAYA", "KERTARAHAYU", "CIKARAGEMAN", "TAMAN RAHAYU"];

    targetSel.innerHTML = `<option value="">-- Pilih Desa --</option>`;
    
    if (role === "super_admin" || role === "admin_kec") {
        listDesa.forEach(d => { targetSel.innerHTML += `<option value="${d}">${d}</option>`; });
    } else {
        targetSel.innerHTML += `<option value="${myDesa}">${myDesa}</option>`;
        targetSel.value = myDesa;
        if (selAB) tarikTargetPPM();
        if (selCU) renderFormCU();
    }
}


// ============================================================
// C. LOGIKA REGISTER AB
// ============================================================
function tarikTargetPPM() {
    const desa = document.getElementById("ab-desa").value;
    if (!desa) return document.getElementById("container-form-ab").classList.add("hidden");

    document.getElementById("pesan-tunggu").classList.remove("hidden");
    document.getElementById("container-form-ab").classList.add("hidden");

    fetch(`${API_URL}?action=get_target_ppm&desa=${desa}`)
        .then(res => res.json())
        .then(data => {
            document.getElementById("pesan-tunggu").classList.add("hidden");
            TARGET_PPM_SAAT_INI = data.targets || {};
            renderFormAB();
            document.getElementById("container-form-ab").classList.remove("hidden");
        })
        .catch(err => {
            alert("❌ Gagal menarik Target PPM dari server.");
            document.getElementById("pesan-tunggu").classList.add("hidden");
        });
}

function renderFormAB() {
    const container = document.getElementById("matriks-alkon");
    container.innerHTML = "";

    METODE_KB.forEach(metode => {
        const target = TARGET_PPM_SAAT_INI[metode] || 0;
        container.innerHTML += `
        <div class="bg-white p-4 rounded-2xl border border-slate-200 mb-3 shadow-sm">
            <div class="flex justify-between items-center mb-3 pb-2 border-b border-slate-50">
                <span class="text-xs font-black text-blue-900 uppercase">💊 METODE: ${metode}</span>
                <span class="text-[9px] font-bold text-slate-400">TARGET PPM: ${target}</span>
            </div>
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="text-[8px] font-bold text-slate-400 block mb-1 uppercase">Pemerintah (P)</label>
                    <input type="number" id="p-${metode}" oninput="autoSumAB('${metode}')" class="w-full p-2 bg-slate-50 rounded-lg text-sm font-bold text-center border border-slate-100 outline-none focus:border-blue-500" placeholder="0">
                </div>
                <div>
                    <label class="text-[8px] font-bold text-slate-400 block mb-1 uppercase">Swasta (S)</label>
                    <input type="number" id="s-${metode}" oninput="autoSumAB('${metode}')" class="w-full p-2 bg-slate-50 rounded-lg text-sm font-bold text-center border border-slate-100 outline-none focus:border-blue-500" placeholder="0">
                </div>
                <div class="col-span-2">
                    <label class="text-[9px] font-black text-blue-600 block mb-1 uppercase text-center">Total s/d Bulan Ini (Akumulasi)</label>
                    <input type="number" id="total-${metode}" class="w-full p-3 bg-blue-50 rounded-xl text-base font-black text-center border-2 border-blue-100 text-blue-900 outline-none" placeholder="Isi Total Akhir...">
                </div>
            </div>
        </div>`;
    });
}

function autoSumAB(metode) {
    const p = parseInt(document.getElementById(`p-${metode}`).value) || 0;
    const s = parseInt(document.getElementById(`s-${metode}`).value) || 0;
    const totalField = document.getElementById(`total-${metode}`);
    if (!totalField.value || parseInt(totalField.value) < (p + s)) {
        totalField.value = p + s;
    }
}

function simpanDataAB() {
    const btn = document.getElementById("btn-simpan-ab");
    const desa = document.getElementById("ab-desa").value;
    if(!desa) return alert("Pilih desa terlebih dahulu!");

    let dataKirim = [];
    METODE_KB.forEach(metode => {
        dataKirim.push({
            metode: metode,
            target: TARGET_PPM_SAAT_INI[metode] || 0,
            hasil_p: document.getElementById(`p-${metode}`).value || 0,
            hasil_s: document.getElementById(`s-${metode}`).value || 0,
            total_sd_ini: document.getElementById(`total-${metode}`).value || 0
        });
    });

    const payload = {
        action: "submit_data_ab",
        admin_nik: localStorage.getItem("nik"),
        admin_nama: localStorage.getItem("nama"),
        admin_role: localStorage.getItem("role"),
        desa: desa,
        bulan: document.getElementById("ab-bulan").value,
        tahun: document.getElementById("ab-tahun").value,
        data_ab: JSON.stringify(dataKirim)
    };

    btn.innerText = "⏳ MENGIRIM DATA...";
    btn.disabled = true;

    fetch(API_URL, { method: "POST", body: new URLSearchParams(payload) })
    .then(res => res.text())
    .then(res => {
        if (res.trim() === "success") {
            alert("✅ DATA AB BERHASIL DISIMPAN!");
            window.location.href = "menu-lapbul.html";
        } else {
            alert("❌ GAGAL: " + res);
            btn.innerText = "SIMPAN DATA REGISTER";
            btn.disabled = false;
        }
    });
}


// ============================================================
// D. LOGIKA REGISTER CU
// ============================================================
function renderFormCU() {
    const container = document.getElementById("matriks-cu");
    const desa = document.getElementById("cu-desa").value;
    if(!desa) return document.getElementById("container-form-cu").classList.add("hidden");

    container.innerHTML = "";
    METODE_CU.forEach(metode => {
        const isKB = ["HAMIL", "IAS", "IAT", "TIAL"].indexOf(metode) === -1;
        const bgColor = isKB ? "bg-white" : "bg-orange-50";
        const textColor = isKB ? "text-emerald-900" : "text-orange-700";

        container.innerHTML += `
        <div class="${bgColor} p-4 rounded-2xl border border-slate-200 mb-3 shadow-sm">
            <p class="text-[10px] font-black ${textColor} uppercase mb-3 border-b border-slate-50 pb-2">📍 ${metode}</p>
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="text-[8px] font-bold text-slate-400 block mb-1 uppercase">Pemerintah (P)</label>
                    <input type="number" id="cu-p-${metode}" class="w-full p-2 bg-slate-50 rounded-lg text-sm font-bold text-center outline-none" placeholder="0">
                </div>
                <div>
                    <label class="text-[8px] font-bold text-slate-400 block mb-1 uppercase">Swasta (S)</label>
                    <input type="number" id="cu-s-${metode}" class="w-full p-2 bg-slate-50 rounded-lg text-sm font-bold text-center outline-none" placeholder="0">
                </div>
            </div>
        </div>`;
    });
    document.getElementById("container-form-cu").classList.remove("hidden");
}

function simpanDataCU() {
    const btn = document.getElementById("btn-simpan-cu");
    const desa = document.getElementById("cu-desa").value;
    if(!desa) return alert("Pilih desa terlebih dahulu!");

    let dataKirim = [];
    METODE_CU.forEach(metode => {
        const p = parseInt(document.getElementById(`cu-p-${metode}`).value) || 0;
        const s = parseInt(document.getElementById(`cu-s-${metode}`).value) || 0;
        dataKirim.push({ metode: metode, hasil_p: p, hasil_s: s, total_cu: p + s });
    });

    const payload = {
        action: "submit_data_cu",
        admin_nik: localStorage.getItem("nik"),
        admin_nama: localStorage.getItem("nama"),
        admin_role: localStorage.getItem("role"),
        desa: desa,
        bulan: document.getElementById("cu-bulan").value,
        tahun: document.getElementById("cu-tahun").value,
        data_cu: JSON.stringify(dataKirim)
    };

    btn.innerText = "⏳ MENYIMPAN...";
    btn.disabled = true;

    fetch(API_URL, { method: "POST", body: new URLSearchParams(payload) })
    .then(res => res.text())
    .then(res => {
        if (res.trim() === "success") {
            alert("✅ DATA CU BERHASIL DISIMPAN!");
            window.location.href = "menu-lapbul.html";
        } else {
            alert("❌ GAGAL: " + res);
            btn.innerText = "SIMPAN REGISTER CU";
            btn.disabled = false;
        }
    });
}


// ============================================================
// E. LOGIKA MASTER REFERENSI (SETTING ENTERPRISE + OTORISASI) - SETTING-TARGET.HTML
// ============================================================

let DATA_DESA_TEMP = [];
let DAFTAR_PKM = [];
let TARGET_KECAMATAN = { iud: 0, mow: 0, mop: 0, kdm: 0, imp: 0, stk: 0, pil: 0 };
const ALKON_LIST = ["iud", "mow", "mop", "kdm", "imp", "stk", "pil"];

let IS_EDIT_MODE = false; // Status apakah gembok sedang terbuka

// 1. INISIALISASI SAAT HALAMAN DIMUAT (CEK HAK AKSES & TARIK KECAMATAN)
function initSettingTarget() {
    const selectKec = document.getElementById("filter-kecamatan");
    const selectThn = document.getElementById("filter-tahun");

    // PAGAR KEAMANAN: Jika elemen ini tidak ada, berarti kita bukan di halaman Setting. STOP!
    if (!selectKec || !selectThn) return;
    
    // --- BIKIN TAHUN DINAMIS ---
    const thnSkg = new Date().getFullYear();
    let optTahun = `<option value="">-- TAHUN --</option>`;
    for(let y = thnSkg - 1; y <= thnSkg + 2; y++) { optTahun += `<option value="${y}">${y}</option>`; }
    selectThn.innerHTML = optTahun;

    const role = localStorage.getItem("role") || "";
    const kecUser = (localStorage.getItem("kecamatan") || "").toUpperCase();

    // --- TARIK DAFTAR KECAMATAN OTOMATIS DARI SPREADSHEET ---
    fetch(`${API_URL}?action=get_semua_kecamatan`)
    .then(res => res.json())
    .then(listKecamatan => {
        let opsiKec = `<option value="">-- PILIH KECAMATAN --</option>`;
        listKecamatan.forEach(k => { opsiKec += `<option value="${k}">${k}</option>`;});
        selectKec.innerHTML = opsiKec;

        // Terapkan Logika Hak Akses setelah dropdown terisi penuh
        if (role === "admin_kec" || role === "admin_kecamatan") {
            // Langsung kunci ke kecamatannya sendiri
            selectKec.value = kecUser;
            selectKec.disabled = true; 
            selectKec.classList.add("bg-slate-200", "cursor-not-allowed");

            tarikTargetPerKecamatan();
        } else if (role === "super_admin") {
            // Bebas pilih, tampilkan panel kode rahasia
            const panelKode = document.getElementById("panel-kode-rahasia");
            if (panelKode) panelKode.classList.remove("hidden");
            selectKec.addEventListener("change", updateTampilanKodeRahasia);
        }
    })
    .catch(err => {
        selectKec.innerHTML = `<option value="">-- GAGAL MEMUAT --</option>`;
        console.error("Gagal menarik data kecamatan:", err);
    });
}

// 2. GENERATOR KODE RAHASIA (TANGGAL + TAHUN + KEC + HASH)
function getKodeRahasia(kec) {
    if(!kec) return "------";
    const today = new Date();
    const d = String(today.getDate()).padStart(2, '0');
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const y = String(today.getFullYear()).slice(-2);
    // Bikin angka acak yang konsisten per hari & per kecamatan
    const hash = (today.getDate() * 7 + (today.getMonth()+1) * 3 + kec.length * 5) % 100;
    const padHash = String(hash).padStart(2, '0');
    return `${d}${m}${y}-${kec}-${padHash}`;
}

function updateTampilanKodeRahasia() {
    const kec = document.getElementById("filter-kecamatan").value;
    document.getElementById("teks-kode-rahasia").innerText = getKodeRahasia(kec);
}

// 3. TARIK DATA DARI SERVER
function tarikTargetPerKecamatan() {
    const kec = document.getElementById("filter-kecamatan").value;
    const tahun = document.getElementById("filter-tahun").value;
    const role = localStorage.getItem("role") || "";

    if(!kec || !tahun) {
        document.getElementById("wadah-utama").classList.add("hidden");
        document.getElementById("wadah-tombol-aksi").innerHTML = "";
        if(role === "super_admin") updateTampilanKodeRahasia();
        return;
    }

    if(role === "super_admin") updateTampilanKodeRahasia();

    document.getElementById("loading-pesan").classList.remove("hidden");
    document.getElementById("wadah-utama").classList.add("hidden");
    
    Promise.all([
        fetch(`${API_URL}?action=get_master_referensi`).then(res => res.json()),
        fetch(`${API_URL}?action=get_desa_by_kecamatan&kecamatan=${kec}`).then(res => res.json()),
        fetch(`${API_URL}?action=get_pkm&kecamatan=${kec}`).then(res => res.json())
    ])
    .then(([dataRefLama, listDesaWilayah, listPkm]) => {
        document.getElementById("loading-pesan").classList.add("hidden");
        
        if(listDesaWilayah.length === 0) return alert(`❌ Desa di Kecamatan ${kec} kosong!`);

        DAFTAR_PKM = listPkm;
        document.getElementById("info-pkm-terdaftar").innerText = DAFTAR_PKM.length > 0 ? DAFTAR_PKM.join(", ") : "Belum ada PKM Terdaftar";

        // Reset Target Kecamatan ke 0 dulu
        TARGET_KECAMATAN = { iud: 0, mow: 0, mop: 0, kdm: 0, imp: 0, stk: 0, pil: 0 };

        DATA_DESA_TEMP = listDesaWilayah.map(namaDesa => {
            // CARI DATA BERDASARKAN DESA, KECAMATAN, DAN TAHUN
            let existing = dataRefLama.find(x => x.desa.toUpperCase() === namaDesa && x.kecamatan.toUpperCase() === kec && x.tahun.toString() === tahun) || {};
            
            let ppm = existing.ppm || { iud: 0, mow: 0, mop: 0, kdm: 0, imp: 0, stk: 0, pil: 0 };
            
            // AUTO RESTORE TARGET DINAS: Jumlahkan dari semua desa yang ada
            ALKON_LIST.forEach(alkon => {
                TARGET_KECAMATAN[alkon] += parseInt(ppm[alkon]) || 0;
            });

            return {
                kecamatan: kec,
                tahun: tahun,
                desa: namaDesa,
                pkm: existing.pkm || "",
                pus: parseInt(existing.pus) || 0,
                unmet_need: parseInt(existing.unmet_need) || 0,
                ppm: ppm,
                jml_ppkbd: parseInt(existing.jml_ppkbd) || 1
            };
        });

        // Set status Gembok: Jika Super Admin langsung True, jika Admin Kec = False
        IS_EDIT_MODE = (role === "super_admin");

        setupTombolAksi();
        renderInputTargetKecamatan();
        renderLaciDesa();
        hitungSelisihTarget();

        document.getElementById("wadah-utama").classList.remove("hidden");
    })
    .catch(err => {
        document.getElementById("loading-pesan").classList.add("hidden");
        alert("❌ Gagal menarik data. Periksa koneksi atau console.");
        console.error(err);
    });
}

// 4. ATUR TOMBOL AKSI & GEMBOK
function setupTombolAksi() {
    const wadah = document.getElementById("wadah-tombol-aksi");
    const btnHitung = document.getElementById("btn-hitung-auto");
    const btnPkm = document.getElementById("btn-tambah-pkm");

    wadah.classList.remove("hidden");

    if (IS_EDIT_MODE) {
        // Mode Terbuka
        wadah.innerHTML = `<button onclick="simpanSemuaReferensi()" id="btn-save-ref" class="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black px-5 py-2.5 rounded-xl shadow-lg active:scale-95 transition uppercase tracking-widest">💾 Simpan Perubahan</button>`;
        btnHitung.classList.remove("hidden");
        btnPkm.classList.remove("hidden");
    } else {
        // Mode Terkunci
        wadah.innerHTML = `<button onclick="mintaAksesEdit()" class="bg-orange-500 hover:bg-orange-400 text-white text-[10px] font-black px-5 py-2.5 rounded-xl shadow-lg active:scale-95 transition uppercase tracking-widest flex items-center gap-2"><span>🔒</span> Minta Akses Edit</button>`;
        btnHitung.classList.add("hidden");
        btnPkm.classList.add("hidden");
    }
}

// 5. PROSES MINTA KODE AKSES
function mintaAksesEdit() {
    const kec = document.getElementById("filter-kecamatan").value;
    const kodeAsli = getKodeRahasia(kec);
    
    let input = prompt(`Silakan hubungi Super Admin untuk meminta Kode Akses Edit data Kecamatan ${kec} hari ini.\n\nMasukkan Kode:`);
    
    if (input === null) return; // Batal
    
    if (input.toUpperCase().trim() === kodeAsli) {
        alert("✅ Akses Diberikan! Gembok data telah dibuka.");
        IS_EDIT_MODE = true;
        setupTombolAksi();
        renderInputTargetKecamatan();
        renderLaciDesa();
    } else {
        alert("❌ Kode Salah! Akses ditolak.");
    }
}

// 6. TAMBAH PKM BARU KECAMATAN
function tambahPKMBaru() {
    const kec = document.getElementById("filter-kecamatan").value;
    let pkmBaru = prompt(`Masukkan Nama PKM Baru untuk Kecamatan ${kec}:\n(Contoh: SETU I)`);
    
    if(!pkmBaru || pkmBaru.trim() === "") return;
    pkmBaru = pkmBaru.toUpperCase().trim();

    const btn = document.getElementById("btn-tambah-pkm");
    btn.innerText = "⏳ Menyimpan...";
    btn.disabled = true;

    const payload = { action: "save_pkm", kecamatan: kec, pkm: pkmBaru };
    
    fetch(API_URL, { method: "POST", body: new URLSearchParams(payload) })
    .then(res => res.text())
    .then(res => {
        if(res === "success") {
            DAFTAR_PKM.push(pkmBaru);
            document.getElementById("info-pkm-terdaftar").innerText = DAFTAR_PKM.join(", ");
            renderLaciDesa(); // Update dropdown di laci
            alert(`✅ PKM ${pkmBaru} berhasil ditambahkan!`);
        }
        btn.innerText = "➕ Tambah PKM";
        btn.disabled = false;
    });
}

// --- RENDER INPUT TARGET DINAS ---
function renderInputTargetKecamatan() {
    let html = "";
    let state = IS_EDIT_MODE ? "" : "disabled";
    let css = IS_EDIT_MODE ? "bg-blue-50 focus:border-blue-500 text-blue-900" : "bg-slate-100 text-slate-400 cursor-not-allowed";

    ALKON_LIST.forEach(alkon => {
        html += `
        <div>
            <label class="text-[8px] font-bold text-slate-400 uppercase block mb-1">${alkon}</label>
            <input type="number" id="kec-${alkon}" value="${TARGET_KECAMATAN[alkon]}" oninput="updateTargetKecGlobal('${alkon}')" ${state} class="w-full p-2 border border-slate-200 rounded-lg text-center font-black outline-none ${css}">
        </div>`;
    });
    document.getElementById("input-target-dinas").innerHTML = html;
}

function updateTargetKecGlobal(alkon) {
    TARGET_KECAMATAN[alkon] = parseInt(document.getElementById(`kec-${alkon}`).value) || 0;
    hitungSelisihTarget();
}

// --- AUTO 50:50 ---
function hitungAutoDistribusi() {
    let totalPUS = DATA_DESA_TEMP.reduce((sum, d) => sum + d.pus, 0);
    let totalUnmet = DATA_DESA_TEMP.reduce((sum, d) => sum + d.unmet_need, 0);

    if (totalPUS === 0 || totalUnmet === 0) return alert("⚠️ Gagal: Harap isi PUS dan Unmet Need desa terlebih dahulu.");

    DATA_DESA_TEMP.forEach(d => {
        let pPUS = d.pus / totalPUS;
        let pUnmet = d.unmet_need / totalUnmet;
        ALKON_LIST.forEach(alkon => {
            d.ppm[alkon] = Math.round((0.5 * TARGET_KECAMATAN[alkon] * pPUS) + (0.5 * TARGET_KECAMATAN[alkon] * pUnmet));
        });
    });
    renderLaciDesa(); hitungSelisihTarget();
    alert("✅ Distribusi 50:50 Berhasil!");
}

// --- RENDER LACI DESA (DENGAN DROPDOWN PKM & READ ONLY STATE) ---
function renderLaciDesa() {
    const container = document.getElementById("panel-desa");
    container.innerHTML = "";
    
    let state = IS_EDIT_MODE ? "" : "disabled";
    let cssInput = IS_EDIT_MODE ? "bg-white text-slate-800 border-slate-200" : "bg-slate-100 text-slate-500 border-slate-100 cursor-not-allowed";

    DATA_DESA_TEMP.forEach((d, index) => {
        
        // Buat Opsi Dropdown PKM
        let opsiPKM = `<option value="">--Pilih PKM--</option>`;
        DAFTAR_PKM.forEach(p => {
            let sel = (d.pkm === p) ? "selected" : "";
            opsiPKM += `<option value="${p}" ${sel}>${p}</option>`;
        });

        container.innerHTML += `
        <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div onclick="toggleLaci(${index})" class="bg-slate-50 p-4 flex justify-between items-center cursor-pointer hover:bg-blue-50 transition">
                <div>
                    <h3 class="font-black text-slate-800 uppercase text-sm">${d.desa}</h3>
                    <p class="text-[9px] font-bold text-slate-400 mt-0.5">PUS: ${d.pus} | Unmet: ${d.unmet_need} | PKM: ${d.pkm || '-'}</p>
                </div>
                <div class="bg-white p-2 rounded-lg border border-slate-200 shadow-sm text-lg" id="icon-laci-${index}">✏️</div>
            </div>
            
            <div id="isi-laci-${index}" class="hidden p-4 border-t border-slate-100 bg-white">
                <div class="grid grid-cols-3 gap-3 mb-4">
                    <div>
                        <label class="text-[9px] font-bold text-slate-400 block mb-1">PKM PEMBINA</label>
                        <select id="laci-pkm-${index}" onchange="simpanDataLaci(${index})" ${state} class="w-full p-2 border rounded-lg text-xs font-bold uppercase text-center ${cssInput}">
                            ${opsiPKM}
                        </select>
                    </div>
                    <div>
                        <label class="text-[9px] font-bold text-slate-400 block mb-1">TOTAL PUS</label>
                        <input type="number" id="laci-pus-${index}" value="${d.pus}" oninput="simpanDataLaci(${index})" ${state} class="w-full p-2 border rounded-lg text-xs font-black text-center ${IS_EDIT_MODE ? 'bg-blue-50 text-blue-900 border-blue-100' : cssInput}">
                    </div>
                    <div>
                        <label class="text-[9px] font-bold text-orange-500 block mb-1">UNMET NEED</label>
                        <input type="number" id="laci-unmet-${index}" value="${d.unmet_need}" oninput="simpanDataLaci(${index})" ${state} class="w-full p-2 border rounded-lg text-xs font-black text-center ${IS_EDIT_MODE ? 'bg-orange-50 text-orange-900 border-orange-100' : cssInput}">
                    </div>
                </div>

                <p class="text-[9px] font-black text-slate-800 mb-2 border-b pb-1">TARGET DESA (PPM) - OTOMATIS PAKAI RUMUS </p>
                <div class="grid grid-cols-4 md:grid-cols-7 gap-2">
                    ${ALKON_LIST.map(alkon => `
                    <div>
                        <label class="text-[8px] font-bold text-slate-400 block mb-1 uppercase text-center">${alkon}</label>
                        <input type="number" id="laci-${alkon}-${index}" value="${d.ppm[alkon]}" oninput="simpanDataLaci(${index})" ${state} class="w-full p-2 border rounded-lg text-xs font-bold text-center ${cssInput}">
                    </div>`).join('')}
                </div>

                <div class="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                    <label class="text-[9px] font-bold text-slate-400 w-full">JUMLAH PPKBD (PEMBAGI CETAK):</label>
                    <input type="number" id="laci-ppkbd-${index}" value="${d.jml_ppkbd}" oninput="simpanDataLaci(${index})" ${state} class="w-20 p-2 border rounded-lg text-xs font-bold text-center ${cssInput}">
                </div>
            </div>
        </div>`;
    });
}

function toggleLaci(index) {
    const laci = document.getElementById(`isi-laci-${index}`);
    const icon = document.getElementById(`icon-laci-${index}`);
    if (laci.classList.contains("hidden")) {
        laci.classList.remove("hidden");
        icon.innerText = "🔼";
    } else {
        laci.classList.add("hidden");
        icon.innerText = "✏️";
    }
}

function simpanDataLaci(index) {
    DATA_DESA_TEMP[index].pkm = document.getElementById(`laci-pkm-${index}`).value;
    DATA_DESA_TEMP[index].pus = parseInt(document.getElementById(`laci-pus-${index}`).value) || 0;
    DATA_DESA_TEMP[index].unmet_need = parseInt(document.getElementById(`laci-unmet-${index}`).value) || 0;
    DATA_DESA_TEMP[index].jml_ppkbd = parseInt(document.getElementById(`laci-ppkbd-${index}`).value) || 1;

    ALKON_LIST.forEach(alkon => {
        DATA_DESA_TEMP[index].ppm[alkon] = parseInt(document.getElementById(`laci-${alkon}-${index}`).value) || 0;
    });

    hitungSelisihTarget();
}

function hitungSelisihTarget() {
    const wadah = document.getElementById("wadah-indikator");
    wadah.innerHTML = "";

    ALKON_LIST.forEach(alkon => {
        let selisih = TARGET_KECAMATAN[alkon] - DATA_DESA_TEMP.reduce((sum, d) => sum + d.ppm[alkon], 0);
        let warnaBg = selisih === 0 ? "bg-green-100" : (selisih > 0 ? "bg-yellow-100" : "bg-red-100");
        let warnaTeks = selisih === 0 ? "text-green-800" : (selisih > 0 ? "text-yellow-800" : "text-red-800");

        wadah.innerHTML += `
        <div class="flex flex-col items-center justify-center p-2 rounded-xl ${warnaBg}">
            <span class="text-[8px] font-black uppercase tracking-widest ${warnaTeks}">${alkon}</span>
            <span class="text-sm font-black ${warnaTeks}">${selisih > 0 ? '+' : ''}${selisih}</span>
        </div>`;
    });
}

// 7. SIMPAN DATA KE SERVER (DENGAN TAHUN)
function simpanSemuaReferensi() {
    const btn = document.getElementById("btn-save-ref");
    const tahun = document.getElementById("filter-tahun").value;
    const kec = document.getElementById("filter-kecamatan").value;

    const payload = {
        action: "save_master_referensi",
        tahun: tahun,
        kecamatan: kec,
        admin_nik: localStorage.getItem("nik"),
        admin_nama: localStorage.getItem("nama"),
        admin_role: localStorage.getItem("role"),
        data_json: JSON.stringify(DATA_DESA_TEMP)
    };

    btn.innerText = "⏳ MENYIMPAN..."; btn.disabled = true;

    fetch(API_URL, { method: "POST", body: new URLSearchParams(payload) })
    .then(res => res.text())
    .then(res => {
        if(res.trim() === "success") {
            alert(`✅ TARGET TAHUN ${tahun} BERHASIL DISIMPAN!`);
            // Kembalikan status gembok jika bukan super admin
            if(localStorage.getItem("role") !== "super_admin") {
                IS_EDIT_MODE = false;
            }
            tarikTargetPerKecamatan(); 
        } else {
            alert("❌ Gagal menyimpan.");
            btn.innerText = "💾 Simpan Perubahan"; btn.disabled = false;
        }
    });
}

// ============================================================
// F. LOGIKA REGISTER AB (FIXED: REKAP & DYNAMIC PKM)
// ============================================================

let DATA_AB_TEMP = []; 
let TARGET_PPM_VILLAGE = []; 
let IS_EDIT_MODE_AB = false;

// --- 1. HITUNG TREN TARGET BULANAN (%) ---
function getPersentaseBulan(bulan) {
    const tren = {
        "JANUARI": 0.075, "FEBRUARI": 0.075, "MARET": 0.075, "APRIL": 0.075,
        "MEI": 0.10, "JUNI": 0.10,
        "JULI": 0.08, "AGUSTUS": 0.08,
        "SEPTEMBER": 0.12,
        "OKTOBER": 0.08, "NOVEMBER": 0.08, "DESEMBER": 0.09 
    };
    return tren[bulan.toUpperCase()] || 0.083;
}

// --- 2. INISIALISASI HALAMAN ---
function initKhususAB() {
    const selectKec = document.getElementById("ab-kecamatan");
    const selectThn = document.getElementById("ab-tahun");
    const selectBln = document.getElementById("ab-bulan");
    if (!selectKec || !selectThn) return;

    const thnSkg = new Date().getFullYear();
    let optTahun = "";
    for(let y = thnSkg - 1; y <= thnSkg + 2; y++) { 
        optTahun += `<option value="${y}" ${y === thnSkg ? 'selected' : ''}>${y}</option>`; 
    }
    selectThn.innerHTML = optTahun;
    
    const daftarBulan = ["JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI", "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"];
    selectBln.value = daftarBulan[new Date().getMonth()];

    fetch(`${API_URL}?action=get_semua_kecamatan`)
    .then(res => res.json()).then(listKecamatan => {
        let opsiKec = `<option value="">-- PILIH KECAMATAN --</option>`;
        listKecamatan.forEach(k => { opsiKec += `<option value="${k}">${k}</option>`; });
        selectKec.innerHTML = opsiKec;

        const role = (localStorage.getItem("role") || "").toLowerCase();
        if (role.includes("admin_kec") || role.includes("admin_desa")) {
            selectKec.value = (localStorage.getItem("kecamatan") || "").toUpperCase();
            selectKec.disabled = true;
            selectKec.classList.add("bg-slate-200");
            initDataAB();
        }
    });
}

// --- 3a. SETUP TOMBOL UTAMA (SINGLE BUTTON STYLE) ---
function setupTombolAksiAB() {
    const wadah = document.getElementById("wadah-tombol-ab");
    if (!wadah) return;

    if (IS_EDIT_MODE_AB) {
        // Hanya satu tombol Simpan sesuai arahan Bapak
        wadah.innerHTML = `
            <button onclick="bukaModalSimpan()" class="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black px-6 py-2 rounded-xl border border-white/20 transition active:scale-95 uppercase tracking-widest flex items-center gap-2">
                <span>💾</span> Simpan
            </button>
        `;
    } else {
        // Tombol Buka Akses yang lebih sleek
        wadah.innerHTML = `
            <button onclick="mintaAksesEditAB()" class="bg-orange-500 hover:bg-orange-400 text-white text-[10px] font-black px-5 py-2 rounded-xl shadow-lg shadow-orange-900/20 transition active:scale-95 flex items-center gap-2 uppercase tracking-tighter">
                <span>🔒</span> Buka Akses
            </button>
        `;
    }
}

// --- 3b. KONTROL MODAL PILIHAN SIMPAN ---
function bukaModalSimpan() {
    const modal = document.getElementById("modal-pilihan-simpan");
    const content = document.getElementById("content-modal-simpan");
    if(!modal) return;

    modal.classList.remove("hidden");
    setTimeout(() => {
        content.classList.remove("scale-95", "opacity-0");
        content.classList.add("scale-100", "opacity-100");
    }, 10);
}

function tutupModalSimpan() {
    const modal = document.getElementById("modal-pilihan-simpan");
    const content = document.getElementById("content-modal-simpan");
    if(!modal) return;

    content.classList.remove("scale-100", "opacity-100");
    content.classList.add("scale-95", "opacity-0");
    setTimeout(() => {
        modal.classList.add("hidden");
    }, 300);
}

// --- 3c. EKSEKUSI SIMPAN DARI MODAL ---
function eksekusiSimpan(status) {
    tutupModalSimpan();
    // Pastikan Bapak sudah punya fungsi prosesSimpanAB di lapbul.js
    if (typeof prosesSimpanAB === "function") {
        prosesSimpanAB(status);
    } else {
        alert("Fungsi prosesSimpanAB belum siap!");
    }
}

// --- 4. PROSES MINTA KODE AKSES ---
function mintaAksesEditAB() {
    const kec = document.getElementById("ab-kecamatan").value;
    if (!kec) return alert("Pilih Kecamatan terlebih dahulu!");

    // Pastikan fungsi getKodeRahasia(kec) sudah ada di script.js Bapak
    const kodeAsli = (typeof getKodeRahasia === "function") ? getKodeRahasia(kec) : "1234"; 
    
    let input = prompt(`Masukkan Kode Otorisasi Edit AB Kecamatan ${kec}:`);
    if (input === null) return;
    
    if (input.toUpperCase().trim() === kodeAsli) {
        alert("✅ Akses Diberikan! Gembok data telah dibuka.");
        IS_EDIT_MODE_AB = true;
        setupTombolAksiAB();
        renderLaciAB(); // Render ulang agar inputan tidak disabled
    } else {
        alert("❌ Kode Salah! Akses ditolak.");
    }
}

// --- 3. TARIK DATA DARI SERVER ---
function initDataAB() {
    const thn = document.getElementById("ab-tahun").value;
    const bln = document.getElementById("ab-bulan").value;
    const kec = document.getElementById("ab-kecamatan").value;
    if (!thn || !bln || !kec) return;

    document.getElementById("loader-ab").classList.remove("hidden");
    document.getElementById("container-laci-ab").innerHTML = "";

    IS_EDIT_MODE_AB = (localStorage.getItem("role") === "super_admin");
    setupTombolAksiAB();

    Promise.all([
        fetch(`${API_URL}?action=get_master_referensi`).then(res => res.json()),
        fetch(`${API_URL}?action=get_register_ab&kecamatan=${kec}&tahun=${thn}&bulan=${bln}`).then(res => res.json())
    ])
    .then(([allTargets, savedData]) => {
        TARGET_PPM_VILLAGE = allTargets.filter(t => t.kecamatan.toUpperCase() === kec.toUpperCase() && t.tahun.toString() === thn.toString());

        if (TARGET_PPM_VILLAGE.length === 0) {
            alert(`⚠️ Target PPM Tahun ${thn} belum tersedia.`);
            document.getElementById("loader-ab").classList.add("hidden");
            return;
        }

        DATA_AB_TEMP = TARGET_PPM_VILLAGE.map(target => {
            let exist = savedData.find(s => s.desa.toUpperCase() === target.desa.toUpperCase()) || {};
            let obj = { 
                desa: target.desa, target_ori: target.ppm, pkm: target.pkm, pus: target.pus, 
                status: exist.status || "Draft", kumulatif_lalu: exist.kumulatif_lalu || 0 
            };
            METODE_KB.forEach(m => {
                let key = m.toLowerCase();
                obj[`${key}_p`] = exist[`${key}_p`] || 0;
                obj[`${key}_s`] = exist[`${key}_s`] || 0;
            });
            return obj;
        });

        document.getElementById("loader-ab").classList.add("hidden");
        updateStatusBarAB(); // Munculkan Dashboard PKM
        renderLaciAB();      // Munculkan Laci Desa
    });
}

// --- 4. RENDER LACI DESA ---
function renderLaciAB() {
    const container = document.getElementById("container-laci-ab");
    const thn = document.getElementById("ab-tahun").value;
    const bln = document.getElementById("ab-bulan").value;
    container.innerHTML = "";
    const role = (localStorage.getItem("role") || "").toLowerCase();

    DATA_AB_TEMP.forEach((d, idx) => {
        let totalAB_Bulan = 0;
        METODE_KB.forEach(m => totalAB_Bulan += (parseInt(d[m.toLowerCase()+'_p']) || 0) + (parseInt(d[m.toLowerCase()+'_s']) || 0));

        let totalAB_JanBulan = totalAB_Bulan + (d.kumulatif_lalu || 0);
        let ppmTahunan = Object.values(d.target_ori).reduce((a,b) => a+b, 0);
        let targetBulanIni = Math.round(ppmTahunan * getPersentaseBulan(bln));
        let capBulan = targetBulanIni > 0 ? ((totalAB_Bulan / targetBulanIni) * 100).toFixed(1) : 0;
        let progresTahun = ppmTahunan > 0 ? ((totalAB_JanBulan / ppmTahunan) * 100).toFixed(1) : 0;

        const isFinal = d.status === "Final";
        const isLocked = isFinal && (role !== "super_admin" || !IS_EDIT_MODE_AB);
        const dot = `<span class="inline-block w-1 h-1 rounded-full mx-1.5 bg-slate-300"></span>`;

        container.innerHTML += `
        <div class="bg-white rounded-[2rem] border ${isFinal ? 'border-emerald-100' : 'border-slate-100'} overflow-hidden shadow-sm mb-4">
            <div onclick="toggleLaciAB(${idx})" class="p-5 flex justify-between items-center cursor-pointer hover:bg-slate-50/50">
                <div class="flex flex-col">
                    <div class="flex items-center gap-2">
                        <h3 class="font-black text-slate-800 text-sm uppercase">${d.desa}</h3>
                        <span class="text-[7px] px-2 py-0.5 rounded-full font-black border ${isFinal ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'} uppercase">${d.status || 'DRAFT'}</span>
                    </div>
                    <div class="flex flex-wrap items-center mt-1.5 text-[8.5px] font-bold text-slate-400 uppercase tracking-tighter">
                        <span class="text-blue-600">PPM ${thn}: ${ppmTahunan}</span> ${dot}
                        <span>AB ${bln}: ${totalAB_Bulan}</span> ${bln !== 'JANUARI' ? `${dot} <span>Jan-${bln}: ${totalAB_JanBulan}</span>` : ''} ${dot}
                        <span class="${capBulan >= 100 ? 'text-emerald-500' : 'text-orange-500'}">Cap: ${capBulan}%</span> ${dot}
                        <span class="text-slate-800">Prog: ${progresTahun}%</span>
                    </div>
                </div>
                <div id="icon-laci-ab-${idx}" class="w-9 h-9 flex items-center justify-center rounded-2xl bg-slate-50 text-blue-300">🔽</div>
            </div>
            <div id="isi-laci-ab-${idx}" class="hidden p-5 border-t border-slate-50 bg-slate-50/10">
                <div class="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    ${METODE_KB.map(m => {
                        let k = m.toLowerCase();
                        let tBln = Math.round((d.target_ori[k] || 0) * getPersentaseBulan(bln));
                        return renderKotakAlkon(m, k, d, tBln, idx, isLocked); //
                    }).join('')}
                </div>
            </div>
        </div>`;
    });
}

// --- 5. HELPER: RENDER KOTAK ALKON ---
function renderKotakAlkon(m, k, d, tBln, idx, isLocked) {
    const isSpec = (m === "MOW" || m === "MOP");
    const cssInput = isLocked ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed" : "bg-white border-slate-100 text-blue-900";
    return `
    <div class="bg-white p-3 rounded-2xl border ${isSpec ? 'border-orange-100 bg-orange-50/5' : 'border-slate-100'} shadow-sm">
        <div class="flex justify-between items-center mb-2">
            <span class="text-[9px] font-black ${isSpec ? 'text-orange-600' : 'text-slate-800'} uppercase">${m}</span>
            <span class="text-[8px] font-bold text-blue-500">T: ${tBln}</span>
        </div>
        <div class="grid grid-cols-2 gap-2">
            <input type="number" id="p-${k}-${idx}" value="${d[k+'_p']}" oninput="updatePS_AB('${k}', ${idx})" ${isLocked ? 'disabled' : ''} class="w-full p-2 border rounded-xl text-[11px] font-black text-center outline-none ${cssInput}" placeholder="P">
            <input type="number" id="s-${k}-${idx}" value="${d[k+'_s']}" oninput="updatePS_AB('${k}', ${idx})" ${isLocked ? 'disabled' : ''} class="w-full p-2 border rounded-xl text-[11px] font-black text-center outline-none ${cssInput}" placeholder="S">
        </div>
    </div>`;
}

// --- 6. UPDATE DASHBOARD (PKM & KECAMATAN) ---
function updateStatusBarAB() {
    const wadah = document.getElementById("indikator-target-bulan");
    const bln = document.getElementById("ab-bulan").value;
    const kec = document.getElementById("ab-kecamatan").value;
    let rekapPKM = {};
    let totalKec = { capaian: 0, target: 0 };

    DATA_AB_TEMP.forEach(d => {
        let ppmTahunan = Object.values(d.target_ori).reduce((a,b) => a+b, 0);
        let tBln = Math.round(ppmTahunan * getPersentaseBulan(bln));
        let abBln = 0;
        METODE_KB.forEach(m => abBln += (parseInt(d[m.toLowerCase()+'_p']) || 0) + (parseInt(d[m.toLowerCase()+'_s']) || 0));

        totalKec.capaian += abBln;
        totalKec.target += tBln;

        if(!rekapPKM[d.pkm]) rekapPKM[d.pkm] = { capaian: 0, target: 0 };
        rekapPKM[d.pkm].capaian += abBln;
        rekapPKM[d.pkm].target += tBln;
    });

    let html = `
    <div class="col-span-full mb-2 p-4 bg-blue-900 rounded-3xl text-white shadow-lg shadow-blue-200">
        <p class="text-[8px] font-black uppercase opacity-60 mb-1">Seluruh Kecamatan ${kec}</p>
        <div class="flex justify-between items-end">
            <h4 class="text-xl font-black">${totalKec.capaian} <span class="text-[10px] opacity-50">/ ${totalKec.target} AB</span></h4>
            <span class="text-xs font-black bg-white/20 px-3 py-1 rounded-full">${totalKec.target > 0 ? ((totalKec.capaian/totalKec.target)*100).toFixed(1) : 0}%</span>
        </div>
    </div>`;

    Object.keys(rekapPKM).forEach(pkm => {
        let p = rekapPKM[pkm];
        let persen = p.target > 0 ? ((p.capaian / p.target) * 100).toFixed(1) : 0;
        html += `
        <div class="col-span-2 md:col-span-1 p-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
            <p class="text-[7px] font-black text-slate-400 uppercase mb-1 truncate">${pkm}</p>
            <div class="flex justify-between items-center">
                <span class="text-sm font-black text-slate-800">${p.capaian}</span>
                <span class="text-[9px] font-black text-blue-600">${persen}%</span>
            </div>
        </div>`;
    });
    wadah.innerHTML = html;
    document.getElementById("status-bar-ab").classList.remove("hidden");
}

// ---7. FUNGSI UNTUK MEMBUKA & MENUTUP LACI ---
function toggleLaciAB(idx) {
    const isi = document.getElementById(`isi-laci-ab-${idx}`);
    const icon = document.getElementById(`icon-laci-ab-${idx}`);
    
    if (!isi) return; // Jika elemen tidak ditemukan, berhenti agar tidak error

    // 1. Toggle (Buka/Tutup) konten laci
    isi.classList.toggle("hidden");

    // 2. Ubah icon dan gaya visual jika elemen icon ada
    if (icon) {
        if (isi.classList.contains("hidden")) {
            icon.innerText = "🔽";
            icon.classList.remove("bg-blue-50", "text-blue-500");
        } else {
            icon.innerText = "🔼";
            icon.classList.add("bg-blue-50", "text-blue-500");
        }
    }
}

// --- KONTROL MODAL PREVIEW ---
function bukaModalPreview() {
    const modal = document.getElementById("modal-preview-ab");
    if (!modal) return console.error("ID modal-preview-ab tidak ditemukan di HTML!");

    modal.classList.remove("hidden");
    
    // Jalankan render tabel agar data yang muncul adalah yang paling update
    renderTableBakuAB();
}

function tutupModalPreview() {
    const modal = document.getElementById("modal-preview-ab");
    if (modal) modal.classList.add("hidden");
}

// --- RENDER ISI TABEL BAKU (DI DALAM MODAL) ---
function renderTableBakuAB() {
    const table = document.getElementById("tabel-baku-ab");
    const bln = document.getElementById("ab-bulan").value;
    const thn = document.getElementById("ab-tahun").value;
    if (!table) return;

    // 1. Header Tabel Baku (Format Standar BKKBN)
    let html = `
    <thead class="bg-slate-800 text-white sticky top-0 z-10">
        <tr class="text-[9px] uppercase tracking-tighter">
            <th rowspan="2" class="border border-slate-700 p-2">NO</th>
            <th rowspan="2" class="border border-slate-700 p-2 min-w-[150px]">DESA / KELURAHAN</th>
            <th rowspan="2" class="border border-slate-700 p-2">PUS</th>
            ${METODE_KB.map(m => `<th colspan="3" class="border border-slate-700 p-1">${m}</th>`).join('')}
        </tr>
        <tr class="text-[8px] uppercase">
            ${METODE_KB.map(() => `
                <th class="border border-slate-700 p-1 bg-slate-700 text-slate-400">T</th>
                <th class="border border-slate-700 p-1 bg-blue-700">P</th>
                <th class="border border-slate-700 p-1 bg-blue-700">S</th>
            `).join('')}
        </tr>
    </thead>
    <tbody class="text-slate-700">`;

    // 2. Isi Data per Desa
    DATA_AB_TEMP.forEach((d, idx) => {
        html += `
        <tr class="hover:bg-blue-50/50 transition border-b border-slate-100">
            <td class="p-2 text-center font-bold text-slate-400 border-x border-slate-100">${idx + 1}</td>
            <td class="p-2 font-black uppercase border-x border-slate-100">${d.desa}</td>
            <td class="p-2 text-center font-bold border-x border-slate-100 text-slate-500">${d.pus}</td>
            ${METODE_KB.map(m => {
                let k = m.toLowerCase();
                // Hitung target bulanan untuk preview
                let tBln = Math.round((d.target_ori[k] || 0) * getPersentaseBulan(bln));
                return `
                <td class="p-1 text-center bg-slate-50/30 border-x border-slate-100">${tBln}</td>
                <td class="p-1 text-center font-bold text-blue-900 border-x border-slate-100">${d[k+'_p'] || 0}</td>
                <td class="p-1 text-center font-bold text-blue-900 border-x border-slate-100">${d[k+'_s'] || 0}</td>
                `;
            }).join('')}
        </tr>`;
    });

    html += `</tbody>`;
    table.innerHTML = html;
}
