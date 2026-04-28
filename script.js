
const API_URL = "https://script.google.com/macros/s/AKfycbzXt4isvjY5KrSZi37IedLKHGzCwiL1dMoB4N6IeSyKyTJXruTpjMuhWdm3RvJyCGQqEA/exec"; 

// Variable Global
let base64Foto = ""; 
let dataRiwayatGlobal = [];
let dataRenjaGlobal = []; 
let GLOBAL_WILAYAH = []; 
let DATA_USERS_ALL = []; // Untuk penampung filter user
let myChartInstance = null;

// ================= 1. LOGIN & SATPAM DIGITAL (FIXED) =================
function login() {
  const nik = document.getElementById("nik").value;
  const password = document.getElementById("password").value;
  const info = document.getElementById("info");
  if (!nik || !password) { info.innerText = "NIK & Password wajib diisi!"; return; }
  info.innerText = "⏳ Memverifikasi...";
  fetch(API_URL, {
    method: "POST",
    body: new URLSearchParams({ action: "login", nik: nik, password: password })
  })
  .then(res => res.json())
  .then(data => {
    if (data.status === "success") {
      localStorage.setItem("nik", data.nik);
      localStorage.setItem("nama", data.nama);
      localStorage.setItem("role", data.role);
      localStorage.setItem("kecamatan", data.kecamatan);
      localStorage.setItem("desa", data.desa);
      localStorage.setItem("foto", data.foto || "");
      window.location.href = data.role.includes("admin") ? "dashboard-admin.html" : "dashboard-kader.html";
    } else { info.innerText = "NIK atau Password Salah!"; }
  });
}

function cekLogin() {
  const nik = localStorage.getItem("nik");
  const role = localStorage.getItem("role");
  const isLoginPage = window.location.pathname.includes("index.html") || window.location.pathname.endsWith("/");

  // 1. JIKA BELUM LOGIN & BUKAN DI HALAMAN LOGIN -> Tendang ke Login
  if (!nik && !isLoginPage) {
    window.location.href = "index.html";
    return;
  }

  // 2. JIKA SUDAH LOGIN & MALAH BUKA HALAMAN LOGIN -> Lempar ke Dashboard masing-masing
  if (nik && isLoginPage) {
    if (role && role.includes("admin")) {
      window.location.href = "dashboard-admin.html";
    } else {
      window.location.href = "dashboard-kader.html";
    }
  }
}

function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}

// ================= 2. SISTEM WILAYAH (FIXED) =================
function loadWilayahDatabase() {
  const selKec = document.getElementById("user-kecamatan") || document.getElementById("select-kecamatan");
  if (!selKec) return;
  selKec.innerHTML = '<option value="">⏳ Sinkronisasi Wilayah...</option>';
  fetch(`${API_URL}?action=get_wilayah_lengkap`)
    .then(res => res.json())
    .then(data => {
      GLOBAL_WILAYAH = data;
      const uniqueKec = [...new Map(data.map(item => [item['kode_kec'], item])).values()];
      selKec.innerHTML = '<option value="">-- Pilih Kecamatan --</option>';
      uniqueKec.forEach(item => {
        if(item.nama_kec && item.nama_kec !== "-") {
          let opt = document.createElement("option");
          // Paksa huruf besar agar pencocokan selalu berhasil
          opt.value = item.nama_kec.toUpperCase(); 
          opt.setAttribute("data-kode", item.kode_kec); 
          opt.innerHTML = item.nama_kec.toUpperCase();
          selKec.appendChild(opt);
        }
      });
      initUserPage();
    })
    .catch(() => { selKec.innerHTML = '<option value="">❌ Gagal Memuat Data</option>'; });
}

function updateDropdownDesa(desaTerpilih = "") {
  const roleLogin = localStorage.getItem("role");
  const selKec = document.getElementById("user-kecamatan") || document.getElementById("select-kecamatan");
  const selDesa = document.getElementById("user-wilayah");
  if (!selDesa || !selKec) return;
  
  const kecDipilih = selKec.value.toUpperCase();
  selDesa.innerHTML = '<option value="">-- Pilih Desa --</option>';
  
  if (kecDipilih && roleLogin === "super_admin") {
    let optSemua = document.createElement("option");
    optSemua.value = "SEMUA DESA";
    optSemua.innerHTML = "--- SEMUA DESA (OTORITAS KEC) ---";
    selDesa.appendChild(optSemua);
  }
  
  const filtered = GLOBAL_WILAYAH.filter(item => (item.nama_kec || "").toUpperCase() === kecDipilih);
  
  // Filter Anti Ganda (Mencegah nama desa kembar muncul di form pendaftaran)
  const uniqueDesa = [...new Set(filtered.map(item => (item.nama_desa || "").trim().toUpperCase()))].sort();
  
  uniqueDesa.forEach(namaDesa => {
    if(namaDesa && namaDesa !== "-") {
      let opt = document.createElement("option");
      opt.value = namaDesa;
      opt.innerHTML = namaDesa;
      // Pencocokan kebal salah huruf besar/kecil
      if(desaTerpilih && namaDesa === desaTerpilih.toUpperCase()) opt.selected = true;
      selDesa.appendChild(opt);
    }
  });
}

function initUserPage() {
  const role = localStorage.getItem("role");
  // Paksa uppercase sejak awal
  const kec = localStorage.getItem("kecamatan") ? localStorage.getItem("kecamatan").toUpperCase() : "";
  const desa = localStorage.getItem("desa") ? localStorage.getItem("desa").toUpperCase() : "";
  
  const subTitle = document.getElementById("sub-title-admin");
  const selRole = document.getElementById("user-role"); 
  const filterRole = document.getElementById("filter-role"); 
  const selKec = document.getElementById("user-kecamatan") || document.getElementById("select-kecamatan");
  const selDesa = document.getElementById("user-wilayah");
  const displayWil = document.getElementById("display-wilayah");

  if (subTitle) {
    if (role === "super_admin") subTitle.innerText = "Otoritas: Kabupaten Bekasi";
    else if (role === "admin_kec") subTitle.innerText = "Otoritas: Kecamatan " + kec;
    else subTitle.innerText = "Otoritas: Desa " + desa;
  }
  if (displayWil) displayWil.innerText = (role === "super_admin") ? "Kabupaten Bekasi" : "Kecamatan " + kec;
  
  // 1. Kunci Kecamatan
  if (selKec && role !== "super_admin") { 
    selKec.value = kec; 
    selKec.disabled = true; 
  }

  if (!selRole) return;
  let ops = "";
  
  // 2. Logika Otoritas Pembuatan Akun
  if (role === "super_admin") {
    ops = `<option value="admin_kec">Admin Kecamatan</option><option value="admin_desa">Admin Desa</option><option value="kader">Kader PPKBD</option>`;
    if(selDesa) updateDropdownDesa();
    
  } else if (role === "admin_kec") {
    ops = `<option value="admin_desa">Admin Desa</option><option value="kader">Kader PPKBD</option>`;
    if(selDesa) updateDropdownDesa();
    
  } else {
    ops = `<option value="kader">Kader PPKBD</option>`;
    // Khusus Admin Desa: Langsung isikan nama desanya dan kunci!
    if(selDesa) { 
        updateDropdownDesa(desa); 
        selDesa.disabled = true; 
    }
  }
  
  selRole.innerHTML = ops;
  if(filterRole) filterRole.innerHTML = `<option value="">Semua Role</option>` + ops;
}

