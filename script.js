const API_URL = "https://script.google.com/macros/s/AKfycbzXt4isvjY5KrSZi37IedLKHGzCwiL1dMoB4N6IeSyKyTJXruTpjMuhWdm3RvJyCGQqEA/exec"; 

// Variable Global
let base64Foto = ""; 
let dataRiwayatGlobal = [];
let dataRenjaGlobal = []; 
let GLOBAL_WILAYAH = []; 
let myChartInstance = null;


// ================= LOGIN & SATPAM DIGITAL =================
function login() {
  const nik = document.getElementById("nik").value;
  const password = document.getElementById("password").value;
  const info = document.getElementById("info");

  if (!nik || !password) {
    info.innerText = "NIK & Password wajib diisi!";
    return;
  }

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
      
      if (data.role.includes("admin")) {
        window.location.href = "dashboard-admin.html";
      } else {
        window.location.href = "dashboard-kader.html";
      }
    } else {
      info.innerText = "NIK atau Password Salah!";
    }
  });
}

function cekLogin() {
  const nik = localStorage.getItem("nik");
  if (!nik) window.location.href = "index.html";
}

function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}

// ================= SISTEM WILAYAH KABUPATEN (BARU) =================
function loadWilayahDatabase() {
  const selKec = document.getElementById("user-kecamatan") || document.getElementById("select-kecamatan");
  if (!selKec) return;

  selKec.innerHTML = '<option value="">⏳ Sinkronisasi Wilayah...</option>';

  fetch(`${API_URL}?action=get_wilayah_lengkap`)
    .then(res => res.json())
    .then(data => {
      GLOBAL_WILAYAH = data;
      // Ambil daftar Kecamatan Unik
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
      // Inisialisasi tampilan setelah data siap
      initUserPage();
    })
    .catch(err => {
      console.error(err);
      selKec.innerHTML = '<option value="">❌ Gagal Memuat Data</option>';
    });
}

function updateDropdownDesa(desaTerpilih = "") {
  const roleLogin = localStorage.getItem("role"); // Cek siapa yang sedang login
  const selKec = document.getElementById("user-kecamatan") || document.getElementById("select-kecamatan");
  const selDesa = document.getElementById("user-wilayah");
  if (!selDesa || !selKec) return;

  const kecDipilih = selKec.value;
  selDesa.innerHTML = '<option value="">-- Pilih Desa --</option>';
  
  // LOGIKA PROTEKSI: Hanya Super Admin yang bisa melihat opsi "SEMUA DESA"
  if (kecDipilih && roleLogin === "super_admin") {
    let optSemua = document.createElement("option");
    optSemua.value = "SEMUA DESA";
    optSemua.innerHTML = "SEMUA DESA";
    selDesa.appendChild(optSemua);
  }
  
  // Ambil daftar desa asli dari database wilayah
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
  const selKec = document.getElementById("user-kecamatan");
  const selDesa = document.getElementById("user-wilayah");

  if (subTitle) {
    if (role === "super_admin") subTitle.innerText = "Otoritas: Kabupaten Bekasi";
    else if (role === "admin_kec") subTitle.innerText = "Otoritas: Kecamatan " + kec;
    else subTitle.innerText = "Otoritas: Desa " + desa;
  }

  if (!selRole) return;

  if (role === "super_admin") {
    selRole.innerHTML = `<option value="admin_kec">Admin Kecamatan</option><option value="admin_desa">Admin Desa</option><option value="kader">Kader PPKBD</option>`;
  } else if (role === "admin_kec") {
    selRole.innerHTML = `<option value="admin_desa">Admin Desa</option><option value="kader">Kader PPKBD</option>`;
    if(selKec) { selKec.value = kec; selKec.disabled = true; updateDropdownDesa(); }
  } else {
    selRole.innerHTML = `<option value="kader">Kader PPKBD</option>`;
    if(selKec) { selKec.value = kec; selKec.disabled = true; }
    if(selDesa) { updateDropdownDesa(desa); selDesa.disabled = true; }
  }
}

