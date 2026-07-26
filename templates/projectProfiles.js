const PROFILES = {
  attendance: { name: 'Absensi & SPP', icon: '✓', tagline: 'Kelola kehadiran dan pembayaran dalam satu tempat.', recordLabel: 'Aktivitas', sheetName: 'Aktivitas', fields: [{ key: 'jenis', label: 'Jenis absensi', type: 'select', options: ['Masuk', 'Pulang', 'Izin', 'Sakit'] }, { key: 'catatan', label: 'Catatan', type: 'text' }] },
  inventory: { name: 'Inventaris', icon: '▣', tagline: 'Pantau stok, aset, dan pergerakan barang secara rapi.', recordLabel: 'Pergerakan stok', sheetName: 'Stok', fields: [{ key: 'barang', label: 'Nama barang', type: 'text' }, { key: 'jumlah', label: 'Jumlah', type: 'number' }, { key: 'jenis', label: 'Jenis transaksi', type: 'select', options: ['Barang masuk', 'Barang keluar', 'Penyesuaian'] }, { key: 'catatan', label: 'Catatan', type: 'text' }] },
  cashier: { name: 'Kasir', icon: 'Rp', tagline: 'Catat transaksi penjualan dengan cepat dan sederhana.', recordLabel: 'Transaksi', sheetName: 'Transaksi', fields: [{ key: 'produk', label: 'Produk / layanan', type: 'text' }, { key: 'jumlah', label: 'Jumlah', type: 'number' }, { key: 'total', label: 'Total (Rp)', type: 'number' }, { key: 'metode', label: 'Metode bayar', type: 'select', options: ['Tunai', 'QRIS', 'Transfer', 'Kartu'] }] },
  booking: { name: 'Booking', icon: '◷', tagline: 'Atur jadwal dan kelola reservasi pelanggan tanpa tumpang tindih.', recordLabel: 'Reservasi', sheetName: 'Reservasi', fields: [{ key: 'pelanggan', label: 'Nama pelanggan', type: 'text' }, { key: 'layanan', label: 'Layanan', type: 'text' }, { key: 'jadwal', label: 'Tanggal & waktu', type: 'datetime-local' }, { key: 'status', label: 'Status', type: 'select', options: ['Menunggu', 'Dikonfirmasi', 'Selesai', 'Dibatalkan'] }] },
  service: { name: 'Layanan / Service', icon: '⚙', tagline: 'Terima, pantau, dan selesaikan pekerjaan layanan pelanggan.', recordLabel: 'Tiket service', sheetName: 'Tiket Service', fields: [{ key: 'pelanggan', label: 'Nama pelanggan', type: 'text' }, { key: 'keluhan', label: 'Keluhan / pekerjaan', type: 'text' }, { key: 'status', label: 'Status', type: 'select', options: ['Baru', 'Diproses', 'Selesai'] }, { key: 'biaya', label: 'Estimasi biaya', type: 'number' }] },
  crm: { name: 'Pelanggan / CRM', icon: '♙', tagline: 'Simpan prospek dan tindak lanjut pelanggan dari satu dashboard.', recordLabel: 'Aktivitas pelanggan', sheetName: 'Pelanggan', fields: [{ key: 'nama', label: 'Nama pelanggan', type: 'text' }, { key: 'kontak', label: 'Kontak', type: 'text' }, { key: 'tahap', label: 'Tahap', type: 'select', options: ['Prospek', 'Dihubungi', 'Negosiasi', 'Pelanggan'] }, { key: 'catatan', label: 'Catatan', type: 'text' }] },
  laundry: { name: 'Laundry', icon: '◉', tagline: 'Kelola cucian pelanggan, layanan, dan status pengerjaan.', recordLabel: 'Order laundry', sheetName: 'Order Laundry', fields: [{ key: 'pelanggan', label: 'Nama pelanggan', type: 'text' }, { key: 'layanan', label: 'Layanan', type: 'select', options: ['Cuci kiloan', 'Cuci satuan', 'Setrika', 'Express'] }, { key: 'berat', label: 'Berat (kg)', type: 'number' }, { key: 'status', label: 'Status', type: 'select', options: ['Diterima', 'Dicuci', 'Siap diambil', 'Selesai'] }] },
  rental: { name: 'Rental', icon: '◆', tagline: 'Catat penyewaan aset dan pantau tanggal pengembaliannya.', recordLabel: 'Penyewaan', sheetName: 'Penyewaan', fields: [{ key: 'penyewa', label: 'Nama penyewa', type: 'text' }, { key: 'item', label: 'Barang / aset', type: 'text' }, { key: 'kembali', label: 'Batas pengembalian', type: 'datetime-local' }, { key: 'status', label: 'Status', type: 'select', options: ['Dipinjam', 'Dikembalikan', 'Terlambat'] }] },
  clinic: { name: 'Klinik', icon: '+', tagline: 'Kelola antrean dan kunjungan pasien secara sederhana.', recordLabel: 'Kunjungan pasien', sheetName: 'Kunjungan', fields: [{ key: 'pasien', label: 'Nama pasien', type: 'text' }, { key: 'keluhan', label: 'Keluhan', type: 'text' }, { key: 'jadwal', label: 'Jadwal kunjungan', type: 'datetime-local' }, { key: 'status', label: 'Status', type: 'select', options: ['Menunggu', 'Diperiksa', 'Selesai'] }] },
  tasks: { name: 'Manajemen Tugas', icon: '✓', tagline: 'Susun pekerjaan tim dan pantau progres setiap tugas.', recordLabel: 'Tugas', sheetName: 'Tugas', fields: [{ key: 'tugas', label: 'Nama tugas', type: 'text' }, { key: 'penanggungJawab', label: 'Penanggung jawab', type: 'text' }, { key: 'deadline', label: 'Deadline', type: 'datetime-local' }, { key: 'status', label: 'Status', type: 'select', options: ['To do', 'Dikerjakan', 'Selesai'] }] },
  event: { name: 'Event Organizer', icon: '★', tagline: 'Atur agenda acara, klien, dan status persiapan event.', recordLabel: 'Agenda event', sheetName: 'Agenda Event', fields: [{ key: 'klien', label: 'Nama klien', type: 'text' }, { key: 'acara', label: 'Nama acara', type: 'text' }, { key: 'tanggal', label: 'Tanggal acara', type: 'datetime-local' }, { key: 'status', label: 'Status', type: 'select', options: ['Rencana', 'Persiapan', 'Berlangsung', 'Selesai'] }] },
  finance: { name: 'Analisis Keuangan', icon: 'Rp', tagline: 'Catat arus kas dan pantau kesehatan keuangan usaha.', recordLabel: 'Transaksi', sheetName: 'Transaksi', fields: [{ key: 'jenis', label: 'Jenis transaksi', type: 'select', options: ['Pemasukan', 'Pengeluaran'] }, { key: 'kategori', label: 'Kategori', type: 'text' }, { key: 'nominal', label: 'Nominal (Rp)', type: 'number' }, { key: 'catatan', label: 'Catatan', type: 'text' }] },
  bimba: { name: 'BIMBA / Pendidikan', icon: 'A+', tagline: 'Kelola siswa, kehadiran, kelas, dan iuran dalam satu sistem.', recordLabel: 'Data siswa', sheetName: 'Siswa', fields: [{ key: 'nama', label: 'Nama siswa', type: 'text' }, { key: 'kelas', label: 'Kelas', type: 'text' }, { key: 'wali', label: 'Nama wali', type: 'text' }, { key: 'status', label: 'Status', type: 'select', options: ['Aktif', 'Nonaktif'] }] }
};

