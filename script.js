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
          opt.value = item.nama_kec;
          opt.setAttribute("data-kode", item.kode_kec); 
          opt.innerHTML = item.nama_kec;
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
  const kecDipilih = selKec.value;
  selDesa.innerHTML = '<option value="">-- Pilih Desa --</option>';
  if (kecDipilih && roleLogin === "super_admin") {
    let optSemua = document.createElement("option");
    optSemua.value = "SEMUA DESA";
    optSemua.innerHTML = "--- SEMUA DESA (OTORITAS KEC) ---";
    selDesa.appendChild(optSemua);
  }
  const filtered = GLOBAL_WILAYAH.filter(item => item.nama_kec === kecDipilih);
  filtered.forEach(item => {
    if(item.nama_desa && item.nama_desa !== "-") {
      let opt = document.createElement("option");
      opt.value = item.nama_desa;
      opt.innerHTML = item.nama_desa;
      if(item.nama_desa === desaTerpilih) opt.selected = true;
      selDesa.appendChild(opt);
    }
  });
}

function initUserPage() {
  const role = localStorage.getItem("role");
  const kec = localStorage.getItem("kecamatan");
  const desa = localStorage.getItem("desa");
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
  if (selKec && role !== "super_admin") { selKec.value = kec; selKec.disabled = true; if (selDesa) updateDropdownDesa(); }

  if (!selRole) return;
  let ops = "";
  if (role === "super_admin") {
    ops = `<option value="admin_kec">Admin Kecamatan</option><option value="admin_desa">Admin Desa</option><option value="kader">Kader PPKBD</option>`;
  } else if (role === "admin_kec") {
    ops = `<option value="admin_desa">Admin Desa</option><option value="kader">Kader PPKBD</option>`;
  } else {
    ops = `<option value="kader">Kader PPKBD</option>`;
    if(selDesa) { updateDropdownDesa(desa); selDesa.disabled = true; }
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
          const listKec = [...new Set(data.map(u => u.Kecamatan || u.kecamatan))].sort();
          listKec.forEach(k => { if(k) filterWil.innerHTML += `<option value="${k}">${k}</option>`; });
        } else if (roleAdmin === "admin_kec") {
          const listDesa = [...new Set(data.map(u => u.Desa || u.desa))].sort();
          listDesa.forEach(d => { if(d) filterWil.innerHTML += `<option value="${d}">${d}</option>`; });
        } else { filterWil.classList.add("hidden"); }
      }
      applyFilters(); 
    });
}

