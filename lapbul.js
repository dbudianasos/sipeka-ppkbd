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
    // Tarik data role, bersihkan spasi, paksa jadi huruf kecil semua
    const rawRole = localStorage.getItem("role") || "";
    const role = rawRole.toLowerCase().trim();
    
    // Tampilkan di konsol buat ngecek kalau masih bandel
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
    // 2. Logika Admin Biasa (Buka AB & CU saja)
    else if (role === "admin_kec" || role === "admin_desa") {
        if (menuAB) menuAB.classList.remove("hidden");
        if (menuCU) menuCU.classList.remove("hidden");
    }
    // 3. Kalau Kader, otomatis yang if di atas dicuekin (tetap hidden)

    // Pastikan Cetak selalu kelihatan buat siapa saja
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
// E. LOGIKA MASTER REFERENSI (AUTO BREAKDOWN 50:50 & LACI) - SETTING TARGET
// ============================================================

let DATA_DESA_TEMP = [];
let TARGET_KECAMATAN = { iud: 0, mow: 0, mop: 0, kdm: 0, imp: 0, stk: 0, pil: 0 };
const ALKON_LIST = ["iud", "mow", "mop", "kdm", "imp", "stk", "pil"];

function tarikTargetPerKecamatan() {
    const kec = document.getElementById("filter-kecamatan").value;
    if(!kec) {
        document.getElementById("panel-target-kecamatan").classList.add("hidden");
        document.getElementById("panel-indikator").classList.add("hidden");
        document.getElementById("panel-desa").classList.add("hidden");
        document.getElementById("btn-save-ref").classList.add("hidden");
        return;
    }

    // Munculkan Loading, sembunyikan panel lain
    document.getElementById("loading-pesan").classList.remove("hidden");
    document.getElementById("panel-target-kecamatan").classList.add("hidden");
    document.getElementById("panel-indikator").classList.add("hidden");
    document.getElementById("panel-desa").classList.add("hidden");
    document.getElementById("btn-save-ref").classList.add("hidden");
    
    Promise.all([
        fetch(`${API_URL}?action=get_master_referensi`).then(res => res.json()),
        fetch(`${API_URL}?action=get_desa_by_kecamatan&kecamatan=${kec}`).then(res => res.json())
    ])
    .then(([dataRefLama, listDesaWilayah]) => {
        document.getElementById("loading-pesan").classList.add("hidden");
        
        if(listDesaWilayah.length === 0) {
            return alert(`❌ Desa di Kecamatan ${kec} tidak ditemukan!\nPastikan nama Kecamatan di Sheet "Wilayah" sama persis (misal: "SETU").`);
        }

        renderInputTargetKecamatan();

        DATA_DESA_TEMP = listDesaWilayah.map(namaDesa => {
            let existing = dataRefLama.find(x => x.desa.toUpperCase() === namaDesa && x.kecamatan.toUpperCase() === kec) || {};
            return {
                kecamatan: kec,
                desa: namaDesa,
                pkm: existing.pkm || "",
                pus: parseInt(existing.pus) || 0,
                unmet_need: parseInt(existing.unmet_need) || 0,
                ppm: existing.ppm || { iud: 0, mow: 0, mop: 0, kdm: 0, imp: 0, stk: 0, pil: 0 },
                jml_ppkbd: parseInt(existing.jml_ppkbd) || 2
            };
        });

        document.getElementById("panel-target-kecamatan").classList.remove("hidden");
        document.getElementById("panel-indikator").classList.remove("hidden");
        document.getElementById("panel-desa").classList.remove("hidden");
        document.getElementById("btn-save-ref").classList.remove("hidden");

        renderLaciDesa();
        hitungSelisihTarget();
    })
    .catch(err => {
        // PENGAMAN JIKA ERROR
        document.getElementById("loading-pesan").classList.add("hidden");
        alert("❌ GAGAL MENGAMBIL DATA DARI SERVER!\n\nKemungkinan:\n1. Belum melakukan 'New Deployment' di GAS.\n2. URL API salah.\n3. Cek console (F12) untuk detail error.");
        console.error("Detail Error API:", err);
    });
}

function renderInputTargetKecamatan() {
    let html = "";
    ALKON_LIST.forEach(alkon => {
        html += `
        <div>
            <label class="text-[8px] font-bold text-slate-400 uppercase block mb-1">${alkon}</label>
            <input type="number" id="kec-${alkon}" value="${TARGET_KECAMATAN[alkon]}" oninput="updateTargetKecGlobal('${alkon}')" class="w-full p-2 bg-blue-50 border border-blue-100 rounded-lg text-center font-black text-blue-900 outline-none focus:border-blue-500">
        </div>`;
    });
    document.getElementById("input-target-dinas").innerHTML = html;
}

function updateTargetKecGlobal(alkon) {
    TARGET_KECAMATAN[alkon] = parseInt(document.getElementById(`kec-${alkon}`).value) || 0;
    hitungSelisihTarget();
}

