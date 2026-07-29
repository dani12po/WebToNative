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

  const pairingArgs = pairing ? `--url ${typeof window !== 'undefined' ? window.location.origin : 'URL_DASHBOARD'} --code ${pairing.code}` : '';
  const agentEndpoint = typeof window !== 'undefined' ? `${window.location.origin}/api/agent-download` : 'URL_DASHBOARD/api/agent-download';
  const command = pairing ? `$endpoint = '${agentEndpoint}'; $meta = Invoke-RestMethod -Uri "${agentEndpoint}?meta=1" -ErrorAction Stop; if (-not $meta.fileName -or -not $meta.sha256) { throw 'Metadata WebToNative Agent tidak lengkap.' }; $agent = Join-Path $PWD $meta.fileName; Invoke-WebRequest -Uri $endpoint -OutFile $agent -ErrorAction Stop; if ((Get-FileHash $agent -Algorithm SHA256).Hash.ToLower() -ne $meta.sha256.ToLower()) { Remove-Item $agent -Force; throw 'Checksum WebToNative Agent tidak cocok.' }; & $agent connect ${pairingArgs}` : '';
  const resumeCommand = '.\\WebToNative-Agent.cmd';

  async function copyCommand(value) {
    try {
      await navigator.clipboard.writeText(String(value || ''));
      setMessage('Perintah disalin.');
    } catch {
      setMessage('Salin perintah secara manual dari kotak di bawah.');
    }
  }

  return <section className="connect-card">
    <p className="eyebrow">CLI Local</p>
    <details className="cli-setup">
      <summary>Belum punya WebToNative Agent?</summary>
      <p>Buka PowerShell di folder pilihan Anda lalu salin perintah pairing. Perintah otomatis mengunduh agent dari dashboard, memverifikasi SHA-256, dan menjalankannya tanpa clone source core.</p>
    </details>
    <details className="cli-resume">
      <summary>Sudah pernah terhubung?</summary>
      <p>Jika agent berhenti karena tidak ada job selama 10 menit, jalankan kembali dari folder yang sama. Tidak perlu pairing atau login ulang.</p>
      <button type="button" className="resume-command" onClick={() => copyCommand(resumeCommand)} title="Klik untuk menyalin perintah menjalankan ulang agent"><code>{resumeCommand}</code><span aria-hidden="true">⧉</span></button>
    </details>
    <p className="copy-hint">Click to copy</p>
    {!pairing ? <button type="button" className="outline full" onClick={createCode}>Coba buat kode lagi</button> : <div className="pairing"><div className="pairing-command"><input aria-label="Perintah pairing CLI" readOnly value={command} onClick={() => copyCommand(command)} onDoubleClick={(event) => event.currentTarget.select()} title="Klik untuk menyalin, klik dua kali untuk memilih semua" /><button type="button" onClick={() => copyCommand(command)} title="Salin perintah ke clipboard" aria-label="Salin perintah">⧉</button></div><div className="pairing-code"><b>{pairing.code}</b><small>Berlaku hingga {new Intl.DateTimeFormat('id-ID', { timeStyle: 'short' }).format(new Date(pairing.expiresAt))}</small></div><div className="pairing-actions"><button type="button" className="outline" onClick={createCode}>Kode baru</button><a className="outline pairing-docs" href="/docs#implementasi">Docs</a></div></div>}
    {message && <small className="message">{message}</small>}
  </section>;
}