function applyFilters() {
  const container = document.getElementById("container-daftar-user");
  const roleAdmin = localStorage.getItem("role");
  const searchInput = document.getElementById("search-user");
  const searchQuery = searchInput ? searchInput.value.toUpperCase() : "";
  const filterRole = document.getElementById("filter-role") ? document.getElementById("filter-role").value : "";
  const filterWilValue = document.getElementById("filter-wilayah") ? document.getElementById("filter-wilayah").value : "";

  const filteredData = DATA_USERS_ALL.filter(u => {
    const uNama = (u.Nama || u.nama || "").toUpperCase();
    const uNik = (u.NIK || u.nik || "").toString();
    const uRole = u.Role || u.role || "";
    const uKec = u.Kecamatan || u.kecamatan || "";
    const uDesa = u.Desa || u.desa || "";
    const matchSearch = uNama.includes(searchQuery) || uNik.includes(searchQuery);
    const matchRole = filterRole === "" || uRole === filterRole;
    let matchWil = true;
    if (roleAdmin === "super_admin") matchWil = filterWilValue === "" || uKec === filterWilValue;
    else if (roleAdmin === "admin_kec") matchWil = filterWilValue === "" || uDesa === filterWilValue;
    return matchSearch && matchRole && matchWil;
  });

  container.innerHTML = "";
  if (filteredData.length === 0) { container.innerHTML = `<p class="text-center text-[10px] text-slate-400 py-10 italic">Data tidak ditemukan.</p>`; return; }
  filteredData.forEach(u => {
    const dNama = u.Nama || u.nama || "---";
    const dNik = u.NIK || u.nik || "---";
    const dKec = u.Kecamatan || u.kecamatan || "---";
    const dDesa = u.Desa || u.desa || "---";
    const dRole = u.Role || u.role || "";
    const dStatus = u.Status || u.status || "aktif";
    let statusColor = dStatus === "aktif" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700";
    let roleLabel = dRole === "super_admin" ? "👑 Super Admin" : (dRole === "admin_kec" ? "🏛️ Admin Kec" : (dRole === "admin_desa" ? "🏠 Admin Desa" : "👤 Kader"));
    container.innerHTML += `
      <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-2">
        <div class="flex justify-between items-start mb-2">
          <div><p class="text-[11px] font-black text-blue-900 uppercase">${dNama}</p><p class="text-[9px] text-slate-400 font-bold">${dNik}</p></div>
          <span class="text-[8px] font-black ${statusColor} px-2 py-0.5 rounded-md uppercase">${dStatus}</span>
        </div>
        <div class="bg-slate-50 p-2 rounded-lg mb-2"><p class="text-[9px] text-slate-500 font-bold">📍 ${dKec} - ${dDesa}</p><p class="text-[9px] text-blue-700 font-black mt-0.5 uppercase">${roleLabel}</p></div>
        <div class="flex gap-2">
           <button onclick="ubahStatusUser('${dNik}', '${dStatus === 'aktif' ? 'nonaktif' : 'aktif'}')" class="flex-1 bg-slate-100 text-slate-600 text-[10px] font-bold py-2 rounded-xl">STATUS</button>
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

// ================= 4. DASHBOARD & STATISTIK (FUNGSI LAMA) =================
function initDashboard() {
  const nama = localStorage.getItem("nama");
  const role = localStorage.getItem("role");
  const kec = localStorage.getItem("kecamatan");
  const desa = localStorage.getItem("desa");
  const fotoBase64 = localStorage.getItem("foto"); // Ambil dari memori
  const elFotoHeader = document.getElementById("fotoProfilHeader");
  
  const elNama = document.getElementById("namaUser");
  const elRole = document.getElementById("labelRole");
  const elWilayah = document.getElementById("wilayahOtoritas");
  const elIcon = document.getElementById("iconRole");
  const elFotoHeader = document.getElementById("fotoProfilHeader"); // ID foto di header

  if (elNama) elNama.innerText = nama;

  // --- LOGIKA FOTO PROFIL (BARU) ---
  if (elFotoHeader) {
    if (fotoBase64 && fotoBase64 !== "" && fotoBase64 !== "-") {
      // Pasang langsung ke elemen img
      elFotoHeader.src = "data:image/jpeg;base64," + fotoBase64;
    } else {
      // Jika belum ada foto, pakai ikon default
      elFotoHeader.src = "def-profil.png";
    }
  }
  let roleText = "";
  let wilayahText = "";
  let iconEmoji = "👤"; 

  // --- LOGIKA PENENTUAN ICON ROLE (MILIK BAPAK) ---
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
  const kecAdmin = localStorage.getItem("kecamatan"); 
  const desaAdmin = localStorage.getItem("desa");
  
  const elTahun = document.getElementById("filter-tahun");
  const elBulan = document.getElementById("filter-bulan");
  if (!elTahun || !elBulan) return; 

  const tahun = elTahun.value;
  const bulan = elBulan.value;
  const userEl = document.getElementById("filter-user"); // Dropdown pilih kader
  const userSelect = userEl ? userEl.value : "";

  // 1. LOGIKA DROPDOWN PILIHAN KADER (KHUSUS ADMIN)
  if (role && role.includes("admin")) {
    const adminArea = document.getElementById("admin-filter-area");
    if (adminArea) adminArea.classList.remove("hidden");

    if (userEl && userEl.options.length <= 1) {
      const params = new URLSearchParams({
        action: "get_users",
        role_admin: role,
        kec_admin: kecAdmin,
        desa_admin: desaAdmin
      });

      fetch(`${API_URL}?${params.toString()}`)
        .then(res => res.json())
        .then(users => {
          users.forEach(u => {
            const uRole = u.Role || u.role || "";
            const uNama = u.Nama || u.nama || "Tanpa Nama";
            const uNik = u.NIK || u.nik || "";
            
            if (uRole === 'kader') { 
              let opt = document.createElement("option");
              opt.value = uNik;
              opt.innerHTML = uNama;
              userEl.appendChild(opt);
            }
          });
        });
    }
  }

  // 2. TENTUKAN TARGET DATA
  let nikTarget = (role && role.includes("admin") && userSelect !== "") ? userSelect : nikLogin;

  // 3. TARIK DATA STATISTIK DARI APPS SCRIPT
  fetch(`${API_URL}?action=get_statistik&nik=${nikTarget}&bulan=${bulan}&tahun=${tahun}&role=${role}`)
    .then(res => res.json())
    .then(data => {
      
      // --- UPDATE KARTU RINGKASAN ---
      const totalReal = data.realisasi_tahunan.reduce((a, b) => a + b, 0);
      const totalTarget = data.target_tahunan.reduce((a, b) => a + b, 0);
      const persen = totalTarget > 0 ? Math.round((totalReal / totalTarget) * 100) : 0;

      if (document.getElementById("total-realisasi")) 
          document.getElementById("total-realisasi").innerText = totalReal;
      
      if (document.getElementById("total-persen")) 
          document.getElementById("total-persen").innerText = persen + "%";
      
      const pb = document.getElementById("progress-bar");
      if (pb) pb.style.width = (persen > 100 ? 100 : persen) + "%";

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
              borderWidth: 2,
              borderColor: '#ffffff',
              hoverOffset: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
              legend: { display: true, position: 'bottom', labels: { usePointStyle: true, font: { size: 10 } } }
            }
          }
        });
      }

      // --- UPDATE PERINGKAT (Hanya Admin) ---
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
  if (document.getElementById("filter-tahun")) document.getElementById("filter-tahun").innerHTML = `<option value="${thn}">${thn}</option>`;
}

// ================= 5. PENGGERAK DOM =================
document.addEventListener("DOMContentLoaded", () => {
  cekLogin();
  if (typeof setTahunOtomatis === 'function') setTahunOtomatis();
  if (document.getElementById("motivasi-login")) tampilkanMotivasi();

  // Jika di halaman dashboard, jalankan initDashboard
  if (document.getElementById("namaUser")) initDashboard();
});