// ================= 3. MANAJEMEN USER (SEARCH & FILTER) =================
function loadUsers() {
  const container = document.getElementById("container-daftar-user");
  const filterWil = document.getElementById("filter-wilayah");
  if (!container) return;
  
  const roleAdmin = localStorage.getItem("role");
  const kecAdmin = localStorage.getItem("kecamatan");
  const desaAdmin = localStorage.getItem("desa");
  
  container.innerHTML = `<p class="text-center text-[10px] text-gray-400 py-10 italic">Sinkronisasi data...</p>`;
  
  fetch(`${API_URL}?action=get_users&role_admin=${roleAdmin}&kec_admin=${kecAdmin}&desa_admin=${desaAdmin}`)
    .then(res => res.json())
    .then(data => {
      DATA_USERS_ALL = data;
      
      if (filterWil) {
        filterWil.innerHTML = '<option value="">Semua Wilayah</option>';
        if (roleAdmin === "super_admin") {
          // Filter Kecamatan agar tidak ganda
          const listKec = [...new Set(data.map(u => (u.Kecamatan || u.kecamatan || "").trim().toUpperCase()))].sort();
          listKec.forEach(k => { if(k && k !== "") filterWil.innerHTML += `<option value="${k}">${k}</option>`; });
        } else if (roleAdmin === "admin_kec") {
          // Filter Desa agar tidak ganda (Menyembuhkan Bug Lubangbuaya 2x)
          const listDesa = [...new Set(data.map(u => (u.Desa || u.desa || "").trim().toUpperCase()))].sort();
          listDesa.forEach(d => { if(d && d !== "") filterWil.innerHTML += `<option value="${d}">${d}</option>`; });
        } else { 
          filterWil.classList.add("hidden"); 
        }
      }
      applyFilters(); 
    });
}

function applyFilters() {
  const container = document.getElementById("container-daftar-user");
  const roleAdmin = localStorage.getItem("role");
  const searchInput = document.getElementById("search-user");
  const searchQuery = searchInput ? searchInput.value.trim().toUpperCase() : "";
  const filterRole = document.getElementById("filter-role") ? document.getElementById("filter-role").value : "";
  const filterWilValue = document.getElementById("filter-wilayah") ? document.getElementById("filter-wilayah").value.trim().toUpperCase() : "";

  const filteredData = DATA_USERS_ALL.filter(u => {
    const uNama = (u.Nama || u.nama || "").trim().toUpperCase();
    const uNik = (u.NIK || u.nik || "").toString().trim();
    const uRole = (u.Role || u.role || "").trim();
    const uKec = (u.Kecamatan || u.kecamatan || "").trim().toUpperCase();
    const uDesa = (u.Desa || u.desa || "").trim().toUpperCase();
    
    const matchSearch = uNama.includes(searchQuery) || uNik.includes(searchQuery);
    const matchRole = filterRole === "" || uRole === filterRole;
    
    let matchWil = true;
    if (roleAdmin === "super_admin") matchWil = filterWilValue === "" || uKec === filterWilValue;
    else if (roleAdmin === "admin_kec") matchWil = filterWilValue === "" || uDesa === filterWilValue;
    
    return matchSearch && matchRole && matchWil;
  });

  container.innerHTML = "";
  
  if (filteredData.length === 0) { 
    container.innerHTML = `<p class="text-center text-[10px] text-slate-400 py-10 italic">Data tidak ditemukan.</p>`; 
    return; 
  }
  
  filteredData.forEach(u => {
    const dNama = u.Nama || u.nama || "---";
    const dNik = u.NIK || u.nik || "---";
    const dKec = u.Kecamatan || u.kecamatan || "---";
    const dDesa = u.Desa || u.desa || "---";
    const dRole = u.Role || u.role || "";
    
    // Perbaikan Bug Tombol Status
    const dStatus = (u.Status || u.status || "aktif").toLowerCase().trim();
    let statusColor = dStatus === "aktif" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700";
    let labelTombolStatus = dStatus === "aktif" ? "NONAKTIFKAN" : "AKTIFKAN";
    
    let roleLabel = dRole === "super_admin" ? "👑 Super Admin" : (dRole === "admin_kec" ? "🏛️ Admin Kec" : (dRole === "admin_desa" ? "🏠 Admin Desa" : "👤 Kader"));
    
    container.innerHTML += `
      <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-2">
        <div class="flex justify-between items-start mb-2">
          <div><p class="text-[11px] font-black text-blue-900 uppercase">${dNama}</p><p class="text-[9px] text-slate-400 font-bold">${dNik}</p></div>
          <span class="text-[8px] font-black ${statusColor} px-2 py-0.5 rounded-md uppercase">${dStatus}</span>
        </div>
        <div class="bg-slate-50 p-2 rounded-lg mb-2"><p class="text-[9px] text-slate-500 font-bold">📍 ${dKec} - ${dDesa}</p><p class="text-[9px] text-blue-700 font-black mt-0.5 uppercase">${roleLabel}</p></div>
        <div class="flex gap-2">
           <button onclick="ubahStatusUser('${dNik}', '${dStatus === 'aktif' ? 'nonaktif' : 'aktif'}')" class="flex-1 bg-slate-100 text-slate-600 text-[10px] font-bold py-2 rounded-xl">${labelTombolStatus}</button>
           <button onclick="hapusUser('${dNik}', '${dNama}')" class="flex-1 bg-red-50 text-red-600 text-[10px] font-bold py-2 rounded-xl">🗑 HAPUS</button>
        </div>
      </div>`;
  });
}

function tambahUser() {
  const btn = document.getElementById("btn-tambah-user");
  const payload = {
    action: "tambah_user",
    user_nik: document.getElementById("user-nik").value,
    nama: document.getElementById("user-nama").value.toUpperCase(),
    password: document.getElementById("user-password").value,
    role: document.getElementById("user-role").value,
    kecamatan: document.getElementById("user-kecamatan").value,
    desa: document.getElementById("user-wilayah").value,
    hp: document.getElementById("user-hp").value
  };
  if (!payload.user_nik || !payload.nama || !payload.kecamatan || !payload.desa) return alert("Wajib diisi!");
  btn.innerText = "⏳ MENYIMPAN..."; btn.disabled = true;
  fetch(API_URL, { method: "POST", body: new URLSearchParams(payload) }).then(() => location.reload());
}

function ubahStatusUser(nik, status) {
  if (!confirm("Ubah status?")) return;
  fetch(API_URL, { method: "POST", body: new URLSearchParams({ action: "update_status_user", nik_target: nik, status_baru: status }) }).then(() => loadUsers());
}

function hapusUser(nik, nama) {
  if (!confirm("Hapus " + nama + "?")) return;
  fetch(API_URL, { method: "POST", body: new URLSearchParams({ action: "hapus_user", nik_target: nik }) }).then(() => loadUsers());
}

