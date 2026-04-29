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
// A. LOGIKA MENU AKSES
// ============================================================
function aturTampilanMenu(role) {
    const menuSetting = document.getElementById("menu-setting-target");
    const menuAB = document.getElementById("menu-ab");
    const menuCU = document.getElementById("menu-cu");

    // Super Admin: Buka pengaturan target
    if (menuSetting && role === "super_admin") {
        menuSetting.classList.remove("hidden");
    }

    // Admin (Super, Kec, Desa): Buka form input
    if (menuAB && menuCU && (role === "super_admin" || role === "admin_kec" || role === "admin_desa")) {
        menuAB.classList.remove("hidden");
        menuCU.classList.remove("hidden");
    }
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
// E. LOGIKA MASTER REFERENSI (SETTING TARGET)
// ============================================================
function loadMasterReferensi() {
    const tbody = document.getElementById("body-referensi");
    fetch(`${API_URL}?action=get_master_referensi`)
    .then(res => res.json())
    .then(data => {
        tbody.innerHTML = "";
        if(data.length === 0) {
            tbody.innerHTML = "<tr><td colspan='11' class='p-5 text-center'>Data Kosong.</td></tr>";
            return;
        }

        data.forEach((r, index) => {
            tbody.innerHTML += `
            <tr class="border-b border-slate-50 hover:bg-slate-50">
                <td class="p-2 font-black text-slate-700 uppercase">${r.desa}</td>
                <td class="p-2"><input type="text" value="${r.pkm}" class="w-24 p-1 bg-white border rounded text-center font-bold" id="ref-pkm-${index}"></td>
                <td class="p-2"><input type="number" value="${r.pus}" class="w-16 p-1 bg-white border rounded text-center font-bold" id="ref-pus-${index}"></td>
                <td class="p-2"><input type="number" value="${r.ppm.iud}" class="w-10 p-1 bg-blue-50 border border-blue-100 rounded text-center font-bold" id="ref-iud-${index}"></td>
                <td class="p-2"><input type="number" value="${r.ppm.mow}" class="w-10 p-1 bg-blue-50 border border-blue-100 rounded text-center font-bold" id="ref-mow-${index}"></td>
                <td class="p-2"><input type="number" value="${r.ppm.mop}" class="w-10 p-1 bg-blue-50 border border-blue-100 rounded text-center font-bold" id="ref-mop-${index}"></td>
                <td class="p-2"><input type="number" value="${r.ppm.kdm}" class="w-10 p-1 bg-blue-50 border border-blue-100 rounded text-center font-bold" id="ref-kdm-${index}"></td>
                <td class="p-2"><input type="number" value="${r.ppm.imp}" class="w-10 p-1 bg-blue-50 border border-blue-100 rounded text-center font-bold" id="ref-imp-${index}"></td>
                <td class="p-2"><input type="number" value="${r.ppm.stk}" class="w-10 p-1 bg-blue-50 border border-blue-100 rounded text-center font-bold" id="ref-stk-${index}"></td>
                <td class="p-2"><input type="number" value="${r.ppm.pil}" class="w-10 p-1 bg-blue-50 border border-blue-100 rounded text-center font-bold" id="ref-pil-${index}"></td>
                <td class="p-2"><input type="number" value="${r.jml_ppkbd}" class="w-10 p-1 bg-slate-100 border rounded text-center font-bold" id="ref-ppkbd-${index}"></td>
                <input type="hidden" id="ref-desa-${index}" value="${r.desa}">
            </tr>`;
        });
        localStorage.setItem("count_ref", data.length);
    })
    .catch(err => {
        tbody.innerHTML = "<tr><td colspan='11' class='p-5 text-center text-red-500'>Koneksi Gagal.</td></tr>";
    });
}

function simpanSemuaReferensi() {
    const btn = document.getElementById("btn-save-ref");
    const count = localStorage.getItem("count_ref");
    let dataKirim = [];

    for(let i=0; i<count; i++) {
        dataKirim.push({
            desa: document.getElementById(`ref-desa-${i}`).value,
            pkm: document.getElementById(`ref-pkm-${i}`).value.toUpperCase(),
            pus: document.getElementById(`ref-pus-${i}`).value || 0,
            ppm: {
                iud: document.getElementById(`ref-iud-${i}`).value || 0,
                mow: document.getElementById(`ref-mow-${i}`).value || 0,
                mop: document.getElementById(`ref-mop-${i}`).value || 0,
                kdm: document.getElementById(`ref-kdm-${i}`).value || 0,
                imp: document.getElementById(`ref-imp-${i}`).value || 0,
                stk: document.getElementById(`ref-stk-${i}`).value || 0,
                pil: document.getElementById(`ref-pil-${i}`).value || 0
            },
            jml_ppkbd: document.getElementById(`ref-ppkbd-${i}`).value || 1
        });
    }

    const payload = {
        action: "save_master_referensi",
        admin_nik: localStorage.getItem("nik"),
        admin_nama: localStorage.getItem("nama"),
        admin_role: localStorage.getItem("role"),
        data_json: JSON.stringify(dataKirim)
    };

    btn.innerText = "⏳ MENYIMPAN...";
    btn.disabled = true;

    fetch(API_URL, { method: "POST", body: new URLSearchParams(payload) })
    .then(res => res.text())
    .then(res => {
        if(res.trim() === "success") {
            alert("✅ Target & Referensi Berhasil Diperbarui!");
            loadMasterReferensi();
        } else {
            alert("❌ Gagal: " + res);
        }
        btn.innerText = "Simpan Perubahan";
        btn.disabled = false;
    });
}
