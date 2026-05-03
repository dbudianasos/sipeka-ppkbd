// ============================================================
// 📁 CU-GRID.JS - MODUL SIPEKA SMART GRID CU
// ============================================================

const ALKON_CU = ["iud", "mow", "mop", "kdm", "imp", "stk", "pil"];
const NON_KB = ["hamil", "ias", "iat", "tial"];
let DATA_CU_TEMP = []; 
let IS_CU_EDITABLE = false;
let ADA_PERUBAHAN = false;

// 🔑 BYPASS VIP (Ganti/Tambah NIK Bapak dan Pimpinan di sini)
const VIP_NIKS = ["3207160604930002", "3216190000000002"]; 

document.addEventListener("DOMContentLoaded", () => {
    if (typeof cekLogin === "function") cekLogin();
    initFilterDinamicCU();
});

// --- 1. INISIASI FILTER DINAMIS ---
function initFilterDinamicCU() {
    const selThn = document.getElementById("cu-tahun");
    const selBln = document.getElementById("cu-bulan");
    const selKec = document.getElementById("cu-kecamatan");
    
    const thnSkg = new Date().getFullYear();
    let optThn = "";
    for(let y = thnSkg - 1; y <= thnSkg + 2; y++) { optThn += `<option value="${y}" ${y === thnSkg ? 'selected' : ''}>${y}</option>`; }
    selThn.innerHTML = optThn;
    selBln.value = ["JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI", "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"][new Date().getMonth()];

    fetch(`${scriptURL}?action=get_semua_kecamatan`) // Pastikan scriptURL diambil dari script.js
    .then(res => res.json())
    .then(listKec => {
        let opsiKec = `<option value="">-- PILIH KECAMATAN --</option>`;
        listKec.forEach(k => { opsiKec += `<option value="${k}">${k}</option>`; });
        selKec.innerHTML = opsiKec;
        selKec.disabled = false;
        cekOtorisasiCU(); 
    }).catch(err => { selKec.innerHTML = `<option value="">❌ GAGAL MEMUAT</option>`; });
}

function cekOtorisasiCU() {
    const role = (localStorage.getItem("role") || "").toLowerCase().trim();
    const kecUser = (localStorage.getItem("kecamatan") || "").toUpperCase();
    const nikUser = localStorage.getItem("nik") || "";
    const selKec = document.getElementById("cu-kecamatan");

    if (role.includes("admin_kec") || role.includes("admin_desa")) {
        selKec.value = kecUser;
        selKec.disabled = true;
        selKec.classList.add("bg-slate-200", "cursor-not-allowed");
    }

    if (role === "super_admin" || VIP_NIKS.includes(nikUser)) {
        IS_CU_EDITABLE = true;
        renderTombolAksi(true);
    } else {
        IS_CU_EDITABLE = false;
        renderTombolAksi(false);
    }
}

function renderTombolAksi(isOpen) {
    const wadah = document.getElementById("wadah-tombol-vip");
    if (isOpen) {
        wadah.innerHTML = `<button onclick="simpanBulkCU()" class="bg-emerald-500 hover:bg-emerald-400 text-white text-[10px] font-black px-5 py-2.5 rounded-xl transition active:scale-95 uppercase tracking-widest shadow-lg flex items-center gap-2"><span>💾</span> Simpan Laporan</button>`;
        document.getElementById("btn-do-pintar").classList.remove("hidden");
    } else {
        wadah.innerHTML = `<button onclick="mintaPinCU()" class="bg-orange-500 hover:bg-orange-400 text-white text-[10px] font-black px-5 py-2.5 rounded-xl transition active:scale-95 uppercase tracking-widest shadow-lg flex items-center gap-2"><span>🔒</span> Buka Gembok</button>`;
        document.getElementById("btn-do-pintar").classList.add("hidden");
    }
}

function mintaPinCU() {
    let pin = prompt("Data Terkunci. Masukkan PIN Harian Otorisasi:");
    // LOGIKA PIN (Silakan sesuaikan dengan PIN harian BAPAK)
    if (pin === "1234") { 
        IS_CU_EDITABLE = true;
        renderTombolAksi(true);
        renderTabelGridCU(); 
        Swal.fire("Berhasil", "Akses Edit Dibuka", "success");
    } else {
        Swal.fire("Gagal", "PIN Salah", "error");
    }
}

