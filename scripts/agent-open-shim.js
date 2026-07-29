// Agent menerima job setelah autentikasi layanan selesai. Pembukaan browser
// interaktif bukan bagian dari proses background binary.
export default async function openFromAgent() {
  throw new Error('Aksi yang membutuhkan browser tidak tersedia pada WebToNative Agent. Hubungkan layanan dari dashboard atau CLI pengaturan.');
}
