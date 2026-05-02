// ============================================================================
// SIPEKA PPKBD - CORE JAVASCRIPT
// Dikembangkan oleh: Dian Budiana
// ============================================================================

// ============================================================================
// 0. CONFIGURASI & VARIABLE GLOBAL
// ============================================================================
const API_URL = "https://script.google.com/macros/s/AKfycbzXt4isvjY5KrSZi37IedLKHGzCwiL1dMoB4N6IeSyKyTJXruTpjMuhWdm3RvJyCGQqEA/exec"; 

let base64Foto = ""; 
let dataRiwayatGlobal = [];
let dataRenjaGlobal = []; 
let GLOBAL_WILAYAH = []; 
let DATA_USERS_ALL = []; 
let myChartInstance = null;
let lastFabClicked = null;

// Variabel Zooming Foto
let currentScale = 1;
let isDragging = false;
let startX, startY;
let translateX = 0;
let translateY = 0;

// ============================================================================
// 1. AUTHENTICATION, SECURITY & MAINTENANCE
// ============================================================================
function pantauMaintenance() {
  const nik = localStorage.getItem("nik");
  
  if (nik === "3207160604930002") return; 

  const isLoginPage = window.location.pathname.includes("index.html") || window.location.pathname.endsWith("/");
  if (isLoginPage) return; 

  // --- UBAH JADI POST DI SINI ---
  fetch(API_URL, {
    method: "POST",
    body: new URLSearchParams({ action: "check_status_sistem" })
  })
    .then(res => res.json())
    .then(data => {
      if (data.status === "maintenance") {
        document.body.innerHTML = `
          <div class="fixed inset-0 z-[9999] bg-slate-900 flex items-center justify-center p-4">
              <div class="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
                  <div class="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-5 border-4 border-white shadow-lg">
                      <span class="text-5xl">🚧</span>
                  </div>
                  <h3 class="text-xl font-black text-slate-800 uppercase tracking-widest mb-2">SISTEM SIBUK</h3>
                  <p class="text-[11px] font-bold text-slate-500 mb-6 leading-relaxed">${data.pesan}</p>
                  <button onclick="logout()" class="w-full bg-red-500 hover:bg-red-600 text-white font-black py-4 rounded-xl text-xs uppercase tracking-widest active:scale-95 transition shadow-lg shadow-red-200">
                      KELUAR APLIKASI
                  </button>
              </div>
          </div>
        `;
      }
    }).catch(e => console.log("Radar skip"));
}

function login() {
  const nik = document.getElementById("nik").value;
  const password = document.getElementById("password").value;
  const info = document.getElementById("info");

  if (!nik || !password) { info.innerText = "NIK & Password wajib diisi!"; return; }

  const loader = document.getElementById("loader-login");
  if (loader) loader.classList.remove("hidden");
  info.innerText = "⏳ Memverifikasi...";

  fetch(API_URL, {
    method: "POST",
    body: new URLSearchParams({ action: "login", nik: nik, password: password })
  })
  .then(res => res.json())
  .then(data => {
    if (loader) loader.classList.add("hidden");

    if (data.status === "maintenance") {
      const pesanEl = document.getElementById("pesan-maintenance");
      const modalEl = document.getElementById("modal-maintenance");
      if(pesanEl) pesanEl.innerText = data.pesan;
      if(modalEl) modalEl.classList.remove("hidden");
      info.innerText = ""; 
      return; 
    }

    if (data.status === "success") {
      localStorage.setItem("nik", data.nik);
      localStorage.setItem("nama", data.nama);
      localStorage.setItem("role", data.role);
      localStorage.setItem("kecamatan", data.kecamatan);
      localStorage.setItem("desa", data.desa);
      localStorage.setItem("foto", data.foto || "");
      window.location.href = data.role.includes("admin") ? "dashboard-admin.html" : "dashboard-kader.html";
    } else { 
      info.innerText = "NIK atau Password Salah!"; 
    }
  })
  .catch(err => {
    if (loader) loader.classList.add("hidden");
    info.innerText = "❌ Gagal koneksi ke server.";
    console.error(err);
  });
}

function tutupMaintenance() {
  const modalMaint = document.getElementById("modal-maintenance");
  if (modalMaint) modalMaint.classList.add("hidden");
}

function cekLogin() {
  const nik = localStorage.getItem("nik");
  const role = localStorage.getItem("role");
  const isLoginPage = window.location.pathname.includes("index.html") || window.location.pathname.endsWith("/");

  if (!nik && !isLoginPage) {
    window.location.href = "index.html";
    return;
  }

  if (nik && isLoginPage) {
    if (role && role.includes("admin")) window.location.href = "dashboard-admin.html";
    else window.location.href = "dashboard-kader.html";
  }
}

function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}


// ============================================================================
// 2. TAMPILAN DASHBOARD & UI UTILITIES
// ============================================================================
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

  if (elFotoHeader) {
    if (fotoBase64 && fotoBase64 !== "" && fotoBase64 !== "-") {
      elFotoHeader.src = "data:image/jpeg;base64," + fotoBase64;
    } else {
      elFotoHeader.src = "def-profil.png";
    }
  }

  let roleText = "", wilayahText = "", iconEmoji = "👤"; 

  if (role === "super_admin") {
    roleText = "Super Administrator"; wilayahText = "Kabupaten Bekasi"; iconEmoji = "👑";

  // --- TAMBAHAN BARU UNTUK PANEL SULTAN ---
    const panelSultan = document.getElementById("panel-sultan");
    if (panelSultan) {
      panelSultan.classList.remove("hidden"); // Munculkan panel
      
      // --- UBAH JADI POST DI SINI ---
      fetch(API_URL, {
        method: "POST",
        body: new URLSearchParams({ action: "check_status_sistem" })
      })
        .then(res => res.json())
        .then(data => {
            const toggle = document.getElementById("toggle-maintenance");
            const label = document.getElementById("label-status-sistem");
            if (data.status === "maintenance") {
                toggle.checked = true;
                label.innerText = "MAINTENANCE";
                label.className = "text-[9px] font-black uppercase bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full tracking-widest border border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.5)]";
            } else {
                toggle.checked = false;
                label.innerText = "AMAN";
                label.className = "text-[9px] font-black uppercase bg-green-500/20 text-green-400 px-3 py-1 rounded-full tracking-widest border border-green-500/30";
            }
        });
    }
    // --- AKHIR TAMBAHAN ---
    
  } else if (role === "admin_kec") {
    roleText = "Admin Kecamatan"; wilayahText = "Kecamatan " + kec; iconEmoji = "🏛️";
  } else if (role === "admin_desa") {
    roleText = "Admin Desa"; wilayahText = "Desa " + desa; iconEmoji = "🏠";
  } else {
    roleText = "Kader PPKBD"; wilayahText = "Desa " + desa; iconEmoji = "👤";
  }

  if (elRole) elRole.innerText = roleText;
  if (elWilayah) elWilayah.innerText = "📍 Wilayah: " + wilayahText;
  if (elIcon) elIcon.innerText = iconEmoji;
}