// RUMUS 50:50 (PUS & UNMET NEED)
function hitungAutoDistribusi() {
    let totalPUS = DATA_DESA_TEMP.reduce((sum, d) => sum + d.pus, 0);
    let totalUnmet = DATA_DESA_TEMP.reduce((sum, d) => sum + d.unmet_need, 0);

    if (totalPUS === 0 || totalUnmet === 0) {
        return alert("⚠️ Gagal: Harap isi Total PUS dan Unmet Need untuk setiap desa terlebih dahulu dengan membuka laci desa.");
    }

    DATA_DESA_TEMP.forEach(d => {
        let proporsiPUS = d.pus / totalPUS;
        let proporsiUnmet = d.unmet_need / totalUnmet;

        ALKON_LIST.forEach(alkon => {
            let target = TARGET_KECAMATAN[alkon];
            // Bobot: 50% dari PUS, 50% dari Unmet Need
            let hasilKalkulasi = (0.5 * target * proporsiPUS) + (0.5 * target * proporsiUnmet);
            d.ppm[alkon] = Math.round(hasilKalkulasi);
        });
    });

    renderLaciDesa();
    hitungSelisihTarget();
    alert("✅ Distribusi Otomatis Berhasil Diterapkan!\nMohon periksa Indikator Selisih untuk membulatkan sisa angka.");
}

function renderLaciDesa() {
    const container = document.getElementById("panel-desa");
    container.innerHTML = "";

    DATA_DESA_TEMP.forEach((d, index) => {
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
                        <label class="text-[9px] font-bold text-slate-400 block mb-1">PUSKESMAS</label>
                        <input type="text" id="laci-pkm-${index}" value="${d.pkm}" oninput="simpanDataLaci(${index})" class="w-full p-2 bg-slate-50 border rounded-lg text-xs font-bold uppercase text-center">
                    </div>
                    <div>
                        <label class="text-[9px] font-bold text-slate-400 block mb-1">TOTAL PUS</label>
                        <input type="number" id="laci-pus-${index}" value="${d.pus}" oninput="simpanDataLaci(${index})" class="w-full p-2 bg-blue-50 border border-blue-100 rounded-lg text-xs font-black text-blue-900 text-center">
                    </div>
                    <div>
                        <label class="text-[9px] font-bold text-orange-500 block mb-1">UNMET NEED</label>
                        <input type="number" id="laci-unmet-${index}" value="${d.unmet_need}" oninput="simpanDataLaci(${index})" class="w-full p-2 bg-orange-50 border border-orange-100 rounded-lg text-xs font-black text-orange-900 text-center">
                    </div>
                </div>

                <p class="text-[9px] font-black text-slate-800 mb-2 border-b pb-1">TARGET DESA (BISA DIEDIT)</p>
                <div class="grid grid-cols-4 md:grid-cols-7 gap-2">
                    ${ALKON_LIST.map(alkon => `
                    <div>
                        <label class="text-[8px] font-bold text-slate-400 block mb-1 uppercase text-center">${alkon}</label>
                        <input type="number" id="laci-${alkon}-${index}" value="${d.ppm[alkon]}" oninput="simpanDataLaci(${index})" class="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center">
                    </div>`).join('')}
                </div>

                <div class="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                    <label class="text-[9px] font-bold text-slate-400 w-full">JUMLAH PPKBD (PEMBAGI CETAK):</label>
                    <input type="number" id="laci-ppkbd-${index}" value="${d.jml_ppkbd}" oninput="simpanDataLaci(${index})" class="w-20 p-2 bg-slate-100 border rounded-lg text-xs font-bold text-center">
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

// Simpan angka sementara dari input laci ke memori, lalu hitung selisih
function simpanDataLaci(index) {
    DATA_DESA_TEMP[index].pkm = document.getElementById(`laci-pkm-${index}`).value.toUpperCase();
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
        let targetAwal = TARGET_KECAMATAN[alkon];
        let totalDidistribusikan = DATA_DESA_TEMP.reduce((sum, d) => sum + d.ppm[alkon], 0);
        let selisih = targetAwal - totalDidistribusikan;

        // Warna Hijau (Pas), Kuning (Masih ada sisa), Merah (Kelebihan kuota)
        let warnaBg = selisih === 0 ? "bg-green-100" : (selisih > 0 ? "bg-yellow-100" : "bg-red-100");
        let warnaTeks = selisih === 0 ? "text-green-800" : (selisih > 0 ? "text-yellow-800" : "text-red-800");

        wadah.innerHTML += `
        <div class="flex flex-col items-center justify-center p-2 rounded-xl ${warnaBg}">
            <span class="text-[8px] font-black uppercase tracking-widest ${warnaTeks}">${alkon}</span>
            <span class="text-sm font-black ${warnaTeks}">${selisih > 0 ? '+' : ''}${selisih}</span>
        </div>`;
    });
}

function simpanSemuaReferensi() {
    const btn = document.getElementById("btn-save-ref");
    const payload = {
        action: "save_master_referensi",
        data_json: JSON.stringify(DATA_DESA_TEMP)
    };

    btn.innerText = "⏳ MENYIMPAN...";
    btn.disabled = true;

    fetch(API_URL, { method: "POST", body: new URLSearchParams(payload) })
    .then(res => res.text())
    .then(res => {
        if(res.trim() === "success") {
            alert("✅ DATA TARGET BERHASIL DISIMPAN!");
            tarikTargetPerKecamatan(); // Refresh
        } else {
            alert("❌ Gagal menyimpan.");
            btn.innerText = "💾 SIMPAN";
            btn.disabled = false;
        }
    });
}
