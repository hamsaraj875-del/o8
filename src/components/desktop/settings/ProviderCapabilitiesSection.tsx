'use client';
import { useEffect, useState } from 'react';
import type { RuntimeCapabilities } from '@/lib/runtimes/types';
import { SettingsGroup, SettingsRow } from './grouped';

export function ProviderCapabilitiesSection({ runtimeId }: { runtimeId: string }) {
  const [result, setResult] = useState<{ id: string; capabilities: RuntimeCapabilities | null; failed: boolean }>();
  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/api/runtime/capabilities?id=${encodeURIComponent(runtimeId)}`, { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error('Unavailable'); return await response.json();
    }).then(data => { if (!controller.signal.aborted) setResult({ id: runtimeId, capabilities: data.capabilities, failed: false }); })
      .catch(() => { if (!controller.signal.aborted) setResult({ id: runtimeId, capabilities: null, failed: true }); });
    return () => controller.abort();
  }, [runtimeId]);
  const current = result?.id === runtimeId ? result : undefined;
  const caps = current?.capabilities;
  const actions = caps ? [[caps.resume, 'Follow-up messages'], [caps.interrupt, 'Stop'], [caps.streaming, 'Live output'], [caps.reviewDiffs, 'Changes']].filter(([enabled]) => enabled).map(([, label]) => label).join(', ') : '';
  const memory = caps?.sessionTransforms ? Object.entries(caps.sessionTransforms).filter(([, enabled]) => enabled).map(([action]) => action).join(', ') : '';
  return <SettingsGroup header="Adapter capabilities">
    <SettingsRow label="Worker actions" value={!current ? 'Loading…' : actions || 'Not reported'} subtitle={current?.failed ? 'Could not read the adapter. Reopen Settings to retry.' : !caps ? 'Conversation capabilities depend on your connected agent.' : 'Supported by this adapter; account status is checked separately.'} divider />
    <SettingsRow label="Session transforms" value={memory || 'Not exposed'} divider />
    <SettingsRow label="Usage" value={caps?.costTelemetry ? 'Reported when available' : 'Not reported'} subtitle="Missing usage is unknown, not zero." divider />
    <SettingsRow label="Account limits" value={caps?.capacity?.observe ? 'Provider observations supported' : 'Not reported'} subtitle="Availability and charges cannot be inferred from a model list." />
  </SettingsGroup>;
}