// ==========================================
// KONTROL SAKLAR SULTAN
// ==========================================
function ubahStatusSistem(checkbox) {
  const nik = localStorage.getItem("nik");
  const statusBaru = checkbox.checked ? "ON" : "OFF";
  const label = document.getElementById("label-status-sistem");

  // Ubah visual sementara agar responsif
  label.innerText = "MEMPROSES...";
  label.className = "text-[9px] font-black uppercase bg-slate-500/20 text-slate-400 px-3 py-1 rounded-full tracking-widest border border-slate-500/30 animate-pulse";
  checkbox.disabled = true;

  fetch(API_URL, {
    method: "POST",
    body: new URLSearchParams({ 
      action: "toggle_maintenance", 
      nik: nik, 
      status_baru: statusBaru 
    })
  })
  .then(res => res.text())
  .then(res => {
    checkbox.disabled = false;
    if (res.trim() === "success") {
      if (statusBaru === "ON") {
        label.innerText = "MAINTENANCE";
        label.className = "text-[9px] font-black uppercase bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full tracking-widest border border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.5)]";
      } else {
        label.innerText = "AMAN";
        label.className = "text-[9px] font-black uppercase bg-green-500/20 text-green-400 px-3 py-1 rounded-full tracking-widest border border-green-500/30";
      }
    } else {
      alert("❌ Gagal merubah status: Unauthorized!");
      checkbox.checked = !checkbox.checked; // Kembalikan ke posisi semula
      label.innerText = "ERROR";
    }
  })
  .catch(err => {
    alert("❌ Gangguan koneksi!");
    checkbox.disabled = false;
    checkbox.checked = !checkbox.checked;
  });
}

function tampilkanMotivasi() {
  const daftar = ["\"Semangat melayani!\"", "\"Kerja ikhlas, kerja tuntas!\""];
  const el = document.getElementById("motivasi-login");
  if (el) el.innerText = daftar[Math.floor(Math.random() * daftar.length)];
}

function setTahunOtomatis() {
  const thn = new Date().getFullYear();
  const elFilter = document.getElementById("filter-tahun");
  if (elFilter) elFilter.innerHTML = `<option value="${thn}">${thn}</option>`;

  const elRenja = document.getElementById("renja-tahun");
  if (elRenja) elRenja.innerHTML = `<option value="${thn}">${thn}</option><option value="${thn + 1}">${thn + 1}</option>`;
}

function navigasiKembali() {
  const role = localStorage.getItem("role");
  if (role && role.toLowerCase().includes("admin")) window.location.href = "dashboard-admin.html";
  else window.location.href = "dashboard-kader.html";
}


// ============================================================================
// 3. WILAYAH & MANAJEMEN ROLE
// ============================================================================
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
  const uniqueDesa = [...new Set(filtered.map(item => (item.nama_desa || "").trim().toUpperCase()))].sort();
  
  uniqueDesa.forEach(namaDesa => {
    if(namaDesa && namaDesa !== "-") {
      let opt = document.createElement("option");
      opt.value = namaDesa;
      opt.innerHTML = namaDesa;
      if(desaTerpilih && namaDesa === desaTerpilih.toUpperCase()) opt.selected = true;
      selDesa.appendChild(opt);
    }
  });
}

function initUserPage() {
  const role = localStorage.getItem("role");
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
  
  if (selKec && role !== "super_admin") { 
    selKec.value = kec; 
    selKec.disabled = true; 
  }

  if (!selRole) return;
  let ops = "";
  
  if (role === "super_admin") {
    ops = `<option value="admin_kec">Admin Kecamatan</option><option value="admin_desa">Admin Desa</option><option value="kader">Kader PPKBD</option>`;
    if(selDesa) updateDropdownDesa();
  } else if (role === "admin_kec") {
    ops = `<option value="admin_desa">Admin Desa</option><option value="kader">Kader PPKBD</option>`;
    if(selDesa) updateDropdownDesa();
  } else {
    ops = `<option value="kader">Kader PPKBD</option>`;
    if(selDesa) { 
        updateDropdownDesa(desa); 
        selDesa.disabled = true; 
    }
  }
  
  selRole.innerHTML = ops;
  if(filterRole) filterRole.innerHTML = `<option value="">Semua Role</option>` + ops;
}

function evaluasiRoleOtomatis() {
  const selRole = document.getElementById("user-role");
  const selKec = document.getElementById("user-kecamatan");
  const selDesa = document.getElementById("user-wilayah");
  if (!selRole || !selKec || !selDesa) return;

  const kec = selKec.value.toUpperCase();
  const desa = selDesa.value.toUpperCase();
  const myRole = localStorage.getItem("role");

  if (kec === "SEMUA KECAMATAN") {
    selRole.innerHTML = `<option value="super_admin">👑 SUPER ADMINISTRATOR (KABUPATEN)</option>`;
  } 
  else if (kec !== "" && desa === "SEMUA DESA") {
    selRole.innerHTML = `<option value="admin_kec">🏛️ ADMIN KECAMATAN ${kec}</option>`;
  } 
  else if (kec !== "" && desa !== "" && desa !== "SEMUA DESA") {
    if (myRole === "super_admin" || myRole === "admin_kec") {
      selRole.innerHTML = `
        <option value="admin_desa">🏠 ADMIN DESA ${desa}</option>
        <option value="kader" selected>👤 KADER PPKBD ${desa}</option>
      `;
    } else {
      selRole.innerHTML = `<option value="kader">👤 KADER PPKBD ${desa}</option>`;
    }
  } else {
    selRole.innerHTML = `<option value="">-- Pilih Wilayah Terlebih Dahulu --</option>`;
  }
}