// ================= DASHBOARD & STATISTIK (FUNGSI LAMA) =================
function initDashboard() {
  const nama = localStorage.getItem("nama");
  const role = localStorage.getItem("role");
  const kec = localStorage.getItem("kecamatan");
  const desa = localStorage.getItem("desa");
  const fotoBase64 = localStorage.getItem("foto");

  const elNama = document.getElementById("namaUser");
  const elRole = document.getElementById("labelRole");
  const elWilayah = document.getElementById("wilayahOtoritas");
  const elIcon = document.getElementById("iconRole");
  const elFotoHeader = document.getElementById("fotoProfilHeader"); 

  if (elNama) elNama.innerText = nama || "Pengguna";

  // --- LOGIKA FOTO PROFIL (FIXED) ---
  if (elFotoHeader) {
    if (fotoBase64 && fotoBase64 !== "" && fotoBase64 !== "-") {
      elFotoHeader.src = "data:image/jpeg;base64," + fotoBase64;
    } else {
      // Pastikan file def-profil.png satu folder dengan file html
      elFotoHeader.src = "def-profil.png";
    }
  }

  let roleText = "";
  let wilayahText = "";
  let iconEmoji = "👤"; 

  if (role === "super_admin") {
    roleText = "Super Administrator";
    wilayahText = "Kabupaten Bekasi";
    iconEmoji = "👑";
  } else if (role === "admin_kec") {
    roleText = "Admin Kecamatan";
    wilayahText = "Kecamatan " + kec;
    iconEmoji = "🏛️";
  } else if (role === "admin_desa") {
    roleText = "Admin Desa";
    wilayahText = "Desa " + desa;
    iconEmoji = "🏠";
  } else {
    roleText = "Kader PPKBD";
    wilayahText = "Desa " + desa;
    iconEmoji = "👤";
  }

  if (elRole) elRole.innerText = roleText;
  if (elWilayah) elWilayah.innerText = "📍 Wilayah: " + wilayahText;
  if (elIcon) elIcon.innerText = iconEmoji;
}

//====================== 4. LOAD STATISTIK (GRAFIK KINERJA) ==========================//
function loadGrafik() {
  const role = localStorage.getItem("role");
  const nikLogin = localStorage.getItem("nik");
  
  const elTahun = document.getElementById("filter-tahun");
  const elBulan = document.getElementById("filter-bulan");
  if (!elTahun || !elBulan) return; 

  const tahun = elTahun.value;
  const bulan = elBulan.value;
  const userEl = document.getElementById("filter-user");
  const userSelect = userEl ? userEl.value : "";

  // KUNCI PERBAIKAN: Deteksi NIK secara akurat per level wilayah
  let nikTarget = nikLogin; // Default untuk Kader biasa

  if (role && role.includes("admin")) {
    const adminArea = document.getElementById("admin-filter-area");
    if (adminArea) adminArea.classList.remove("hidden");

    if (userSelect !== "") {
       nikTarget = userSelect; // Tarik data 1 kader spesifik
    } else {
       // Kumpulkan semua NIK Kader dari dropdown untuk rekap regional
       let targetNiks = [];
       if (userEl) {
         for (let i = 1; i < userEl.options.length; i++) {
            targetNiks.push(userEl.options[i].value);
         }
       }
       
       if (role === "super_admin" && targetNiks.length === 0) {
          nikTarget = ""; // Super admin kosong = tarik seluruh kabupaten
       } else {
          nikTarget = targetNiks.join(",") || "KOSONG"; // Gabungkan NIK pake koma
       }
    }
  }

  // Minta Data ke Server
  fetch(`${API_URL}?action=get_statistik&nik=${nikTarget}&bulan=${bulan}&tahun=${tahun}&role=${role}`)
    .then(res => res.json())
    .then(data => {
      
      // --- UPDATE KARTU RINGKASAN ---
      const totalReal = data.realisasi_tahunan.reduce((a, b) => a + b, 0);
      const totalTarget = data.target_tahunan.reduce((a, b) => a + b, 0);
      const persen = totalTarget > 0 ? Math.round((totalReal / totalTarget) * 100) : 0;

      if (document.getElementById("total-realisasi")) document.getElementById("total-realisasi").innerText = totalReal;
      if (document.getElementById("total-persen")) document.getElementById("total-persen").innerText = persen + "%";

      // --- UPDATE DIAGRAM DONUT ---
      const canvas = document.getElementById('myChart');
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (myChartInstance) myChartInstance.destroy();
        
        myChartInstance = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['Pertemuan', 'KIE', 'Pelayanan', 'Pencatatan', 'Lainnya'],
            datasets: [{
              data: data.realisasi_bulanan, 
              backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#94a3b8'],
              borderWidth: 2, borderColor: '#ffffff', hoverOffset: 6
            }]
          },
          options: {
            responsive: true, maintainAspectRatio: false, cutout: '65%',
            plugins: { legend: { display: true, position: 'bottom', labels: { usePointStyle: true, font: { size: 10 } } } }
          }
        });
      }

      // --- UPDATE PERINGKAT TOP 5 ---
      const rankArea = document.getElementById("section-peringkat");
      if (role && role.includes("admin") && rankArea) {
        rankArea.classList.remove("hidden");
        renderPeringkat(data.ranking);
      }
    })
    .catch(err => console.error("Gagal load statistik:", err));
}

//====================== 5. RENDER PERINGKAT ==========================//
function renderPeringkat(dataRanking) {
  const listPeringkat = document.getElementById("list-peringkat");
  if (!listPeringkat) return;

  if (!dataRanking || dataRanking.length === 0) {
    listPeringkat.innerHTML = "<p class='text-center text-[10px] text-gray-400 py-4'>Belum ada data laporan.</p>";
    return;
  }

  listPeringkat.innerHTML = dataRanking.map((u, i) => {
    const namaKader = u.Nama || u.nama || "Anonim";
    const skorKader = u.Skor || u.skor || 0;

    return `
    <div class="flex items-center justify-between bg-white p-3 rounded-2xl shadow-sm border border-slate-50">
      <div class="flex items-center gap-3">
        <span class="flex items-center justify-center w-6 h-6 rounded-full ${i === 0 ? 'bg-yellow-400' : 'bg-slate-100'} text-[10px] font-bold ${i === 0 ? 'text-white' : 'text-gray-400'}">${i+1}</span>
        <p class="text-[11px] font-bold text-slate-700 uppercase">${namaKader}</p>
      </div>
      <span class="text-[9px] bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-bold">${skorKader} Lap</span>
    </div>
  `}).join('');
}

function tampilkanMotivasi() {
  const daftar = ["\"Semangat melayani!\"", "\"Kerja ikhlas, kerja tuntas!\""];
  const el = document.getElementById("motivasi-login");
  if (el) el.innerText = daftar[Math.floor(Math.random() * daftar.length)];
}