const text = (key, label) => ({ key, label, type: 'text' });
const number = (key, label) => ({ key, label, type: 'number' });
const date = (key, label) => ({ key, label, type: 'date' });
const select = (key, label, options) => ({ key, label, type: 'select', options });

const MODULES_BY_TYPE = {
  workshop: [
    { id: 'tiket', name: 'Tiket Servis', icon: 'T', fields: [text('pelanggan', 'Nama pelanggan'), text('kendaraan', 'Kendaraan / nomor plat'), text('keluhan', 'Keluhan'), text('teknisi', 'Teknisi'), number('estimasi', 'Estimasi biaya (Rp)'), select('status', 'Status', ['Masuk', 'Diagnosa', 'Dikerjakan', 'Siap diambil', 'Selesai'])] },
    { id: 'sparepart', name: 'Sparepart', icon: 'S', adminOnly: true, fields: [text('nama', 'Nama sparepart'), text('kode', 'Kode barang'), number('stok', 'Stok'), number('harga', 'Harga jual (Rp)')] },
    { id: 'teknisi', name: 'Teknisi', icon: 'K', adminOnly: true, fields: [text('nama', 'Nama teknisi'), text('keahlian', 'Keahlian'), text('telepon', 'Nomor telepon'), select('status', 'Status', ['Aktif', 'Libur', 'Nonaktif'])] },
    { id: 'pelanggan', name: 'Pelanggan', icon: 'P', adminOnly: true, fields: [text('nama', 'Nama pelanggan'), text('telepon', 'Nomor telepon'), text('kendaraan', 'Kendaraan'), text('alamat', 'Alamat')] },
    { id: 'pembayaran', name: 'Pembayaran', icon: 'Rp', adminOnly: true, fields: [text('tiket', 'ID tiket servis'), number('nominal', 'Nominal (Rp)'), select('metode', 'Metode bayar', ['Tunai', 'QRIS', 'Transfer']), select('status', 'Status', ['Belum dibayar', 'DP', 'Lunas'])] },
    { id: 'laporan', name: 'Laporan Bengkel', icon: '#', adminOnly: true, fields: [text('periode', 'Periode'), number('pendapatan', 'Pendapatan (Rp)'), number('biaya', 'Biaya (Rp)'), text('catatan', 'Catatan')] }
  ],
  laundry: [
    { id: 'order', name: 'Order Laundry', icon: 'O', fields: [text('pelanggan', 'Nama pelanggan'), text('layanan', 'Layanan'), number('berat', 'Berat (kg)'), number('harga', 'Harga per kg (Rp)'), number('diskon', 'Diskon (Rp)'), number('total', 'Total tagihan (Rp)'), select('metodeBayar', 'Metode pembayaran', ['Tunai', 'QRIS', 'Transfer']), select('statusBayar', 'Status pembayaran', ['Belum dibayar', 'DP', 'Lunas']), select('statusOrder', 'Status order', ['Diterima', 'Dicuci', 'Dikeringkan', 'Disetrika', 'Siap diambil', 'Selesai'])] },
    { id: 'layanan', name: 'Layanan & Harga', icon: '$', adminOnly: true, fields: [text('layanan', 'Nama layanan'), number('harga', 'Harga dasar / kg (Rp)'), text('satuan', 'Satuan'), select('status', 'Status layanan', ['Aktif', 'Nonaktif'])] },
    { id: 'pelanggan', name: 'Pelanggan', icon: 'P', adminOnly: true, fields: [text('nama', 'Nama pelanggan'), text('telepon', 'Nomor telepon'), text('alamat', 'Alamat'), select('status', 'Status', ['Aktif', 'Nonaktif'])] },
    { id: 'pembayaran', name: 'Pembayaran', icon: 'Rp', adminOnly: true, fields: [text('order', 'ID / nama order'), number('nominal', 'Nominal pembayaran (Rp)'), select('metode', 'Metode', ['Tunai', 'QRIS', 'Transfer']), select('status', 'Status', ['Menunggu', 'Terverifikasi', 'Lunas'])] },
    { id: 'laporan', name: 'Laporan', icon: '#', adminOnly: true, fields: [text('periode', 'Periode'), number('pendapatan', 'Total pendapatan (Rp)'), number('biaya', 'Total biaya (Rp)'), text('catatan', 'Catatan laporan')] }
  ],
  cashier: [
    { id: 'transaksi', name: 'Transaksi', icon: '↗', fields: PROFILES.cashier.fields },
    { id: 'produk', name: 'Produk', icon: '□', adminOnly: true, fields: [{ key: 'nama', label: 'Nama produk', type: 'text' }, { key: 'harga', label: 'Harga (Rp)', type: 'number' }, { key: 'stok', label: 'Stok', type: 'number' }] },
    { id: 'laporan', name: 'Laporan', icon: '▤', adminOnly: true, fields: [{ key: 'periode', label: 'Periode laporan', type: 'month' }, { key: 'catatan', label: 'Catatan', type: 'text' }] }
  ],
  attendance: [
    { id: 'absensi', name: 'Absensi', icon: '✓', fields: PROFILES.attendance.fields },
    { id: 'izin', name: 'Izin & Cuti', icon: '◷', fields: [{ key: 'tanggal', label: 'Tanggal', type: 'date' }, { key: 'jenis', label: 'Jenis', type: 'select', options: ['Izin', 'Sakit', 'Cuti'] }, { key: 'catatan', label: 'Keterangan', type: 'text' }] },
    { id: 'laporan', name: 'Laporan Absensi', icon: '▤', adminOnly: true, fields: [{ key: 'periode', label: 'Periode', type: 'month' }, { key: 'catatan', label: 'Catatan admin', type: 'text' }] }
  ],
  finance: [
    { id: 'transaksi', name: 'Arus Kas', icon: '↗', fields: PROFILES.finance.fields },
    { id: 'anggaran', name: 'Anggaran', icon: '◫', adminOnly: true, fields: [{ key: 'kategori', label: 'Kategori', type: 'text' }, { key: 'batas', label: 'Batas anggaran (Rp)', type: 'number' }, { key: 'periode', label: 'Periode', type: 'month' }] },
    { id: 'analisis', name: 'Analisis', icon: '◔', adminOnly: true, fields: [{ key: 'periode', label: 'Periode analisis', type: 'month' }, { key: 'ringkasan', label: 'Ringkasan', type: 'text' }] }
  ],
  bimba: [
    { id: 'siswa', name: 'Data Siswa', icon: '♙', adminOnly: true, fields: PROFILES.bimba.fields },
    { id: 'kelas', name: 'Kelas', icon: '▣', adminOnly: true, fields: [{ key: 'nama', label: 'Nama kelas', type: 'text' }, { key: 'pengajar', label: 'Pengajar', type: 'text' }, { key: 'jadwal', label: 'Jadwal', type: 'text' }] },
    { id: 'absensi', name: 'Absensi', icon: '✓', fields: [{ key: 'siswa', label: 'Nama siswa', type: 'text' }, { key: 'tanggal', label: 'Tanggal', type: 'date' }, { key: 'status', label: 'Status', type: 'select', options: ['Hadir', 'Izin', 'Sakit', 'Alpa'] }] },
    { id: 'iuran', name: 'Iuran', icon: 'Rp', adminOnly: true, fields: [{ key: 'siswa', label: 'Nama siswa', type: 'text' }, { key: 'bulan', label: 'Bulan', type: 'month' }, { key: 'nominal', label: 'Nominal (Rp)', type: 'number' }, { key: 'status', label: 'Status', type: 'select', options: ['Lunas', 'Belum lunas'] }] }
  ]
};