// ================= MANAJEMEN USER (TAMBAH, LIST, HAPUS) =================
function tambahUser() {
  const btn = document.getElementById("btn-tambah-user");
  const info = document.getElementById("info-user");

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

  if (!payload.user_nik || !payload.nama || !payload.kecamatan || !payload.desa) {
    info.innerText = "❌ Nama, NIK, Kecamatan & Desa wajib diisi!";
    info.className = "text-center text-[10px] mt-2 font-bold text-red-500";
    return;
  }

  btn.innerText = "⏳ MENYIMPAN...";
  btn.disabled = true;

  fetch(API_URL, { method: "POST", body: new URLSearchParams(payload) })
  .then(res => res.text())
  .then(res => {
    if (res === "success") {
      info.innerText = "✅ USER BERHASIL DIDAFTARKAN!";
      info.className = "text-center text-[10px] mt-2 font-bold text-green-600";
      setTimeout(() => { location.reload(); }, 1500);
    } else {
      alert("Gagal: " + res);
      btn.disabled = false;
      btn.innerText = "SIMPAN DATA PENGGUNA";
    }
  });
}
let DATA_USERS_ALL = [];
function loadUsers() {
  const container = document.getElementById("container-daftar-user");
  if (!container) return;

  const roleAdmin = localStorage.getItem("role");
  const kecAdmin = localStorage.getItem("kecamatan");
  const desaAdmin = localStorage.getItem("desa");

  container.innerHTML = `<p class="text-center text-[10px] text-gray-400 py-10 italic animate-pulse">Menyinkronkan database...</p>`;

  const params = new URLSearchParams({
    action: "get_users",
    role_admin: roleAdmin,
    kec_admin: kecAdmin,
    desa_admin: desaAdmin
  });

  fetch(`${API_URL}?${params.toString()}`)
    .then(res => res.json())
    .then(data => {
      DATA_USERS_ALL = data; // Simpan ke variabel global
      
      // Isi Dropdown Filter Kecamatan (Hanya jika Super Admin)
      const filterKec = document.getElementById("filter-kecamatan");
      if(filterKec && roleAdmin === "super_admin" && filterKec.options.length <= 1) {
        const listKec = [...new Set(data.map(u => u.kecamatan))];
        listKec.forEach(k => {
          if(k) filterKec.innerHTML += `<option value="${k}">${k}</option>`;
        });
      }

      applyFilters(); // Jalankan tampilan pertama kali
    });
}