function setTahunOtomatis() {
  const thn = new Date().getFullYear();
  
  // 1. Untuk Filter Statistik (Hanya tahun ini)
  const elFilter = document.getElementById("filter-tahun");
  if (elFilter) {
    elFilter.innerHTML = `<option value="${thn}">${thn}</option>`;
  }

  // 2. Untuk Form Renja (Tahun ini & Tahun depan)
  const elRenja = document.getElementById("renja-tahun");
  if (elRenja) {
    elRenja.innerHTML = `
      <option value="${thn}">${thn}</option>
      <option value="${thn + 1}">${thn + 1}</option>
    `;
  }
}

// ================= 5. PENGGERAK DOM =================
document.addEventListener("DOMContentLoaded", () => {
  cekLogin();
  if (typeof setTahunOtomatis === 'function') setTahunOtomatis();
  if (document.getElementById("motivasi-login")) tampilkanMotivasi();

  // Jika di halaman dashboard, jalankan initDashboard
  if (document.getElementById("namaUser")) initDashboard();
});

// ==========================================
// 6. LOGIKA KAMUS PPKBD & SATUAN (TAHAP 2)
// ==========================================

function updateSubstansi() {
  const jenis = document.getElementById("renja-jenis").value;
  const wrapperSub = document.getElementById("wrapper-substansi");
  const selectSub = document.getElementById("renja-substansi");
  
  // Kamus asli dari backup Bapak
  const dataSubstansi = {
    "Pertemuan": ["Pertemuan Rutin Kader", "Rapat Koordinasi (Desa/RW)", "Pertemuan Kelompok Kerja (Pokja)"],
    "KIE": ["Penyuluhan Kelompok", "Konseling Individu", "Kunjungan Rumah (Door-to-door)", "Penyebaran Media Informasi"],
    "Pelayanan & Penggerakan": ["Pendampingan Rujukan KB", "Distribusi Alkon (Sub-PPKBD)", "Pembinaan Poktan (BKB/BKR/BKL/UPPKA)", "Fasilitasi Pelayanan KB/Baksos"],
    "Pencatatan & Pelaporan": ["Pemutakhiran Data Keluarga (Verval)", "Pemetaan Sasaran (PUS Unmet Need)", "Pengisian Buku Bantu / K0", "Input Laporan ke New SIGA"]
  };

  selectSub.innerHTML = '<option value="">-- Pilih Substansi --</option>';

  // Logika: Sembunyikan jika "Lainnya" atau kosong
  if (jenis === "Lainnya" || jenis === "") {
    if (wrapperSub) wrapperSub.classList.add("hidden");
    let opt = document.createElement("option");
    opt.value = "Lainnya";
    opt.selected = true;
    selectSub.appendChild(opt);
  } else {
    if (wrapperSub) wrapperSub.classList.remove("hidden");
    if (dataSubstansi[jenis]) {
      dataSubstansi[jenis].forEach(item => {
        let opt = document.createElement("option");
        opt.value = item;
        opt.innerHTML = item;
        selectSub.appendChild(opt);
      });
      // Tambahkan pilihan lainnya di tiap kategori
      let optLain = document.createElement("option");
      optLain.value = "Lainnya di " + jenis;
      optLain.innerHTML = "Lainnya...";
      selectSub.appendChild(optLain);
    }
  }
  updateSatuanOtomatis(); // Panggil otomatisasi satuan
  if (typeof generateIndikator === 'function') generateIndikator(); 
}

function updateSatuanOtomatis() {
  const jenis = document.getElementById("renja-jenis").value;
  const subEl = document.getElementById("renja-substansi");
  const substansi = subEl ? subEl.value : "";
  const satuanSel = document.getElementById("renja-target-satuan");

  if (!satuanSel) return;

  // Logika cerdas penentuan satuan sesuai juknis Bapak
  if (jenis === "Pencatatan & Pelaporan") {
    if (substansi.toLowerCase().includes("verval")) {
      satuanSel.value = "Keluarga";
    } else {
      satuanSel.value = "Dokumen";
    }
  } else if (jenis === "Pelayanan & Penggerakan") {
    satuanSel.value = "Akseptor";
  } else if (jenis === "Pertemuan") {
    satuanSel.value = "Kegiatan";
  } else {
    satuanSel.value = "Orang";
  }
}

function generateIndikator() {
  const jenis = document.getElementById("renja-jenis").value;
  const substansiEl = document.getElementById("renja-substansi");
  const substansi = substansiEl && substansiEl.value ? substansiEl.value : "";
  const keterangan = document.getElementById("renja-keterangan").value.trim();
  const sasaran = document.getElementById("renja-sasaran").value.trim() || "[Sasaran]";
  const angkaTarget = document.getElementById("renja-target-angka").value.trim();
  const satuanTarget = document.getElementById("renja-target-satuan").value;
  const peserta = angkaTarget ? `${angkaTarget} ${satuanTarget}` : "[Jumlah]";
  const lokasi = document.getElementById("renja-lokasi").value || "[Lokasi]";
  
  const inputIndikator = document.getElementById("renja-indikator");

  if (!jenis || jenis === "" || !inputIndikator) {
    if (inputIndikator) inputIndikator.value = "";
    return;
  }
  
  let namaKegiatan = (substansi && substansi !== "") ? substansi : jenis;
  if (jenis === "Lainnya") {
    namaKegiatan = "kegiatan operasional";
  }

  // Gabungkan keterangan jika ada
  const detailKegiatan = keterangan ? `${namaKegiatan} (${keterangan})` : namaKegiatan;
  let kalimatBaku = "";

  // Logika Switch-Case asli dari backup Bapak
  switch (jenis) {
    case "Pertemuan":
      kalimatBaku = `Terselenggaranya agenda ${detailKegiatan} serta meningkatnya kesepahaman pada ${peserta} dari unsur ${sasaran} di wilayah ${lokasi}.`;
      break;
    case "KIE":
      kalimatBaku = `Meningkatnya pengetahuan dan kesadaran ${peserta} sasaran ${sasaran} mengenai program Bangga Kencana melalui edukasi ${detailKegiatan} di ${lokasi}.`;
      break;
    case "Pelayanan & Penggerakan":
      kalimatBaku = `Terlaksananya fasilitasi bagi ${peserta} sasaran ${sasaran} melalui aktivitas ${detailKegiatan} secara optimal di wilayah ${lokasi}.`;
      break;
    case "Pencatatan & Pelaporan":
      kalimatBaku = `Tersusunnya administrasi ${detailKegiatan} untuk sasaran ${sasaran} sebanyak ${peserta} di ${lokasi} yang valid dan akurat.`;
      break;
    default:
      kalimatBaku = `Terlaksananya ${detailKegiatan} dengan capaian ${peserta} dari target ${sasaran} di ${lokasi} sesuai dengan rencana kerja.`;
  }
  
  inputIndikator.value = kalimatBaku;
}

