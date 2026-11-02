'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    if (password.length < 8) return setMessage('Password must contain at least 8 characters.');
    if (password !== confirmation) return setMessage('Passwords do not match.');
    setLoading(true);
    try {
      const { error } = await createClient().auth.updateUser({ password });
      if (error) throw error;
      setPassword('');
      setConfirmation('');
      setMessage('Password updated successfully. You can now sign in.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The recovery link is invalid or expired. Request a new one.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 440, margin: '80px auto', padding: 24 }}>
      <h1>Choose a new password</h1>
      <p>Open this page from the recovery link sent to your email.</p>
      <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
        <label>New password<input type="password" minLength={8} autoComplete="new-password" required value={password} onChange={e => setPassword(e.target.value)} /></label>
        <label>Confirm password<input type="password" minLength={8} autoComplete="new-password" required value={confirmation} onChange={e => setConfirmation(e.target.value)} /></label>
        <button type="submit" disabled={loading}>{loading ? 'Updating…' : 'Update password'}</button>
      </form>
      {message && <p role="status">{message}</p>}
    </main>
  );
}
