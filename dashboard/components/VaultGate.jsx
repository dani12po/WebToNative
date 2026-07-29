'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { decryptVaultDocument, encryptVaultDocument, generateRecoveryKey, hashRecoveryKey, validateVaultPassword } from '../lib/vault-client';

const VaultContext = createContext(null);
const EMPTY_VAULT = Object.freeze({ projects: [], aiProviders: [] });
// Hanya RAM pada tab browser saat ini. Tidak ada Master Password, plaintext,
// atau kunci yang ditulis ke localStorage/sessionStorage/cookie.
let activeVaultSession = null;

export function clearVaultSession() {
  activeVaultSession = null;
}

export function useVault() {
  const value = useContext(VaultContext);
  if (!value) throw new Error('useVault harus dipakai di dalam VaultProvider.');
  return value;
}

// Gate ini sengaja tidak merender dashboard sampai vault dibuka. Plaintext hanya
// disimpan pada React state (RAM) dan hilang ketika tab direload/ditutup.
export default function VaultProvider({ session, children }) {
  const [mode, setMode] = useState('checking'); // checking | create | recovery-key | locked | recover | reset | unlocked | error
  const [remotePayload, setRemotePayload] = useState(null);
  const [vault, setVault] = useState(null);
  const [sessionPassword, setSessionPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [recoveryKey, setRecoveryKey] = useState('');
  const [recoveryInput, setRecoveryInput] = useState('');
  const [resetTicket, setResetTicket] = useState('');
  const [recoveryAcknowledged, setRecoveryAcknowledged] = useState(false);
  const [message, setMessage] = useState('Memeriksa brankas terenkripsi…');
  const [busy, setBusy] = useState(false);
  const headers = useMemo(() => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }), [session.access_token]);
  const updateVault = (nextValue) => {
    setVault((current) => {
      const next = typeof nextValue === 'function' ? nextValue(current) : nextValue;
      activeVaultSession = { userId: session.user.id, vault: next, masterPassword: activeVaultSession?.userId === session.user.id ? activeVaultSession.masterPassword : '' };
      return next;
    });
  };

  useEffect(() => {
    let active = true;
    async function checkVault() {
      try {
        if (activeVaultSession?.userId === session.user.id && activeVaultSession.vault) {
          setVault(activeVaultSession.vault);
          setSessionPassword(activeVaultSession.masterPassword || '');
          setMode('unlocked');
          setMessage('');
          return;
        }
        const response = await fetch('/api/vault', { headers: { Authorization: headers.Authorization }, cache: 'no-store' });
        const data = await response.json();
        if (!active) return;
        if (response.status === 404) {
          setMode('create');
          setMessage('Belum ada brankas. Buat Master Password untuk mengenkripsi backup pertama Anda.');
          return;
        }
        if (!response.ok) throw new Error(data.error || 'Brankas tidak dapat diperiksa.');
        setRemotePayload(data.vault.payload);
        setMode('locked');
        setMessage('Brankas terenkripsi ditemukan. Masukkan Master Password untuk membuka data secara lokal.');
      } catch (error) {
        if (active) { setMode('error'); setMessage(error.message || 'Brankas tidak dapat diperiksa.'); }
      }
    }
    checkVault();
    return () => { active = false; };
  }, [headers.Authorization]);

  async function unlock() {
    setBusy(true); setMessage('Mendekripsi di perangkat ini…');
    try {
      const document = await decryptVaultDocument(remotePayload, password, session.user.id);
      updateVault({ ...EMPTY_VAULT, ...document });
      setSessionPassword(password);
      activeVaultSession = { userId: session.user.id, vault: { ...EMPTY_VAULT, ...document }, masterPassword: password };
      setPassword('');
      setMode('unlocked');
    } catch (error) { setMessage(error.message || 'Master Password tidak dapat membuka vault.'); }
    finally { setBusy(false); }
  }

  async function createVault() {
    const passwordError = validateVaultPassword(password);
    if (passwordError) return setMessage(passwordError);
    if (password !== confirm) return setMessage('Konfirmasi Master Password tidak sama.');
    setBusy(true); setMessage('Membuat ciphertext di browser…');
    try {
      const document = { ...EMPTY_VAULT, createdAt: new Date().toISOString() };
      const nextRecoveryKey = generateRecoveryKey();
      const payload = await encryptVaultDocument(document, password, session.user.id);
      const response = await fetch('/api/vault', { method: 'PUT', headers, body: JSON.stringify({ payload, recoveryKeyHash: await hashRecoveryKey(nextRecoveryKey) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Vault tidak dapat disimpan.');
      setRemotePayload(payload); updateVault(document); setSessionPassword(password); activeVaultSession = { userId: session.user.id, vault: document, masterPassword: password }; setRecoveryKey(nextRecoveryKey);
      setPassword(''); setConfirm('');
      setMode('recovery-key');
    } catch (error) { setMessage(error.message || 'Vault tidak dapat dibuat.'); }
    finally { setBusy(false); }
  }

  async function verifyRecovery() {
    setBusy(true); setMessage('Memverifikasi Recovery Key…');
    try {
      const response = await fetch('/api/vault/recovery/verify', { method: 'POST', headers, body: JSON.stringify({ recoveryKeyHash: await hashRecoveryKey(recoveryInput) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Recovery Key tidak valid.');
      setResetTicket(data.resetTicket); setRecoveryInput(''); setPassword(''); setConfirm(''); setMode('reset');
      setMessage('Recovery Key valid. Buat Master Password baru untuk mengganti vault lama.');
    } catch (error) { setMessage(error.message || 'Recovery Key tidak dapat diverifikasi.'); }
    finally { setBusy(false); }
  }

  async function resetVault() {
    const passwordError = validateVaultPassword(password);
    if (passwordError) return setMessage(passwordError);
    if (password !== confirm) return setMessage('Konfirmasi Master Password tidak sama.');
    setBusy(true); setMessage('Mengenkripsi vault baru di browser…');
    try {
      const document = { ...EMPTY_VAULT, recoveredAt: new Date().toISOString() };
      const nextRecoveryKey = generateRecoveryKey();
      const payload = await encryptVaultDocument(document, password, session.user.id);
      const response = await fetch('/api/vault/recovery/reset', { method: 'POST', headers, body: JSON.stringify({ resetTicket, payload, recoveryKeyHash: await hashRecoveryKey(nextRecoveryKey) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Reset vault gagal.');
      updateVault(document); setSessionPassword(password); activeVaultSession = { userId: session.user.id, vault: document, masterPassword: password }; setRemotePayload(payload); setRecoveryKey(nextRecoveryKey); setRecoveryAcknowledged(false);
      setPassword(''); setConfirm(''); setResetTicket(''); setMode('recovery-key');
      setMessage('Vault lama dihapus permanen. Simpan Recovery Key baru Anda.');
    } catch (error) { setMessage(error.message || 'Reset vault gagal.'); }
    finally { setBusy(false); }
  }

  async function copyRecoveryKey() {
    try { await navigator.clipboard.writeText(recoveryKey); setMessage('Recovery Key disalin. Simpan di password manager atau tempat aman.'); }
    catch { setMessage('Salin Recovery Key secara manual dari kotak di atas.'); }
  }
  function downloadRecoveryKey() {
    const blob = new Blob([`WebToNative Recovery Key\n\n${recoveryKey}\n\nSimpan secara offline. Recovery Key hanya dapat mereset vault; tidak dapat membuka data lama.\n`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'webtonative-recovery-key.txt'; link.click(); URL.revokeObjectURL(url); setMessage('Dokumen Recovery Key diunduh.');
  }

  async function saveVaultDocument(nextDocument) {
    const masterPassword = sessionPassword || activeVaultSession?.masterPassword;
    if (!masterPassword) throw new Error('Brankas perlu dibuka ulang sebelum perubahan dapat disimpan.');
    const payload = await encryptVaultDocument(nextDocument, masterPassword, session.user.id);
    const response = await fetch('/api/vault', { method: 'PUT', headers, body: JSON.stringify({ payload }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Backup vault gagal disimpan.');
    setRemotePayload(payload);
    updateVault(nextDocument);
    activeVaultSession = { userId: session.user.id, vault: nextDocument, masterPassword };
    return data;
  }

  const context = useMemo(() => ({ vault, setVault: updateVault, saveVaultDocument, isUnlocked: mode === 'unlocked' }), [vault, mode, session.user.id, sessionPassword]);
  if (mode === 'unlocked') return <VaultContext.Provider value={context}>{children}</VaultContext.Provider>;

  return <main className="vault-gate-shell" aria-busy={mode === 'checking'}>
    <section className="vault-gate-card" role={mode === 'locked' || mode === 'create' ? 'dialog' : undefined} aria-modal={mode === 'locked' || mode === 'create' ? 'true' : undefined} aria-label="Brankas Master Password">
      <div className="vault-gate-lock" aria-hidden="true">⌑</div>
      <p className="eyebrow">BRANKAS PERANGKAT</p>
      <h1>{mode === 'create' ? 'Buat Master Password' : mode === 'recovery-key' ? 'Simpan Recovery Key' : mode === 'recover' ? 'Pulihkan akses vault' : mode === 'reset' ? 'Reset brankas terenkripsi' : mode === 'locked' ? 'Buka brankas Anda' : 'Menyiapkan brankas'}</h1>
      <p>{mode === 'create' ? 'Master Password hanya dipakai untuk mengenkripsi data di browser. Nilainya tidak dikirim ke WebToNative.' : mode === 'recovery-key' ? 'Kunci ini ditampilkan satu kali. Tanpanya, vault tidak dapat direset jika Master Password terlupa.' : mode === 'recover' ? 'Recovery Key hanya mengizinkan reset. Ia tidak dapat mendekripsi ciphertext lama.' : mode === 'reset' ? 'Tindakan ini permanen: seluruh isi vault lama akan dihapus dan tidak dapat dipulihkan.' : 'Dashboard baru akan dimuat setelah data brankas berhasil didekripsi secara lokal.'}</p>
      {mode === 'checking' && <div className="vault-spinner" aria-label="Memeriksa vault" />}
      {(mode === 'create' || mode === 'locked') && <form onSubmit={(event) => { event.preventDefault(); mode === 'create' ? createVault() : unlock(); }}>
        <label>Master Password<input type="password" autoComplete={mode === 'create' ? 'new-password' : 'current-password'} minLength="8" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        {mode === 'create' && <><p className="vault-password-hint">Minimal 8 karakter, dengan huruf besar, angka, dan simbol.</p><label>Konfirmasi Master Password<input type="password" autoComplete="new-password" minLength="8" required value={confirm} onChange={(event) => setConfirm(event.target.value)} /></label></>}
        <button className="primary" type="submit" disabled={busy}>{busy ? 'Memproses…' : mode === 'create' ? 'Buat & kunci brankas' : 'Buka & sinkronkan'} <span>→</span></button>
        {mode === 'locked' && <button className="vault-forgot" type="button" onClick={() => { setMode('recover'); setMessage('Masukkan Recovery Key untuk memulai reset vault.'); }}>Lupa Master Password?</button>}
      </form>}
      {mode === 'recover' && <form onSubmit={(event) => { event.preventDefault(); verifyRecovery(); }}><label>Recovery Key<input autoComplete="off" required placeholder="Contoh: ABCD-EFGH-IJKL-MNOP-…" value={recoveryInput} onChange={(event) => setRecoveryInput(event.target.value)} /></label><button className="primary" type="submit" disabled={busy}>{busy ? 'Memverifikasi…' : 'Verifikasi Recovery Key'} <span>→</span></button><button className="vault-forgot" type="button" onClick={() => setMode('locked')}>Kembali ke Master Password</button></form>}
      {mode === 'reset' && <form onSubmit={(event) => { event.preventDefault(); resetVault(); }}><label>Master Password baru<input type="password" autoComplete="new-password" minLength="8" required value={password} onChange={(event) => setPassword(event.target.value)} /></label><p className="vault-password-hint">Minimal 8 karakter, dengan huruf besar, angka, dan simbol.</p><label>Konfirmasi Master Password<input type="password" autoComplete="new-password" minLength="8" required value={confirm} onChange={(event) => setConfirm(event.target.value)} /></label><button className="primary" type="submit" disabled={busy}>{busy ? 'Mereset…' : 'Hapus vault lama & buat baru'} <span>→</span></button></form>}
      {mode === 'recovery-key' && <div className="recovery-key-card"><code>{recoveryKey}</code><div><button className="outline" type="button" onClick={copyRecoveryKey}>Salin</button><button className="outline" type="button" onClick={downloadRecoveryKey}>Unduh .txt</button></div><label className="recovery-check"><input type="checkbox" checked={recoveryAcknowledged} onChange={(event) => setRecoveryAcknowledged(event.target.checked)} /><span>Saya sudah menyimpan Recovery Key ini di tempat aman.</span></label><button className="primary" type="button" disabled={!recoveryAcknowledged} onClick={() => { setRecoveryKey(''); setMode('unlocked'); }}>Lanjutkan ke dashboard <span>→</span></button></div>}
      {mode === 'error' && <button className="outline" type="button" onClick={() => window.location.reload()}>Coba lagi</button>}
      <p className="vault-gate-message" role="status">{message}</p>
      <small>OAuth Google dan Vercel tidak disimpan di vault. Login resmi tetap diperlukan pada setiap komputer.</small>
    </section>
  </main>;
}