const preset = (id, name, icon, tagline, recordLabel, fields) => ({ id, name, icon, tagline, recordLabel, sheetName: recordLabel, fields });

const EXTRA_TEMPLATES = [
  preset('restaurant', 'Restoran', 'R', 'Kelola pesanan meja dan pelayanan pelanggan.', 'Pesanan', [text('pelanggan', 'Nama pelanggan'), text('menu', 'Menu'), number('total', 'Total (Rp)'), select('status', 'Status', ['Baru', 'Dimasak', 'Selesai'])]),
  preset('coffee', 'Coffee Shop', 'C', 'Catat pesanan minuman dan transaksi harian.', 'Pesanan minuman', [text('menu', 'Menu minuman'), number('jumlah', 'Jumlah'), number('total', 'Total (Rp)'), select('metode', 'Metode bayar', ['Tunai', 'QRIS', 'Kartu'])]),
  preset('ecommerce', 'E-Commerce', 'E', 'Kelola order online, pelanggan, dan pengiriman.', 'Order', [text('pelanggan', 'Nama pelanggan'), text('produk', 'Produk'), number('total', 'Total (Rp)'), select('status', 'Status order', ['Baru', 'Diproses', 'Dikirim', 'Selesai'])]),
  preset('fashion', 'Toko Fashion', 'F', 'Pantau penjualan pakaian dan stok koleksi.', 'Penjualan', [text('produk', 'Nama produk'), text('ukuran', 'Ukuran'), number('jumlah', 'Jumlah'), number('total', 'Total (Rp)')]),
  preset('salon', 'Salon & Beauty', 'S', 'Atur layanan kecantikan dan jadwal pelanggan.', 'Layanan salon', [text('pelanggan', 'Nama pelanggan'), text('layanan', 'Layanan'), date('tanggal', 'Tanggal'), select('status', 'Status', ['Booking', 'Dikerjakan', 'Selesai'])]),
  preset('gym', 'Gym & Fitness', 'G', 'Kelola anggota, paket, dan aktivitas kebugaran.', 'Aktivitas anggota', [text('anggota', 'Nama anggota'), text('paket', 'Paket'), date('tanggal', 'Tanggal'), select('status', 'Status', ['Aktif', 'Selesai'])]),
  preset('hotel', 'Hotel & Homestay', 'H', 'Kelola reservasi kamar dan data tamu.', 'Reservasi kamar', [text('tamu', 'Nama tamu'), text('kamar', 'Nomor kamar'), date('checkin', 'Tanggal check-in'), select('status', 'Status', ['Booking', 'Check-in', 'Check-out'])]),
  preset('travel', 'Travel & Tour', 'T', 'Atur perjalanan, penumpang, dan jadwal keberangkatan.', 'Pemesanan travel', [text('penumpang', 'Nama penumpang'), text('tujuan', 'Tujuan'), date('tanggal', 'Tanggal berangkat'), select('status', 'Status', ['Pesan', 'Lunas', 'Berangkat'])]),
  preset('logistics', 'Logistik', 'L', 'Pantau pengiriman dan status paket pelanggan.', 'Pengiriman', [text('pengirim', 'Nama pengirim'), text('tujuan', 'Tujuan'), text('resi', 'Nomor resi'), select('status', 'Status', ['Diterima', 'Transit', 'Terkirim'])]),
  preset('warehouse', 'Gudang', 'W', 'Kelola penerimaan dan pengeluaran barang gudang.', 'Pergerakan barang', [text('barang', 'Nama barang'), number('jumlah', 'Jumlah'), select('jenis', 'Jenis', ['Masuk', 'Keluar']), text('lokasi', 'Lokasi rak')]),
  preset('agriculture', 'Pertanian', 'A', 'Catat kegiatan kebun, panen, dan hasil produksi.', 'Kegiatan kebun', [text('tanaman', 'Jenis tanaman'), date('tanggal', 'Tanggal'), text('kegiatan', 'Kegiatan'), number('hasil', 'Hasil panen (kg)')]),
  preset('farm', 'Peternakan', 'P', 'Pantau ternak, pakan, dan hasil produksi.', 'Catatan ternak', [text('ternak', 'Jenis ternak'), text('kegiatan', 'Kegiatan'), number('jumlah', 'Jumlah'), date('tanggal', 'Tanggal')]),
  preset('petshop', 'Pet Shop', 'P', 'Kelola layanan hewan dan data pelanggan.', 'Layanan hewan', [text('pemilik', 'Nama pemilik'), text('hewan', 'Nama hewan'), text('layanan', 'Layanan'), select('status', 'Status', ['Booking', 'Diproses', 'Selesai'])]),
  preset('workshop', 'Bengkel', 'B', 'Kelola servis kendaraan dan pekerjaan mekanik.', 'Tiket servis', [text('pelanggan', 'Nama pelanggan'), text('kendaraan', 'Kendaraan'), text('keluhan', 'Keluhan'), select('status', 'Status', ['Masuk', 'Dikerjakan', 'Selesai'])]),
  preset('carwash', 'Car Wash', 'C', 'Atur antrean cuci kendaraan dan pembayaran.', 'Antrean cuci', [text('pelanggan', 'Nama pelanggan'), text('kendaraan', 'Kendaraan'), text('layanan', 'Paket cuci'), select('status', 'Status', ['Antre', 'Dicuci', 'Selesai'])]),
  preset('photography', 'Fotografi', 'F', 'Kelola booking sesi foto dan proyek klien.', 'Sesi foto', [text('klien', 'Nama klien'), text('paket', 'Paket foto'), date('tanggal', 'Tanggal sesi'), select('status', 'Status', ['Booking', 'Pemotretan', 'Selesai'])]),
  preset('realestate', 'Properti', 'P', 'Catat listing properti dan prospek pembeli.', 'Listing properti', [text('properti', 'Nama properti'), text('lokasi', 'Lokasi'), number('harga', 'Harga (Rp)'), select('status', 'Status', ['Tersedia', 'Dibooking', 'Terjual'])]),
  preset('construction', 'Konstruksi', 'K', 'Pantau proyek lapangan dan progres pekerjaan.', 'Progres proyek', [text('proyek', 'Nama proyek'), text('tugas', 'Pekerjaan'), number('progres', 'Progres (%)'), select('status', 'Status', ['Rencana', 'Berjalan', 'Selesai'])]),
  preset('legal', 'Kantor Hukum', 'H', 'Kelola perkara, klien, dan jadwal konsultasi.', 'Perkara', [text('klien', 'Nama klien'), text('perkara', 'Judul perkara'), date('tanggal', 'Tanggal'), select('status', 'Status', ['Baru', 'Berjalan', 'Selesai'])]),
  preset('hr', 'HR & Karyawan', 'H', 'Kelola data karyawan dan aktivitas kepegawaian.', 'Data karyawan', [text('nama', 'Nama karyawan'), text('jabatan', 'Jabatan'), text('divisi', 'Divisi'), select('status', 'Status', ['Aktif', 'Cuti', 'Nonaktif'])]),
  preset('recruitment', 'Rekrutmen', 'R', 'Pantau kandidat dan tahapan proses seleksi.', 'Kandidat', [text('nama', 'Nama kandidat'), text('posisi', 'Posisi dilamar'), text('kontak', 'Kontak'), select('tahap', 'Tahap', ['Masuk', 'Wawancara', 'Tes', 'Diterima'])]),
  preset('payroll', 'Payroll', 'P', 'Catat komponen gaji dan pembayaran karyawan.', 'Pembayaran gaji', [text('karyawan', 'Nama karyawan'), text('periode', 'Periode'), number('nominal', 'Nominal (Rp)'), select('status', 'Status', ['Draft', 'Dibayar'])]),
  preset('invoice', 'Invoice', 'I', 'Kelola tagihan dan status pembayaran pelanggan.', 'Invoice', [text('pelanggan', 'Nama pelanggan'), text('nomor', 'Nomor invoice'), number('total', 'Total (Rp)'), select('status', 'Status', ['Draft', 'Terkirim', 'Lunas'])]),
  preset('donation', 'Donasi', 'D', 'Catat donasi dan program penyaluran dana.', 'Donasi', [text('donatur', 'Nama donatur'), text('program', 'Program'), number('nominal', 'Nominal (Rp)'), date('tanggal', 'Tanggal')]),
  preset('cooperative', 'Koperasi', 'K', 'Kelola simpanan, pinjaman, dan anggota koperasi.', 'Transaksi koperasi', [text('anggota', 'Nama anggota'), select('jenis', 'Jenis transaksi', ['Simpanan', 'Pinjaman', 'Angsuran']), number('nominal', 'Nominal (Rp)'), date('tanggal', 'Tanggal')]),
  preset('library', 'Perpustakaan', 'P', 'Catat koleksi buku dan transaksi peminjaman.', 'Peminjaman buku', [text('peminjam', 'Nama peminjam'), text('buku', 'Judul buku'), date('pinjam', 'Tanggal pinjam'), select('status', 'Status', ['Dipinjam', 'Dikembalikan'])]),
  preset('school', 'Sekolah', 'S', 'Kelola siswa, kelas, dan aktivitas administrasi.', 'Data siswa', [text('nama', 'Nama siswa'), text('kelas', 'Kelas'), text('wali', 'Nama wali'), select('status', 'Status', ['Aktif', 'Nonaktif'])]),
  preset('course', 'Kursus', 'K', 'Atur peserta kursus, kelas, dan progres belajar.', 'Peserta kursus', [text('nama', 'Nama peserta'), text('program', 'Program kursus'), text('pengajar', 'Pengajar'), select('status', 'Status', ['Aktif', 'Selesai'])]),
  preset('pharmacy', 'Apotek', 'A', 'Kelola penjualan obat dan persediaan apotek.', 'Penjualan obat', [text('obat', 'Nama obat'), number('jumlah', 'Jumlah'), number('total', 'Total (Rp)'), select('status', 'Status', ['Terjual', 'Retur'])]),
  preset('dental', 'Klinik Gigi', 'G', 'Atur pasien dan jadwal perawatan gigi.', 'Kunjungan pasien', [text('pasien', 'Nama pasien'), text('layanan', 'Perawatan'), date('tanggal', 'Tanggal'), select('status', 'Status', ['Booking', 'Diperiksa', 'Selesai'])]),
  preset('catering', 'Catering', 'C', 'Kelola pesanan makanan dan jadwal pengantaran.', 'Pesanan catering', [text('pelanggan', 'Nama pelanggan'), text('paket', 'Paket catering'), date('tanggal', 'Tanggal kirim'), select('status', 'Status', ['Pesan', 'Dimasak', 'Dikirim'])]),
  preset('delivery', 'Delivery Order', 'D', 'Pantau order antar dan kurir pengiriman.', 'Order pengantaran', [text('pelanggan', 'Nama pelanggan'), text('alamat', 'Alamat tujuan'), text('kurir', 'Nama kurir'), select('status', 'Status', ['Baru', 'Diantar', 'Terkirim'])]),
  preset('marketplace', 'Marketplace Seller', 'M', 'Kelola order dari marketplace dan pengiriman.', 'Order marketplace', [text('marketplace', 'Marketplace'), text('produk', 'Produk'), number('total', 'Total (Rp)'), select('status', 'Status', ['Masuk', 'Dikemas', 'Dikirim'])]),
  preset('membership', 'Membership', 'M', 'Kelola anggota dan masa aktif keanggotaan.', 'Anggota', [text('nama', 'Nama anggota'), text('paket', 'Paket'), date('berlaku', 'Berlaku sampai'), select('status', 'Status', ['Aktif', 'Berakhir'])]),
  preset('survey', 'Survey & Feedback', 'S', 'Kumpulkan jawaban survey dan masukan pelanggan.', 'Respon survey', [text('responden', 'Nama responden'), text('topik', 'Topik survey'), select('nilai', 'Penilaian', ['Sangat baik', 'Baik', 'Cukup', 'Kurang']), text('catatan', 'Catatan')]),
  preset('complaint', 'Pengaduan', 'P', 'Kelola laporan pengaduan dan tindak lanjut.', 'Pengaduan', [text('pelapor', 'Nama pelapor'), text('topik', 'Topik pengaduan'), text('detail', 'Detail'), select('status', 'Status', ['Baru', 'Diproses', 'Selesai'])]),
  preset('helpdesk', 'Helpdesk IT', 'I', 'Kelola tiket bantuan dan penyelesaian masalah.', 'Tiket bantuan', [text('pelapor', 'Nama pelapor'), text('masalah', 'Masalah'), select('prioritas', 'Prioritas', ['Rendah', 'Sedang', 'Tinggi']), select('status', 'Status', ['Baru', 'Diproses', 'Selesai'])]),
  preset('parking', 'Parkir', 'P', 'Catat kendaraan masuk dan keluar area parkir.', 'Aktivitas parkir', [text('plat', 'Nomor plat'), select('jenis', 'Jenis kendaraan', ['Motor', 'Mobil']), date('tanggal', 'Tanggal'), select('status', 'Status', ['Masuk', 'Keluar'])]),
  preset('security', 'Keamanan', 'K', 'Catat patroli dan laporan keamanan harian.', 'Laporan keamanan', [text('petugas', 'Nama petugas'), text('lokasi', 'Lokasi'), text('kejadian', 'Catatan kejadian'), select('status', 'Status', ['Aman', 'Perlu tindak lanjut'])]),
  preset('community', 'Komunitas', 'K', 'Kelola anggota, kegiatan, dan agenda komunitas.', 'Kegiatan komunitas', [text('kegiatan', 'Nama kegiatan'), date('tanggal', 'Tanggal'), text('penanggungJawab', 'Penanggung jawab'), select('status', 'Status', ['Rencana', 'Berjalan', 'Selesai'])]),
  preset('posyandu', 'Posyandu', 'P', 'Catat layanan balita dan kegiatan kesehatan warga.', 'Kunjungan balita', [text('nama', 'Nama balita'), text('wali', 'Nama wali'), number('berat', 'Berat badan (kg)'), date('tanggal', 'Tanggal')])
];

