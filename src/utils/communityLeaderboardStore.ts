import type { CommunityAggregate } from '../types/community';
import {
  beginCommunityRemoteRead,
  finishCommunityRemoteRead,
  subscribeCommunityRemoteMutations,
  subscribeFeedback,
} from './communityStore';
import { emptyCommunityAggregate, fetchPoetAggregates, remoteEnabled } from './communityRemote';
import { localCommunityAggregate, overlayPendingCommunityAggregate } from './communityTargetStore';

export interface CommunityLeaderboardSnapshot {
  aggregates: readonly CommunityAggregate[];
  phase: 'local' | 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
}

type LeaderboardRecord = {
  ids: readonly string[];
  remoteAggregates: readonly CommunityAggregate[];
  snapshot: CommunityLeaderboardSnapshot;
  fingerprint: string;
  listeners: Set<() => void>;
  promise: Promise<void> | null;
  stopLocal: (() => void) | null;
  stopRemote: (() => void) | null;
};

const records = new Map<string, LeaderboardRecord>();

function idsKey(ids: readonly string[]) {
  return [...new Set(ids)].filter(Boolean).sort().join('|');
}

function buildAggregates(record: LeaderboardRecord) {
  const source = remoteEnabled
    ? record.remoteAggregates
    : record.ids.map((id) => localCommunityAggregate('poet', id));
  const byId = new Map(source.map((aggregate) => [aggregate.targetId, aggregate]));
  return record.ids.map((id) => overlayPendingCommunityAggregate(
    byId.get(id) ?? (remoteEnabled ? emptyCommunityAggregate('poet', id) : localCommunityAggregate('poet', id)),
  ));
}

function refreshRecord(record: LeaderboardRecord, notify = true) {
  const next: CommunityLeaderboardSnapshot = {
    aggregates: buildAggregates(record),
    phase: record.snapshot.phase,
    error: record.snapshot.error,
  };
  const fingerprint = JSON.stringify(next);
  if (fingerprint === record.fingerprint) return;
  record.snapshot = next;
  record.fingerprint = fingerprint;
  if (notify) for (const listener of record.listeners) listener();
}

function createRecord(ids: readonly string[]): LeaderboardRecord {
  const normalized = [...new Set(ids)].filter(Boolean);
  const snapshot: CommunityLeaderboardSnapshot = {
    aggregates: normalized.map((id) => localCommunityAggregate('poet', id)),
    phase: remoteEnabled ? 'idle' : 'local',
    error: null,
  };
  const record: LeaderboardRecord = {
    ids: normalized,
    remoteAggregates: [],
    snapshot,
    fingerprint: '',
    listeners: new Set(),
    promise: null,
    stopLocal: null,
    stopRemote: null,
  };
  refreshRecord(record, false);
  return record;
}

function ensureRecord(ids: readonly string[]) {
  const key = idsKey(ids);
  const existing = records.get(key);
  if (existing) return existing;
  const record = createRecord(ids);
  records.set(key, record);
  return record;
}

async function load(record: LeaderboardRecord, force = false) {
  if (!remoteEnabled) return;
  if (record.promise) return record.promise;
  if (!force && record.snapshot.phase === 'ready') return;

  record.snapshot = { ...record.snapshot, phase: 'loading', error: null };
  refreshRecord(record);
  beginCommunityRemoteRead('Загружаем сводный рейтинг…');
  record.promise = (async () => {
    const aggregates = await fetchPoetAggregates(record.ids);
    if (!aggregates) {
      record.snapshot = { ...record.snapshot, phase: 'error', error: 'Сводный рейтинг временно недоступен.' };
      finishCommunityRemoteRead(false);
      return;
    }
    record.remoteAggregates = aggregates;
    record.snapshot = { ...record.snapshot, phase: 'ready', error: null };
    finishCommunityRemoteRead(true);
  })().finally(() => {
    record.promise = null;
    refreshRecord(record);
  });
  return record.promise;
}

function bind(record: LeaderboardRecord) {
  if (!record.stopLocal) record.stopLocal = subscribeFeedback(() => refreshRecord(record));
  if (!record.stopRemote) {
    record.stopRemote = subscribeCommunityRemoteMutations((mutation) => {
      if (mutation.targetType === 'poet' && record.ids.includes(mutation.targetId)) void load(record, true);
    });
  }
}

function release(record: LeaderboardRecord) {
  if (record.listeners.size) return;
  record.stopLocal?.();
  record.stopLocal = null;
  record.stopRemote?.();
  record.stopRemote = null;
  records.delete(idsKey(record.ids));
}

export function getCommunityLeaderboardSnapshot(ids: readonly string[]) {
  return ensureRecord(ids).snapshot;
}

export function subscribeCommunityLeaderboard(ids: readonly string[], listener: () => void) {
  const record = ensureRecord(ids);
  record.listeners.add(listener);
  bind(record);
  void load(record);
  return () => {
    record.listeners.delete(listener);
    release(record);
  };
}

export function retryCommunityLeaderboard(ids: readonly string[]) {
  return load(ensureRecord(ids), true);
}
