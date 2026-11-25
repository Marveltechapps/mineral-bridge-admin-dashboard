import { useEffect, useState, type KeyboardEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FilterChips } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { Field, TextArea } from '@/components/ui/Input';
import { Initials } from '@/components/ui/Misc';
import { Pill } from '@/components/ui/Pill';
import { Text } from '@/components/ui/Text';
import type { Tone } from '@/constants/tones';
import { useQueryMatch } from '@/hooks/useConsoleData';
import { consoleActions, useConsole } from '@/store/consoleStore';
import { useLiveList } from '@/hooks/useLiveList';
import { Loader } from '@/components/ui/Loader';
import { apiRequest, isDemoMode } from '@/lib/apiClient';
import { ENDPOINTS } from '@/lib/endpoints';
import { formatAuthError } from '@/services/auth';
import { KYC, KYC_FILTERS, getKycSubmissions, reviewDecisionBody } from '@/services/verification';
import { refreshCounters } from '@/services/shell/counters';
import type { KycSubmission } from '@/types/verification';
import styles from '../Verification.module.css';
import layout from '@/styles/layout.module.css';

const TIER_NOTE = { 1: 'ID only', 2: 'ID + group registration', 3: 'ID + permits + KYB' } as const;
const TIER_TONE: Record<number, Tone> = { 1: 'gray', 2: 'navy', 3: 'gold' };

interface SignedFile {
  url: string;
  file?: { mimeType?: string; name?: string };
}

function DocumentPreview({
  title,
  url,
  mimeType,
  loading,
  error,
  onClose,
}: {
  title: string;
  url?: string;
  mimeType?: string;
  loading: boolean;
  error?: string;
  onClose: () => void;
}) {
  const pdf = mimeType === 'application/pdf';
  return (
    <div className={styles.preview}>
      <div className={styles.previewCard} role="dialog" aria-modal="true" aria-label={title}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <Text size={15} weight={800} tone="ink">
            {title}
          </Text>
          <Button variant="secondary" h={32} px={12} r={10} fs={12} onClick={onClose}>
            Close
          </Button>
        </div>
        {loading && (
          <Text size={13} weight={600} tone="ink3">
            Loading the uploaded file…
          </Text>
        )}
        {error && (
          <Text size={13} weight={700} tone="err">
            {error}
          </Text>
        )}
        {url && !pdf && <img className={styles.previewImg} src={url} alt={title} />}
        {url && pdf && (
          <a href={url} target="_blank" rel="noreferrer">
            Open the PDF
          </a>
        )}
      </div>
    </div>
  );
}

function DocThumb({ fileId, name, onOpen }: { fileId?: string; name: string; onOpen: () => void }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    if (!fileId || isDemoMode()) return;
    const ac = new AbortController();
    void apiRequest<SignedFile>(ENDPOINTS.files.url(fileId), { signal: ac.signal })
      .then((signed) => {
        if (!ac.signal.aborted && signed.url) setUrl(signed.url);
      })
      .catch(() => undefined);
    return () => ac.abort();
  }, [fileId]);
  if (!url) return <span className={styles.thumb} aria-hidden="true" />;
  return (
    <button type="button" className={styles.thumbButton} onClick={onOpen} aria-label={`Preview ${name}`}>
      <img className={styles.thumbImg} src={url} alt="" />
    </button>
  );
}

