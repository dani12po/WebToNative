'use client';

import { useEffect, useState } from 'react';

export default function ConnectCli({ token }) {
  const [pairing, setPairing] = useState(null);
  const [message, setMessage] = useState('');

  async function createCode() {
    setMessage('Membuat kode koneksi…');
    try {
      const response = await fetch('/api/agents/pair', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const payload = await response.json();
      if (!response.ok) return setMessage(payload.error || 'Kode tidak dapat dibuat.');
      setPairing(payload);
      setMessage('Kode siap digunakan di terminal komputer Anda.');
    } catch {
      setMessage('Tidak dapat menghubungi API pairing. Pastikan dashboard masih berjalan.');
    }
  }

  useEffect(() => { createCode(); }, []);

  const command = pairing ? `npm run connect-web -- --url ${typeof window !== 'undefined' ? window.location.origin : 'URL_DASHBOARD'} --code ${pairing.code}` : '';

  async function copyCommand() {
    try {
      await navigator.clipboard.writeText(command);
      setMessage('Perintah sudah disalin. Tempelkan ke terminal di folder tools.');
    } catch {
      setMessage('Salin perintah secara manual dari kotak di bawah.');
    }
  }

  return <section className="connect-card">
    <p className="eyebrow">CLI LOKAL</p>
    <h2>Hubungkan komputer ini</h2>
    <p>Gunakan kode sekali pakai agar CLI lokal dapat mengambil job dari dashboard.</p>
    <ol className="connect-steps"><li>Buka terminal pada folder <code>WebToNative</code>.</li><li>Jalankan perintah pairing di bawah.</li><li>CLI langsung menunggu job milik akun ini hingga 10 menit.</li></ol>
    {!pairing ? <button type="button" className="outline full" onClick={createCode}>Coba buat kode lagi</button> : <div className="pairing"><b>{pairing.code}</b><small>Berlaku hingga {new Intl.DateTimeFormat('id-ID', { timeStyle: 'short' }).format(new Date(pairing.expiresAt))}</small><code>{command}</code><div className="pairing-actions"><button type="button" className="primary" onClick={copyCommand}>Salin perintah</button><button type="button" className="outline" onClick={createCode}>Kode baru</button></div></div>}
    {message && <small className="message">{message}</small>}
  </section>;
}