EXTRA_TEMPLATES.forEach(function(template) { PROFILES[template.id] = template; });

function defaultModules(profile) {
  return [
    { id: 'utama', name: profile.recordLabel, icon: profile.icon, fields: profile.fields },
    { id: 'aktivitas', name: 'Aktivitas', icon: '+', fields: [text('judul', 'Judul aktivitas'), text('catatan', 'Catatan'), select('status', 'Status', ['Baru', 'Diproses', 'Selesai'])] },
    { id: 'laporan', name: 'Laporan', icon: '#', adminOnly: true, fields: [text('periode', 'Periode'), text('ringkasan', 'Ringkasan laporan')] }
  ];
}

function withSaasModules(modules) {
  const result = modules.slice();
  if (!result.some(module => module.id === 'pembayaran')) {
    result.push({ id: 'pembayaran', name: 'Pembayaran', icon: 'Rp', adminOnly: true, fields: [text('referensi', 'Referensi transaksi'), number('nominal', 'Nominal (Rp)'), select('metode', 'Metode pembayaran', ['Tunai', 'QRIS', 'Transfer', 'Kartu']), select('status', 'Status pembayaran', ['Menunggu', 'DP', 'Lunas', 'Dibatalkan'])] });
  }
  if (!result.some(module => module.id === 'pengaturan')) {
    result.push({ id: 'pengaturan', name: 'Pengaturan Harga', icon: '$', adminOnly: true, fields: [text('nama', 'Nama layanan / produk'), number('harga', 'Harga (Rp)'), text('satuan', 'Satuan'), select('status', 'Status', ['Aktif', 'Nonaktif'])] });
  }
  return result;
}

export const PROJECT_TYPE_CHOICES = Object.entries(PROFILES).map(([value, profile]) => ({ name: profile.name, value }));

export function getProjectProfile(type) {
  const profile = PROFILES[type] || PROFILES.attendance;
  return {
    id: type,
    ...profile,
    modules: withSaasModules(MODULES_BY_TYPE[type] || defaultModules(profile))
  };
}