function KycCard({ k, open, decided, onChanged }: { k: KycSubmission; open: boolean; decided?: string; onChanged: () => void }) {
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<{ title: string; url?: string; mimeType?: string; loading: boolean; error?: string } | null>(null);
  const toggle = () => consoleActions.set({ kycOpen: open ? null : k.id });
  const statusTone: Tone = decided === 'Verified' ? 'green' : decided === 'Rejected' ? 'red' : decided ? 'amber' : k.tone;
  const openDocument = (doc: KycSubmission['docs'][number]) => {
    if (!doc.fileId || isDemoMode()) {
      consoleActions.notify(doc.fileId ? `Opening ${doc.name}` : `${doc.name} has no uploaded file attached.`);
      return;
    }
    setPreview({ title: doc.name, loading: true });
    void apiRequest<SignedFile>(ENDPOINTS.files.url(doc.fileId))
      .then((signed) => setPreview({ title: doc.name, url: signed.url, mimeType: signed.file?.mimeType || doc.mimeType, loading: false }))
      .catch((err: unknown) => setPreview({ title: doc.name, loading: false, error: formatAuthError(err, 'The document could not be opened.') }));
  };
  const decide = (outcome: string) => {
    const payload = reviewDecisionBody(outcome, reason);
    if ('error' in payload) {
      setReasonError(payload.error);
      return;
    }
    setReasonError('');
    const text =
      outcome === 'Verified'
        ? `Tier ${k.tier} approved for ${k.person}`
        : outcome === 'Rejected'
          ? `${k.id} rejected — reason sent to ${k.person}`
          : `Resubmission requested from ${k.person}`;
    if (isDemoMode()) {
      consoleActions.notify(text);
      consoleActions.set((s) => ({ kycDone: { ...s.kycDone, [k.id]: outcome }, kycOpen: null }));
      setReason('');
      return;
    }
    setSaving(true);
    void apiRequest<{ message?: string }>(ENDPOINTS.compliance.decision(k.id), { method: 'POST', body: JSON.stringify(payload) })
      .then((saved) => {
        consoleActions.notify(saved.message || text);
        consoleActions.set((s) => ({ kycDone: { ...s.kycDone, [k.id]: outcome }, kycOpen: null }));
        setReason('');
        refreshCounters();
        onChanged();
      })
      .catch((err: unknown) => consoleActions.notify(formatAuthError(err, 'The decision was not saved.')))
      .finally(() => setSaving(false));
  };
  const bodyId = `kyc-body-${k.id}`;

  return (
    <Card clip>
      <div
        className={styles.kycHead}
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={toggle}
        onKeyDown={(e: KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle();
          }
        }}
      >
        <Text size={12.5} weight={800} tone="brand">
          {k.id}
        </Text>
        <span style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
          <Initials
            text={k.person
              .split(' ')
              .map((s) => s[0])
              .join('')}
            size={32}
            radius={11}
            fs={11}
          />
          <span style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Text size={12.5} weight={700} tone="ink">
              {k.person}
            </Text>
            <Text size={11} weight={600} tone="ink3" ellipsis>
              {k.org}
            </Text>
          </span>
        </span>
        <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Pill tone={TIER_TONE[k.tier] ?? 'gray'}>Tier {k.tier}</Pill>
          <Text size={10.5} weight={600} tone="ink3">
            {TIER_NOTE[k.tier]}
          </Text>
        </span>
        <Text size={12} weight={600} tone="ink2">
          {k.submitted}
        </Text>
        <Pill tone={statusTone}>{decided || k.status}</Pill>
        <span style={{ display: 'flex', justifyContent: 'flex-end', color: 'var(--ink3)' }}>
          <Icon name={open ? 'up' : 'down'} size={14} />
        </span>
      </div>
      {open && (
        <div id={bodyId} style={{ padding: '0 20px 18px' }}>
          <div className={styles.kycBody}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              <Text size={10.5} weight={800} ls={1.1} tone="ink3">
                REQUIRED DOCUMENTS FOR THIS TIER
              </Text>
              {k.docs.map((d) => (
                <div key={d.id || `${d.name}-${d.side || ''}`} className={styles.kycDoc}>
                  <DocThumb fileId={d.fileId} name={d.name} onOpen={() => openDocument(d)} />
                  <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Text size={12.5} weight={700} tone="ink">
                      {d.name}
                    </Text>
                    <Text size={10.5} weight={600} tone="ink3">
                      {d.ref || d.side || 'Submitted capture'}
                    </Text>
                    {d.rejectionReason && (
                      <Text size={11} weight={700} tone="err">
                        {d.rejectionReason}
                      </Text>
                    )}
                  </span>
                  <Button variant="secondary" h={32} px={12} r={11} fs={11.5} gap={6} icon="eye" onClick={() => openDocument(d)}>
                    View
                  </Button>
                  <Pill tone={d.tone}>{d.status}</Pill>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, padding: 16, borderRadius: 16, background: 'var(--surf4)', border: '1px solid var(--line2)' }}>
              <Text size={10.5} weight={800} ls={1.1} tone="ink2">
                REVIEW DECISION
              </Text>
              <Field label="Reason for the customer" caps={false} hint={reasonError ? <Text size={11} weight={700} tone="err">{reasonError}</Text> : <Text size={10.5} weight={600} tone="ink3">Required to reject or request a resubmission.</Text>}>
                <TextArea
                  rows={3}
                  value={reason}
                  aria-invalid={reasonError ? true : undefined}
                  aria-label="Reason sent to the customer"
                  placeholder="Explain what is wrong and what they should upload instead"
                  onChange={(event) => {
                    setReason(event.target.value);
                    if (reasonError) setReasonError('');
                  }}
                />
              </Field>
              <Button variant="success" h={42} r={13} gap={8} icon="check" disabled={saving} onClick={() => decide('Verified')}>
                Approve tier
              </Button>
              <Button variant="outline" h={38} r={12} disabled={saving} onClick={() => decide('Awaiting resubmission')}>
                Request resubmission
              </Button>
              <Button variant="dangerSoft" h={38} r={12} disabled={saving} onClick={() => decide('Rejected')}>
                Reject with reason
              </Button>
              <Text size={10.5} weight={600} tone="ink3" lh={1.5} style={{ marginTop: 2 }}>
                Decision is logged to the audit trail against your admin account.
              </Text>
            </div>
          </div>
        </div>
      )}
      {preview && (
        <DocumentPreview
          title={preview.title}
          url={preview.url}
          mimeType={preview.mimeType}
          loading={preview.loading}
          error={preview.error}
          onClose={() => setPreview(null)}
        />
      )}
    </Card>
  );
}

export default function KycQueuePage() {
  const match = useQueryMatch();
  const tierFilter = useConsole((s) => s.filters.verTier);
  const openId = useConsole((s) => s.kycOpen);
  const done = useConsole((s) => s.kycDone);
  const live = useLiveList(getKycSubmissions, KYC);
  const rows = live.rows.filter(
    (k) => (tierFilter === 'All tiers' || tierFilter.indexOf(`Tier ${k.tier}`) === 0 || (tierFilter === 'Overdue SLA' && (k.overdue || k.submitted.indexOf('day') > 0))) && match([k.id, k.org, k.person, `tier ${k.tier}`]),
  );
  if (live.loading) return <Loader label="Loading KYC queue" />;

  return (
    <div className={layout.stack14}>
      {live.error && <p role="alert">{live.error}</p>}
      <FilterChips filterKey="verTier" options={KYC_FILTERS} label="Filter KYC submissions" />
      {rows.map((k) => (
        <KycCard key={k.id} k={k} open={openId === k.id} decided={done[k.id]} onChanged={live.reload} />
      ))}
    </div>
  );
}
