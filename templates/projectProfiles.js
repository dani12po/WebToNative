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

const MODULES_BY_TYPE = {
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

export const PROJECT_TYPE_CHOICES = Object.entries(PROFILES).map(([value, profile]) => ({ name: profile.name, value }));

export function getProjectProfile(type) {
  const profile = PROFILES[type] || PROFILES.attendance;
  return {
    id: type,
    ...profile,
    modules: MODULES_BY_TYPE[type] || [{ id: 'utama', name: profile.recordLabel, icon: profile.icon, fields: profile.fields }]
  };
}