// ============================================================================
// 4. MANAJEMEN USER (TAMBAH, EDIT, HAPUS, FILTER)
// ============================================================================
function loadUsers() {
  const container = document.getElementById("container-daftar-user");
  const filterWil = document.getElementById("filter-wilayah");
  if (!container) return;
  
  const roleAdmin = localStorage.getItem("role");
  const kecAdmin = localStorage.getItem("kecamatan");
  const desaAdmin = localStorage.getItem("desa");
  
  container.innerHTML = `<p class="text-center text-[10px] text-gray-400 py-10 italic animate-pulse">Sinkronisasi data...</p>`;
  
  fetch(`${API_URL}?action=get_users&role_admin=${roleAdmin}&kec_admin=${kecAdmin}&desa_admin=${desaAdmin}`)
    .then(res => res.json())
    .then(data => {
      DATA_USERS_ALL = data;
      
      if (filterWil) {
        filterWil.innerHTML = '<option value="">Semua Wilayah</option>';
        if (roleAdmin === "super_admin") {
          const listKec = [...new Set(data.map(u => (u.Kecamatan || u.kecamatan || "").trim().toUpperCase()))].sort();
          listKec.forEach(k => { if(k && k !== "") filterWil.innerHTML += `<option value="${k}">${k}</option>`; });
        } else if (roleAdmin === "admin_kec") {
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
    
    const dStatus = (u.Status || u.status || "aktif").toLowerCase().trim();
    let statusColor = dStatus === "aktif" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700";
    let labelTombolStatus = dStatus === "aktif" ? "NONAKTIFKAN" : "AKTIFKAN";
    
    let roleLabel = dRole === "super_admin" ? "👑 Super Admin" : (dRole === "admin_kec" ? "🏛️ Admin Kec" : (dRole === "admin_desa" ? "🏠 Admin Desa" : "👤 Kader"));
    
    let aksiTombol = `<button onclick="kelolaOtoritasUser('${dNik}', 'toggle_status')" class="flex-1 bg-slate-100 text-slate-600 text-[10px] font-bold py-2 rounded-xl active:scale-95 transition">${labelTombolStatus}</button>`;
    
    if (roleAdmin === "super_admin") {
      aksiTombol += `
        <button onclick="resetPasswordUser('${dNik}')" class="flex-1 bg-orange-50 text-orange-600 text-[10px] font-bold py-2 rounded-xl active:scale-95 transition">🔄 RESET PASS</button>
        <button onclick="siapkanEditUser('${dNik}')" class="flex-1 bg-blue-50 text-blue-600 text-[10px] font-bold py-2 rounded-xl active:scale-95 transition">✏️ EDIT</button>
      `;
    }
    
    container.innerHTML += `
      <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-2">
        <div class="flex justify-between items-start mb-2">
          <div>
            <p class="text-[11px] font-black text-blue-900 uppercase">${dNama}</p>
            <p class="text-[9px] text-slate-400 font-bold">${dNik}</p>
          </div>
          <span class="text-[8px] font-black ${statusColor} px-2 py-0.5 rounded-md uppercase">${dStatus}</span>
        </div>
        <div class="bg-slate-50 p-2 rounded-lg mb-2">
          <p class="text-[9px] text-slate-500 font-bold">📍 ${dKec} - ${dDesa}</p>
          <p class="text-[9px] text-blue-700 font-black mt-0.5 uppercase">${roleLabel}</p>
        </div>
        <div class="flex gap-2">
           ${aksiTombol}
        </div>
      </div>`;
  });
}

function tambahUser() {
  const btn = document.getElementById("btn-tambah-user");
  const nikInput = document.getElementById("user-nik");
  const namaInput = document.getElementById("user-nama");
  const kecInput = document.getElementById("user-kecamatan");
  const desaInput = document.getElementById("user-wilayah");
  const roleInput = document.getElementById("user-role");
  const hpInput = document.getElementById("user-hp");

  const payload = {
    action: "tambah_user",
    admin_nik: localStorage.getItem("nik"),
    admin_nama: localStorage.getItem("nama"),
    admin_role: localStorage.getItem("role"),
    user_nik: nikInput.value.trim(),
    nama: namaInput.value.toUpperCase().trim(),
    password: "123456", 
    role: roleInput.value,
    kecamatan: kecInput.value,
    desa: desaInput.value,
    hp: hpInput.value
  };

  if (!payload.user_nik || !payload.nama || !payload.kecamatan || !payload.desa) {
    return alert("⚠️ Mohon lengkapi NIK, Nama, Kecamatan, dan Desa!");
  }

  btn.innerText = "⏳ MENGECEK & MENYIMPAN...";
  btn.disabled = true;

  fetch(API_URL, { 
    method: "POST", 
    body: new URLSearchParams(payload) 
  })
  .then(res => res.text())
  .then(res => {
    const responClean = res.trim();
    if (responClean === "success") {
      alert("✅ Berhasil!\nUser " + payload.nama + " telah didaftarkan ke sistem.");
      if (typeof batalEdit === 'function') batalEdit(); 
      if (typeof loadUsers === 'function') loadUsers(); 
    } 
    else if (responClean === "nik_exists") {
      alert("⚠️ DATA GANDA!\nNIK " + payload.user_nik + " sudah terdaftar di sistem.\n\nSilakan cek kembali NIK atau gunakan fitur EDIT jika ingin memperbarui data user tersebut.");
      btn.innerText = "SIMPAN DATA PENGGUNA";
      btn.disabled = false;
    } 
    else {
      alert("❌ Gagal: " + res);
      btn.innerText = "SIMPAN DATA PENGGUNA";
      btn.disabled = false;
    }
  })
  .catch(err => {
    console.error("Fetch Error:", err);
    alert("❌ Terjadi kesalahan koneksi. Silakan coba lagi.");
    btn.innerText = "SIMPAN DATA PENGGUNA";
    btn.disabled = false;
  });
}

function prosesUpdateUser() {
  const btn = document.getElementById("btn-tambah-user");
  const nikTarget = document.getElementById("edit-nik-target").value; 
  
  const payload = {
    action: "admin_manage_user",
    sub_action: "update_user",
    target_nik: nikTarget,
    admin_nik: localStorage.getItem("nik"),
    admin_nama: localStorage.getItem("nama"),
    admin_role: localStorage.getItem("role"),
    nama: document.getElementById("user-nama").value.toUpperCase(),
    role_target: document.getElementById("user-role").value,
    kecamatan: document.getElementById("user-kecamatan").value,
    desa: document.getElementById("user-wilayah").value,
    hp: document.getElementById("user-hp").value
  };

  if (!payload.nama || !payload.kecamatan || !payload.desa) {
    return alert("⚠️ Nama, Kecamatan & Desa tidak boleh kosong!");
  }

  btn.innerText = "⏳ MEMPROSES UPDATE...";
  btn.disabled = true;

  fetch(API_URL, {
    method: "POST",
    body: new URLSearchParams(payload)
  })
  .then(res => res.text())
  .then(res => {
    if (res.trim() === "success") {
      alert("✅ Data Pengguna Berhasil Diperbarui!");
      batalEdit(); 
      loadUsers(); 
    } else {
      alert("❌ Gagal Update: " + res);
      btn.innerText = "UPDATE DATA PENGGUNA";
      btn.disabled = false;
    }
  })
  .catch(err => {
    alert("❌ Kesalahan koneksi jaringan.");
    btn.innerText = "UPDATE DATA PENGGUNA";
    btn.disabled = false;
  });
}

function batalEdit() {
  document.getElementById("form-title").innerText = "👤 Registrasi Akun Baru";
  document.getElementById("btn-batal-edit").classList.add("hidden");
  
  document.getElementById("edit-nik-target").value = "";
  document.getElementById("user-nik").value = "";
  document.getElementById("user-nik").disabled = false;
  document.getElementById("user-nama").value = "";
  document.getElementById("user-hp").value = "";
  
  const btnSubmit = document.getElementById("btn-tambah-user");
  btnSubmit.innerText = "SIMPAN DATA PENGGUNA";
  btnSubmit.classList.replace("bg-orange-500", "bg-blue-900");
  
  btnSubmit.onclick = function() { tambahUser(); }; 
  btnSubmit.disabled = false;
  
  initUserPage(); 
}

function kelolaOtoritasUser(nik, subAction, extraData = {}) {
  const confirmMsg = subAction === 'toggle_status' ? "Ubah status keaktifan user ini?" : "Proses aksi ini?";
  if (subAction !== 'update_user' && !confirm(confirmMsg)) return;

  const payload = {
    action: "admin_manage_user",
    sub_action: subAction,
    target_nik: nik,
    admin_nik: localStorage.getItem("nik"),
    admin_nama: localStorage.getItem("nama"),
    admin_role: localStorage.getItem("role"),
    ...extraData 
  };

  fetch(API_URL, {
    method: "POST",
    body: new URLSearchParams(payload)
  })
  .then(res => res.text())
  .then(res => {
    if (res.trim() === "success") {
      alert("✅ Otoritas Berhasil Diperbarui!");
      loadUsers(); 
    } else {
      alert("❌ Gagal: " + res);
    }
  });
}

function resetPasswordUser(nik) {
  if (confirm("Reset password user ini ke standar (123456)?")) {
    kelolaOtoritasUser(nik, 'reset_password');
  }
}

// ⚠️ [KONFIRMASI BAPAK]: INI ADALAH FUNGSI siapkanEditUser VERSI BARU DARI BAPAK
// Saya menggunakan yang ini karena ada fitur timeout untuk set role otomatis
function siapkanEditUser(nik) {
  const user = DATA_USERS_ALL.find(u => u.NIK.toString() === nik.toString());
  if (!user) return alert("Data tidak ditemukan.");

  document.getElementById("form-title").innerText = "✏️ EDIT DATA: " + (user.Nama || "").toUpperCase();
  document.getElementById("btn-batal-edit").classList.remove("hidden");
  document.getElementById("edit-nik-target").value = user.NIK; 
  document.getElementById("user-nik").value = user.NIK;
  document.getElementById("user-nik").disabled = true; 
  document.getElementById("user-nama").value = user.Nama;
  document.getElementById("user-hp").value = user.HP || "";

  const kecEl = document.getElementById("user-kecamatan");
  if (kecEl) {
    kecEl.value = (user.Kecamatan || "").toUpperCase();
    updateDropdownDesa(user.Desa); 
    
    setTimeout(() => {
      evaluasiRoleOtomatis(); 
      document.getElementById("user-role").value = user.Role; 
    }, 200);
  }

  const btnSubmit = document.getElementById("btn-tambah-user");
  btnSubmit.innerText = "UPDATE DATA PENGGUNA";
  btnSubmit.classList.remove("bg-blue-900");
  btnSubmit.classList.add("bg-orange-500");
  btnSubmit.onclick = function() { prosesUpdateUser(); };

  window.scrollTo({ top: 0, behavior: 'smooth' });
}



// ============================================================================
// 5. RENCANA KERJA (RENJA)
// ============================================================================
function updateSubstansi() {
  const jenis = document.getElementById("renja-jenis").value;
  const wrapperSub = document.getElementById("wrapper-substansi");
  const selectSub = document.getElementById("renja-substansi");
  
  const dataSubstansi = {
    "Pertemuan": ["Pertemuan Rutin Kader", "Rapat Koordinasi (Desa/RW)", "Pertemuan Kelompok Kerja (Pokja)"],
    "KIE": ["Penyuluhan Kelompok", "Konseling Individu", "Kunjungan Rumah (Door-to-door)", "Penyebaran Media Informasi"],
    "Pelayanan & Penggerakan": ["Pendampingan Rujukan KB", "Distribusi Alkon (Sub-PPKBD)", "Pembinaan Poktan (BKB/BKR/BKL/UPPKA)", "Fasilitasi Pelayanan KB/Baksos"],
    "Pencatatan & Pelaporan": ["Pemutakhiran Data Keluarga (Verval)", "Pemetaan Sasaran (PUS Unmet Need)", "Pengisian Buku Bantu / K0", "Input Laporan ke New SIGA"]
  };

  selectSub.innerHTML = '<option value="">-- Pilih Substansi --</option>';

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
      let optLain = document.createElement("option");
      optLain.value = "Lainnya di " + jenis;
      optLain.innerHTML = "Lainnya...";
      selectSub.appendChild(optLain);
    }
  }
  updateSatuanOtomatis(); 
  if (typeof generateIndikator === 'function') generateIndikator(); 
}

