const API_URL = "https://script.google.com/macros/s/AKfycbzXt4isvjY5KrSZi37IedLKHGzCwiL1dMoB4N6IeSyKyTJXruTpjMuhWdm3RvJyCGQqEA/exec"; // ganti!

// Variable untuk menampung data foto base64
let base64Foto = ""; 
// Variable global untuk menampung data agar bisa difilter saat cetak
let dataRiwayatGlobal = [];
let dataRenjaGlobal = []; // Untuk menyimpan data renja agar bisa difilter tanggal
let myChartInstance = null;

// ================= LOGIN =================
function login() {
  const nik = document.getElementById("nik").value;
  const password = document.getElementById("password").value;
  const info = document.getElementById("info");

  if (!nik || !password) {
    info.innerText = "NIK & Password wajib diisi!";
    return;
  }

  // Tampilkan loading saat proses
  info.innerText = "⏳ Memverifikasi...";
  info.classList.replace("text-red-500", "text-blue-500");

  fetch(API_URL, {
    method: "POST",
    body: new URLSearchParams({
      action: "login",
      nik: nik,
      password: password
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.status === "success") {
      // Simpan data ke memori browser
      localStorage.setItem("nik", data.nik);
      localStorage.setItem("nama", data.nama);
      localStorage.setItem("role", data.role);
      localStorage.setItem("kecamatan", data.kecamatan);
      localStorage.setItem("desa", data.desa);
      localStorage.setItem("foto", data.foto || "");

      // JALUR REDIRECT:
      // Jika role-nya mengandung kata 'admin', lempar ke dashboard-admin
      if (data.role.includes("admin")) {
        window.location.href = "dashboard-admin.html";
      } else {
        window.location.href = "dashboard-kader.html";
      }

    } else if (data.status === "nonaktif") {
      info.innerText = "Akun Anda dinonaktifkan Admin!";
      info.classList.replace("text-blue-500", "text-red-500");
    } else {
      info.innerText = "NIK atau Password Salah!";
      info.classList.replace("text-blue-500", "text-red-500");
    }
  })
  .catch(() => {
    info.innerText = "Koneksi Error!";
    info.classList.replace("text-blue-500", "text-red-500");
  });
}

// ================= SATPAM DIGITAL (CEK LOGIN & ROLE) =================
function cekLogin() {
  const nik = localStorage.getItem("nik");
  const role = localStorage.getItem("role");
  const path = window.location.pathname;

  // 1. Cek: Apakah sudah login?
  if (!nik) {
    window.location.href = "index.html";
    return;
  }

  // 2. Proteksi Halaman Admin: 
  // Jika sedang di dashboard-admin tapi role-nya bukan admin, tendang ke dashboard kader!
  if (path.includes("dashboard-admin.html") && !role.includes("admin")) {
    alert("⛔ Akses Ditolak! Anda bukan Administrator.");
    window.location.href = "dashboard-kader.html";
  }

  // 3. Proteksi Halaman Kader:
  // Jika admin iseng mau masuk dashboard-kader, arahkan ke dashboard-admin saja
  if (path.includes("dashboard-kader.html") && role.includes("admin")) {
    
  }
}

// ================= ISI DATA DASHBOARD =================
function initDashboard() {
  const nama = localStorage.getItem("nama");
  const role = localStorage.getItem("role");

  // Isi Nama & Role di Header
  if (document.getElementById("namaUser")) document.getElementById("namaUser").innerText = nama;
  if (document.getElementById("roleUser")) document.getElementById("roleUser").innerText = role === "admin" ? "Administrator Wil V" : "Kader PPKBD";

  // Munculkan Menu Admin jika role-nya admin
  const menuAdmin = document.getElementById("menu-admin");
  if (role === "admin" && menuAdmin) {
    menuAdmin.style.display = "block";
  }
}

// ================= LOGOUT =================
function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}

// ================= AMBIL PROFIL =================
function loadProfil() {
  const nik = localStorage.getItem("nik");
  fetch(API_URL + "?action=get_profil&nik=" + nik)
    .then(res => res.json())
    .then(data => {
      if (data.status === "success") {
        document.getElementById("hp").value = data.hp || "";
        document.getElementById("wilayah").value = data.wilayah || "";
        if(document.getElementById("kecamatan")) {
           document.getElementById("kecamatan").value = localStorage.getItem("kecamatan") || "";
        }
      }
    });
}

// ================= UPDATE PROFIL =================
function updateProfil() {
  const hp = document.getElementById("hp").value;
  const passwordBaru = document.getElementById("passwordBaru").value;
  const nik = localStorage.getItem("nik");
  const info = document.getElementById("info");

  // VALIDASI
  if (!hp) {
    info.innerText = "No HP wajib diisi!";
    return;
  }

  if (passwordBaru && passwordBaru.length < 4) {
    info.innerText = "Password minimal 4 karakter!";
    return;
  }

  fetch(API_URL, {
    method: "POST",
    body: new URLSearchParams({
      action: "update_profil",
      nik: nik,
      hp: hp,
      password: passwordBaru
    })
  })
  .then(res => res.text())
  .then(res => {
    if (res === "success") {
      info.innerText = "Berhasil disimpan!";
    } else {
      info.innerText = "Gagal menyimpan!";
    }
  });
}

// ================= LOAD DATA LAPORAN =================
function loadLaporan() {
  fetch(API_URL + "?action=get_laporan")
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById("listLaporan");
      container.innerHTML = "";

      data.forEach(lap => {
        if (lap.status === "Draft") {
          container.innerHTML += `
            <div class="bg-white p-4 rounded-xl shadow">
              <p class="font-bold">${lap.nama}</p>
              <p class="text-sm">${lap.kegiatan}</p>
              <p class="text-xs text-gray-500">${lap.tanggal}</p>
              <button onclick="approve('${lap.id}')" 
                class="mt-2 bg-green-600 text-white px-3 py-1 rounded">
                Approve
              </button>
            </div>
          `;
        }
      });
    });
}

// ================= FUNCTION APPROVE =================
function approve(id) {
  const verifikator = localStorage.getItem("nama");

  fetch(API_URL, {
    method: "POST",
    body: new URLSearchParams({
      action: "approve_laporan",
      laporan_id: id,
      verifikator: verifikator
    })
  })
  .then(res => res.text())
  .then(res => {
    if (res === "success") {
      alert("Berhasil diapprove!");
      loadLaporan();
    }
  });
}