// --- 2. TARIK DATA DARI GAS ---
function tarikDataGridCU() {
    if (ADA_PERUBAHAN && !confirm("Ada perubahan yang belum disimpan. Yakin ingin memuat ulang?")) return;

    const kec = document.getElementById("cu-kecamatan").value;
    const thn = document.getElementById("cu-tahun").value;
    const bln = document.getElementById("cu-bulan").value;
    
    if(!kec) return Swal.fire("Peringatan", "Kecamatan belum dipilih", "warning");

    tampilkanLoader("Menarik Saldo & Menghitung Data AB...");

    fetch(`${scriptURL}?action=get_cu_grid&kecamatan=${kec}&tahun=${thn}&bulan=${bln}`)
    .then(res => res.json())
    .then(res => {
        sembunyikanLoader();
        if(res.status === "success") {
            DATA_CU_TEMP = res.data; 
            ADA_PERUBAHAN = false;
            renderTabelGridCU();
            document.getElementById("area-grid-cu").classList.remove("hidden");
        } else {
            Swal.fire("Gagal", res.message, "error");
        }
    }).catch(err => {
        sembunyikanLoader();
        Swal.fire("Error", "Gagal menghubungi server siPeKa.", "error");
    });
}

// --- 3. RENDER GRID (DENGAN CLEAR ON FOCUS) ---
function renderTabelGridCU() {
    const tbody = document.getElementById("tbody-grid-cu");
    let html = "";
    let state = IS_CU_EDITABLE ? "" : "disabled";
    let cssInput = IS_CU_EDITABLE ? "text-blue-900 bg-white hover:bg-blue-50 focus:bg-white" : "bg-readonly";

    DATA_CU_TEMP.forEach((d, idx) => {
        let isSpecial = (IS_CU_EDITABLE && (d.selisih !== 0)); // Penanda PUS tidak seimbang
        let bgRow = isSpecial ? "bg-red-50/50" : "hover:bg-slate-50";

        html += `
        <tr class="${bgRow} transition border-b border-slate-100">
            <td class="p-2 text-center text-[10px] font-bold text-slate-400 paku-no">${idx + 1}</td>
            <td class="p-2 font-black text-[10px] uppercase paku-desa text-slate-700 truncate max-w-[130px]">${d.desa}</td>
            <td class="p-1 bg-blue-50/50 text-center font-black text-blue-900 text-[11px]">${d.pus}</td>
        `;
        
        // Loop Alkon
        ALKON_CU.forEach(alkon => {
            html += `
            <td class="p-1 text-center bg-white border-l border-slate-50"><input type="number" min="0" value="${d.alkon[alkon+'_p']}" onfocus="clearZero(this)" onblur="restoreZero(this)" oninput="updateDataCU(${idx}, 'alkon', '${alkon}_p', this.value)" ${state} class="grid-input ${cssInput}"></td>
            <td class="p-1 text-center bg-white"><input type="number" min="0" value="${d.alkon[alkon+'_s']}" onfocus="clearZero(this)" onblur="restoreZero(this)" oninput="updateDataCU(${idx}, 'alkon', '${alkon}_s', this.value)" ${state} class="grid-input ${cssInput}"></td>
            `;
        });

        // Total KB 
        html += `<td class="p-2 text-center bg-emerald-50"><span id="totalkb_${idx}" class="font-black text-emerald-700 text-[11px]">${d.total_kb}</span></td>`;

        // Loop Non-KB
        NON_KB.forEach(non => {
            let cssNon = IS_CU_EDITABLE ? "text-red-900 bg-red-50/30 hover:bg-red-100" : "bg-readonly";
            html += `<td class="p-1 text-center border-l border-white"><input type="number" min="0" value="${d.non_kb[non]}" onfocus="clearZero(this)" onblur="restoreZero(this)" oninput="updateDataCU(${idx}, 'non_kb', '${non}', this.value)" ${state} class="grid-input ${cssNon}"></td>`;
        });

        // Selisih PUS (JUNGKAT JUNGKIT INDICATOR)
        let warnaSelisih = d.selisih === 0 ? "text-slate-300" : (d.selisih > 0 ? "text-red-600 font-black" : "text-orange-600 font-black");
        let teksSelisih = d.selisih > 0 ? `+${d.selisih} (Lebih)` : (d.selisih < 0 ? `${d.selisih} (Kurang)` : "PAS");
        html += `<td class="p-2 text-center bg-slate-100"><span id="selisih_${idx}" class="text-[9px] ${warnaSelisih}">${teksSelisih}</span></td></tr>`;
    });
    tbody.innerHTML = html;
}

// --- 4. LOGIKA INTERAKSI (CLEAR ON FOCUS & UPDATE) ---
function clearZero(el) { if (el.value === "0" || el.value === 0) el.value = ""; }
function restoreZero(el) { if (el.value === "") el.value = "0"; }

function updateDataCU(idx, tipe, key, val) {
    ADA_PERUBAHAN = true;
    let num = parseInt(val) || 0;
    if(num < 0) num = 0; // Anti minus
    DATA_CU_TEMP[idx][tipe][key] = num;
    kalkulasiBaris(idx);
}