// --- SIMPAN RENCANA KERJA KE SERVER ---
function simpanRenja() {
  const btn = document.getElementById("btn-simpan-renja");
  const info = document.getElementById("info-renja");
  
  // Ambil identitas dari localStorage
  const nik = localStorage.getItem("nik");
  const nama = localStorage.getItem("nama");
  
  // Ambil data form
  const jenis = document.getElementById("renja-jenis").value;
  const substansi = document.getElementById("renja-substansi").value;
  const keterangan = document.getElementById("renja-keterangan").value.trim();
  const volume = document.getElementById("renja-volume").value;
  const targetAngka = document.getElementById("renja-target-angka").value;
  const targetSatuan = document.getElementById("renja-target-satuan").value;

  // Validasi Dasar
  if (!jenis || !volume || !targetAngka) {
    alert("⚠️ Mohon lengkapi Jenis Kegiatan, Volume, dan Target Sasaran!");
    return;
  }

  // Jahit Nama Kegiatan (Persis logika backup Bapak untuk GAS)
  let kegiatanGabung = (jenis === "Lainnya") ? "Lainnya: " + keterangan : jenis + ": " + substansi + (keterangan ? " - " + keterangan : "");

  btn.disabled = true;
  btn.innerText = "⏳ MENYIMPAN...";

  const payload = {
    action: "submit_renja",
    nik: nik,
    nama: nama,
    tahun: document.getElementById("renja-tahun").value,
    bulan: "TAHUNAN",
    kegiatan: kegiatanGabung,
    sasaran: document.getElementById("renja-sasaran").value,
    target_volume: volume,
    target_peserta: `${targetAngka} ${targetSatuan}`,
    indikator: document.getElementById("renja-indikator").value,
    lokasi: document.getElementById("renja-lokasi").value
  };

  fetch(API_URL, {
    method: "POST",
    body: new URLSearchParams(payload)
  })
  .then(res => res.text())
  .then(res => {
    if (res.trim() === "success") {
      alert("✅ Rencana Kerja Berhasil Disimpan!");

      // --- PROSES RESET TOTAL FORM ---
      
      // 1. Reset Dropdown Utama & Sembunyikan Substansi
      document.getElementById("renja-jenis").value = "";
      const wrapperSub = document.getElementById("wrapper-substansi");
      if (wrapperSub) wrapperSub.classList.add("hidden");
      
      const subEl = document.getElementById("renja-substansi");
      if (subEl) subEl.innerHTML = '<option value="">-- Pilih Substansi --</option>';

      // 2. Kosongkan Semua Kolom Input Teks & Angka
      document.getElementById("renja-keterangan").value = "";
      document.getElementById("renja-volume").value = "";
      document.getElementById("renja-sasaran").value = "";
      document.getElementById("renja-target-angka").value = "";
      document.getElementById("renja-indikator").value = "";

      // 3. Khusus Lokasi: Tidak perlu direset jika Kader 
      // ingin menginput banyak data di lokasi yang sama (biar cepat)
      // Tapi jika ingin dikosongkan juga, aktifkan baris bawah ini:
      // document.getElementById("renja-lokasi").value = "";

      loadRenja(); // Segarkan daftar di bawah
    } else {
      alert("❌ Gagal menyimpan: " + res);
    }
    btn.disabled = false;
    btn.innerText = "SIMPAN RENCANA KERJA";
  })
  .catch(err => {
    console.error("Error Simpan:", err);
    alert("Koneksi bermasalah!");
    btn.disabled = false;
    btn.innerText = "SIMPAN RENCANA KERJA";
  });
}

// --- MUAT DAFTAR RENJA SAYA ---
function loadRenja() {
  const list = document.getElementById("listRenja");
  const nik = localStorage.getItem("nik");
  if (!list) return;

  list.innerHTML = "<p class='text-center text-gray-400 text-[10px] animate-pulse py-5'>Sinkronisasi data...</p>";

  fetch(`${API_URL}?action=get_renja&nik=${nik}`)
    .then(res => res.json())
    .then(data => {
      list.innerHTML = "";
      if (!data || data.length === 0) {
        list.innerHTML = "<p class='text-center text-gray-400 text-xs py-10 italic'>Belum ada rencana kerja tersimpan.</p>";
        return;
      }

      data.forEach(item => {
        // Logika warna border: Biru jika bisa dihapus, Hijau jika sudah terkunci (dipakai lapor)
        const borderCol = item.can_delete ? 'border-blue-900' : 'border-green-500';
        const statusLabel = item.can_delete ? 
          `<button onclick="hapusRenja('${item.renja_id}')" class="text-red-300 hover:text-red-500 transition">🗑️</button>` : 
          `<span class="text-[8px] bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-bold">TERKUNCI</span>`;

        list.innerHTML += `
          <div class="bg-white p-4 rounded-2xl shadow-sm border-l-4 ${borderCol} mb-3 relative animate-fadeIn">
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <span class="bg-blue-50 text-blue-700 text-[8px] px-2 py-0.5 rounded-md font-black uppercase">TA ${item.tahun}</span>
                </div>
                <h3 class="font-bold text-blue-900 text-xs uppercase leading-tight pr-10">${item.kegiatan}</h3>
                <div class="flex gap-4 mt-3">
                  <div class="flex flex-col">
                    <span class="text-[8px] text-gray-400 uppercase font-bold">Volume</span>
                    <span class="text-xs font-black text-slate-700">${item.sisa_vol} / ${item.target_vol}</span>
                  </div>
                  <div class="flex flex-col border-l pl-4">
                    <span class="text-[8px] text-gray-400 uppercase font-bold">Target Sasaran</span>
                    <span class="text-xs font-black text-blue-700">${item.target_peserta}</span>
                  </div>
                </div>
              </div>
              ${statusLabel}
            </div>
          </div>`;
      });
    });
}

// --- HAPUS RENJA ---
function hapusRenja(id) {
  if (!confirm("Apakah Anda yakin ingin menghapus Rencana Kerja ini?")) return;
  
  fetch(`${API_URL}?action=hapus_renja&renja_id=${id}`)
    .then(res => res.text())
    .then(res => {
      if (res.trim() === "success") {
        alert("Terhapus!");
        loadRenja();
      } else {
        alert("Gagal menghapus: " + res);
      }
    });
}

// ============================================================
// 7. LOGIKA INPUT LAPORAN (VISUM) - TAHAP 1
// ============================================================

// --- A. BATASI TANGGAL MAKSIMAL HARI INI ---
function batasiTanggalLaporan() {
  const inputTgl = document.getElementById("lap-tgl");
  if (inputTgl) {
    const today = new Date().toISOString().split('T')[0];
    inputTgl.setAttribute("max", today);
  }
}

/// --- B. TARIK DATA RENJA KE MEMORI (DENGAN AUTO-CHECK) ---
function loadRenjaUntukLaporan() {
  const nik = localStorage.getItem("nik");
  const dropdown = document.getElementById("pilih-renja");
  
  // Beri indikasi ke user bahwa data sedang diambil
  if (dropdown) dropdown.innerHTML = '<option value="">⏳ Sinkronisasi Renja...</option>';
  
  dataRenjaGlobal = []; // Reset penampung global
  
  fetch(`${API_URL}?action=get_renja&nik=${nik}`)
    .then(res => res.json())
    .then(data => {
      if(data && data.length > 0) {
        dataRenjaGlobal = data;
        console.log("Data Renja untuk laporan siap!");

        // JURUS ANTI-BALAPAN:
        // Cek apakah user sudah terlanjur isi tanggal. 
        // Jika sudah, langsung jalankan filter tanpa nunggu klik kedua kali.
        const tglSudahAda = document.getElementById("lap-tgl").value;
        if (tglSudahAda) {
          console.log("Tanggal terdeteksi, menjalankan filter otomatis...");
          filterRenjaBerdasarkanTanggal();
        } else {
          // Jika belum isi tanggal, kembalikan teks dropdown ke semula
          if (dropdown) dropdown.innerHTML = '<option value="">-- Pilih Rencana Kerja --</option>';
        }
      } else {
        if (dropdown) dropdown.innerHTML = '<option value="">(Belum ada Renja tersimpan)</option>';
      }
    })
    .catch(err => {
      console.error("Gagal sinkronisasi:", err);
      if (dropdown) dropdown.innerHTML = '<option value="">❌ Gagal memuat data</option>';
    });
}