function applyFilters() {
  const container = document.getElementById("container-daftar-user");
  const searchQuery = document.getElementById("search-user").value.toUpperCase();
  const filterRole = document.getElementById("filter-role").value;
  const filterKec = document.getElementById("filter-kecamatan").value;

  // Proses Filter
  const filteredData = DATA_USERS_ALL.filter(u => {
    const matchSearch = u.nama.toUpperCase().includes(searchQuery) || u.nik.includes(searchQuery);
    const matchRole = filterRole === "" || u.role === filterRole;
    const matchKec = filterKec === "" || u.kecamatan === filterKec;
    return matchSearch && matchRole && matchKec;
  });

  container.innerHTML = "";

  if (filteredData.length === 0) {
    container.innerHTML = `<p class="text-center text-[10px] text-slate-400 py-10 italic">Data tidak ditemukan...</p>`;
    return;
  }

  filteredData.forEach(u => {
    let statusColor = u.status === "aktif" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700";
    
    // PENJELASAN UNDEFINED: Pastikan menggunakan u.kecamatan dan u.desa (sesuai JSON dari GAS)
    // Jika masih undefined, ganti menjadi u.nama_kec atau u.nama_desa sesuai kolom di spreadsheet
    const kecTampil = u.kecamatan || "-";
    const desaTampil = u.desa || "-";

    let roleLabel = "";
    if(u.role === "super_admin") roleLabel = "👑 Super Admin";
    else if(u.role === "admin_kec") roleLabel = "🏛️ Admin Kec";
    else if(u.role === "admin_desa") roleLabel = "🏠 Admin Desa";
    else roleLabel = "👤 Kader";
    
    let btnStatus = u.status === "aktif" 
      ? `<button onclick="ubahStatusUser('${u.nik}', 'nonaktif')" class="flex-1 bg-slate-100 text-slate-600 text-[10px] font-black py-2.5 rounded-xl transition active:scale-95">⏸ NONAKTIFKAN</button>`
      : `<button onclick="ubahStatusUser('${u.nik}', 'aktif')" class="flex-1 bg-green-50 text-green-700 text-[10px] font-black py-2.5 rounded-xl transition active:scale-95">▶ AKTIFKAN</button>`;

    container.innerHTML += `
      <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
        <div class="flex justify-between items-start mb-3">
          <div>
            <p class="text-[11px] font-black text-blue-900 uppercase leading-tight">${u.nama}</p>
            <p class="text-[9px] text-slate-400 font-bold">${u.nik}</p>
          </div>
          <span class="text-[8px] font-black ${statusColor} px-2 py-0.5 rounded-md uppercase shadow-sm">${u.status}</span>
        </div>
        
        <div class="bg-slate-50 p-2 rounded-lg mb-3">
           <p class="text-[9px] text-slate-500 font-bold">📍 ${kecTampil} - ${desaTampil}</p>
           <p class="text-[9px] text-blue-700 font-black mt-0.5 uppercase tracking-tighter">${roleLabel}</p>
        </div>
        
        <div class="flex gap-2">
          ${btnStatus}
          <button onclick="hapusUser('${u.nik}', '${u.nama}')" class="flex-1 bg-red-50 text-red-600 text-[10px] font-black py-2.5 rounded-xl transition active:scale-95">🗑 HAPUS</button>
        </div>
      </div>
    `;
  });
}

function ubahStatusUser(nik, status) {
  if (!confirm("Ubah status user ini?")) return;
  fetch(API_URL, { method: "POST", body: new URLSearchParams({ action: "update_status_user", nik_target: nik, status_baru: status }) })
  .then(() => loadUsers());
}

function hapusUser(nik, nama) {
  if (!confirm("Hapus permanen user " + nama + "?")) return;
  fetch(API_URL, { method: "POST", body: new URLSearchParams({ action: "hapus_user", nik_target: nik }) })
  .then(() => loadUsers());
}

// ================= LOGIKA DASHBOARD & STATISTIK (LAMA BAPAK) =================
function initDashboard() {
  const nama = localStorage.getItem("nama");
  const role = localStorage.getItem("role");
  if (document.getElementById("namaUser")) document.getElementById("namaUser").innerText = nama;
  if (document.getElementById("roleUser")) document.getElementById("roleUser").innerText = role.includes("admin") ? "Administrator" : "Kader PPKBD";
}

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
  const userEl = document.getElementById("filter-user");
  const userSelect = userEl ? userEl.value : "";

  if (role && role.includes("admin") && userEl && userEl.options.length <= 1) {
    const params = new URLSearchParams({ action: "get_users", role_admin: role, kec_admin: kecAdmin, desa_admin: desaAdmin });
    fetch(`${API_URL}?${params.toString()}`)
      .then(res => res.json())
      .then(users => {
        users.forEach(u => {
          if (u.role === 'kader') {
            let opt = document.createElement("option");
            opt.value = u.nik; opt.innerHTML = u.nama;
            userEl.appendChild(opt);
          }
        });
      });
  }

  let nikTarget = (role && role.includes("admin") && userSelect !== "") ? userSelect : nikLogin;
  fetch(`${API_URL}?action=get_statistik&nik=${nikTarget}&bulan=${bulan}&tahun=${tahun}&role=${role}`)
    .then(res => res.json())
    .then(data => {
      const totalReal = data.realisasi_tahunan.reduce((a, b) => a + b, 0);
      const totalTarget = data.target_tahunan.reduce((a, b) => a + b, 0);
      const persen = totalTarget > 0 ? Math.round((totalReal / totalTarget) * 100) : 0;
      if (document.getElementById("total-realisasi")) document.getElementById("total-realisasi").innerText = totalReal;
      if (document.getElementById("total-persen")) document.getElementById("total-persen").innerText = persen + "%";
      if (document.getElementById("progress-bar")) document.getElementById("progress-bar").style.width = (persen > 100 ? 100 : persen) + "%";
      
      const canvas = document.getElementById('myChart');
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (myChartInstance) myChartInstance.destroy();
        myChartInstance = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['Pertemuan', 'KIE', 'Pelayanan', 'Pencatatan', 'Lainnya'],
            datasets: [{ data: data.realisasi_bulanan, backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#94a3b8'], borderWidth: 2, borderColor: '#ffffff' }]
          },
          options: { responsive: true, cutout: '65%', plugins: { legend: { display: true, position: 'bottom' } } }
        });
      }
    });
}

