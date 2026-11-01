'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Camera,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Database,
  RefreshCw,
  Users,
  Check,
  UserCheck,
} from 'lucide-react';

export type ScanOutcome = 'idle' | 'success' | 'already_checked_in' | 'invalid';

export interface ScanResult {
  outcome: ScanOutcome;
  message: string;
  name?: string;
  regNum?: string;
  teamName?: string;
  isTeam?: boolean;
  teamMembers?: Array<{ name: string; email: string; reg_number?: string; checked_in?: boolean }>;
  timestamp: string;
  offline?: boolean;
  hashPayload?: string;
}

interface QRScannerProps {
  eventId: string;
  eventTitle?: string;
}

// Simple IndexedDB Helper
const DB_NAME = 'msc_scanner_db';
const DB_VERSION = 2;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      // Rebuild the disposable cache so legacy global keys cannot cross event boundaries.
      if (db.objectStoreNames.contains('cached_registrations')) db.deleteObjectStore('cached_registrations');
      const cacheStore = db.createObjectStore('cached_registrations', { keyPath: ['event_id', 'hash_payload'] });
      cacheStore.createIndex('event_id', 'event_id', { unique: false });
      if (!db.objectStoreNames.contains('offline_queue')) {
        db.createObjectStore('offline_queue', { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export default function QRScanner({ eventId, eventTitle }: QRScannerProps) {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [cachedCount, setCachedCount] = useState(0);
  const [pendingQueueCount, setPendingQueueCount] = useState(0);
  const [cachingInProgress, setCachingInProgress] = useState(false);
  const [syncingInProgress, setSyncingInProgress] = useState(false);
  const [teamModalData, setTeamModalData] = useState<ScanResult | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;

  // Serialized scanner lifecycle queue to prevent "Cannot stop, scanner is not running or paused"
  const scanOpsRef = useRef<Promise<void>>(Promise.resolve());
  const enqueueScanOp = useCallback((fn: () => Promise<void>) => {
    scanOpsRef.current = scanOpsRef.current.then(fn, fn);
    return scanOpsRef.current;
  }, []);

  // Audio and Haptic Synthesizer
  const playFeedback = useCallback((outcome: ScanOutcome) => {
    // Haptic feedback
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        if (outcome === 'success') {
          navigator.vibrate([100]);
        } else if (outcome === 'already_checked_in') {
          navigator.vibrate([200, 100, 200]);
        } else {
          navigator.vibrate([400]);
        }
      } catch {
        // Ignored if unsupported
      }
    }

    // Audio cue - use ref to get current soundEnabled value
    if (!soundEnabledRef.current || typeof window === 'undefined') return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (outcome === 'success') {
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 high ding
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      } else if (outcome === 'already_checked_in') {
        osc.frequency.setValueAtTime(440, audioCtx.currentTime); // A4 double tone
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
      } else {
        osc.frequency.setValueAtTime(220, audioCtx.currentTime); // A3 error buzz
        gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      }
    } catch {
      // Audio autoplay restrictions
    }
  }, []);

  // Check counts in IndexedDB
  const updateDBCounts = useCallback(async () => {
    try {
      const db = await openDB();
      const countRegs = new Promise<number>((res) => {
        const tx = db.transaction('cached_registrations', 'readonly');
        const store = tx.objectStore('cached_registrations');
        const countReq = store.count();
        countReq.onsuccess = () => res(countReq.result);
      });
      const countQueue = new Promise<number>((res) => {
        const tx = db.transaction('offline_queue', 'readonly');
        const store = tx.objectStore('offline_queue');
        const countReq = store.count();
        countReq.onsuccess = () => res(countReq.result);
      });
      const [rCount, qCount] = await Promise.all([countRegs, countQueue]);
      setCachedCount(rCount);
      setPendingQueueCount(qCount);
    } catch {
      // IndexedDB not ready
    }
  }, []);

  // Cache Registrations for offline use
  const cacheRegistrations = async () => {
    setCachingInProgress(true);
    try {
      const res = await fetch(`/api/admin/registrations?event_id=${encodeURIComponent(eventId)}&limit=1000`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Could not download registrations (HTTP ${res.status}).`);
      const data = await res.json();
      if (!Array.isArray(data.registrations)) throw new Error('Registration response was incomplete.');
      const records: any[] = data.registrations;
      if (typeof data.total_count === 'number' && data.total_count > records.length) throw new Error('Only part of this event roster was returned. Offline caching is disabled until pagination is implemented.');

      const db = await openDB();
      const tx = db.transaction('cached_registrations', 'readwrite');
      const store = tx.objectStore('cached_registrations');
      // Replace this event's snapshot only after a complete server response.
      const cursorRequest = store.index('event_id').openCursor(IDBKeyRange.only(eventId));
      cursorRequest.onsuccess = () => {
        const cursor = cursorRequest.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
          return;
        }
        records.forEach((rec) => {
          store.put({
          hash_payload: rec.hash_payload || rec.id,
          event_id: eventId,
          lead_name: rec.lead_name || rec.name,
          reg_number: rec.reg_number || rec.registration_number,
          team_name: rec.team_name || '',
          team_members: (rec.team_members || []).map((member: any, index: number) => ({
            ...member,
            id: `${rec.id}-m-${index}`,
            name: member.fullName || member.name || 'Team member',
            email: member.email || '',
            reg_number: member.regNum || member.reg_number || member.registration_number || '',
            checked_in: Boolean(member.checked_in),
          })),
          checked_in: rec.checked_in || false,
          checked_in_at: rec.checked_in_at || null,
          });
        });
      };

      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
      await updateDBCounts();
    } catch (err) {
      console.error('Failed to cache registrations:', err);
    } finally {
      setCachingInProgress(false);
    }
  };

  // Sync Offline Queue to server
  const syncOfflineQueue = useCallback(async () => {
    if (!navigator.onLine) return;
    setSyncingInProgress(true);
    try {
      const db = await openDB();
      const tx = db.transaction('offline_queue', 'readonly');
      const store = tx.objectStore('offline_queue');
      const request = store.getAll();

      const items: any[] = await new Promise((resolve) => {
        request.onsuccess = () => resolve(request.result || []);
      });

      if (items.length === 0) {
        setSyncingInProgress(false);
        return;
      }

      for (const item of items) {
        try {
          const res = await fetch('/api/admin/checkin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event_id: item.event_id,
              hash_payload: item.hash_payload,
              team_mode: item.team_mode,
              member_id: item.member_id,
            }),
          });
          const data = await res.json().catch(() => ({}));
          if (res.ok && (data.success || data.already_checked_in)) {
            const deleteTx = db.transaction('offline_queue', 'readwrite');
            deleteTx.objectStore('offline_queue').delete(item.id);
            await new Promise<void>((resolve, reject) => {
              deleteTx.oncomplete = () => resolve();
              deleteTx.onerror = () => reject(deleteTx.error);
              deleteTx.onabort = () => reject(deleteTx.error);
            });
          }
        } catch {
          // Keep in queue for next sync
        }
      }
      await updateDBCounts();
    } catch (err) {
      console.error('Offline queue sync error:', err);
    } finally {
      setSyncingInProgress(false);
    }
  }, [updateDBCounts]);

  // Online / Offline listener
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineQueue();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    updateDBCounts();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncOfflineQueue, updateDBCounts]);

  const onScanSuccessRef = useRef<(decodedText: string) => Promise<void>>(() => Promise.resolve());

  // Camera Scanner Lifecycle
  const startScanner = useCallback(async () => {
    try {
      const html5QrCode = new Html5Qrcode('qr-reader');
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText: string) => onScanSuccessRef.current(decodedText),
        () => {}
      );
    } catch (err) {
      console.error('Failed to start camera scanner:', err);
    }
  }, []);

  const stopScanner = useCallback(async () => {
    if (!scannerRef.current) {
      return;
    }
    // Only call stop() if the scanner is actually running
    try {
      // Html5Qrcode.getState() can tell us if it's running
      const state = (scannerRef.current as any).getState?.();
      if (state === 2) { // Html5QrcodeScannerState.SCANNING = 2
        await scannerRef.current.stop();
      }
    } catch (err) {
      console.warn('Error stopping scanner (may already be stopped):', err);
    } finally {
      scannerRef.current.clear?.(); // release camera even if stop() threw
      scannerRef.current = null;
    }
  }, []);

  useEffect(() => {
    enqueueScanOp(startScanner);
    return () => {
      enqueueScanOp(stopScanner);
    };
  }, [enqueueScanOp, startScanner, stopScanner]);

  // Process a Scanned Code
  const processCheckin = useCallback(async (hash: string, teamMode?: 'all' | 'lead_only') => {
    let result: ScanResult;

    // Resolve team details without changing attendance. The operator must choose
    // a team action before the first check-in mutation is sent.
    if (navigator.onLine && !teamMode) {
      try {
        const previewRes = await fetch('/api/admin/checkin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event_id: eventId, hash_payload: hash, preview: true }),
        });
        const preview = await previewRes.json();
        if (!previewRes.ok || !preview.success) {
          result = { outcome: 'invalid', message: preview.error || 'Ticket could not be verified.', timestamp: new Date().toLocaleTimeString(), hashPayload: hash };
          setScanResult(result);
          setRecentScans((prev) => [result, ...prev.slice(0, 9)]);
          playFeedback('invalid');
          return;
        }
        if (preview.is_team && (preview.team_members?.length || 0) > 1) {
          result = {
            outcome: 'idle',
            message: 'Team verified. Select who should be checked in.',
            name: preview.participant_name || 'Participant',
            regNum: preview.registration_number,
            teamName: preview.team_name,
            isTeam: true,
            teamMembers: preview.team_members || [],
            timestamp: new Date().toLocaleTimeString(),
            hashPayload: hash,
          };
          setScanResult(result);
          setTeamModalData(result);
          return;
        }
      } catch {
        // Network failure falls through to the event-scoped offline cache.
      }
    }

    // 1. Try Online API if network is available
    if (navigator.onLine) {
      try {
        const res = await fetch('/api/admin/checkin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_id: eventId,
            hash_payload: hash,
            team_mode: teamMode,
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          result = {
            outcome: 'invalid',
            message: data.error || 'Invalid or unverified ticket identifier.',
            timestamp: new Date().toLocaleTimeString(),
            hashPayload: hash,
          };
        } else if (data.already_checked_in) {
          result = {
            outcome: 'already_checked_in',
            message: `Already Checked In at ${data.checked_in_at || 'prior turnstile'}`,
            name: data.participant_name || 'Participant',
            regNum: data.registration_number,
            teamName: data.team_name,
            timestamp: new Date().toLocaleTimeString(),
            hashPayload: hash,
          };
        } else {
          result = {
            outcome: 'success',
            message: 'Admission Check-in Confirmed!',
            name: data.participant_name || 'Participant',
            regNum: data.registration_number,
            teamName: data.team_name,
            isTeam: Boolean(data.team_name),
            teamMembers: data.team_members || [],
            timestamp: new Date().toLocaleTimeString(),
            hashPayload: hash,
          };
        }

        setScanResult(result);
        playFeedback(result.outcome);
        setRecentScans((prev) => [result, ...prev.slice(0, 9)]);

        // If team detected and no mode specified, prompt team modal
        if (result.outcome === 'success' && result.isTeam && !teamMode && (result.teamMembers?.length || 0) > 1) {
          setTeamModalData(result);
        }
        return;
      } catch {
        // Fallback to offline validation
      }
    }

    // 2. Offline Mode with IndexedDB
    try {
      const db = await openDB();
      const tx = db.transaction('cached_registrations', 'readonly');
      const store = tx.objectStore('cached_registrations');
      const req = store.get([eventId, hash]);

      const cachedRec = await new Promise<any>((resolve) => {
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      });

      if (!cachedRec || cachedRec.event_id !== eventId) {
        result = {
          outcome: 'invalid',
          message: 'Ticket not found in this event’s local cache (Offline Mode).',
          timestamp: new Date().toLocaleTimeString(),
          offline: true,
          hashPayload: hash,
        };
      } else if (cachedRec.checked_in) {
        result = {
          outcome: 'already_checked_in',
          message: `Already Checked In (Offline Cache)`,
          name: cachedRec.lead_name,
          regNum: cachedRec.reg_number,
          teamName: cachedRec.team_name,
          timestamp: new Date().toLocaleTimeString(),
          offline: true,
          hashPayload: hash,
        };
      } else {
        if (Boolean(cachedRec.team_name) && (cachedRec.team_members?.length || 0) > 1 && !teamMode) {
          result = {
            outcome: 'idle',
            message: 'Team found in offline cache. Select who should be checked in.',
            name: cachedRec.lead_name,
            regNum: cachedRec.reg_number,
            teamName: cachedRec.team_name,
            isTeam: true,
            teamMembers: cachedRec.team_members,
            timestamp: new Date().toLocaleTimeString(),
            offline: true,
            hashPayload: hash,
          };
          setScanResult(result);
          setTeamModalData(result);
          return;
        }
        // Mark locally checked in only after the operator chooses a team mode.
        const writeTx = db.transaction(['cached_registrations', 'offline_queue'], 'readwrite');
        cachedRec.checked_in = true;
        cachedRec.checked_in_at = new Date().toISOString();
        writeTx.objectStore('cached_registrations').put(cachedRec);

        // Queue for server sync
        writeTx.objectStore('offline_queue').add({
          event_id: eventId,
          hash_payload: hash,
          team_mode: teamMode || 'lead_only',
          timestamp: new Date().toISOString(),
        });

        await new Promise((resolve) => (writeTx.oncomplete = resolve));
        await updateDBCounts();

        result = {
          outcome: 'success',
          message: 'Check-in Granted (Queued Offline for Sync)',
          name: cachedRec.lead_name,
          regNum: cachedRec.reg_number,
          teamName: cachedRec.team_name,
          isTeam: Boolean(cachedRec.team_name),
          teamMembers: cachedRec.team_members,
          timestamp: new Date().toLocaleTimeString(),
          offline: true,
          hashPayload: hash,
        };
      }

      setScanResult(result);
      playFeedback(result.outcome);
      setRecentScans((prev) => [result, ...prev.slice(0, 9)]);

      if (result.outcome === 'success' && result.isTeam && !teamMode && (result.teamMembers?.length || 0) > 1) {
        setTeamModalData(result);
      }
    } catch {
      const errResult: ScanResult = {
        outcome: 'invalid',
        message: 'Offline validation failed.',
        timestamp: new Date().toLocaleTimeString(),
        offline: true,
      };
      setScanResult(errResult);
      playFeedback('invalid');
    }
  }, [eventId, playFeedback, updateDBCounts]);

  const checkInSingleMember = async (memberId: string | undefined, memberEmail: string, hashPayload: string) => {
    if (!memberId || !/^[0-9a-f-]{36}-m-\d+$/i.test(memberId)) {
      setScanResult({ outcome: 'invalid', message: 'This cached team member has no valid member identifier. Refresh the attendee cache before checking them in.', timestamp: new Date().toLocaleTimeString(), hashPayload });
      return;
    }
    try {
      if (!navigator.onLine) {
        const db = await openDB();
        const tx = db.transaction(['cached_registrations', 'offline_queue'], 'readwrite');
        const cacheStore = tx.objectStore('cached_registrations');
        const cached = await new Promise<any>((resolve, reject) => {
          const request = cacheStore.get([eventId, hashPayload]);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        if (!cached || cached.event_id !== eventId) throw new Error('Team is missing from this event cache.');
        const index = Number(memberId.split('-m-').pop());
        if (!Number.isInteger(index) || index < 0 || index >= (cached.team_members || []).length) throw new Error('Member is not present in the cached roster.');
        cached.team_members[index] = { ...cached.team_members[index], checked_in: true };
        cacheStore.put(cached);
        tx.objectStore('offline_queue').add({
          event_id: eventId,
          hash_payload: hashPayload,
          member_id: memberId,
          team_mode: 'member',
          timestamp: new Date().toISOString(),
        });
        await new Promise<void>((resolve, reject) => {
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
          tx.onabort = () => reject(tx.error);
        });
        setTeamModalData((prev) => prev ? {
          ...prev,
          teamMembers: (prev.teamMembers || []).map((m: any) => m.id === memberId ? { ...m, checked_in: true } : m),
        } : null);
        setScanResult({ outcome: 'success', message: 'Member check-in queued offline. Server confirmation is pending.', timestamp: new Date().toLocaleTimeString(), offline: true, hashPayload });
        await updateDBCounts();
        playFeedback('success');
        return;
      }
      const res = await fetch('/api/admin/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: eventId,
          hash_payload: hashPayload,
          member_id: memberId,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTeamModalData((prev) => {
          if (!prev) return null;
          const updated = (prev.teamMembers || []).map((m: any) => {
            if (m.id === memberId || m.email === memberEmail) {
              return { ...m, checked_in: true };
            }
            return m;
          });
          return { ...prev, teamMembers: updated };
        });
        playFeedback('success');
      }
    } catch (err) {
      console.error('Member checkin error:', err);
    }
  };

  const onScanSuccess = useCallback(async (decodedText: string) => {
    // Pause only if scanner is actually running
    if (scannerRef.current) {
      try {
        const state = (scannerRef.current as any).getState?.();
        if (state === 2) { // Html5QrcodeScannerState.SCANNING
          scannerRef.current.pause();
        }
      } catch {
        // ignore
      }
    }

    let hash = decodedText.trim();
    try {
      const parsed = new URL(decodedText);
      const parts = parsed.pathname.split('/').filter(Boolean);
      const checkinIndex = parts.indexOf('checkin');
      const ticketIndex = parts.indexOf('ticket');
      if (parts.includes('admin') && checkinIndex >= 0 && parts[checkinIndex + 1]) {
        hash = decodeURIComponent(parts[checkinIndex + 1]);
      } else if (ticketIndex >= 0 && parts[ticketIndex + 1]) {
        hash = decodeURIComponent(parts[ticketIndex + 1]);
      } else if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        hash = '';
      }
    } catch {
      // Plain identifiers remain supported.
    }
    if (!hash || hash.length > 512) {
      setScanResult({ outcome: 'invalid', message: 'QR code format is not recognized.', timestamp: new Date().toLocaleTimeString() });
      return;
    }

    await processCheckin(hash);

    setTimeout(() => {
      if (scannerRef.current) {
        try {
          const state = (scannerRef.current as any).getState?.();
          if (state === 1) { // Html5QrcodeScannerState.PAUSED
            scannerRef.current.resume();
          }
        } catch {
          // ignore
        }
      }
    }, 2000);
  }, [processCheckin]);

  onScanSuccessRef.current = onScanSuccess;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Turnstile Status & Toolbar */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: 'var(--shadow-rest)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isOnline ? <Wifi size={18} color="var(--success)" /> : <WifiOff size={18} color="var(--warning)" />}
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-strong)' }}>
              {isOnline ? 'Network Online' : 'Offline Mode Active'}
            </span>
          </div>
          <span style={{ color: 'var(--border)' }}>|</span>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Database size={14} />
            <span>Cached Attendee DB: <strong>{cachedCount}</strong></span>
          </div>
          {pendingQueueCount > 0 && (
            <span className="fluent-badge badge-warning" style={{ fontSize: '11px' }}>
              {pendingQueueCount} Scans Queued Offline
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={cacheRegistrations}
            disabled={cachingInProgress}
            className="fluent-btn fluent-btn-secondary"
            style={{ fontSize: '12px', padding: '6px 14px' }}
            title="Download attendee records for offline emergency turnstile check"
          >
            <Database size={14} /> {cachingInProgress ? 'Caching...' : 'Cache Registrations'}
          </button>

          {pendingQueueCount > 0 && isOnline && (
            <button
              onClick={syncOfflineQueue}
              disabled={syncingInProgress}
              className="fluent-btn fluent-btn-primary"
              style={{ fontSize: '12px', padding: '6px 14px' }}
            >
              <RefreshCw size={14} className={syncingInProgress ? 'spin' : ''} />
              {syncingInProgress ? 'Syncing...' : `Sync Queue (${pendingQueueCount})`}
            </button>
          )}

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="fluent-btn fluent-btn-secondary"
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />} Sound Cues {soundEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '20px' }}>
        {/* Scanner Viewport Column */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-rest)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-strong)', margin: 0 }}>
                Live Camera Scanner
              </h2>
              {eventTitle && (
                <span style={{ fontSize: '12px', color: 'var(--brand)', fontWeight: 500 }}>
                  {eventTitle}
                </span>
              )}
            </div>
            <span className="fluent-badge badge-success">Live Viewfinder</span>
          </div>

          {/* html5-qrcode video viewport */}
          <div
            id="qr-reader"
            style={{
              width: '100%',
              maxWidth: '380px',
              minHeight: '280px',
              background: '#0a0a0c',
              borderRadius: 'var(--radius-sm)',
              overflow: 'hidden',
            }}
          />

          <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px', textAlign: 'center' }}>
            Present an attendee digital pass or physical badge QR code.
          </span>
        </div>

        {/* Scan Status & Session Turnstile History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {scanResult ? (
            <div
              style={{
                padding: '24px',
                borderRadius: 'var(--radius-sm)',
                border: '2px solid',
                background:
                  scanResult.outcome === 'success'
                    ? 'var(--success-bg)'
                    : scanResult.outcome === 'already_checked_in'
                    ? 'var(--warning-bg)'
                    : 'var(--danger-bg)',
                borderColor:
                  scanResult.outcome === 'success'
                    ? 'var(--success)'
                    : scanResult.outcome === 'already_checked_in'
                    ? 'var(--warning)'
                    : 'var(--danger)',
                color:
                  scanResult.outcome === 'success'
                    ? 'var(--success)'
                    : scanResult.outcome === 'already_checked_in'
                    ? 'var(--warning)'
                    : 'var(--danger)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                {scanResult.outcome === 'success' && <CheckCircle2 size={28} />}
                {scanResult.outcome === 'already_checked_in' && <AlertTriangle size={28} />}
                {scanResult.outcome === 'invalid' && <XCircle size={28} />}
                <h3 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>
                  {scanResult.outcome === 'success' && (scanResult.offline ? 'CHECK-IN QUEUED (OFFLINE)' : 'CHECK-IN GRANTED')}
                  {scanResult.outcome === 'already_checked_in' && 'ALREADY CHECKED IN'}
                  {scanResult.outcome === 'invalid' && 'INVALID TICKET'}
                </h3>
              </div>

              <p style={{ fontSize: '14px', margin: '0 0 12px 0', fontWeight: 500 }}>
                {scanResult.message}
              </p>

              {scanResult.name && (
                <div style={{ background: 'rgba(255,255,255,0.7)', padding: '12px', borderRadius: 'var(--radius-sm)', color: 'var(--text-strong)', fontSize: '13px' }}>
                  <div><strong>Participant:</strong> {scanResult.name}</div>
                  {scanResult.regNum && <div><strong>Reg Number:</strong> {scanResult.regNum}</div>}
                  {scanResult.teamName && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                      <Users size={14} color="var(--brand)" />
                      <strong>Team:</strong> {scanResult.teamName}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                padding: '36px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                textAlign: 'center',
                color: 'var(--text-muted)',
              }}
            >
              <Camera size={36} color="var(--brand)" style={{ margin: '0 auto 12px' }} />
              <p style={{ margin: 0, fontSize: '14px' }}>
                Ready to scan. Present an attendee ticket QR to record check-in.
              </p>
            </div>
          )}

          {/* Recent Scans Turnstile History */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '20px',
              flex: 1,
            }}
          >
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-strong)', marginBottom: '12px' }}>
              Turnstile Session History
            </h3>
            {recentScans.length === 0 ? (
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No scans recorded this turnstile session yet.</span>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
                {recentScans.map((s, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: 'var(--bg-soft)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '12px',
                    }}
                  >
                    <div>
                      <strong style={{ color: 'var(--text-strong)' }}>{s.name || 'Unverified'}</strong>
                      {s.teamName && <span style={{ color: 'var(--brand)', marginLeft: '6px' }}>({s.teamName})</span>}
                      <span style={{ marginLeft: '8px', color: 'var(--text-muted)' }}>{s.message}</span>
                    </div>
                    <span style={{ color: 'var(--text-muted)' }}>{s.timestamp}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Team Check-in Options Modal */}
      {teamModalData && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              maxWidth: '520px',
              width: '100%',
              background: 'var(--surface)',
              borderRadius: 'var(--radius-sm)',
              padding: '24px',
              boxShadow: 'var(--shadow-lift)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <Users size={22} color="var(--brand)" />
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-strong)', margin: 0 }}>
                Team Turnstile Check-In
              </h3>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-body)', marginBottom: '16px', lineHeight: 1.4 }}>
              Scanned ticket belongs to team <strong>{teamModalData.teamName}</strong> ({teamModalData.teamMembers?.length || 'Multiple'} members). Choose your check-in action:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
              <button
                type="button"
                onClick={() => {
                  processCheckin(teamModalData.hashPayload!, 'all');
                  setTeamModalData(null);
                }}
                className="fluent-btn fluent-btn-primary"
                style={{ justifyContent: 'center', padding: '10px', fontSize: '13px', fontWeight: 600 }}
              >
                <Users size={16} /> Check In Entire Team ({teamModalData.teamMembers?.length || 'All'} Members)
              </button>

              <button
                type="button"
                onClick={() => {
                  processCheckin(teamModalData.hashPayload!, 'lead_only');
                  setTeamModalData(null);
                }}
                className="fluent-btn fluent-btn-secondary"
                style={{ justifyContent: 'center', padding: '9px', fontSize: '13px' }}
              >
                <UserCheck size={16} /> Check In Scanned Attendee Only ({teamModalData.name})
              </button>
            </div>

            {/* Granular Individual Member Check-In Roster */}
            {teamModalData.teamMembers && teamModalData.teamMembers.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px', marginBottom: '16px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-strong)', display: 'block', marginBottom: '8px' }}>
                  Or Check In Members Individually:
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                  {teamModalData.teamMembers.map((member, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '6px 10px',
                        background: member.checked_in ? 'rgba(16, 124, 65, 0.08)' : 'var(--bg-soft)',
                        border: member.checked_in ? '1px solid rgba(16, 124, 65, 0.3)' : '1px solid var(--border)',
                        borderRadius: '4px',
                        fontSize: '12px',
                      }}
                    >
                      <div>
                        <strong style={{ color: 'var(--text-strong)' }}>{member.name}</strong>
                        {member.reg_number && member.reg_number !== 'N/A' && (
                          <span style={{ color: 'var(--text-muted)', marginLeft: '6px', fontSize: '11px', fontFamily: 'monospace' }}>
                            {member.reg_number}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => checkInSingleMember((member as any).id, member.email, teamModalData.hashPayload!)}
                        disabled={member.checked_in}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '3px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: member.checked_in ? 'default' : 'pointer',
                          border: member.checked_in ? '1px solid var(--success)' : '1px solid var(--brand)',
                          background: member.checked_in ? 'var(--success-bg)' : 'var(--brand)',
                          color: member.checked_in ? 'var(--success)' : '#ffffff',
                        }}
                      >
                        {member.checked_in ? (
                          <>
                            <Check size={11} /> Checked In
                          </>
                        ) : (
                          'Check In'
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setTeamModalData(null)}
                className="fluent-btn fluent-btn-secondary"
                style={{ fontSize: '12px', padding: '6px 14px' }}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
