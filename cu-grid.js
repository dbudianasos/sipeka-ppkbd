// --- VARIABEL GLOBAL ---
const API_URL = "URL_WEB_APP_GAS_BAPAK_DI_SINI"; // Ganti ini saat implementasi
const ALKON_CU = ["iud", "mow", "mop", "kdm", "imp", "stk", "pil"];
const NON_KB = ["hamil", "ias", "iat", "tial"];

let IS_CU_EDITABLE = false;
let DAFTAR_DESA_CU = [];

// DAFTAR NIK VIP YANG BISA BYPASS GEMBOK CU
const VIP_NIKS = ["3216180000000001", "3216190000000002"]; // <-- Masukkan NIK Bapak di sini

document.addEventListener("DOMContentLoaded", () => {
    initFilterDinamic();
});

// 1. SETUP TAHUN DAN KECAMATAN DINAMIS
function initFilterDinamic() {
    const selThn = document.getElementById("cu-tahun");
    const selKec = document.getElementById("cu-kecamatan");
    const selBln = document.getElementById("cu-bulan");
    
    // Set Tahun Otomatis
    const thnSkg = new Date().getFullYear();
    let optThn = "";
    for(let y = thnSkg - 1; y <= thnSkg + 2; y++) { 
        optThn += `<option value="${y}" ${y === thnSkg ? 'selected' : ''}>${y}</option>`; 
    }
    selThn.innerHTML = optThn;
    
    // Set Bulan Otomatis
    const daftarBulan = ["JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI", "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"];
    selBln.value = daftarBulan[new Date().getMonth()];

    // Tarik Kecamatan Dinamis dari GAS
    fetch(`${API_URL}?action=get_semua_kecamatan`)
    .then(res => res.json())
    .then(listKec => {
        let opsiKec = `<option value="">-- PILIH KECAMATAN --</option>`;
        listKec.forEach(k => { opsiKec += `<option value="${k}">${k}</option>`; });
        selKec.innerHTML = opsiKec;
        
        cekOtorisasiKecamatan(); // Cek siapa yang login
    })
    .catch(err => {
        selKec.innerHTML = `<option value="">-- GAGAL MEMUAT --</option>`;
        console.error(err);
    });
}

// 2. CEK HAK AKSES & JALUR VIP
function cekOtorisasiKecamatan() {
    const role = (localStorage.getItem("role") || "").toLowerCase().trim();
    const kecUser = (localStorage.getItem("kecamatan") || "").toUpperCase();
    const nikUser = localStorage.getItem("nik") || "";
    const selKec = document.getElementById("cu-kecamatan");

    // Jika Admin Lokal, Kunci Dropdown ke Kecamatannya saja
    if (role.includes("admin_kec") || role.includes("admin_desa")) {
        selKec.value = kecUser;
        selKec.disabled = true;
        selKec.classList.add("bg-slate-200", "cursor-not-allowed");
    }

    // CEK JALUR VIP ATAU SUPER ADMIN
    if (role === "super_admin" || VIP_NIKS.includes(nikUser)) {
        IS_CU_EDITABLE = true;
        renderTombolAksi(true); // Gembok Terbuka
    } else {
        IS_CU_EDITABLE = false;
        renderTombolAksi(false); // Gembok Tertutup
    }
}

function renderTombolAksi(isTerbuka) {
    const wadah = document.getElementById("wadah-tombol-vip");
    if (isTerbuka) {
        wadah.innerHTML = `<button onclick="simpanBulkCU()" class="bg-emerald-500 hover:bg-emerald-400 text-white text-[10px] font-black px-6 py-2.5 rounded-xl transition active:scale-95 uppercase tracking-widest shadow-lg flex items-center gap-2"><span>💾</span> Simpan Final</button>`;
    } else {
        wadah.innerHTML = `<button onclick="mintaPinCU()" class="bg-orange-500 hover:bg-orange-400 text-white text-[10px] font-black px-6 py-2.5 rounded-xl transition active:scale-95 uppercase tracking-widest shadow-lg flex items-center gap-2"><span>🔒</span> Buka Gembok</button>`;
    }
}

function mintaPinCU() {
    // Fungsi simulasi Minta PIN. Bisa pakai getKodeRahasia Bapak nanti.
    let pin = prompt("Masukkan PIN Harian untuk membuka edit data:");
    if (pin === "1234") { // Ganti logika PIN sesuai kebutuhan
        IS_CU_EDITABLE = true;
        renderTombolAksi(true);
        generateGridCU(); // Render ulang agar input bisa diketik
        Swal.fire("Berhasil", "Akses Edit Dibuka", "success");
    } else {
        Swal.fire("Gagal", "PIN Salah", "error");
    }
}

