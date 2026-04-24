const API_URL = "https://script.google.com/macros/s/AKfycbzXt4isvjY5KrSZi37IedLKHGzCwiL1dMoB4N6IeSyKyTJXruTpjMuhWdm3RvJyCGQqEA/exec"; // ganti!

// Variable untuk menampung data foto base64
let base64Foto = ""; 
// Variable global untuk menampung data agar bisa difilter saat cetak
let dataRiwayatGlobal = [];

// ================= LOGIN =================
function login() {
  const nik = document.getElementById("nik").value;
  const password = document.getElementById("password").value;
  const info = document.getElementById("info");

  if (!nik || !password) {
    info.innerText = "NIK & Password wajib diisi!";
    return;
  }

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

	  localStorage.setItem("nik", data.nik);
	  localStorage.setItem("nama", data.nama);
	  localStorage.setItem("role", data.role);
	  localStorage.setItem("kecamatan", data.kecamatan);

	  window.location.href = "dashboard.html";

	} else if (data.status === "nonaktif") {

	  info.innerText = "Akun tidak aktif!";

	} else {
	  info.innerText = "Login gagal!";
	}
  })
  .catch(() => {
    info.innerText = "Koneksi error!";
  });
}

// ================= CEK LOGIN =================
function cekLogin() {
  if (!localStorage.getItem("nik")) {
    window.location.href = "index.html";
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
      // Perbaikan: Tambahkan pengecekan status success
      if (data.status === "success") {
        document.getElementById("hp").value = data.hp || "";
        document.getElementById("wilayah").value = data.wilayah || "";
        // Jika ada element kecamatan, isi juga
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
  const bulan = document.getElementById("renja-bulan").value;
  const lokasi = document.getElementById("renja-lokasi").value;
  const sasaran = document.getElementById("renja-sasaran").value;
  const volume = document.getElementById("renja-volume").value;
  const peserta = document.getElementById("renja-peserta").value;
  const indikator = document.getElementById("renja-indikator").value;

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
    // Format: "Jenis: Substansi - Keterangan"
    // Contoh: "KIE: Konseling Individu - Dusun III"
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
      kegiatan: kegiatanGabung, // <--- Hasil gabungan 3 input masuk ke sini
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
      jenis.value = ""; // Kembali ke "-- Pilih Jenis Kegiatan --"
      
      const wrapperSub = document.getElementById("wrapper-substansi");
      if (wrapperSub) wrapperSub.classList.add("hidden"); // Sembunyikan lagi dropdown anak
      
      const substansi = document.getElementById("renja-substansi");
      if (substansi) substansi.value = ""; // Kosongkan pilihan anak

      // 2. Kosongkan Elemen Teks & Angka
      document.getElementById("renja-indikator").value = "";
      document.getElementById("renja-sasaran").value = "";
      document.getElementById("renja-volume").value = "";
      document.getElementById("renja-peserta").value = "";
      document.getElementById("renja-keterangan").value = ""; // Bersihkan juga keterangan
      
      // Refresh list renja di bawahnya
      setTimeout(() => {
		  loadRenja();
		}, 1500); // Tunggu 1,5 detik baru refresh daftar
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
  const list = document.getElementById("listRenja"); // Sudah disesuaikan dengan HTML Bapak
  const nik = localStorage.getItem("nik");

  if (!list) return;

  // Tampilkan efek loading biar keren
  list.innerHTML = "<p class='text-center text-gray-400 text-xs animate-pulse'>Sedang menyinkronkan data...</p>";

  fetch(`${API_URL}?action=get_renja&nik=${nik}`)
    .then(res => res.json())
    .then(data => {
      if (!data || data.length === 0) {
        list.innerHTML = "<div class='bg-blue-50 p-4 rounded-2xl text-center text-blue-800 text-xs'>Belum ada rencana kerja. Yuk, buat sekarang!</div>";
        return;
      }

      let html = "";
      data.forEach(item => {
        // Kita buat kartu yang cantik untuk daftar renja
        html += `
          <div class="bg-white p-4 rounded-2xl shadow-sm border-l-4 border-blue-900 mb-3">
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <h3 class="font-bold text-blue-900 text-xs uppercase leading-tight">${item.kegiatan}</h3>
                <p class="text-[9px] text-gray-400 mt-1 italic">ID: ${item.renja_id}</p>
              </div>
              <div class="bg-blue-100 px-2 py-1 rounded-lg">
                <p class="text-[10px] font-bold text-blue-800">${item.target_peserta} <span class="font-normal">Orang</span></p>
              </div>
            </div>
          </div>
        `;
      });
      list.innerHTML = html;
    })
    .catch(err => {
      console.error(err);
      list.innerHTML = "<p class='text-center text-red-400 text-[10px] py-4'>Gagal mengambil data. Cek koneksi!</p>";
    });
}

// ================= LOAD DATA RENJA (Untuk Dropdown di Form Laporan) =================
function loadRenjaUntukLaporan() {
  const nik = localStorage.getItem("nik");
  const dropdown = document.getElementById("pilih-renja");

  if (!dropdown) return;

  fetch(API_URL + "?action=get_renja&nik=" + nik)
    .then(res => res.json())
    .then(data => {
      dropdown.innerHTML = '<option value="">-- Pilih Rencana Kerja --</option>';
      
      if (data.length === 0) {
        dropdown.innerHTML = '<option value="">(Belum ada Renja / NIK tidak cocok)</option>';
        return;
      }

      data.forEach(renja => {
        // Kita tampilkan kegiatan di dropdown agar kader mudah memilih
        dropdown.innerHTML += `<option value="${renja.renja_id}">${renja.kegiatan}</option>`;
      });
    })
    .catch(err => {
      console.error("Fetch Error:", err);
      dropdown.innerHTML = '<option value="">Gagal koneksi ke server</option>';
    });
}
// ================= SIMPAN LAPORAN FINAL =================
async function simpanLaporan() {
  const btn = document.getElementById("btn-simpan-laporan");
  const info = document.getElementById("info-laporan");
  
  // Ambil Data Identitas
  const nik = localStorage.getItem("nik");
  const nama = localStorage.getItem("nama");
  const kecamatan = localStorage.getItem("kecamatan");
  
  // Ambil Data Form
  const sumber = document.getElementById("sumber-kegiatan").value;
  const dropdownRenja = document.getElementById("pilih-renja");
  const renja_id = (sumber === "renja") ? dropdownRenja.value : "LUAR-RENJA";
  
  const kegiatanManual = document.getElementById("lap-kegiatan").value;
  const lokasi = document.getElementById("lap-lokasi").value;
  const tanggal = document.getElementById("lap-tgl").value;
  const realisasi = document.getElementById("lap-realisasi").value;

  // --- GEMBOK VALIDASI ---
  if (sumber === "renja" && !renja_id) return alert("Pilih Renja terlebih dahulu!");
  if (!tanggal || !realisasi || !lokasi) return alert("Lengkapi Tanggal, Lokasi, dan Realisasi!");
  
  // Cek apakah foto sudah diproses oleh previewFoto
  if (!base64Foto) return alert("Gagal! Foto Visum wajib diupload.");

  // Tentukan Nama Kegiatan untuk di Spreadsheet
  let namaKegiatanFinal = (sumber === "renja") 
      ? dropdownRenja.options[dropdownRenja.selectedIndex].text 
      : "Tambahan: " + kegiatanManual;

  // Mulai Proses Kirim
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
        realisasi: realisasi,
        lokasi: lokasi,
        foto_data: base64Foto  // Mengirim foto yang sudah dikompres
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
    console.error("Error:", err);
    alert("Koneksi Error. Pastikan internet stabil dan Apps Script sudah di-deploy.");
    btn.disabled = false;
    btn.innerText = "KIRIM LAPORAN SEKARANG";
  }
}

// Fungsi Menampilkan Preview dan Kompresi
function previewFoto(input) {
    const file = input.files[0];
    const reader = new FileReader();
    const label = document.getElementById("label-foto");
    const preview = document.getElementById("img-preview");

    reader.onload = function(e) {
        const img = new Image();
        img.src = e.target.result;
        img.onload = function() {
            // --- PROSES AUTO COMPRESS ---
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800; // Ukuran maksimal lebar
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

            // Kompres ke JPEG dengan kualitas 0.7 (70%)
            base64Foto = canvas.toDataURL("image/jpeg", 0.7);
            
            preview.src = base64Foto;
            preview.classList.remove("hidden");
            label.innerText = "Foto terpilih: " + file.name;
        }
    }
    reader.readAsDataURL(file);
}

// ================= TAMBAH USER (KHUSUS ADMIN) =================
function tambahUser() {
  const btn = document.getElementById("btn-tambah-user");
  const info = document.getElementById("info-user");

  const nama = document.getElementById("user-nama").value;
  const nik = document.getElementById("user-nik").value;
  const hp = document.getElementById("user-hp").value;
  const kecamatan = document.getElementById("user-kecamatan").value;
  const wilayah = document.getElementById("user-wilayah").value;
  const role = document.getElementById("user-role").value;
  const password = document.getElementById("user-password").value;

  // Validasi Kosong
  if (!nama || !nik || !wilayah || !kecamatan || !password) {
    info.innerText = "Harap lengkapi semua form data user!";
    info.className = "text-center text-sm mt-2 text-red-500 font-bold";
    return;
  }

  // Validasi panjang NIK (KTP Indonesia harus 16 digit)
  if (nik.length < 15) {
    info.innerText = "Peringatan: NIK kurang dari 16 digit!";
    info.className = "text-center text-sm mt-2 text-red-500 font-bold";
    return;
  }

  btn.disabled = true; btn.innerText = "MENYIMPAN DATA...";

  fetch(API_URL, {
    method: "POST",
    body: new URLSearchParams({
      action: "tambah_user",
      nama: nama,
      nik: nik,
      hp: hp,
      kecamatan: kecamatan,
      wilayah: wilayah,
      role: role,
      password: password
    })
  })
  .then(res => res.text())
  .then(res => {
    if (res === "success") {
      info.innerText = "User berhasil didaftarkan!";
      info.className = "text-center text-sm mt-2 text-green-600 font-bold";
      
      // Kosongkan form setelah sukses (kecuali kecamatan & password)
      document.getElementById("user-nama").value = "";
      document.getElementById("user-nik").value = "";
      document.getElementById("user-hp").value = "";
      document.getElementById("user-wilayah").value = "";
      
    } else {
      info.innerText = "Gagal mendaftarkan user ke Database!";
      info.className = "text-center text-sm mt-2 text-red-500 font-bold";
    }
    btn.disabled = false; btn.innerText = "SIMPAN USER BARU";
  })
  .catch(() => {
    info.innerText = "Koneksi Error. Coba lagi!";
    info.className = "text-center text-sm mt-2 text-red-500 font-bold";
    btn.disabled = false; btn.innerText = "SIMPAN USER BARU";
  });
}

// ================= LOAD DAFTAR USER =================
function loadUsers() {
  const container = document.getElementById("container-daftar-user");
  const kecAdmin = localStorage.getItem("kecamatan");

  container.innerHTML = `<p class="text-center text-sm text-gray-400 py-4 italic">Memuat data...</p>`;

  fetch(API_URL + "?action=get_users&kecamatan=" + kecAdmin)
    .then(res => res.json())
    .then(data => {
      container.innerHTML = "";

      if (data.length === 0) {
        container.innerHTML = `<div class="bg-white p-6 rounded-2xl text-center text-gray-400 text-sm shadow">Belum ada kader terdaftar.</div>`;
        return;
      }

      data.forEach(u => {
        // Penentuan warna label status
        let statusColor = u.status === "aktif" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700";
        let roleBadge = u.role === "admin" ? "👑 Admin" : "👤 Kader";
        
        // Logika tombol: Jika aktif tampilkan tombol Nonaktif, jika nonaktif tampilkan tombol Aktif
        let btnStatus = u.status === "aktif" 
          ? `<button onclick="ubahStatusUser('${u.nik}', 'nonaktif')" class="flex-1 bg-yellow-100 text-yellow-700 text-xs font-bold py-2 rounded-lg">⏸ Nonaktifkan</button>`
          : `<button onclick="ubahStatusUser('${u.nik}', 'aktif')" class="flex-1 bg-green-100 text-green-700 text-xs font-bold py-2 rounded-lg">▶ Aktifkan</button>`;

        container.innerHTML += `
          <div class="bg-white p-4 rounded-2xl shadow-sm border-l-4 ${u.role === 'admin' ? 'border-red-500' : 'border-blue-500'}">
            <div class="flex justify-between items-start mb-2">
              <div>
                <p class="text-sm font-black text-blue-900 uppercase">${u.nama}</p>
                <p class="text-[10px] text-gray-500 font-bold tracking-wider">${u.nik}</p>
              </div>
              <span class="text-[10px] font-bold ${statusColor} px-2 py-1 rounded-md uppercase">${u.status}</span>
            </div>
            
            <p class="text-xs text-gray-600 mb-3">Wilayah: <b>${u.wilayah}</b> | ${roleBadge}</p>
            
            <div class="flex gap-2 mt-2">
              ${btnStatus}
              <button onclick="hapusUser('${u.nik}', '${u.nama}')" class="flex-1 bg-red-100 text-red-700 text-xs font-bold py-2 rounded-lg">🗑 Hapus</button>
            </div>
          </div>
        `;
      });
    });
}

// ================= UBAH STATUS USER =================
function ubahStatusUser(nikTarget, statusBaru) {
  if (!confirm(`Yakin ingin mengubah status kader ini menjadi ${statusBaru.toUpperCase()}?`)) return;

  fetch(API_URL, {
    method: "POST",
    body: new URLSearchParams({
      action: "update_status_user",
      nik_target: nikTarget,
      status_baru: statusBaru
    })
  })
  .then(res => res.text())
  .then(res => {
    if (res === "success") {
      alert("Status berhasil diubah!");
      loadUsers(); // Refresh daftar otomatis
    }
  });
}

// ================= HAPUS USER =================
function hapusUser(nikTarget, namaTarget) {
  if (!confirm(`PERINGATAN! Yakin ingin menghapus kader ${namaTarget} secara permanen dari sistem?`)) return;

  fetch(API_URL, {
    method: "POST",
    body: new URLSearchParams({
      action: "hapus_user",
      nik_target: nikTarget
    })
  })
  .then(res => res.text())
  .then(res => {
    if (res === "success") {
      alert("Kader berhasil dihapus!");
      loadUsers(); // Refresh daftar otomatis
    }
  });
}
//======================Update Substansi==========================//
function updateSubstansi() {
  const jenis = document.getElementById("renja-jenis").value;
  const wrapperSub = document.getElementById("wrapper-substansi");
  const selectSub = document.getElementById("renja-substansi");
  const labelDeskripsi = document.getElementById("label-deskripsi");

  // MAPPING SUBSTANSI SESUAI KATEGORI SIGA
  const dataSubstansi = {
    "Pertemuan": [
      "Pertemuan Rutin Kader", 
      "Rapat Koordinasi (Desa/RW)", 
      "Pertemuan Kelompok Kerja (Pokja)"
    ],
    "KIE": [
      "Penyuluhan Kelompok", 
      "Konseling Individu", 
      "Kunjungan Rumah (Door-to-door)", 
      "Penyebaran Media Informasi"
    ],
    "Pelayanan & Penggerakan": [
      "Pendampingan Rujukan KB", 
      "Distribusi Alkon (Sub-PPKBD)", 
      "Pembinaan Poktan (BKB/BKR/BKL/UPPKA)", 
      "Fasilitasi Pelayanan KB/Baksos"
    ],
    "Pencatatan & Pelaporan": [
      "Pemutakhiran Data Keluarga (Verval)", 
      "Pemetaan Sasaran (PUS Unmet Need)", 
      "Pengisian Buku Bantu / K0", 
      "Input Laporan ke New SIGA"
    ]
  };

  // Reset dropdown anak
  selectSub.innerHTML = '<option value="">-- Pilih Substansi --</option>';

  if (jenis === "Lainnya" || jenis === "") {
    wrapperSub.classList.add("hidden");
    labelDeskripsi.innerText = "Deskripsi Kegiatan";
    // Jika Lainnya, tambahkan opsi default agar tidak kosong saat dikirim
    let opt = document.createElement("option");
    opt.value = "Lainnya";
    opt.selected = true;
    selectSub.appendChild(opt);
  } else {
    wrapperSub.classList.remove("hidden");
    labelDeskripsi.innerText = "Keterangan Tambahan (Opsional)";
    
    // Isi dropdown anak berdasarkan pilihan induk
    dataSubstansi[jenis].forEach(item => {
      let opt = document.createElement("option");
      opt.value = item;
      opt.innerHTML = item;
      selectSub.appendChild(opt);
    });
    // Tambahkan pilihan "Lainnya" di setiap kategori
    let optLain = document.createElement("option");
    optLain.value = "Lainnya di " + jenis;
    optLain.innerHTML = "Lainnya...";
    selectSub.appendChild(optLain);
  }
}

// =========================================================
// BAGIAN MONITORING & CETAK (Tambahkan ke script.js)
// =========================================================

// 1. FUNGSI LOAD RIWAYAT (Untuk Monitoring & Cetak)
function loadRiwayat() {
  const nik = localStorage.getItem("nik");
  const container = document.getElementById("list-riwayat");

  // Jika sedang di halaman monitoring, tampilkan loading
  if (container) {
    container.innerHTML = `<p class="text-center text-sm text-gray-400 py-10 italic">Memuat riwayat laporan...</p>`;
  }

  fetch(API_URL + "?action=get_riwayat&nik=" + nik)
    .then(res => res.json())
    .then(data => {
      dataRiwayatGlobal = data; // Simpan data ke variabel global

      // Jika container ada (berarti sedang di halaman monitoring.html)
      if (container) {
        container.innerHTML = "";

        if (data.length === 0) {
          container.innerHTML = `<div class="bg-white p-6 rounded-2xl text-center text-gray-400 text-sm shadow">Belum ada riwayat laporan.</div>`;
          return;
        }

        // Tampilkan dari yang terbaru
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
                <p>👥 ${lap.realisasi} Sasaran</p>
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

// 2. FUNGSI HAPUS LAPORAN (Hanya untuk status Draft)
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
      loadRiwayat(); // Refresh data
    } else if (res === "ditolak") {
      alert("Gagal! Laporan sudah disetujui Admin dan tidak bisa dihapus.");
    } else {
      alert("Gagal menghapus laporan.");
    }
  });
}

// 3. FUNGSI CETAK VISUM (Filter Per Bulan)
function cetakPDFPerBulan() {
  if (dataRiwayatGlobal.length === 0) return alert("Data belum siap atau kosong. Tunggu sebentar atau pastikan Anda sudah pernah melapor.");

  const bulanPilih = document.getElementById("bulan-cetak").value;
  const namaBulan = document.getElementById("bulan-cetak").options[document.getElementById("bulan-cetak").selectedIndex].text;
  
  // Filter data berdasarkan bulan
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