function kalkulasiBaris(idx) {
    let d = DATA_CU_TEMP[idx];
    d.total_kb = Object.values(d.alkon).reduce((a,b) => a+b, 0);
    d.total_non = Object.values(d.non_kb).reduce((a,b) => a+b, 0);
    d.selisih = (d.total_kb + d.total_non) - d.pus;

    document.getElementById(`totalkb_${idx}`).innerText = d.total_kb;
    
    let elSelisih = document.getElementById(`selisih_${idx}`);
    if (d.selisih === 0) {
        elSelisih.className = "text-[9px] text-emerald-600 font-black"; elSelisih.innerText = "PAS ✅";
    } else if (d.selisih > 0) {
        elSelisih.className = "text-[9px] text-red-600 font-black blink"; elSelisih.innerText = `+${d.selisih} (Lebih)`;
    } else {
        elSelisih.className = "text-[9px] text-orange-600 font-black"; elSelisih.innerText = `${d.selisih} (Kurang)`;
    }
}

// --- 5. SIHIR DO PINTAR (AUTO-RASIONALISASI) ---
function terapkanDOPintar() {
    Swal.fire({
        title: '✨ Auto-Rasionalisasi DO',
        html: '<p class="text-xs mb-3">Berapa estimasi tren Drop Out (berhenti KB) se-Kecamatan bulan ini?</p>',
        input: 'select',
        inputOptions: { '0.01': 'Rendah (1%)', '0.02': 'Sedang (2%)', '0.03': 'Tinggi (3%)', '0.05': 'Sangat Tinggi (5%)' },
        showCancelButton: true, confirmButtonColor: '#8b5cf6', cancelButtonColor: '#cbd5e1', confirmButtonText: 'Terapkan Sihir'
    }).then((result) => {
        if (result.isConfirmed) {
            let persen = parseFloat(result.value);
            ADA_PERUBAHAN = true;

            DATA_CU_TEMP.forEach((d, idx) => {
                let targetDO = Math.floor(d.total_kb * persen);
                if (targetDO > 0) {
                    let sisaDO = targetDO;

                    // Fungsi Potong Prioritas Jangka Pendek
                    const potong = (kunci) => {
                        if (sisaDO <= 0) return;
                        if (d.alkon[kunci] > 0) {
                            let ptg = Math.min(d.alkon[kunci], sisaDO);
                            d.alkon[kunci] -= ptg;
                            sisaDO -= ptg;
                        }
                    };

                    // EKSEKUSI PEMOTONGAN (MOW & MOP AMAN)
                    potong('pil_p'); potong('pil_s');
                    potong('stk_p'); potong('stk_s');
                    potong('kdm_p'); potong('kdm_s');
                    potong('imp_p'); potong('imp_s'); // Implan lapis terakhir

                    let totalTerpotong = targetDO - sisaDO;

                    // HUKUM KESEIMBANGAN PUS: Lempar DO ke IAT (Ingin Anak Ditunda)
                    d.non_kb.iat += totalTerpotong;
                    kalkulasiBaris(idx); // Update selisih
                }
            });

            renderTabelGridCU();
            Swal.fire("Sihir Berhasil!", "Data Drop Out telah didistribusikan ke Pil, Suntik, dan Kondom. Sisa potongan dialihkan ke IAT agar PUS tetap seimbang.", "success");
        }
    });
}

// --- 6. SIMPAN BULK KE GAS ---
function simpanBulkCU() {
    // Cek Keseimbangan PUS sebelum save
    let adaError = DATA_CU_TEMP.some(d => d.selisih !== 0);
    if(adaError) {
        return Swal.fire("Tunggu Dulu!", "Masih ada desa yang selisih PUS-nya belum PAS (0). Periksa kolom paling kanan.", "warning");
    }

    tampilkanLoader("Menyimpan Data se-Kecamatan...");
    
    const payload = {
        action: "save_bulk_cu",
        kecamatan: document.getElementById("cu-kecamatan").value,
        tahun: document.getElementById("cu-tahun").value,
        bulan: document.getElementById("cu-bulan").value,
        admin_nama: localStorage.getItem("nama") || "Admin VIP",
        data_json: JSON.stringify(DATA_CU_TEMP)
    };

    fetch(scriptURL, { method: "POST", body: new URLSearchParams(payload) })
    .then(res => res.json())
    .then(res => {
        sembunyikanLoader();
        if(res.status === "success") {
            ADA_PERUBAHAN = false;
            Swal.fire("Tersimpan!", "Data Register CU berhasil di-Finalisasi.", "success");
        } else { Swal.fire("Gagal", res.message, "error"); }
    }).catch(err => { sembunyikanLoader(); Swal.fire("Error", "Gagal menyimpan.", "error"); });
}

// --- UTILS LOADER ---
function tampilkanLoader(teks) {
    const l = document.getElementById("loader-sipeka");
    if(l) { document.getElementById("loader-text").innerText = teks; l.classList.remove("hidden"); }
}
function sembunyikanLoader() {
    const l = document.getElementById("loader-sipeka");
    if(l) l.classList.add("hidden");
}