// 3. GENERATE GRID (SIMULASI MENGAMBIL DATA DESA DINAMIS)
function generateGridCU() {
    const kec = document.getElementById("cu-kecamatan").value;
    if(!kec) return Swal.fire("Peringatan", "Kecamatan belum dimuat/dipilih", "warning");

    Swal.fire({ title: 'Menyiapkan Grid...', text: 'Melakukan auto-kalkulasi dari Bulan Lalu dan Data AB...', didOpen: () => Swal.showLoading() });

    // SIMULASI API CALL (Di backend GAS nanti: Tarik Desa, Tarik Saldo, Tarik AB, Gabungkan)
    fetch(`${API_URL}?action=get_desa_by_kecamatan&kecamatan=${kec}`)
    .then(res => res.json())
    .then(listDesa => {
        DAFTAR_DESA_CU = listDesa; // Menyimpan nama desa dari server
        renderTabelGrid();
        document.getElementById("area-grid-cu").classList.remove("hidden");
        Swal.close();
    }).catch(err => {
        // MOCKUP DATA JIKA API_URL BELUM DIISI (Agar Bapak bisa test UI nya)
        DAFTAR_DESA_CU = ["CIJENGKOL", "BURANGKENG", "CIBENING", "CILEDUG", "LUBANG BUAYA", "TAMAN SARI"];
        renderTabelGrid();
        document.getElementById("area-grid-cu").classList.remove("hidden");
        Swal.close();
    });
}

function renderTabelGrid() {
    const tbody = document.getElementById("tbody-grid-cu");
    let html = "";
    
    // Status Disable Input jika gembok tertutup
    let state = IS_CU_EDITABLE ? "" : "disabled";
    let cssLock = IS_CU_EDITABLE ? "bg-white text-blue-900" : "bg-slate-50 text-slate-400 cursor-not-allowed border-slate-100";

    DAFTAR_DESA_CU.forEach((desa, idx) => {
        // ID input menggunakan index desa agar mudah ditarik datanya saat save
        html += `
        <tr class="hover:bg-orange-50 transition border-b border-slate-100">
            <td class="p-2 text-center text-[10px] font-bold text-slate-400 paku-no">${idx + 1}</td>
            <td class="p-2 font-black text-[10px] uppercase paku-desa text-slate-700">${desa}</td>
            <td class="p-1 bg-blue-50/30 text-center"><input type="number" id="pus_${idx}" value="1000" ${state} class="grid-input w-16 ${cssLock}"></td>
        `;
        
        // Loop Render Alkon (P & S)
        ALKON_CU.forEach(alkon => {
            html += `
            <td class="p-1 text-center"><input type="number" id="${alkon}_p_${idx}" value="0" oninput="autoSumCU(${idx})" ${state} class="grid-input ${cssLock}"></td>
            <td class="p-1 text-center"><input type="number" id="${alkon}_s_${idx}" value="0" oninput="autoSumCU(${idx})" ${state} class="grid-input ${cssLock}"></td>
            `;
        });

        // Kolom Total KB (Readonly, Auto Sum)
        html += `<td class="p-2 text-center bg-emerald-50"><span id="totalkb_${idx}" class="font-black text-emerald-700 text-[11px]">0</span></td>`;

        // Loop Render Non-KB
        NON_KB.forEach(non => {
            html += `<td class="p-1 text-center bg-red-50/20"><input type="number" id="${non}_${idx}" value="0" ${state} class="grid-input ${IS_CU_EDITABLE ? 'bg-white text-red-900 focus:border-red-500' : cssLock}"></td>`;
        });

        html += `</tr>`;
    });

    tbody.innerHTML = html;
}

// 4. AUTO SUM TOTAL KB PER BARIS
function autoSumCU(idx) {
    let total = 0;
    ALKON_CU.forEach(alkon => {
        let p = parseInt(document.getElementById(`${alkon}_p_${idx}`).value) || 0;
        let s = parseInt(document.getElementById(`${alkon}_s_${idx}`).value) || 0;
        total += (p + s);
    });
    document.getElementById(`totalkb_${idx}`).innerText = total;
}

// 5. MENGUMPULKAN DATA UNTUK DISIMPAN BULK
function simpanBulkCU() {
    let dataKirim = [];
    
    DAFTAR_DESA_CU.forEach((desa, idx) => {
        let objDesa = { desa: desa, pus: document.getElementById(`pus_${idx}`).value };
        
        ALKON_CU.forEach(alkon => {
            objDesa[`${alkon}_p`] = document.getElementById(`${alkon}_p_${idx}`).value;
            objDesa[`${alkon}_s`] = document.getElementById(`${alkon}_s_${idx}`).value;
        });
        NON_KB.forEach(non => {
            objDesa[non] = document.getElementById(`${non}_${idx}`).value;
        });
        
        dataKirim.push(objDesa);
    });

    console.log("Data siap dikirim ke GAS:", dataKirim);
    Swal.fire("Berhasil", "Cek Console untuk melihat Array Data yang siap dikirim Bulk ke GAS.", "success");
    // Di sini nanti kita pasang fetch API_URL action="save_bulk_cu"
}