// --- C. BUKA KUNCI FORM & FILTER TAHUN ---
function bukaKunciForm() {
  const tglInput = document.getElementById("lap-tgl").value;
  const areaLanjutan = document.getElementById("area-lanjutan");
  const pesanKunci = document.getElementById("pesan-kunci");
  
  if (tglInput) {
    areaLanjutan.removeAttribute("disabled");
    areaLanjutan.classList.remove("opacity-40");
    if (pesanKunci) pesanKunci.style.display = "none";
    
    // Jalankan filter otomatis
    filterRenjaBerdasarkanTanggal();
  } else {
    areaLanjutan.setAttribute("disabled", "true");
    areaLanjutan.classList.add("opacity-40");
    if (pesanKunci) pesanKunci.style.display = "block";
  }
}

function filterRenjaBerdasarkanTanggal() {
  const tglInput = document.getElementById("lap-tgl").value;
  const dropdown = document.getElementById("pilih-renja");
  if (!dropdown || !tglInput) return;

  const tahunPilih = String(tglInput.split("-")[0]);
  dropdown.innerHTML = '<option value="">-- Pilih Renja --</option>';
  
  // Filter: Tahun harus sama & Sisa Volume > 0
  const renjaTersedia = dataRenjaGlobal.filter(r => {
    const tahunCocok = String(r.tahun).trim() === String(tahunPilih).trim();
    return String(r.tahun) === tahunPilih && Number(r.sisa_vol) > 0;
  });

  dropdown.innerHTML = '<option value="">-- Pilih Rencana Kerja --</option>';
  
  if (renjaTersedia.length === 0) {
    dropdown.innerHTML = `<option value="">(Tidak ada Renja aktif tahun ${tahunPilih})</option>`;
  } else {
    renjaTersedia.forEach(r => {
      // Masukkan satuan ke data-attribute agar bisa diambil nanti
      dropdown.innerHTML += `<option value="${r.renja_id}" data-satuan="${r.target_peserta}" data-kegiatan="${r.kegiatan}">
        ${r.kegiatan} (Sisa: ${r.sisa_vol}x)
      </option>`;
    });
  }
  if (typeof updateLabelSatuanLaporan === 'function') updateLabelSatuanLaporan();
  if (typeof validasiFotoLaporan === 'function') validasiFotoLaporan();
        
}

// --- D. PINDAH MODE: RENJA VS LUAR RENJA ---
function toggleAreaForm() {
  const sumber = document.getElementById("sumber-kegiatan").value;
  const areaRenja = document.getElementById("area-pilih-renja");
  const areaManual = document.getElementById("area-manual");

  if (sumber === "luar") {
    areaRenja.style.display = "none";
    areaManual.style.display = "block";
  } else {
    areaRenja.style.display = "block";
    areaManual.style.display = "none";
  }
  updateLabelSatuanLaporan(); 
  validasiFotoLaporan();      
}

// --- E. TAMPILKAN DETAIL RENCANA YANG DIPILIH ---
function showDetailRenja() {
  const drp = document.getElementById("pilih-renja");
  const previewBox = document.getElementById("preview-renja-full");
  const previewTeks = document.getElementById("teks-renja-full");

  if (drp && drp.selectedIndex > 0) {
    const opt = drp.options[drp.selectedIndex];
    // Ambil detail dari teks option (kegiatan + sisa)
    previewTeks.innerText = opt.text;
    previewBox.classList.remove("hidden");
  } else {
    if(previewBox) previewBox.classList.add("hidden");
  }
  updateLabelSatuanLaporan(); 
}

// --- F. UPDATE LABEL SATUAN (ORANG/KELUARGA/DLL) ---
function updateLabelSatuanLaporan() {
  const drp = document.getElementById("pilih-renja");
  const container = document.getElementById("container-satuan-laporan");
  const sumber = document.getElementById("sumber-kegiatan").value;

  if (!container) return;

  if (sumber === "renja") {
    let satuanAsli = "Orang"; // Default
    if (drp && drp.selectedIndex > 0) {
      const teksTarget = drp.options[drp.selectedIndex].getAttribute("data-satuan") || "";
      // Pecah "12 Keluarga" ambil kata "Keluarga"-nya saja
      const parts = teksTarget.split(" ");
      satuanAsli = parts.length > 1 ? parts[parts.length - 1] : "Orang";
    }
    
    container.innerHTML = `
      <div class="w-full p-4 bg-blue-100 border border-blue-200 text-blue-800 font-bold rounded-2xl text-center text-sm shadow-inner flex items-center justify-center gap-2">
        <span>${satuanAsli}</span>
        <span class="text-[10px] opacity-50">🔒</span>
      </div>
    `;
  } else {
    // Jika Luar Renja, biarkan kader pilih satuan secara manual
    container.innerHTML = `
      <select id="lap-satuan-manual" onchange="validasiFotoLaporan()" class="w-full p-4 text-sm font-bold text-amber-900 bg-amber-50 border border-amber-200 rounded-2xl outline-none focus:ring-2 focus:ring-amber-500 shadow-sm">
        <option value="Orang">Orang</option>
        <option value="Keluarga">Keluarga</option>
        <option value="Akseptor">Akseptor</option>
        <option value="Dokumen">Dokumen</option>
        <option value="Kegiatan">Kegiatan</option>
        <option value="Kelompok">Kelompok</option>
      </select>
    `;
  }
}