function updateSatuanOtomatis() {
  const jenis = document.getElementById("renja-jenis").value;
  const subEl = document.getElementById("renja-substansi");
  const substansi = subEl ? subEl.value : "";
  const satuanSel = document.getElementById("renja-target-satuan");

  if (!satuanSel) return;

  if (jenis === "Pencatatan & Pelaporan") {
    if (substansi.toLowerCase().includes("verval")) satuanSel.value = "Keluarga";
    else satuanSel.value = "Dokumen";
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
  if (jenis === "Lainnya") namaKegiatan = "kegiatan operasional";

  const detailKegiatan = keterangan ? `${namaKegiatan} (${keterangan})` : namaKegiatan;
  let kalimatBaku = "";

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

function simpanRenja() {
  const btn = document.getElementById("btn-simpan-renja");
  const info = document.getElementById("info-renja");
  
  const nik = localStorage.getItem("nik");
  const nama = localStorage.getItem("nama");
  
  const jenis = document.getElementById("renja-jenis").value;
  const substansi = document.getElementById("renja-substansi").value;
  const keterangan = document.getElementById("renja-keterangan").value.trim();
  const volume = document.getElementById("renja-volume").value;
  const targetAngka = document.getElementById("renja-target-angka").value;
  const targetSatuan = document.getElementById("renja-target-satuan").value;

  if (!jenis || !volume || !targetAngka) {
    alert("⚠️ Mohon lengkapi Jenis Kegiatan, Volume, dan Target Sasaran!");
    return;
  }

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
    lokasi: document.getElementById("renja-lokasi").value,
    role: localStorage.getItem("role"),
  };

  fetch(API_URL, {
    method: "POST",
    body: new URLSearchParams(payload)
  })
  .then(res => res.text())
  .then(res => {
    if (res.trim() === "success") {
      alert("✅ Rencana Kerja Berhasil Disimpan!");

      document.getElementById("renja-jenis").value = "";
      const wrapperSub = document.getElementById("wrapper-substansi");
      if (wrapperSub) wrapperSub.classList.add("hidden");
      
      const subEl = document.getElementById("renja-substansi");
      if (subEl) subEl.innerHTML = '<option value="">-- Pilih Substansi --</option>';

      document.getElementById("renja-keterangan").value = "";
      document.getElementById("renja-volume").value = "";
      document.getElementById("renja-sasaran").value = "";
      document.getElementById("renja-target-angka").value = "";
      document.getElementById("renja-indikator").value = "";

      loadRenja(); 
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


// ============================================================================
// 6. LAPORAN VISUM (FORM, KAMERA & PENYIMPANAN)
// ============================================================================
function batasiTanggalLaporan() {
  const inputTgl = document.getElementById("lap-tgl");
  if (inputTgl) {
    const today = new Date().toISOString().split('T')[0];
    inputTgl.setAttribute("max", today);
  }
}

function loadRenjaUntukLaporan() {
  const nik = localStorage.getItem("nik");
  const dropdown = document.getElementById("pilih-renja");
  
  if (dropdown) dropdown.innerHTML = '<option value="">⏳ Sinkronisasi Renja...</option>';
  dataRenjaGlobal = []; 
  
  fetch(`${API_URL}?action=get_renja&nik=${nik}`)
    .then(res => res.json())
    .then(data => {
      if(data && data.length > 0) {
        dataRenjaGlobal = data;
        console.log("Data Renja untuk laporan siap!");

        const tglSudahAda = document.getElementById("lap-tgl").value;
        if (tglSudahAda) {
          console.log("Tanggal terdeteksi, menjalankan filter otomatis...");
          filterRenjaBerdasarkanTanggal();
        } else {
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

function bukaKunciForm() {
  const tglInput = document.getElementById("lap-tgl").value;
  const areaLanjutan = document.getElementById("area-lanjutan");
  const pesanKunci = document.getElementById("pesan-kunci");
  
  if (tglInput) {
    areaLanjutan.removeAttribute("disabled");
    areaLanjutan.classList.remove("opacity-40");
    if (pesanKunci) pesanKunci.style.display = "none";
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
  
  const renjaTersedia = dataRenjaGlobal.filter(r => {
    return String(r.tahun) === tahunPilih && Number(r.sisa_vol) > 0;
  });

  dropdown.innerHTML = '<option value="">-- Pilih Rencana Kerja --</option>';
  
  if (renjaTersedia.length === 0) {
    dropdown.innerHTML = `<option value="">(Tidak ada Renja aktif tahun ${tahunPilih})</option>`;
  } else {
    renjaTersedia.forEach(r => {
      dropdown.innerHTML += `<option value="${r.renja_id}" data-satuan="${r.target_peserta}" data-kegiatan="${r.kegiatan}">
        ${r.kegiatan} (Sisa: ${r.sisa_vol}x)
      </option>`;
    });
  }
  if (typeof updateLabelSatuanLaporan === 'function') updateLabelSatuanLaporan();
  if (typeof validasiFotoLaporan === 'function') validasiFotoLaporan();       
}

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

function showDetailRenja() {
  const drp = document.getElementById("pilih-renja");
  const previewBox = document.getElementById("preview-renja-full");
  const previewTeks = document.getElementById("teks-renja-full");

  if (drp && drp.selectedIndex > 0) {
    const opt = drp.options[drp.selectedIndex];
    previewTeks.innerText = opt.text;
    previewBox.classList.remove("hidden");
  } else {
    if(previewBox) previewBox.classList.add("hidden");
  }
  updateLabelSatuanLaporan(); 
}

function updateLabelSatuanLaporan() {
  const drp = document.getElementById("pilih-renja");
  const container = document.getElementById("container-satuan-laporan");
  const sumber = document.getElementById("sumber-kegiatan").value;

  if (!container) return;

  if (sumber === "renja") {
    let satuanAsli = "Orang"; 
    if (drp && drp.selectedIndex > 0) {
      const teksTarget = drp.options[drp.selectedIndex].getAttribute("data-satuan") || "";
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
    const renjaId = document.getElementById("pilih-renja").value;
    const catatan = document.getElementById("lap-catatan-renja").value.trim();
    if (renjaId && catatan.length >= 5) kegiatanOk = true;
  } else {
    const manualTeks = document.getElementById("lap-kegiatan-manual").value.trim();
    if (manualTeks.length >= 5) kegiatanOk = true;
  }

  if (tgl && lokasi && kegiatanOk && realisasi > 0) {
    areaFoto.classList.remove("opacity-30", "pointer-events-none");
    areaFoto.classList.add("bg-blue-50/50", "border-blue-200");
    labelFoto.innerText = "Klik untuk Ambil Foto Visum";
    labelFoto.classList.replace("text-gray-400", "text-blue-800");
    if (document.getElementById("img-preview").classList.contains("hidden")) {
      ikon.innerText = "📸";
    }
  } else {
    areaFoto.classList.add("opacity-30", "pointer-events-none");
    areaFoto.classList.remove("bg-blue-50/50", "border-blue-200");
    labelFoto.innerText = "Lengkapi Data di Atas Terlebih Dahulu";
    labelFoto.classList.replace("text-blue-800", "text-gray-400");
    ikon.innerText = "🔒";
  }
}

function bukaKamera() {
  document.getElementById('lap-foto-file').click();
}

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
  
  const tglInput = document.getElementById("lap-tgl").value;
  const lokasiRaw = document.getElementById("lap-lokasi").value.toUpperCase();
  const realisasi = document.getElementById("lap-realisasi").value;
  const sumber = document.getElementById("sumber-kegiatan").value;
  
  let satuan = "Orang";
  if (sumber === "renja") {
    const containerSatuan = document.getElementById("container-satuan-laporan");
    satuan = containerSatuan ? containerSatuan.innerText.replace("🔒", "").trim() : "Orang";
  } else {
    satuan = document.getElementById("lap-satuan-manual").value;
  }

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
      const MAX_WIDTH = 1000; 
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

      const boxHeight = height * 0.18; 
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)"; 
      ctx.fillRect(0, height - boxHeight, width, boxHeight);

      ctx.fillStyle = "white";
      const padding = width * 0.04;
      const fontSizeBig = Math.round(width * 0.04); 
      const fontSizeSmall = Math.round(width * 0.03);

      ctx.textAlign = "left";
      ctx.font = `bold ${fontSizeBig}px Arial`;
      ctx.fillText("siPeKa PPKBD", padding, height - (boxHeight * 0.7));
      
      ctx.font = `${fontSizeSmall}px Arial`;
      const cetakKeg = teksKegiatan.length > 35 ? teksKegiatan.substring(0, 35) + "..." : teksKegiatan;
      ctx.fillText(cetakKeg.toUpperCase(), padding, height - (boxHeight * 0.45));
      
      ctx.fillStyle = "#FFD700"; 
      ctx.font = `bold ${fontSizeSmall}px Arial`;
      ctx.fillText(`HASIL: ${realisasi} ${satuan}`, padding, height - (boxHeight * 0.2));

      ctx.textAlign = "right";
      ctx.fillStyle = "white";
      ctx.font = `bold ${fontSizeSmall}px Arial`;
      const cetakLok = lokasiRaw.length > 25 ? lokasiRaw.substring(0, 25) + "..." : lokasiRaw;
      ctx.fillText("📍 " + cetakLok, width - padding, height - (boxHeight * 0.6));
      
      ctx.font = `${fontSizeSmall}px Arial`;
      ctx.fillText("📅 " + tglInput, width - padding, height - (boxHeight * 0.3));

      base64Foto = canvas.toDataURL("image/jpeg", 0.8);
      preview.src = base64Foto;

      loading.classList.add("hidden");
      preview.classList.remove("hidden");
      label.innerText = "Foto Berhasil Diverifikasi!";
    }
  }
  reader.readAsDataURL(file);
}

async function simpanLaporan() {
  const btn = document.getElementById("btn-simpan-laporan");
  const info = document.getElementById("info-laporan");
  
  const nik = localStorage.getItem("nik");
  const nama = localStorage.getItem("nama");
  const kecamatan = localStorage.getItem("kecamatan");

  const sumber = document.getElementById("sumber-kegiatan").value;
  const tanggal = document.getElementById("lap-tgl").value;
  const lokasi = document.getElementById("lap-lokasi").value.trim();
  const realisasi = document.getElementById("lap-realisasi").value;

  let satuanFinal = "";
  if (sumber === "renja") {
    const containerSatuan = document.getElementById("container-satuan-laporan");
    satuanFinal = containerSatuan ? containerSatuan.innerText.replace("🔒", "").trim() : "Orang";
  } else {
    const selectSatuan = document.getElementById("lap-satuan-manual");
    satuanFinal = selectSatuan ? selectSatuan.value : "Orang";
  }

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
    namaKegiatanFinal = `${teksRenja} | Detail: ${catatanRenja}`;

  } else {
    renja_id = "LUAR-RENJA";
    const kegiatanManual = document.getElementById("lap-kegiatan-manual").value.trim();

    if (kegiatanManual.length < 5) {
      return alert("⚠️ Nama & Uraian kegiatan manual minimal 5 karakter!");
    }
    namaKegiatanFinal = `Insidental: ${kegiatanManual}`;
  }

  if (!base64Foto) return alert("⚠️ Foto Visum belum diambil atau gagal diproses!");
  if (!tanggal || !lokasi || !realisasi) return alert("⚠️ Lengkapi Tanggal, Lokasi, dan Hasil!");

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
        realisasi: `${realisasi} ${satuanFinal}`, 
        lokasi: lokasi,
        role: localStorage.getItem("role"),
        foto_data: base64Foto, 
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


// ============================================================================
// 7. RIWAYAT LAPORAN & FOTO VIEWER
// ============================================================================
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

      data.reverse().forEach(item => {
        const tglObj = new Date(item.tanggal);
        const bulanIndex = tglObj.getMonth().toString(); 
        if (filterBulan !== "ALL" && bulanIndex !== filterBulan) return;

        const status = (item.status || "PENDING").toUpperCase();
        let statusColor = "bg-orange-100 text-orange-600"; 
        let labelStatus = "DRAFT / PENDING";
        let aksiKader = "";
        let alasanHTML = "";

        if (status === "APPROVED") {
          statusColor = "bg-green-100 text-green-700";
          labelStatus = "DISETUJUI";
          countApproved++;
          aksiKader = `<span class="text-[10px] text-green-500 font-black">Disetujui ✅</span>`;
        } 
        else if (status === "REJECT") {
          statusColor = "bg-red-100 text-red-700"; 
          labelStatus = "DITOLAK";
          countPending++; 
          
          alasanHTML = `
            <div class="mt-3 p-3 bg-red-50 rounded-xl border border-red-100">
              <p class="text-[8px] font-black text-red-600 uppercase mb-1">Catatan Admin:</p>
              <p class="text-[10px] font-bold text-slate-700 leading-tight">${item.alasan || "Foto/Data tidak sesuai"}</p>
            </div>`;
          
          aksiKader = `<button onclick="hapusLaporanKader('${item.id}')" class="bg-red-600 text-white text-[9px] font-bold px-3 py-1.5 rounded-lg shadow-lg active:scale-95 transition">🗑️ HAPUS & REVISI</button>`;
        } 
        else {
          countPending++;
          aksiKader = `<button onclick="hapusLaporanKader('${item.id}')" class="text-red-500 text-[10px] font-bold px-2 py-1 transition active:text-red-700">🗑️ HAPUS</button>`;
        }
        
        container.innerHTML += `
          <div class="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 mb-4 overflow-hidden">
            <div class="flex justify-between items-start mb-3">
                <span class="text-[8px] font-black ${statusColor} px-2.5 py-1 rounded-full uppercase tracking-widest border border-current opacity-80">${labelStatus}</span>
                <div class="flex gap-2">
                  <button onclick="intipFoto('${item.fotoId}')" class="text-[9px] text-blue-600 font-black border border-blue-100 px-2.5 py-1 rounded-xl bg-blue-50 active:scale-95 transition">
                    🖼️ LIHAT FOTO
                  </button>
                  <p class="text-[9px] text-slate-300 font-bold font-mono pt-1.5">ID: ${item.id}</p>
                </div>
            </div>

            <h3 class="text-xs font-black text-blue-900 uppercase leading-tight mb-1">${item.kegiatan}</h3>
            <p class="text-[9px] text-slate-500 font-medium mb-1">📍 ${item.realisasi}</p>
            <p class="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">${item.tanggal}</p>

            ${alasanHTML}

            <div class="flex items-center justify-between border-t border-dashed border-slate-100 pt-3 mt-3">
               <p class="text-[9px] text-slate-400 font-bold">Verifikator: <span class="text-blue-700 uppercase">${item.verifikator || '-'}</span></p>
               ${aksiKader}
            </div>
          </div>`;
      });

      if(document.getElementById("stat-approved")) document.getElementById("stat-approved").innerText = countApproved;
      if(document.getElementById("stat-pending")) document.getElementById("stat-pending").innerText = countPending;
    })
    .catch(err => {
      console.error(err);
      container.innerHTML = `<p class="text-center text-red-500 text-xs py-10 font-bold">❌ GAGAL SYNC ARSIP</p>`;
    });
}

function hapusLaporanKader(id) {
  if (!confirm("Hapus laporan ini? Foto di server juga akan ikut dihapus permanen.")) return;

  const nik = localStorage.getItem("nik");
  const nama = localStorage.getItem("nama");
  const role = localStorage.getItem("role");

  const params = new URLSearchParams({
    action: "hapus_laporan",
    laporan_id: id,
    nik: nik,
    nama: nama,
    role: role
  });

  fetch(`${API_URL}?${params.toString()}`)
    .then(res => res.text())
    .then(res => {
      if (res.trim() === "success") {
        alert("✅ Laporan berhasil dihapus!");
        loadRiwayatKader(); 
      } else if (res.trim() === "ditolak") {
        alert("❌ Gagal! Laporan sudah disetujui Admin dan tidak bisa dihapus.");
      } else {
        alert("❌ Gagal menghapus: " + res);
      }
    })
    .catch(err => {
      console.error("Error Hapus:", err);
      alert("❌ Terjadi kesalahan koneksi saat menghapus.");
    });
}

function intipFoto(id) {
  if (!id || id === "-" || id === "undefined") return alert("⚠️ Foto tidak tersedia.");
  
  const modal = document.getElementById("modal-foto");
  const img = document.getElementById("img-intip");
  
  if (modal && img) {
    resetZoom();
    img.src = `https://drive.google.com/thumbnail?id=${id}&sz=w1200`;
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }
}

function prosesZoom(delta) {
  const container = document.getElementById("zoom-container");
  const label = document.getElementById("zoom-label");
  if (!container) return;

  currentScale += delta;
  if (currentScale < 0.5) currentScale = 0.5;
  if (currentScale > 4) currentScale = 4; 

  updateTransform();
  if (label) label.innerText = Math.round(currentScale * 100) + "%";
}

function updateTransform() {
  const container = document.getElementById("zoom-container");
  if (container) {
    container.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentScale})`;
  }
}

function resetZoom() {
  currentScale = 1;
  translateX = 0;
  translateY = 0;
  updateTransform();
  if (document.getElementById("zoom-label")) document.getElementById("zoom-label").innerText = "100%";
}

function tutupIntip() {
  const modal = document.getElementById("modal-foto");
  if (modal) {
    modal.classList.add("hidden");
    document.body.style.overflow = "auto";
    resetZoom();
  }
}


// ============================================================================
// 8. STATISTIK & PERINGKAT KINERJA
// ============================================================================
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

  let nikTarget = nikLogin; 

  if (role && role.includes("admin")) {
    const adminArea = document.getElementById("admin-filter-area");
    if (adminArea) adminArea.classList.remove("hidden");

    if (userSelect !== "") {
       nikTarget = userSelect; 
    } else {
       let targetNiks = [];
       if (userEl) {
         for (let i = 1; i < userEl.options.length; i++) {
            targetNiks.push(userEl.options[i].value);
         }
       }
       
       if (role === "super_admin" && targetNiks.length === 0) {
          nikTarget = ""; 
       } else {
          nikTarget = targetNiks.join(",") || "KOSONG"; 
       }
    }
  }

  fetch(`${API_URL}?action=get_statistik&nik=${nikTarget}&bulan=${bulan}&tahun=${tahun}&role=${role}`)
    .then(res => res.json())
    .then(data => {
      
      const totalReal = data.realisasi_tahunan.reduce((a, b) => a + b, 0);
      const totalTarget = data.target_tahunan.reduce((a, b) => a + b, 0);
      const persen = totalTarget > 0 ? Math.round((totalReal / totalTarget) * 100) : 0;

      if (document.getElementById("total-realisasi")) document.getElementById("total-realisasi").innerText = totalReal;
      if (document.getElementById("total-persen")) document.getElementById("total-persen").innerText = persen + "%";

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

      const rankArea = document.getElementById("section-peringkat");
      if (role && role.includes("admin") && rankArea) {
        rankArea.classList.remove("hidden");
        renderPeringkat(data.ranking);
      }
    })
    .catch(err => console.error("Gagal load statistik:", err));
}

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


// ============================================================================
// 9. LOG AKTIVITAS & BACKUP CSV
// ============================================================================
let DATA_LOG_GLOBAL = []; 

function loadLogAktivitas() {
  const container = document.getElementById("container-log");
  if (!container) return;

  const role = localStorage.getItem("role");
  const kec = localStorage.getItem("kecamatan");

  fetch(`${API_URL}?action=get_logs&role=${role}&kec=${kec}`)
    .then(res => res.json())
    .then(data => {
      DATA_LOG_GLOBAL = data.logs; 
      
      const infoTotal = document.getElementById("info-total-log");
      if (infoTotal) {
        infoTotal.innerText = `Kapasitas Database: ${data.total_database} / 2000 Baris`;
      }

      if (role === "super_admin") {
        document.getElementById("btn-backup-log").classList.remove("hidden");
        document.getElementById("panel-filter-log").classList.remove("hidden");
      }
      
      renderLogSesuaiOtoritas();
    })
    .catch(err => {
      container.innerHTML = "<p class='text-center text-xs text-red-500 py-10'>Gagal sinkronisasi data.</p>";
    });
}

function renderLogSesuaiOtoritas() {
  const container = document.getElementById("container-log");
  const roleAdmin = localStorage.getItem("role");
  
  const filterAksi = document.getElementById("filter-aksi-log") ? document.getElementById("filter-aksi-log").value.toUpperCase() : "";
  const keyword = document.getElementById("search-log") ? document.getElementById("search-log").value.toUpperCase() : "";

  const dataTerfilter = DATA_LOG_GLOBAL.filter(log => {
    const matchAksi = filterAksi === "" || (log.aksi || "").toUpperCase().includes(filterAksi);
    const matchKey = (log.nama || "").toUpperCase().includes(keyword) || (log.nik || "").toString().includes(keyword);
    return matchAksi && matchKey;
  });

  if (dataTerfilter.length === 0) {
    container.innerHTML = "<p class='text-center text-xs text-slate-400 py-10'>Tidak ada aktivitas ditemukan.</p>";
    return;
  }

  if (roleAdmin === "super_admin") {
    let htmlTabel = `
      <div class="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50 text-[9px] text-slate-400 uppercase tracking-widest">
                <th class="p-4 border-b font-black">Waktu</th>
                <th class="p-4 border-b font-black">Pengguna</th>
                <th class="p-4 border-b font-black text-center">Aksi</th>
                <th class="p-4 border-b font-black">Keterangan</th>
              </tr>
            </thead>
            <tbody class="text-[10px] font-bold text-slate-700">
    `;

    dataTerfilter.forEach(log => {
      const tgl = new Date(log.timestamp);
      const strWaktu = `${tgl.toLocaleDateString('id-ID', {day:'2-digit', month:'short', year:'numeric'})} ${tgl.toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}`;
      
      let badgeWarna = "bg-slate-100 text-slate-600";
      if (log.aksi.includes("HAPUS")) badgeWarna = "bg-red-100 text-red-600";
      if (log.aksi.includes("TAMBAH")) badgeWarna = "bg-green-100 text-green-600";
      if (log.aksi.includes("LOGIN")) badgeWarna = "bg-blue-100 text-blue-600";

      htmlTabel += `
        <tr class="border-b border-slate-50 hover:bg-slate-50 transition">
          <td class="p-4 whitespace-nowrap text-[9px] text-slate-400">${strWaktu}</td>
          <td class="p-4 uppercase leading-tight"><span class="text-blue-900">${log.nama}</span><br><span class="text-[8px] text-slate-400">${log.role}</span></td>
          <td class="p-4 text-center"><span class="px-2 py-1 rounded-md uppercase text-[8px] font-black ${badgeWarna}">${log.aksi}</span></td>
          <td class="p-4 uppercase text-[9px]">${log.keterangan || "-"}</td>
        </tr>
      `;
    });

    htmlTabel += `</tbody></table></div></div>`;
    container.innerHTML = htmlTabel;
  } 
  else {
    let htmlTimeline = `<div class="relative border-l-2 border-slate-200 ml-3 space-y-6 pb-10">`;
    dataTerfilter.forEach(log => {
      const tgl = new Date(log.timestamp);
      const waktuStr = tgl.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      
      htmlTimeline += `
        <div class="relative pl-6">
          <div class="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-4 border-blue-400 shadow-sm"></div>
          <div class="bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
            <div class="flex justify-between items-start mb-1">
              <span class="text-[8px] font-black uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">${log.aksi}</span>
              <span class="text-[8px] font-bold text-slate-400">${waktuStr}</span>
            </div>
            <p class="text-[10px] font-bold text-slate-700 uppercase leading-tight mb-2">${log.keterangan}</p>
            <p class="text-[8px] font-bold text-slate-400 uppercase">👤 ${log.nama}</p>
          </div>
        </div>
      `;
    });
    htmlTimeline += `</div>`;
    container.innerHTML = htmlTimeline;
  }
}

function backupLogKeCSV() {
  if (DATA_LOG_GLOBAL.length === 0) return alert("⚠️ Tidak ada data untuk di-backup!");

  let csvContent = "TIMESTAMP,NIK,NAMA_USER,ROLE,AKSI,ID_TERKAIT,KETERANGAN\n";

  DATA_LOG_GLOBAL.forEach(log => {
    const tgl = new Date(log.timestamp).toISOString();
    const row = [
      `"${tgl}"`,
      `"${log.nik || ""}"`,
      `"${log.nama || ""}"`,
      `"${log.role || ""}"`,
      `"${log.aksi || ""}"`,
      `"${log.id_data || ""}"`,
      `"${(log.keterangan || "").replace(/"/g, '""')}"` 
    ].join(",");
    
    csvContent += row + "\n";
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Backup_Log_siPeKa_${new Date().getTime()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ============================================================================
// 10. FITUR TOMBOL MELAYANG (FAB) & AUTO-CHAT WA
// ============================================================================
let lastFabClicked = null;

function handleFabClick(type) {
    const label = document.getElementById("label-" + type);

    if (lastFabClicked !== type) {
        // Klik Pertama: Munculkan Label
        document.querySelectorAll('[id^="label-"]').forEach(el => el.classList.add('opacity-0'));
        label.classList.remove('opacity-0');
        lastFabClicked = type;
        
        setTimeout(() => {
            if(lastFabClicked === type) {
                label.classList.add('opacity-0');
                lastFabClicked = null;
            }
        }, 3000);
    } 
    else {
        // Klik Kedua: Jalankan Aksi
        if (type === 'tentang') window.location.href = 'tentang.html';
        if (type === 'bantuan') kirimPesanWA(); // Panggil fungsi Auto-Chat
        if (type === 'kopi') bukaTraktir();
        
        label.classList.add('opacity-0');
        lastFabClicked = null;
    }
}

// FUNGSI AUTO-CHAT WA (CHATBOT SEDERHANA)
function kirimPesanWA() {
    const nama = localStorage.getItem("nama") || "Kader siPeKa";
    const desa = localStorage.getItem("desa") || "-";
    const kec = localStorage.getItem("kecamatan") || "-";
    
    // Pesan Otomatis (Gunakan %0A untuk baris baru)
    const pesan = `Halo Pak Dian, saya *${nama}* dari *Desa ${desa}, Kec. ${kec}*. %0A%0ASehubungan dengan penggunaan aplikasi *siPeKa*, ada yang ingin saya tanyakan mengenai: %0A...`;
    
    const urlWA = `https://wa.me/6282260188765?text=${pesan}`;
    window.open(urlWA, '_blank');
}

function toggleFAB() {
    const menu = document.getElementById('menu-fab');
    const icon = document.getElementById('icon-fab');
    const instruksi = document.getElementById('label-instruksi');
    
    if (menu.classList.contains('hidden')) {
        menu.classList.remove('hidden');
        if(instruksi) instruksi.classList.remove('hidden'); // Munculkan instruksi "Klik 2x"
        setTimeout(() => {
            menu.classList.remove('translate-y-4', 'opacity-0');
            icon.style.transform = 'rotate(45deg)';
        }, 10);
    } else {
        menu.classList.add('translate-y-4', 'opacity-0');
        icon.style.transform = 'rotate(0deg)';
        if(instruksi) instruksi.classList.add('hidden'); // Sembunyikan instruksi
        document.querySelectorAll('[id^="label-"]').forEach(el => el.classList.add('opacity-0'));
        lastFabClicked = null;
        setTimeout(() => { menu.classList.add('hidden'); }, 300);
    }
}

// Fungsi Modal Traktir Kopi (Hanya pastikan sudah ada di script.js)
function bukaTraktir() {
    const modal = document.getElementById("modal-traktir");
    if (modal) modal.classList.remove("hidden");
}

function tutupTraktir() {
    const modal = document.getElementById("modal-traktir");
    if (modal) modal.classList.add("hidden");
}
// ============================================================================
// 11. PENGGERAK UTAMA (DOM CONTENT LOADED)
// ============================================================================
// Ini adalah "Mesin Starter" untuk memicu semua fungsi saat halaman selesai dimuat.
// ⚠️ Saya sudah menggabungkan fungsi Drag Foto (yang nyelip di tengah) ke sini.
// ============================================================================
document.addEventListener("DOMContentLoaded", () => {
  // 1. Eksekusi Login & Keamanan
  cekLogin();
  pantauMaintenance(); 
  if (document.getElementById("motivasi-login")) tampilkanMotivasi();

  // 2. Eksekusi Dashboard
  if (typeof setTahunOtomatis === 'function') setTahunOtomatis();
  if (document.getElementById("namaUser")) initDashboard();

  // 3. Eksekusi Modal Foto (Fungsi Geser/Zoom Modal Intip Foto)
  const zoomArea = document.getElementById("modal-foto");
  if (zoomArea) {
    const startAction = (e) => {
      isDragging = true;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      startX = clientX - translateX;
      startY = clientY - translateY;
      const container = document.getElementById("zoom-container");
      if(container) container.style.transition = "none";
    };

    const moveAction = (e) => {
      if (!isDragging) return;
      if (e.touches) e.preventDefault(); 
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      translateX = clientX - startX;
      translateY = clientY - startY;
      updateTransform();
    };

    const stopAction = () => {
      isDragging = false;
      const container = document.getElementById("zoom-container");
      if(container) container.style.transition = "transform 0.2s ease-out";
    };

    zoomArea.addEventListener("mousedown", startAction);
    window.addEventListener("mousemove", moveAction);
    window.addEventListener("mouseup", stopAction);
    zoomArea.addEventListener("touchstart", startAction, { passive: false });
    window.addEventListener("touchmove", moveAction, { passive: false });
    window.addEventListener("touchend", stopAction);
  }
});