// ================= SIMPAN RENJA (VERSI UPDATE SIGA) =================
function simpanRenja() {
  const btn = document.getElementById("btn-simpan-renja");
  const info = document.getElementById("info-renja");
  
  const nik = localStorage.getItem("nik");
  const nama = localStorage.getItem("nama");
  
  // Ambil data dasar
  const tahun = document.getElementById("renja-tahun").value;
  const bulan = "TAHUNAN";
  const lokasi = document.getElementById("renja-lokasi").value;
  const sasaran = document.getElementById("renja-sasaran").value;
  const volume = document.getElementById("renja-volume").value;
  const indikator = document.getElementById("renja-indikator").value;
  const angkaTarget = document.getElementById("renja-target-angka").value;
  const satuanTarget = document.getElementById("renja-target-satuan").value;
  const peserta = angkaTarget ? `${angkaTarget} ${satuanTarget}` : "";

  // Ambil data untuk digabungkan
  const jenis = document.getElementById("renja-jenis").value;
  const substansi = document.getElementById("renja-substansi").value;
  const keterangan = document.getElementById("renja-keterangan").value;

  // Validasi: Jenis Kegiatan wajib ada
  if (!jenis || !sasaran || !volume || !peserta) {
    info.innerText = "Harap isi Jenis Kegiatan dan semua kolom target!";
    info.className = "text-center text-sm mt-2 text-red-500 font-bold";
    return;
  }

  // --- LOGIKA JAHIT DATA UNTUK KOLOM KEGIATAN ---
  let kegiatanGabung = "";
  if (jenis === "Lainnya") {
    kegiatanGabung = "Lainnya: " + keterangan;
  } else {
    kegiatanGabung = jenis + ": " + substansi + (keterangan ? " - " + keterangan : "");
  }

  btn.disabled = true;
  btn.innerText = "MENYIMPAN...";
  info.innerText = "";

  fetch(API_URL, {
    method: "POST",
    body: new URLSearchParams({
      action: "submit_renja",
      nik: nik,
      nama: nama,
      tahun: tahun,
      bulan: bulan,
      kegiatan: kegiatanGabung,
      sasaran: sasaran,
      target_volume: volume,
      target_peserta: peserta,
      indikator: indikator,
      lokasi: lokasi
    })
  })
  .then(res => res.text())
  .then(res => {
    if (res.trim() === "success") {
      info.innerText = "Renja berhasil disimpan!";
      info.className = "text-center text-sm mt-2 text-green-600 font-bold";
      
      // 1. Kosongkan Dropdown Utama & Sembunyikan Substansi
      const jenis = document.getElementById("renja-jenis");
      jenis.value = ""; 
      
      const wrapperSub = document.getElementById("wrapper-substansi");
      if (wrapperSub) wrapperSub.classList.add("hidden"); 
      
      const substansi = document.getElementById("renja-substansi");
      if (substansi) substansi.value = ""; 

      // 2. Kosongkan Elemen Teks & Angka
      document.getElementById("renja-indikator").value = "";
      document.getElementById("renja-sasaran").value = "";
      document.getElementById("renja-volume").value = "";
      document.getElementById("renja-keterangan").value = ""; 
      document.getElementById("renja-target-angka").value = "";
      
      // Refresh list renja di bawahnya
      setTimeout(() => {
        loadRenja();
      }, 1500); 
    } else {
      info.innerText = "Gagal menyimpan!";
      info.className = "text-center text-sm mt-2 text-red-500 font-bold";
    }
    btn.disabled = false;
    btn.innerText = "SIMPAN RENCANA KERJA";
  })
  .catch(() => {
    info.innerText = "Koneksi error!";
    info.className = "text-center text-sm mt-2 text-red-500 font-bold";
    btn.disabled = false;
    btn.innerText = "SIMPAN RENCANA KERJA";
  });
}

// ================= LOAD DATA RENJA (Untuk List di Bawah Form) =================
function loadRenja() {
  const list = document.getElementById("listRenja");
  const nik = localStorage.getItem("nik");
  if (!list) return;

  list.innerHTML = "<p class='text-center text-gray-400 text-[10px] animate-pulse'>Sinkronisasi data...</p>";

  fetch(`${API_URL}?action=get_renja&nik=${nik}`)
    .then(res => res.json())
    .then(data => {
      if (!data || data.length === 0) {
        list.innerHTML = "<p class='text-center text-gray-400 text-xs py-10'>Belum ada rencana kerja.</p>";
        return;
      }

      let html = "";
      data.forEach(item => {
        const aksiHapus = item.can_delete 
          ? `<button onclick="hapusRenja('${item.renja_id}')" class="text-red-300 hover:text-red-600 transition p-2">
               <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
               </svg>
             </button>`
          : `<span class="text-[8px] bg-green-100 text-green-600 px-2 py-1 rounded-lg font-bold">TERKUNCI</span>`;

        html += `
          <div class="bg-white p-4 rounded-2xl shadow-sm border-l-4 ${item.can_delete ? 'border-blue-900' : 'border-green-500'} mb-3 relative">
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <span class="bg-blue-100 text-blue-600 text-[8px] px-2 py-0.5 rounded-md font-bold uppercase">PROGRAM TAHUN ${item.tahun}</span>
                </div>
                <h3 class="font-bold text-blue-900 text-xs uppercase leading-tight pr-8">${item.kegiatan}</h3>
                
                <div class="flex gap-3 mt-3">
                  <div class="flex flex-col">
                    <span class="text-[8px] text-gray-400 uppercase">Sisa Volume</span>
                    <span class="text-xs font-bold ${item.sisa_vol === 0 ? 'text-red-500' : 'text-gray-700'}">${item.sisa_vol} / ${item.target_vol}</span>
                  </div>
                  <div class="flex flex-col border-l pl-3">
                    <span class="text-[8px] text-gray-400 uppercase">Target</span>
                    <span class="text-xs font-bold text-gray-700">${item.target_peserta}</span>
                  </div>
                </div>
              </div>
              
              <div class="flex items-center">
                ${aksiHapus}
              </div>
            </div>
          </div>
        `;
      });
      list.innerHTML = html;
    })
    .catch(err => {
      console.error(err);
      list.innerHTML = "<p class='text-center text-red-400 text-[10px]'>Gagal memuat daftar.</p>";
    });
}

// ================= FUNGSI HAPUS RENJA =================
function hapusRenja(id) {
  if (confirm("Apakah yakin ingin menghapus rencana ini?")) {
    console.log("Mencoba menghapus Renja ID:", id); 
    fetch(`${API_URL}?action=hapus_renja&renja_id=${id}`)
      .then(res => res.text())
      .then(res => {
        if (res.trim() === "success") {
          alert("Rencana Kerja Berhasil Dihapus!");
          loadRenja(); 
        } else {
          alert("Gagal menghapus data di database: " + res);
        }
      })
      .catch(err => {
        console.error("Error Hapus:", err);
        alert("Terjadi kesalahan koneksi saat menghapus.");
      });
  }
}

// ================= LOAD DATA RENJA (Untuk Dropdown di Form Laporan) =================
let statusRenjaGlobal = "loading"; 

function loadRenjaUntukLaporan() {
  const nik = localStorage.getItem("nik");
  dataRenjaGlobal = []; 
  statusRenjaGlobal = "loading";

  const antiCache = new Date().getTime();
  const fetchUrl = API_URL + "?action=get_renja&nik=" + nik + "&nocache=" + antiCache;

  fetch(fetchUrl)
    .then(res => res.json())
    .then(data => {
      if(data && data.length > 0) {
        dataRenjaGlobal = data; 
        statusRenjaGlobal = "sukses";
        console.log("Renja berhasil ditarik:", dataRenjaGlobal);

        const tglSudahDiisi = document.getElementById("lap-tgl").value;
        if (tglSudahDiisi) {
          filterRenjaBerdasarkanTanggal(); 
        }
      } else {
        statusRenjaGlobal = "kosong";
      }
    })
    .catch(err => {
      console.error("Fetch Error Renja:", err);
      statusRenjaGlobal = "error";
    });
}