// --- G. VALIDASI FORM (UNTUK BUKA KUNCI KAMERA) ---
function validasiFotoLaporan() {
  const tgl = document.getElementById("lap-tgl").value;
  const lokasi = document.getElementById("lap-lokasi").value.trim();
  const sumber = document.getElementById("sumber-kegiatan").value;
  const realisasi = document.getElementById("lap-realisasi").value;
  
  const areaFoto = document.getElementById("area-foto-klik");
  const labelFoto = document.getElementById("label-foto");
  const ikon = document.getElementById("ikon-kamera");

  let kegiatanOk = false;
  if (sumber === "renja") {
    // Cek apakah sudah pilih renja dan isi catatan
    const renjaId = document.getElementById("pilih-renja").value;
    const catatan = document.getElementById("lap-catatan-renja").value.trim();
    if (renjaId && catatan.length >= 5) kegiatanOk = true;
  } else {
    // Cek apakah isi kegiatan manual minimal 5 karakter
    const manualTeks = document.getElementById("lap-kegiatan-manual").value.trim();
    if (manualTeks.length >= 5) kegiatanOk = true;
  }

  // Jika semua syarat (Tgl, Lokasi, Kegiatan, Hasil) terpenuhi, buka kunci kamera
  if (tgl && lokasi && kegiatanOk && realisasi > 0) {
    areaFoto.classList.remove("opacity-30", "pointer-events-none");
    areaFoto.classList.add("bg-blue-50/50", "border-blue-200");
    labelFoto.innerText = "Klik untuk Ambil Foto Visum";
    labelFoto.classList.replace("text-gray-400", "text-blue-800");
    if (document.getElementById("img-preview").classList.contains("hidden")) {
      ikon.innerText = "📸";
    }
  } else {
    // Kunci kembali jika ada data yang dihapus
    areaFoto.classList.add("opacity-30", "pointer-events-none");
    areaFoto.classList.remove("bg-blue-50/50", "border-blue-200");
    labelFoto.innerText = "Lengkapi Data di Atas Terlebih Dahulu";
    labelFoto.classList.replace("text-blue-800", "text-gray-400");
    ikon.innerText = "🔒";
  }
}

// --- H. FUNGSI BUKA KAMERA ---
function bukaKamera() {
  document.getElementById('lap-foto-file').click();
}

// --- I. PROSES FOTO & WATERMARK (LOGIKA BACKUP) ---
function previewFoto(input) {
  const file = input.files[0];
  if (!file) return;

  const loading = document.getElementById("loading-foto");
  const preview = document.getElementById("img-preview");
  const ikon = document.getElementById("ikon-kamera");
  const label = document.getElementById("label-foto");

  loading.classList.remove("hidden");
  preview.classList.add("hidden");
  ikon.classList.add("hidden");
  label.innerText = "Sedang Memproses...";

  const reader = new FileReader();
  
  // Ambil data untuk Watermark
  const tglInput = document.getElementById("lap-tgl").value;
  const lokasiRaw = document.getElementById("lap-lokasi").value.toUpperCase();
  const realisasi = document.getElementById("lap-realisasi").value;
  const sumber = document.getElementById("sumber-kegiatan").value;
  
  // Ambil satuan
  let satuan = "Orang";
  if (sumber === "renja") {
    const containerSatuan = document.getElementById("container-satuan-laporan");
    satuan = containerSatuan ? containerSatuan.innerText.replace("🔒", "").trim() : "Orang";
  } else {
    satuan = document.getElementById("lap-satuan-manual").value;
  }

  // Ambil nama kegiatan
  let teksKegiatan = "";
  if (sumber === "renja") {
    const drp = document.getElementById("pilih-renja");
    teksKegiatan = drp.options[drp.selectedIndex].getAttribute("data-kegiatan");
  } else {
    teksKegiatan = document.getElementById("lap-kegiatan-manual").value;
  }

  reader.onload = function(e) {
    const img = new Image();
    img.src = e.target.result;
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 1000; // Kompresi agar tidak berat saat upload
      let width = img.width;
      let height = img.height;

      if (width > MAX_WIDTH) {
        height *= MAX_WIDTH / width;
        width = MAX_WIDTH;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      // --- DRAW WATERMARK BOX (Sesuai Backup Bapak) ---
      const boxHeight = height * 0.18; 
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)"; 
      ctx.fillRect(0, height - boxHeight, width, boxHeight);

      ctx.fillStyle = "white";
      const padding = width * 0.04;
      const fontSizeBig = Math.round(width * 0.04); 
      const fontSizeSmall = Math.round(width * 0.03);

      // Kiri: Nama Aplikasi & Kegiatan
      ctx.textAlign = "left";
      ctx.font = `bold ${fontSizeBig}px Arial`;
      ctx.fillText("siPeKa PPKBD", padding, height - (boxHeight * 0.7));
      
      ctx.font = `${fontSizeSmall}px Arial`;
      const cetakKeg = teksKegiatan.length > 35 ? teksKegiatan.substring(0, 35) + "..." : teksKegiatan;
      ctx.fillText(cetakKeg.toUpperCase(), padding, height - (boxHeight * 0.45));
      
      ctx.fillStyle = "#FFD700"; // Warna Emas untuk Hasil
      ctx.font = `bold ${fontSizeSmall}px Arial`;
      ctx.fillText(`HASIL: ${realisasi} ${satuan}`, padding, height - (boxHeight * 0.2));

      // Kanan: Lokasi & Tanggal
      ctx.textAlign = "right";
      ctx.fillStyle = "white";
      ctx.font = `bold ${fontSizeSmall}px Arial`;
      const cetakLok = lokasiRaw.length > 25 ? lokasiRaw.substring(0, 25) + "..." : lokasiRaw;
      ctx.fillText("📍 " + cetakLok, width - padding, height - (boxHeight * 0.6));
      
      ctx.font = `${fontSizeSmall}px Arial`;
      ctx.fillText("📅 " + tglInput, width - padding, height - (boxHeight * 0.3));

      // Simpan ke variabel global base64Foto
      base64Foto = canvas.toDataURL("image/jpeg", 0.8);
      preview.src = base64Foto;

      loading.classList.add("hidden");
      preview.classList.remove("hidden");
      label.innerText = "Foto Berhasil Diverifikasi!";
    }
  }
  reader.readAsDataURL(file);
}