// ================= LOGIKA RENJA & LAPORAN (LAMA BAPAK) =================
function simpanRenja() {
  const btn = document.getElementById("btn-simpan-renja");
  const payload = {
    action: "submit_renja",
    nik: localStorage.getItem("nik"),
    nama: localStorage.getItem("nama"),
    tahun: document.getElementById("renja-tahun").value,
    bulan: "TAHUNAN",
    kegiatan: document.getElementById("renja-jenis").value + ": " + document.getElementById("renja-substansi").value,
    sasaran: document.getElementById("renja-sasaran").value,
    target_volume: document.getElementById("renja-volume").value,
    target_peserta: document.getElementById("renja-target-angka").value + " " + document.getElementById("renja-target-satuan").value,
    indikator: document.getElementById("renja-indikator").value,
    lokasi: document.getElementById("renja-lokasi").value
  };
  btn.disabled = true;
  fetch(API_URL, { method: "POST", body: new URLSearchParams(payload) }).then(() => location.reload());
}

function loadRenja() {
  const list = document.getElementById("listRenja");
  const nik = localStorage.getItem("nik");
  if (!list) return;
  fetch(`${API_URL}?action=get_renja&nik=${nik}`)
    .then(res => res.json())
    .then(data => {
      let html = "";
      data.forEach(item => {
        html += `<div class="bg-white p-4 rounded-2xl shadow-sm mb-3">
          <p class="text-[8px] font-bold text-blue-600 uppercase">PROGRAM ${item.tahun}</p>
          <h3 class="font-bold text-xs uppercase">${item.kegiatan}</h3>
          <p class="text-xs text-gray-500">Target: ${item.target_peserta}</p>
        </div>`;
      });
      list.innerHTML = html;
    });
}

// ================= FUNGSI PENUNJANG ACAK =================
function tampilkanMotivasi() {
  const daftar = ["\"Semangat melayani!\"", "\"Satu laporan Anda berharga.\"", "\"Kerja ikhlas, kerja tuntas!\""];
  const el = document.getElementById("motivasi-login");
  if (el) el.innerText = daftar[Math.floor(Math.random() * daftar.length)];
}

function setTahunOtomatis() {
  const thn = new Date().getFullYear();
  if (document.getElementById("filter-tahun")) document.getElementById("filter-tahun").innerHTML = `<option value="${thn}">${thn}</option>`;
}

// ================= PENGGERAK DOM =================
document.addEventListener("DOMContentLoaded", () => {
  if (typeof setTahunOtomatis === 'function') setTahunOtomatis();
  if (document.getElementById("motivasi-login")) tampilkanMotivasi();
});