// ================================================================
// A. LOGIKA FILTER, BUKA KUNCI, DAN SATUAN OTOMATIS
// ================================================================

function toggleAreaForm() {
  const sumber = document.getElementById("sumber-kegiatan").value;
  const areaRenja = document.getElementById("area-pilih-renja");
  const areaManual = document.getElementById("area-manual");
  const tglInput = document.getElementById("lap-tgl").value;

  if (sumber === "luar") {
    areaRenja.style.display = "none";
    areaManual.style.display = "block";
  } else {
    areaRenja.style.display = "block";
    areaManual.style.display = "none";
    if (tglInput) filterRenjaBerdasarkanTanggal(); 
  }
  updateLabelSatuanLaporan(); 
  validasiFotoLaporan();      
}

function bukaKunciForm() {
  const tglInput = document.getElementById("lap-tgl").value;
  const areaLanjutan = document.getElementById("area-lanjutan");
  const pesanKunci = document.getElementById("pesan-kunci");
  const dropdownSumber = document.getElementById("sumber-kegiatan");
  const today = new Date().toISOString().split('T')[0];

  if (tglInput) {
    if (tglInput > today) {
      alert("Maaf Pak/Bu, tidak boleh melaporkan kegiatan untuk tanggal masa depan.");
      document.getElementById("lap-tgl").value = "";
      areaLanjutan.setAttribute("disabled", "true");
      areaLanjutan.classList.add("opacity-40");
      return;
    }

    areaLanjutan.removeAttribute("disabled");
    areaLanjutan.classList.remove("opacity-40");
    dropdownSumber.removeAttribute("disabled");
    if (pesanKunci) pesanKunci.style.display = "none";
    
    if (typeof filterRenjaBerdasarkanTanggal === "function") {
      filterRenjaBerdasarkanTanggal();
    }
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
  
  const renjaTersedia = dataRenjaGlobal.filter(r => {
    return String(r.tahun) === tahunPilih && Number(r.sisa_vol) > 0;
  });

  dropdown.innerHTML = '<option value="">-- Pilih Rencana Kerja --</option>';
  
  if (renjaTersedia.length === 0) {
    dropdown.innerHTML = `<option value="">(Tidak ada Renja aktif tahun ${tahunPilih})</option>`;
  } else {
    renjaTersedia.forEach(r => {
      dropdown.innerHTML += `<option value="${r.renja_id}" data-satuan="${r.target_peserta}" data-kegiatan="${r.kegiatan}">
        ${r.kegiatan} (Sisa Kuota (volume): ${r.sisa_vol}x Kegiatan)
      </option>`;
    });
  }
  updateLabelSatuanLaporan(); 
  validasiFotoLaporan();      
}

function showDetailRenja() {
  const drp = document.getElementById("pilih-renja");
  const previewBox = document.getElementById("preview-renja-full");
  const previewTeks = document.getElementById("teks-renja-full");

  if (drp && drp.selectedIndex > 0) {
    previewTeks.innerText = drp.options[drp.selectedIndex].text;
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
  validasiFotoLaporan(); 
}

function validasiFotoLaporan() {
  const tgl = document.getElementById("lap-tgl").value;
  const lokasi = document.getElementById("lap-lokasi").value.trim();
  const sumber = document.getElementById("sumber-kegiatan").value;
  
  const areaFoto = document.getElementById("area-foto-klik");
  const labelFoto = document.getElementById("label-foto");
  const ikon = document.getElementById("ikon-kamera");

  let kegiatanOk = false;
  if (sumber === "renja") {
    if (document.getElementById("pilih-renja").value) kegiatanOk = true;
  } else {
    const manualTeks = document.getElementById("lap-kegiatan-manual");
    if (manualTeks && manualTeks.value.trim().length >= 5) {
      kegiatanOk = true;
    }
  }

  if (tgl && lokasi && kegiatanOk) {
    areaFoto.classList.remove("opacity-30", "pointer-events-none");
    areaFoto.classList.add("bg-blue-50/50", "border-blue-200");
    labelFoto.innerText = "Klik untuk Ambil/Pilih Foto";
    labelFoto.classList.replace("text-gray-400", "text-blue-800");
    if (document.getElementById("img-preview").classList.contains("hidden")) {
       ikon.innerText = "📸";
    }
  } else {
    areaFoto.classList.add("opacity-30", "pointer-events-none");
    areaFoto.classList.remove("bg-blue-50/50", "border-blue-200");
    labelFoto.innerText = "Lengkapi Tanggal, Lokasi & Kegiatan";
    labelFoto.classList.replace("text-blue-800", "text-gray-400");
    ikon.innerText = "🔒";
  }
}

// ================= SIMPAN LAPORAN FINAL =================
async function simpanLaporan() {
  const btn = document.getElementById("btn-simpan-laporan");
  const info = document.getElementById("info-laporan");
  
  const nik = localStorage.getItem("nik");
  const nama = localStorage.getItem("nama");
  const kecamatan = localStorage.getItem("kecamatan");
  
  const sumber = document.getElementById("sumber-kegiatan").value;
  const tanggal = document.getElementById("lap-tgl").value;
  const lokasi = document.getElementById("lap-lokasi").value;
  const realisasi = document.getElementById("lap-realisasi").value;

  let satuanFinal = "";
  if (sumber === "renja") {
    const containerSatuan = document.getElementById("container-satuan-laporan");
    satuanFinal = containerSatuan ? containerSatuan.innerText.replace("🔒", "").trim() : "Orang";
  } else {
    const selectSatuan = document.getElementById("lap-satuan-manual");
    satuanFinal = selectSatuan ? selectSatuan.value : "Orang";
  }
  const realisasiLengkap = `${realisasi} ${satuanFinal}`;

  let renja_id = "";
  let namaKegiatanFinal = "";

  if (sumber === "renja") {
    const dropdownRenja = document.getElementById("pilih-renja");
    renja_id = dropdownRenja.value;
    
    if (!renja_id) return alert("Pilih Rencana Kerja terlebih dahulu!");
    
    const optTerpilih = dropdownRenja.options[dropdownRenja.selectedIndex];
    const teksRenja = optTerpilih.getAttribute("data-kegiatan") || optTerpilih.text.split(" (Sisa")[0].trim();
    const catatanRenja = document.getElementById("lap-catatan-renja").value.trim();

    if (!catatanRenja || catatanRenja.length < 5) {
      alert("⚠️ Uraian Detail Kegiatan wajib diisi (Min. 5 karakter) agar laporan valid!");
      return;
    }
    
    namaKegiatanFinal = `${teksRenja} | Detail: ${catatanRenja}`;

  } else {
    renja_id = "LUAR-RENJA";
    const manualTeks = document.getElementById("lap-kegiatan-manual");
    const kegiatanManual = manualTeks ? manualTeks.value.trim() : "";

    if (!kegiatanManual || kegiatanManual.length < 5) {
      alert("⚠️ Harap isi Nama & Uraian Kegiatan Luar Renja dengan jelas (minimal 5 karakter)!");
      return;
    }
    namaKegiatanFinal = `Insidental: ${kegiatanManual}`;
  }

  if (!tanggal || !realisasi || !lokasi) return alert("Lengkapi Tanggal, Lokasi, dan Jumlah Realisasi!");
  if (!base64Foto) return alert("Gagal! Foto Visum wajib diupload.");

  btn.disabled = true; 
  btn.innerText = "SEDANG MENGIRIM...";
  if(info) info.innerText = "Mohon tunggu, sedang mengunggah data & foto...";

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
        realisasi: realisasiLengkap, 
        lokasi: lokasi,
        foto_data: base64Foto  
      })
    });

    const resText = await response.text();
    if (resText.trim() === "success") {
      alert("Laporan & Foto Berhasil Terkirim!");
      window.location.href = "dashboard.html";
    } else {
      alert("Gagal mengirim! Respon server: " + resText);
      btn.disabled = false;
      btn.innerText = "KIRIM LAPORAN SEKARANG";
    }
  } catch (err) {
    alert("Koneksi Error. Pastikan internet stabil.");
    btn.disabled = false;
    btn.innerText = "KIRIM LAPORAN SEKARANG";
  }
}