// --- J. SIMPAN LAPORAN VISUM KE SERVER ---
async function simpanLaporan() {
  const btn = document.getElementById("btn-simpan-laporan");
  const info = document.getElementById("info-laporan");
  
  // 1. Ambil Identitas & Wilayah
  const nik = localStorage.getItem("nik");
  const nama = localStorage.getItem("nama");
  const kecamatan = localStorage.getItem("kecamatan");

  // 2. Ambil Data Form Dasar
  const sumber = document.getElementById("sumber-kegiatan").value;
  const tanggal = document.getElementById("lap-tgl").value;
  const lokasi = document.getElementById("lap-lokasi").value.trim();
  const realisasi = document.getElementById("lap-realisasi").value;

  // 3. Tentukan Satuan Final
  let satuanFinal = "";
  if (sumber === "renja") {
    const containerSatuan = document.getElementById("container-satuan-laporan");
    satuanFinal = containerSatuan ? containerSatuan.innerText.replace("🔒", "").trim() : "Orang";
  } else {
    const selectSatuan = document.getElementById("lap-satuan-manual");
    satuanFinal = selectSatuan ? selectSatuan.value : "Orang";
  }

  // 4. Logika Penentuan Nama Kegiatan & Renja ID
  let renja_id = "";
  let namaKegiatanFinal = "";

  if (sumber === "renja") {
    const dropdownRenja = document.getElementById("pilih-renja");
    renja_id = dropdownRenja.value;
    
    if (!renja_id) return alert("⚠️ Pilih Rencana Kerja terlebih dahulu!");
    
    const optTerpilih = dropdownRenja.options[dropdownRenja.selectedIndex];
    const teksRenja = optTerpilih.getAttribute("data-kegiatan");
    const catatanRenja = document.getElementById("lap-catatan-renja").value.trim();

    if (catatanRenja.length < 5) {
      return alert("⚠️ Uraian detail kegiatan minimal 5 karakter!");
    }
    // Gabungkan Nama Renja dengan Catatan Detail
    namaKegiatanFinal = `${teksRenja} | Detail: ${catatanRenja}`;

  } else {
    // Jalur Luar Renja (Insidental)
    renja_id = "LUAR-RENJA";
    const kegiatanManual = document.getElementById("lap-kegiatan-manual").value.trim();

    if (kegiatanManual.length < 5) {
      return alert("⚠️ Nama & Uraian kegiatan manual minimal 5 karakter!");
    }
    namaKegiatanFinal = `Insidental: ${kegiatanManual}`;
  }

  // 5. Validasi Akhir Sebelum Kirim
  if (!base64Foto) return alert("⚠️ Foto Visum belum diambil atau gagal diproses!");
  if (!tanggal || !lokasi || !realisasi) return alert("⚠️ Lengkapi Tanggal, Lokasi, dan Hasil!");

  // 6. Eksekusi Pengiriman
  btn.disabled = true; 
  btn.innerText = "⏳ SEDANG MENGIRIM...";
  info.innerText = "Mohon tunggu, sedang mengunggah data & foto ke server...";
  info.className = "text-center text-xs mt-3 font-bold text-blue-600 animate-pulse";

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: new URLSearchParams({
        action: "submit_laporan",
        nik: nik,
        nama: nama,
        kecamatan: kecamatan,
        renja_id: renja_id,
        kegiatan: namaKegiatanFinal,
        tanggal: tanggal,
        realisasi: `${realisasi} ${satuanFinal}`, // Contoh: "15 Orang"
        lokasi: lokasi,
        foto_data: base64Foto // Format Base64 yang sudah ada Watermark
      })
    });

    const resText = await response.text();
    if (resText.trim() === "success") {
      alert("✅ Laporan Berhasil Terkirim!\nSilakan cek status verifikasi di riwayat.");
      window.location.href = "dashboard-kader.html";
    } else {
      alert("❌ Gagal mengirim! Respon server: " + resText);
      btn.disabled = false;
      btn.innerText = "KIRIM LAPORAN SEKARANG";
    }
  } catch (err) {
    console.error("Fetch Error:", err);
    alert("⚠️ Koneksi Error! Pastikan sinyal stabil saat mengunggah foto.");
    btn.disabled = false;
    btn.innerText = "KIRIM LAPORAN SEKARANG";
  }
}

// ============================================================
// 9. LOGIKA RIWAYAT LAPORAN MANDIRI (KADER)
// ============================================================
// --- A. LOAD RIWAYAT DENGAN FILTER & INTIP FOTO ---
function loadRiwayatKader() {
  const container = document.getElementById("list-riwayat-kader");
  const nik = localStorage.getItem("nik");
  const filterBulan = document.getElementById("filter-bulan-riwayat") ? document.getElementById("filter-bulan-riwayat").value : "ALL";
  
  if (!container) return;

  container.innerHTML = `<p class="text-center text-gray-400 text-[10px] py-10 italic animate-pulse">Menghubungkan ke arsip visum...</p>`;

  fetch(`${API_URL}?action=get_riwayat&nik=${nik}`)
    .then(res => res.json())
    .then(data => {
      container.innerHTML = "";
      let countApproved = 0;
      let countPending = 0;

      if (!data || data.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-400 text-xs py-10 italic">Belum ada laporan terkirim.</p>`;
        return;
      }

      // Balik data agar yang terbaru muncul paling atas
      data.reverse().forEach(item => {
        // Logika Filter Bulan
        const tglObj = new Date(item.tanggal);
        const bulanIndex = tglObj.getMonth().toString(); // 0-11
        if (filterBulan !== "ALL" && bulanIndex !== filterBulan) return;

        const isDraft = item.status.toLowerCase() === "draft";
        if (!isDraft) countApproved++; else countPending++;

        const statusColor = isDraft ? "bg-orange-100 text-orange-600" : "bg-green-100 text-green-700";
        
        container.innerHTML += `
          <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-3 relative overflow-hidden">
            <div class="flex justify-between items-start mb-3">
               <span class="text-[8px] font-black ${statusColor} px-2 py-0.5 rounded-md uppercase">${item.status}</span>
               <div class="flex gap-2">
                 <button onclick="intipFoto('${item.foto}')" class="bg-blue-50 text-blue-600 text-[9px] font-bold px-2 py-1 rounded-md border border-blue-100 active:scale-95 transition">🖼️ INTIP FOTO</button>
                 <p class="text-[9px] text-slate-400 font-bold font-mono pt-1">${item.id}</p>
               </div>
            </div>
            
            <h3 class="text-xs font-black text-blue-900 uppercase leading-tight mb-1">${item.kegiatan}</h3>
            <p class="text-[9px] text-slate-500 font-medium mb-3 italic">📍 ${item.realisasi} di ${item.tanggal}</p>
            
            <div class="flex items-center justify-between border-t border-dashed border-slate-100 pt-3 mt-3">
               <p class="text-[9px] text-slate-400 font-bold">Verifikator: <span class="text-blue-700">${item.verifikator || '-'}</span></p>
               ${isDraft ? 
                 `<button onclick="hapusLaporanKader('${item.id}')" class="text-red-500 text-[10px] font-bold px-2 py-1 transition active:text-red-700">🗑️ HAPUS</button>` 
                 : `<span class="text-[10px] text-green-500 font-black">Disetujui ✅</span>`
               }
            </div>
          </div>`;
      });

      // Update angka statistik di atas
      if(document.getElementById("stat-approved")) document.getElementById("stat-approved").innerText = countApproved;
      if(document.getElementById("stat-pending")) document.getElementById("stat-pending").innerText = countPending;
    })
    .catch(err => {
      console.error(err);
      container.innerHTML = `<p class="text-center text-red-500 text-xs py-10">Gagal mengambil riwayat. Cek koneksi.</p>`;
    });
}

// --- B. LOGIKA MODAL PREVIEW FOTO ---
function intipFoto(url) {
  if (!url || url === "-" || url === "undefined") {
    return alert("⚠️ Foto tidak ditemukan atau gagal diproses server.");
  }
  
  const modal = document.getElementById("modal-foto");
  const img = document.getElementById("img-intip");
  
  if (modal && img) {
    img.src = url;
    modal.classList.remove("hidden");
    // Mencegah scroll body saat modal buka
    document.body.style.overflow = "hidden";
  }
}

function tutupIntip() {
  const modal = document.getElementById("modal-foto");
  if (modal) {
    modal.classList.add("hidden");
    document.body.style.overflow = "auto";
  }
}

// --- C. LOGIKA HAPUS LAPORAN ---
function hapusLaporanKader(id) {
  if (!confirm("Hapus laporan ini? Foto di server juga akan ikut dihapus permanen.")) return;
  
  fetch(`${API_URL}?action=hapus_laporan&laporan_id=${id}`)
    .then(res => res.text())
    .then(res => {
      if (res.trim() === "success") {
        alert("Laporan berhasil dihapus!");
        loadRiwayatKader();
      } else {
        alert("Gagal menghapus: " + res);
      }
    });
}