// ===================Fungsi Menampilkan Preview dan Kompresi=====================
function previewFoto(input) {
  const file = input.files[0];
  if (!file) return;

  const loading = document.getElementById("loading-foto");
  const preview = document.getElementById("img-preview");
  const ikon = document.getElementById("ikon-kamera");
  const label = document.getElementById("label-foto");

  if(loading) loading.classList.remove("hidden");
  if(preview) preview.classList.add("hidden");
  if(ikon) ikon.classList.add("hidden");
  label.innerText = "Mohon Tunggu...";
    
  const reader = new FileReader();
  
  const tglInput = document.getElementById("lap-tgl").value;
  const lokasiRaw = (document.getElementById("lap-lokasi").value || "LOKASI TIDAK DIISI").toUpperCase();
  const realisasi = document.getElementById("lap-realisasi").value || "0";
  const sumber = document.getElementById("sumber-kegiatan").value;

  let satuan = "Orang";
  if (sumber === "renja") {
    const containerSatuan = document.getElementById("container-satuan-laporan");
    satuan = containerSatuan ? containerSatuan.innerText.replace("🔒", "").trim() : "Orang";
  } else {
    const selectSatuan = document.getElementById("lap-satuan-manual");
    satuan = selectSatuan ? selectSatuan.value : "Orang";
  }

  let teksKegiatan = "";
  if (sumber === "renja") {
    const drp = document.getElementById("pilih-renja");
    teksKegiatan = drp.selectedIndex > 0 ? drp.options[drp.selectedIndex].text : "Kegiatan Renja";
  } else {
    const manualTeks = document.getElementById("lap-kegiatan-manual");
    teksKegiatan = manualTeks && manualTeks.value ? manualTeks.value : "Kegiatan Luar Renja";
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

      const boxHeight = height * 0.15; 
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)"; 
      ctx.fillRect(0, height - boxHeight, width, boxHeight);

      ctx.fillStyle = "white";
      const padding = width * 0.03;
      const fontSizeNormal = Math.round(width * 0.035); 
      const fontSizeSmall = Math.round(width * 0.028);

      ctx.textAlign = "left";
      ctx.font = `bold ${fontSizeNormal}px Arial`;
      ctx.fillText("SIPEKA PPKBD", padding, height - (boxHeight * 0.7));
      
      ctx.font = `${fontSizeSmall}px Arial`;
      const cetakKegiatan = teksKegiatan.length > 40 ? teksKegiatan.substring(0, 40) + "..." : teksKegiatan;
      ctx.fillText(cetakKegiatan, padding, height - (boxHeight * 0.4));
      
      ctx.fillStyle = "#FFD700"; 
      ctx.font = `bold ${fontSizeSmall}px Arial`;
      ctx.fillText(`HASIL: ${realisasi} ${satuan}`, padding, height - (boxHeight * 0.15));

      ctx.textAlign = "right";
      ctx.fillStyle = "white";
      ctx.font = `${fontSizeSmall}px Arial`;
      const cetakLokasi = lokasiRaw.length > 30 ? lokasiRaw.substring(0, 30) + "..." : lokasiRaw;
      ctx.fillText("📍 " + cetakLokasi, width - padding, height - (boxHeight * 0.6));
      ctx.fillText("📅 " + tglInput, width - padding, height - (boxHeight * 0.3));

      base64Foto = canvas.toDataURL("image/jpeg", 0.7);
      preview.src = base64Foto;

      if(loading) loading.classList.add("hidden");
      preview.classList.remove("hidden");
      label.innerText = "Foto Visum Terverifikasi!";
      if(ikon) ikon.classList.add("hidden");
    }
  }
  reader.readAsDataURL(file);
}

// ================= TAMBAH USER (KHUSUS ADMIN) =================
function tambahUser() {
  const btn = document.getElementById("btn-tambah-user");
  const info = document.getElementById("info-user");

  const payload = {
    action: "tambah_user",
    user_nik: document.getElementById("user-nik").value,
    nama: document.getElementById("user-nama").value,
    password: document.getElementById("user-password").value,
    role: document.getElementById("user-role").value,
    kecamatan: document.getElementById("user-kecamatan").value, // AMBIL DARI DROPDOWN
    desa: document.getElementById("user-wilayah").value,        // AMBIL DARI DROPDOWN DESA
    hp: document.getElementById("user-hp").value
  };

  // SESUAIKAN: Tambahkan pengecekan kecamatan & desa
  if (!payload.user_nik || !payload.nama || !payload.kecamatan || !payload.desa) {
    info.innerText = "❌ Nama, NIK, Kecamatan & Desa wajib diisi!";
    info.className = "text-center text-[10px] mt-2 font-bold text-red-500";
    return;
  }

  btn.innerText = "⏳ MENYIMPAN...";
  btn.disabled = true;

  fetch(API_URL, {
    method: "POST",
    body: new URLSearchParams(payload)
  })
  .then(res => res.text())
  .then(res => {
    if (res === "success") {
      info.innerText = "✅ USER BERHASIL DIDAFTARKAN!";
      info.className = "text-center text-[10px] mt-2 font-bold text-green-600";
      document.getElementById("user-nik").value = "";
      document.getElementById("user-nama").value = "";
      btn.disabled = false;
      btn.innerText = "SIMPAN USER BARU";
      loadUsers(); // Refresh daftar di bawah
    }
  });
}

// ================= LOAD DAFTAR USER =================
function loadUsers() {
  const container = document.getElementById("container-daftar-user");
  const roleAdmin = localStorage.getItem("role");
  const kecAdmin = localStorage.getItem("kecamatan");
  const desaAdmin = localStorage.getItem("desa");

  container.innerHTML = `<p class="text-center text-[10px] text-gray-400 py-10 italic">Menyinkronkan data wilayah...</p>`;

  // KIRIM PARAMETER LENGKAP agar GAS bisa filter otomatis
  const params = new URLSearchParams({
    action: "get_users",
    role_admin: roleAdmin,
    kec_admin: kecAdmin,
    desa_admin: desaAdmin
  });

  fetch(`${API_URL}?${params.toString()}`)
    .then(res => res.json())
    .then(data => {
      container.innerHTML = "";

      if (data.length === 0) {
        container.innerHTML = `<div class="bg-white p-10 rounded-2xl text-center text-gray-400 text-[10px] shadow-sm border border-dashed">Belum ada user di wilayah otoritas Anda.</div>`;
        return;
      }

      data.forEach(u => {
        let statusColor = u.status === "aktif" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700";
        
        // LABEL ROLE DINAMIS
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
               <p class="text-[9px] text-slate-500 font-bold">📍 ${u.kecamatan} - ${u.desa}</p>
               <p class="text-[9px] text-blue-700 font-black mt-0.5 uppercase tracking-tighter">${roleLabel}</p>
            </div>
            
            <div class="flex gap-2">
              ${btnStatus}
              <button onclick="hapusUser('${u.nik}', '${u.nama}')" class="flex-1 bg-red-50 text-red-600 text-[10px] font-black py-2.5 rounded-xl transition active:scale-95">🗑 HAPUS</button>
            </div>
          </div>
        `;
      });
    });
}

//======================Update Substansi==========================//
function updateSubstansi() {
  const jenis = document.getElementById("renja-jenis").value;
  const wrapperSub = document.getElementById("wrapper-substansi");
  const selectSub = document.getElementById("renja-substansi");
  const labelDeskripsi = document.getElementById("label-deskripsi");
  
  const labelSasaran = document.getElementById("label-sasaran");
  const inputSasaran = document.getElementById("renja-sasaran"); 
  const labelPeserta = document.getElementById("label-peserta");
  const inputPeserta = document.getElementById("renja-target-angka"); 

  const dataSubstansi = {
    "Pertemuan": ["Pertemuan Rutin Kader", "Rapat Koordinasi (Desa/RW)", "Pertemuan Kelompok Kerja (Pokja)"],
    "KIE": ["Penyuluhan Kelompok", "Konseling Individu", "Kunjungan Rumah (Door-to-door)", "Penyebaran Media Informasi"],
    "Pelayanan & Penggerakan": ["Pendampingan Rujukan KB", "Distribusi Alkon (Sub-PPKBD)", "Pembinaan Poktan (BKB/BKR/BKL/UPPKA)", "Fasilitasi Pelayanan KB/Baksos"],
    "Pencatatan & Pelaporan": ["Pemutakhiran Data Keluarga (Verval)", "Pemetaan Sasaran (PUS Unmet Need)", "Pengisian Buku Bantu / K0", "Input Laporan ke New SIGA"]
  };

  if (inputPeserta) {
    inputPeserta.disabled = false;
    inputPeserta.classList.remove("bg-slate-200");
    inputPeserta.placeholder = "Jumlah"; 
    if (inputPeserta.value == "0") inputPeserta.value = ""; 
  }
  if (labelPeserta) labelPeserta.innerText = "TARGET & SATUAN"; 
  
  if (jenis === "Pertemuan") {
    if (labelSasaran) labelSasaran.innerText = "UNSUR PESERTA / UNDANGAN";
    if (inputSasaran) inputSasaran.placeholder = "Contoh: Tokoh Masyarakat, Kader, RT/RW...";
  } 
  else if (jenis === "KIE") {
    if (labelSasaran) labelSasaran.innerText = "SASARAN PENYULUHAN";
    if (inputSasaran) inputSasaran.placeholder = "Contoh: PUS, Ibu Hamil, Remaja, Catin...";
  }
  else if (jenis === "Pelayanan & Penggerakan") {
    if (labelSasaran) labelSasaran.innerText = "SASARAN / AKSEPTOR";
    if (inputSasaran) inputSasaran.placeholder = "Contoh: Calon Akseptor, PUS Unmet Need...";
  }
  else if (jenis === "Pencatatan & Pelaporan") {
    if (labelSasaran) labelSasaran.innerText = "OBJEK PENDATAAN / PELAPORAN";
    if (inputSasaran) inputSasaran.placeholder = "Contoh: Keluarga, Kader Sub-PPKBD, PUS...";
  }
  else {
    if (labelSasaran) labelSasaran.innerText = "SASARAN KEGIATAN";
    if (inputSasaran) inputSasaran.placeholder = "Contoh: Masyarakat umum, PUS...";
  }

  selectSub.innerHTML = '<option value="">-- Pilih Substansi --</option>';
  
  if (jenis === "Lainnya" || jenis === "") {
    if (wrapperSub) wrapperSub.classList.add("hidden");
    if (labelDeskripsi) labelDeskripsi.innerText = "Deskripsi Kegiatan";
    
    let opt = document.createElement("option");
    opt.value = "Lainnya";
    opt.selected = true;
    selectSub.appendChild(opt);
  } else {
    if (wrapperSub) wrapperSub.classList.remove("hidden");
    if (labelDeskripsi) labelDeskripsi.innerText = "Keterangan Tambahan (Opsional)";
    
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
  generateIndikator();
}

function updateSubstansiLaporan() {
  const jenis = document.getElementById("lap-kegiatan").value;
  const wrapperSub = document.getElementById("wrapper-substansi-lap");
  const selectSub = document.getElementById("lap-substansi");
  
  const wrapperKet = document.getElementById("wrapper-keterangan-lap");
  const labelKet = document.getElementById("label-lap-keterangan");
  const inputRealisasi = document.getElementById("lap-realisasi");

  const dataSubstansi = {
    "Pertemuan": ["Pertemuan Rutin Kader", "Rapat Koordinasi (Desa/RW)", "Pertemuan Kelompok Kerja (Pokja)"],
    "KIE": ["Penyuluhan Kelompok", "Konseling Individu", "Kunjungan Rumah (Door-to-door)", "Penyebaran Media Informasi"],
    "Pelayanan & Penggerakan": ["Pendampingan Rujukan KB", "Distribusi Alkon (Sub-PPKBD)", "Pembinaan Poktan (BKB/BKR/BKL/UPPKA)", "Fasilitasi Pelayanan KB/Baksos"],
    "Pencatatan & Pelaporan": ["Pemutakhiran Data Keluarga (Verval)", "Pemetaan Sasaran (PUS Unmet Need)", "Pengisian Buku Bantu / K0", "Input Laporan ke New SIGA"]
  };

  if (inputRealisasi) {
    inputRealisasi.disabled = false;
    inputRealisasi.classList.remove("bg-slate-200");
    if (inputRealisasi.value == "0") inputRealisasi.value = ""; 
  }

  selectSub.innerHTML = '<option value="">-- Pilih Substansi --</option>';

  if (jenis === "Lainnya" || jenis === "") {
    if (wrapperSub) wrapperSub.classList.add("hidden");
    
    if (jenis === "Lainnya") {
      if (wrapperKet) wrapperKet.classList.remove("hidden");
      if (labelKet) labelKet.innerText = "Deskripsi Kegiatan Lainnya";
    } else {
      if (wrapperKet) wrapperKet.classList.add("hidden");
    }
    
    let opt = document.createElement("option");
    opt.value = "Lainnya";
    opt.selected = true;
    selectSub.appendChild(opt);

  } else {
    if (wrapperSub) wrapperSub.classList.remove("hidden");
    if (wrapperKet) wrapperKet.classList.remove("hidden");
    if (labelKet) labelKet.innerText = "Dasar Pelaksanaan / Keterangan";
    
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
}

// ==========================================
// FUNGSI AI: AUTO-UBAH SATUAN TARGET
// ==========================================
function updateSatuanOtomatis() {
  const jenis = document.getElementById("renja-jenis").value;
  const substansiEl = document.getElementById("renja-substansi");
  const substansi = substansiEl ? substansiEl.value : "";
  const satuanSel = document.getElementById("renja-target-satuan");

  if (!satuanSel) return;

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

// ==========================================
// KUNCI TANGGAL MAKSIMAL HARI INI
// ==========================================
function batasiTanggalLaporan() {
  const inputTgl = document.getElementById("lap-tgl");
  if (inputTgl) {
    const today = new Date().toISOString().split('T')[0];
    inputTgl.setAttribute("max", today);
  }
}

// ==========================================
// FUNGSI AI: AUTO-GENERATE TAHUN (DASHBOARD & RENJA)
// ==========================================
function setTahunOtomatis() {
  const tahunSekarang = new Date().getFullYear(); 
  
  // 1. OTOMATISASI DROPDOWN DASHBOARD (filter-tahun)
  const filterTahun = document.getElementById("filter-tahun");
  if (filterTahun) {
    filterTahun.innerHTML = `
      <option value="${tahunSekarang - 1}">${tahunSekarang - 1}</option>
      <option value="${tahunSekarang}" selected>${tahunSekarang}</option>
      <option value="${tahunSekarang + 1}">${tahunSekarang + 1}</option>
    `;
  }

  // 2. OTOMATISASI DROPDOWN RENJA (renja-tahun)
  const selectTahunRenja = document.getElementById("renja-tahun");
  if (selectTahunRenja) {
    selectTahunRenja.innerHTML = `
      <option value="${tahunSekarang}" selected>${tahunSekarang}</option>
      <option value="${tahunSekarang + 1}">${tahunSekarang + 1}</option>
    `;
  }
}

//====================== LOAD STATISTIK (GRAFIK KINERJA) ==========================//
function loadGrafik() {
  const role = localStorage.getItem("role");
  const nikLogin = localStorage.getItem("nik");
  const kecAdmin = localStorage.getItem("kecamatan"); 
  const desaAdmin = localStorage.getItem("desa");
  
  // 1. CEK ELEMEN DASAR (Agar tidak error null)
  const elTahun = document.getElementById("filter-tahun");
  const elBulan = document.getElementById("filter-bulan");
  if (!elTahun || !elBulan) return; // Berhenti jika elemen tidak ada di halaman ini

  const tahun = elTahun.value;
  const bulan = elBulan.value;
  const userEl = document.getElementById("filter-user");
  const userSelect = userEl ? userEl.value : "";

  // 2. LOGIKA TAMPILAN KHUSUS ADMIN (Multi-Level)
  // Pakai .includes("admin") agar mencakup super_admin, admin_kec, dan admin_desa
  if (role && role.includes("admin")) {
    const adminArea = document.getElementById("admin-filter-area");
    if (adminArea) adminArea.classList.remove("hidden");

    // Ambil daftar kader jika dropdown user masih kosong
    if (userEl && userEl.options.length <= 1) {
      // Kirim parameter lengkap agar GAS bisa memfilter wilayah
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
            if (u.role === 'kader') { // Hanya tampilkan kader di dropdown
              let opt = document.createElement("option");
              opt.value = u.nik;
              opt.innerHTML = u.nama;
              userEl.appendChild(opt);
            }
          });
        })
        .catch(err => console.error("Gagal ambil daftar kader:", err));
    }
  }

  // 3. TENTUKAN SIAPA YANG MAU DILIHAT DATANYA
  // Jika admin pilih nama di dropdown, gunakan NIK tersebut. Jika tidak, gunakan NIK sendiri.
  let nikTarget = (role && role.includes("admin") && userSelect !== "") ? userSelect : nikLogin;

  // 4. TARIK DATA STATISTIK
  fetch(`${API_URL}?action=get_statistik&nik=${nikTarget}&bulan=${bulan}&tahun=${tahun}&role=${role}`)
    .then(res => res.json())
    .then(data => {
      
      // --- UPDATE KARTU RINGKASAN (TAHUNAN) ---
      const totalReal = data.realisasi_tahunan.reduce((a, b) => a + b, 0);
      const totalTarget = data.target_tahunan.reduce((a, b) => a + b, 0);
      const persen = totalTarget > 0 ? Math.round((totalReal / totalTarget) * 100) : 0;

      // Cek keberadaan ID sebelum isi data (Safety Check)
      if (document.getElementById("total-realisasi")) 
          document.getElementById("total-realisasi").innerText = totalReal;
      
      if (document.getElementById("total-persen")) 
          document.getElementById("total-persen").innerText = persen + "%";
      
      if (document.getElementById("progress-bar")) 
          document.getElementById("progress-bar").style.width = (persen > 100 ? 100 : persen) + "%";

      // --- UPDATE DIAGRAM DONUT (BULANAN) ---
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

//====================== RENDER PERINGKAT ==========================//
function renderPeringkat(dataRanking) {
  const listPeringkat = document.getElementById("list-peringkat");
  if (!listPeringkat) return;

  if (!dataRanking || dataRanking.length === 0) {
    listPeringkat.innerHTML = "<p class='text-center text-[10px] text-gray-400 py-4'>Belum ada data laporan.</p>";
    return;
  }

  listPeringkat.innerHTML = dataRanking.map((u, i) => `
    <div class="flex items-center justify-between bg-white p-3 rounded-2xl shadow-sm border border-slate-50">
      <div class="flex items-center gap-3">
        <span class="flex items-center justify-center w-6 h-6 rounded-full ${i === 0 ? 'bg-yellow-400' : 'bg-slate-100'} text-[10px] font-bold ${i === 0 ? 'text-white' : 'text-gray-400'}">${i+1}</span>
        <p class="text-[11px] font-bold text-slate-700">${u.nama}</p>
      </div>
      <span class="text-[9px] bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-bold">${u.skor} Lap</span>
    </div>
  `).join('');
}
// ==========================================
// KATA-KATA MOTIVASI ACAK SAAT LOGIN
// ==========================================
const daftarMotivasi = [
  "\"Semangat melayani, wujudkan keluarga sejahtera!\"",
  "\"Satu laporan Anda, langkah besar bagi kemajuan masyarakat.\"",
  "\"Kerja ikhlas, kerja tuntas. Selamat bertugas hari ini!\"",
  "\"Data yang akurat adalah awal dari keputusan yang tepat.\"",
  "\"Lelahmu hari ini adalah amal jariyah esok hari. Tetap semangat!\"",
  "\"Mari bangun lingkungan yang sehat dan berencana.\"",
  "\"Disiplin lapor hari ini, bukti dedikasi tanpa henti.\""
];

function tampilkanMotivasi() {
  const elMotivasi = document.getElementById("motivasi-login"); // ID disamakan dengan HTML
  if (elMotivasi) {
    const randomIndex = Math.floor(Math.random() * daftarMotivasi.length);
    elMotivasi.innerText = daftarMotivasi[randomIndex];
    // Tambahkan sedikit efek transisi biar keren
    elMotivasi.style.opacity = 0;
    setTimeout(() => { elMotivasi.style.opacity = 1; }, 100);
  }
}

// =========================================================
// BAGIAN MONITORING & CETAK
// =========================================================

function loadRiwayat() {
  const nik = localStorage.getItem("nik");
  const container = document.getElementById("list-riwayat");

  if (container) {
    container.innerHTML = `<p class="text-center text-sm text-gray-400 py-10 italic">Memuat riwayat laporan...</p>`;
  }

  fetch(API_URL + "?action=get_riwayat&nik=" + nik)
    .then(res => res.json())
    .then(data => {
      dataRiwayatGlobal = data; 

      if (container) {
        container.innerHTML = "";

        if (data.length === 0) {
          container.innerHTML = `<div class="bg-white p-6 rounded-2xl text-center text-gray-400 text-sm shadow">Belum ada riwayat laporan.</div>`;
          return;
        }

        data.reverse().forEach(lap => {
          let isDraft = lap.status === "Draft";
          let statusWarna = isDraft ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700";
          let btnHapus = isDraft 
            ? `<button onclick="hapusLaporan('${lap.id}')" class="text-red-500 text-[10px] font-bold bg-red-50 px-2 py-1 rounded">🗑 HAPUS</button>` 
            : `<span class="text-[9px] text-gray-400">Terverifikasi: ${lap.verifikator}</span>`;

          let tgl = new Date(lap.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

          container.innerHTML += `
            <div class="bg-white p-4 rounded-2xl shadow-sm border-l-4 ${isDraft ? 'border-yellow-400' : 'border-green-500'}">
              <div class="flex justify-between items-start mb-2">
                <span class="${statusWarna} text-[9px] font-bold px-2 py-1 rounded uppercase tracking-widest">${lap.status}</span>
                ${btnHapus}
              </div>
              <p class="font-bold text-sm text-gray-800">${lap.kegiatan}</p>
              <div class="flex justify-between text-xs text-gray-500 mt-2">
                <p>📅 ${tgl}</p>
                <p>👥 <span class="font-bold text-blue-700 uppercase">${lap.realisasi}</span></p>
              </div>
            </div>
          `;
        });
      }
    })
    .catch(() => {
      if (container) container.innerHTML = `<p class="text-center text-sm text-red-500 py-10">Gagal memuat data.</p>`;
    });
}

function hapusLaporan(id) {
  if (!confirm("Yakin ingin menghapus laporan ini? Data yang dihapus tidak bisa dikembalikan.")) return;

  fetch(API_URL, {
    method: "POST",
    body: new URLSearchParams({ action: "hapus_laporan", laporan_id: id })
  })
  .then(res => res.text())
  .then(res => {
    if (res === "success") {
      alert("Laporan berhasil dihapus.");
      loadRiwayat(); 
    } else if (res === "ditolak") {
      alert("Gagal! Laporan sudah disetujui Admin dan tidak bisa dihapus.");
    } else {
      alert("Gagal menghapus laporan.");
    }
  });
}

function cetakPDFPerBulan() {
  if (dataRiwayatGlobal.length === 0) return alert("Data belum siap atau kosong. Tunggu sebentar atau pastikan Anda sudah pernah melapor.");

  const bulanPilih = document.getElementById("bulan-cetak").value;
  const namaBulan = document.getElementById("bulan-cetak").options[document.getElementById("bulan-cetak").selectedIndex].text;
  
  const dataTerfilter = dataRiwayatGlobal.filter(lap => {
    let tglLap = new Date(lap.tanggal);
    let bulanLap = String(tglLap.getMonth() + 1).padStart(2, '0');
    return bulanLap === bulanPilih;
  });

  if (dataTerfilter.length === 0) {
    return alert(`Tidak ditemukan laporan kinerja untuk bulan ${namaBulan}.`);
  }

  const nama = localStorage.getItem("nama");
  const nik = localStorage.getItem("nik");
  const wilayah = localStorage.getItem("wilayah") || "-";
  const kecamatan = localStorage.getItem("kecamatan") || "SETU";
  
  let html = `
    <html>
    <head>
      <title>Visum Kinerja - ${nama}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; font-size: 11px; color: #333; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
        .header h2 { margin: 0; font-size: 16px; }
        .header p { margin: 2px 0; font-size: 12px; }
        .identitas { margin-bottom: 15px; width: 100%; }
        .identitas td { padding: 2px; }
        table.data { width: 100%; border-collapse: collapse; margin-top: 10px; }
        table.data th, table.data td { border: 1px solid black; padding: 6px; text-align: left; }
        table.data th { background-color: #f2f2f2; text-align: center; text-transform: uppercase; }
        .ttd { width: 100%; margin-top: 40px; }
        .ttd td { width: 50%; text-align: center; vertical-align: bottom; height: 80px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>VISUM PELAKSANAAN KEGIATAN KADER PPKBD / POS KB</h2>
        <p>UPTD PENGENDALIAN PENDUDUK WILAYAH V KABUPATEN BEKASI</p>
        <p><strong>BULAN: ${namaBulan.toUpperCase()} 2026</strong></p>
      </div>
      
      <table class="identitas">
        <tr><td width="120"><strong>Nama Kader</strong></td><td>: ${nama}</td></tr>
        <tr><td><strong>NIK</strong></td><td>: ${nik}</td></tr>
        <tr><td><strong>Wilayah Tugas</strong></td><td>: ${wilayah} / KEC. ${kecamatan.toUpperCase()}</td></tr>
      </table>

      <table class="data">
        <thead>
          <tr>
            <th width="5%">No</th>
            <th width="15%">Tanggal</th>
            <th width="45%">Kegiatan / Substansi</th>
            <th width="10%">Hasil</th>
            <th width="25%">Keterangan</th>
          </tr>
        </thead>
        <tbody>
  `;

  dataTerfilter.forEach((lap, index) => {
    let tgl = new Date(lap.tanggal).toLocaleDateString('id-ID');
    let statusKet = lap.status === "Disetujui" ? `Terverifikasi oleh ${lap.verifikator}` : "Proses Verifikasi";
    
    html += `
      <tr>
        <td style="text-align: center;">${index + 1}</td>
        <td>${tgl}</td>
        <td>${lap.kegiatan}</td>
        <td style="text-align: center;">${lap.realisasi}</td>
        <td>${statusKet}</td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>

      <table class="ttd">
        <tr>
          <td>Mengetahui,<br><strong>Admin / Verifikator</strong><br><br><br><br><br>( .................................... )</td>
          <td>Bekasi, ${new Date().toLocaleDateString('id-ID')}<br><strong>Pembuat Laporan</strong><br><br><br><br><br><strong>${nama}</strong></td>
        </tr>
      </table>
      
      <script>
        window.onload = function() { 
          window.print(); 
          setTimeout(function(){ window.close(); }, 500);
        }
      </script>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  printWindow.document.write(html);
  printWindow.document.close();
}

function bukaKamera() {
  const inputFile = document.getElementById('lap-foto-file');
  if (inputFile) {
    inputFile.click();
  } else {
    console.error("Error: ID 'lap-foto-file' tidak ditemukan di HTML!");
  }
}

// ==========================================
// FUNGSI AI: AUTO-GENERATE INDIKATOR RENJA
// ==========================================
function generateIndikator() {
  const jenis = document.getElementById("renja-jenis").value;
  const substansiEl = document.getElementById("renja-substansi");
  const substansi = substansiEl && substansiEl.value ? substansiEl.value : "";
  const keterangan = document.getElementById("renja-keterangan").value.trim();
  const sasaran = document.getElementById("renja-sasaran").value.trim();
  const angkaTarget = document.getElementById("renja-target-angka").value.trim();
  const satuanTarget = document.getElementById("renja-target-satuan").value;
  const peserta = angkaTarget ? `${angkaTarget} ${satuanTarget}` : "[Jumlah]";
  
  const inputIndikator = document.getElementById("renja-indikator");

  if (!jenis || jenis === "") {
    inputIndikator.value = "";
    return;
  }
  
  let namaKegiatan = (substansi && substansi !== "") ? substansi : jenis;
  if (jenis === "Lainnya") {
    namaKegiatan = "kegiatan operasional";
  }

  const detailKegiatan = keterangan ? `${namaKegiatan} (${keterangan})` : namaKegiatan;
  let kalimatBaku = "";

  switch (jenis) {
    case "Pertemuan":
      kalimatBaku = `Terselenggaranya agenda ${detailKegiatan} serta meningkatnya kesepahaman pada ${peserta} dari unsur ${sasaran} di wilayah kerja.`;
      break;
    case "KIE":
      kalimatBaku = `Meningkatnya pengetahuan dan kesadaran ${peserta} sasaran ${sasaran} mengenai program Bangga Kencana melalui edukasi ${detailKegiatan}.`;
      break;
    case "Pelayanan & Penggerakan":
      kalimatBaku = `Terlaksananya fasilitasi bagi ${peserta} sasaran ${sasaran} melalui aktivitas ${detailKegiatan} secara optimal.`;
      break;
    case "Pencatatan & Pelaporan":
      kalimatBaku = `Tersusunnya administrasi ${detailKegiatan} untuk sasaran ${sasaran} sebanyak ${peserta} yang valid, akurat, dan dapat dipertanggungjawabkan tepat waktu.`;
      break;
    default:
      kalimatBaku = `Terlaksananya ${detailKegiatan} dengan capaian ${peserta} dari target ${sasaran} sesuai dengan rencana kerja operasional.`;
  }
  inputIndikator.value = kalimatBaku;
}

// =========================================================
// MASTER PENGGERAK OTOMATIS (JALAN SAAT HALAMAN DIBUKA)
// =========================================================
document.addEventListener("DOMContentLoaded", () => {
  // 1. Setel Tahun Otomatis (Dashboard & Renja)
  if (typeof setTahunOtomatis === 'function') {
    setTahunOtomatis();
  }

  // 2. Tarik Data Renja Otomatis (Khusus Halaman Laporan)
  if (document.getElementById("pilih-renja")) {
    loadRenjaUntukLaporan();
  }

  // 3. Batasi Kalender Maksimal Hari Ini (Khusus Halaman Laporan)
  if (document.getElementById("lap-tgl") && typeof batasiTanggalLaporan === 'function') {
    batasiTanggalLaporan();
  }

  // 4. Tampilkan Kata Motivasi (Khusus Halaman Login)
  if (document.getElementById("motivasi-login")) {
    tampilkanMotivasi();
  }
});

// ================= SINKRONISASI WILAYAH GLOBAL =================
let GLOBAL_WILAYAH = []; 

// 1. Fungsi Ambil Data dari Spreadsheet (Dipakai di User & Master Wilayah)
function loadWilayahDatabase() {
  const selKecUser = document.getElementById("user-kecamatan"); // di user.html
  const selKecMaster = document.getElementById("select-kecamatan"); // di master-wilayah.html
  
  const targetDropdown = selKecUser || selKecMaster;
  if (!targetDropdown) return;

  fetch(`${API_URL}?action=get_wilayah_lengkap`)
    .then(res => res.json())
    .then(data => {
      GLOBAL_WILAYAH = data;
      
      // Ambil daftar Kecamatan Unik
      const uniqueKec = [...new Map(data.map(item => [item['kode_kec'], item])).values()];
      
      targetDropdown.innerHTML = '<option value="">-- Pilih Kecamatan --</option>';
      uniqueKec.forEach(item => {
        if(item.nama_kec && item.nama_kec !== "-") {
          let opt = document.createElement("option");
          opt.value = item.nama_kec;
          opt.setAttribute("data-kode", item.kode_kec); 
          opt.innerHTML = item.nama_kec;
          targetDropdown.appendChild(opt);
        }
      });

      // Panggil inisialisasi halaman setelah data siap
      if (typeof initUserPage === 'function') initUserPage();
      if (typeof updateInfoWilayah === 'function') updateInfoWilayah();
    })
    .catch(err => console.error("Gagal load wilayah:", err));
}

// 2. Fungsi Update Dropdown Desa
function updateDropdownDesa(desaTerpilih = "") {
  const selKec = document.getElementById("user-kecamatan") || document.getElementById("select-kecamatan");
  const selDesa = document.getElementById("user-wilayah");
  if (!selDesa || !selKec) return;

  const kecDipilih = selKec.value;
  selDesa.innerHTML = '<option value="">-- Pilih Desa --</option>';
  
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

// 3. Inisialisasi Header & Kunci Wilayah (Halaman User)
function initUserPage() {
  const role = localStorage.getItem("role");
  const kec = localStorage.getItem("kecamatan");
  const desa = localStorage.getItem("desa");
  
  const subTitle = document.getElementById("sub-title-admin");
  const selRole = document.getElementById("user-role");
  const selKec = document.getElementById("user-kecamatan");
  const selDesa = document.getElementById("user-wilayah");

  // Update Teks Header Otoritas
  if (subTitle) {
    if (role === "super_admin") subTitle.innerText = "Otoritas: Kabupaten Bekasi";
    else if (role === "admin_kec") subTitle.innerText = "Otoritas: Kec. " + kec;
    else subTitle.innerText = "Otoritas: Desa " + desa;
  }

  if (!selRole) return;

  // Kunci Dropdown & Role berdasarkan Jabatan
  if (role === "super_admin") {
    selRole.innerHTML = `
      <option value="admin_kec">Admin Kecamatan</option>
      <option value="admin_desa">Admin Desa</option>
      <option value="kader">Kader PPKBD</option>`;
  } else if (role === "admin_kec") {
    selRole.innerHTML = `<option value="admin_desa">Admin Desa</option><option value="kader">Kader PPKBD</option>`;
    if (selKec) { selKec.value = kec; selKec.disabled = true; updateDropdownDesa(); }
  } else {
    selRole.innerHTML = `<option value="kader">Kader PPKBD</option>`;
    if (selKec) { selKec.value = kec; selKec.disabled = true; }
    if (selDesa) { updateDropdownDesa(desa); selDesa.disabled = true; }
  }
}
