import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Archive,
  ArchiveRestore,
  Boxes,
  Copy,
  Loader2,
  RefreshCw,
  Send,
  ShieldAlert,
  Store,
  Users,
} from 'lucide-react';

import { InventoryRow } from '../lib/catalog';
import { getBackendUrl, readApiError } from '../lib/checkoutPayment';
import { formatNaira, stockLabel, UPDATES_FEE } from '../lib/pricing';

const ADMIN_KEY_STORAGE = 'knotify_admin_key';

interface AdminDashboardProps {
  ties: InventoryRow[];
  paidOrders?: number;
  paidUsers?: number;
  onRefresh: () => void;
}

async function adminRequest(path: string, adminKey: string, init: RequestInit = {}) {
  let response: Response;
  try {
    response = await fetch(`${getBackendUrl()}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': adminKey,
        ...(init.headers || {}),
      },
    });
  } catch {
    throw new Error('Could not reach the server. Check your connection and try again.');
  }

  if (!response.ok) {
    throw new Error(await readApiError(response, 'Admin request failed.'));
  }

  return response.json().catch(() => null);
}

/**
 * Prototype admin surface. Deliberately one screen: what is in stock, what is
 * hidden, and the restock announcement composer.
 *
 * There is no admin role in the API yet, so every write is authorised by the
 * shared `X-Admin-Key` header (Backend/config.py -> ADMIN_API_KEY). With that
 * env var unset the routes answer 503 and this screen says so.
 */
export default function AdminDashboard({
  ties,
  paidOrders = 0,
  paidUsers = 0,
  onRefresh,
}: AdminDashboardProps) {
  const [adminKey, setAdminKey] = useState(() => {
    try {
      return sessionStorage.getItem(ADMIN_KEY_STORAGE) || '';
    } catch {
      return '';
    }
  });
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [restockDrafts, setRestockDrafts] = useState<Record<string, string>>({});
  const [broadcastTie, setBroadcastTie] = useState('');
  const [broadcastNote, setBroadcastNote] = useState('');
  // The storefront call filters archived ties out, so the admin screen loads its
  // own list with include_archived=true - otherwise archived ties could never be
  // found again to restore.
  const [rows, setRows] = useState<InventoryRow[]>(ties);
  const [loading, setLoading] = useState(false);

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${getBackendUrl()}/quantity/ties?include_archived=true`);
      if (!response.ok) {
        throw new Error(await readApiError(response, 'Could not load the inventory.'));
      }
      const data = (await response.json().catch(() => [])) as InventoryRow[];
      setRows(Array.isArray(data) ? data : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load the inventory.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const activeTies = useMemo(() => rows.filter((tie) => tie.is_active !== false), [rows]);
  const archivedTies = useMemo(() => rows.filter((tie) => tie.is_active === false), [rows]);
  const unitsInStock = useMemo(
    () => activeTies.reduce((total, tie) => total + Number(tie.quantity || 0), 0),
    [activeTies]
  );

  const rememberKey = (value: string) => {
    setAdminKey(value);
    try {
      sessionStorage.setItem(ADMIN_KEY_STORAGE, value);
    } catch {
      /* storage blocked - the key just won't persist */
    }
  };

  const run = async (id: string, action: () => Promise<unknown>, success: string) => {
    if (!adminKey.trim()) {
      setError('Add your admin key first — it is the ADMIN_API_KEY value from the backend .env.');
      return;
    }
    setBusyId(id);
    setError('');
    setNotice('');
    try {
      await action();
      setNotice(success);
      await loadRows();
      onRefresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'That did not work.');
    } finally {
      setBusyId('');
    }
  };

  const archive = (tie: InventoryRow, archived: boolean) =>
    run(
      tie.tie_id,
      () =>
        adminRequest(
          `/quantity/ties/${encodeURIComponent(tie.tie_id)}/${archived ? 'archive' : 'restore'}`,
          adminKey,
          { method: 'POST' }
        ),
      archived
        ? `"${tie.tie_name}" is now hidden from the store.`
        : `"${tie.tie_name}" is back in the store.`
    );

  const restock = (tie: InventoryRow, quantity: number) =>
    run(
      tie.tie_id,
      () =>
        adminRequest(`/quantity/ties/${encodeURIComponent(tie.tie_id)}`, adminKey, {
          method: 'PATCH',
          body: JSON.stringify({ quantity, is_active: quantity > 0 }),
        }),
      `"${tie.tie_name}" set to ${quantity} in stock.`
    );

  const stats = [
    { label: 'Live ties', value: String(activeTies.length), icon: Store },
    { label: 'Units in stock', value: String(unitsInStock), icon: Boxes },
    { label: 'Archived', value: String(archivedTies.length), icon: Archive },
    { label: 'Paid users', value: String(paidUsers || paidOrders || 0), icon: Users },
  ];

  const broadcastTieRow = rows.find((tie) => tie.tie_id === broadcastTie);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 pb-24 text-left">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-brand-border/40 pb-6">
        <div>
          <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-brand-secondary">
            Prototype · not linked from the storefront nav
          </span>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-brand-primary tracking-tight mt-1">
            Admin
          </h1>
          <p className="text-xs text-brand-primary/65 font-sans mt-1">
            Inventory, archiving and the restock announcement composer.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-2 rounded-full border border-brand-border px-4 py-2 text-[10px] font-sans font-bold uppercase tracking-widest text-brand-primary hover:bg-brand-card transition-colors cursor-pointer"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Admin key */}
      <div className="mt-6 rounded-2xl border border-brand-border bg-brand-card/50 p-4">
        <label className="block text-[10px] font-sans font-bold uppercase tracking-widest text-brand-secondary mb-1.5">
          Admin key
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="password"
            value={adminKey}
            onChange={(event) => rememberKey(event.target.value)}
            placeholder="ADMIN_API_KEY from Backend/.env"
            className="flex-1 bg-brand-bg text-brand-primary font-mono text-xs rounded-xl border border-brand-border px-3.5 py-2.5 focus:border-brand-secondary focus:outline-none"
          />
          <span className="inline-flex items-center gap-1.5 text-[10px] font-sans text-brand-primary/55">
            <ShieldAlert size={12} /> Stored in this tab only
          </span>
        </div>
        <p className="mt-2 text-[10px] font-sans leading-relaxed text-brand-primary/55">
          Archive and restock call the API with this key. If the backend has no ADMIN_API_KEY set, they
          answer 503 — that is deliberate, so the routes are never open to just anyone.
        </p>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[11px] text-red-700 font-sans">
          {error}
        </div>
      )}
      {notice && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[11px] text-emerald-800 font-sans">
          {notice}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-brand-border bg-brand-card/40 p-4">
            <div className="flex items-center gap-2 text-brand-primary/55">
              <Icon size={13} />
              <span className="text-[9px] font-mono uppercase tracking-widest">{label}</span>
            </div>
            <p className="mt-2 font-serif text-2xl text-brand-primary">{value}</p>
          </div>
        ))}
      </div>

      {/* Inventory table */}
      <section className="mt-10">
        <h2 className="text-xs font-sans font-bold uppercase tracking-widest text-brand-secondary mb-4">
          Inventory ({rows.length})
        </h2>

        <div className="overflow-x-auto rounded-2xl border border-brand-border">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-brand-card/60 text-brand-primary/60">
              <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:text-[9px] [&>th]:font-mono [&>th]:uppercase [&>th]:tracking-widest">
                <th>Tie</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/60">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-brand-primary/55">
                    No inventory rows. Start the backend and refresh.
                  </td>
                </tr>
              )}

              {rows.map((tie) => {
                const stock = stockLabel(tie.quantity);
                const archived = tie.is_active === false;
                const busy = busyId === tie.tie_id;

                return (
                  <tr key={tie.tie_id} className={archived ? 'opacity-55' : ''}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-8 shrink-0 overflow-hidden rounded border border-brand-border bg-brand-bg">
                          {tie.image_url ? (
                            <img
                              src={tie.image_url}
                              alt={tie.tie_name}
                              className="h-full w-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[8px] text-brand-primary/40">
                              no img
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-brand-primary">{tie.tie_name}</p>
                          <p className="truncate font-mono text-[10px] text-brand-primary/45">
                            {tie.tie_id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-brand-primary/80">{formatNaira(tie.price)}</td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-brand-primary">{tie.quantity}</span>
                      <span className="block text-[10px] text-brand-primary/50">{stock.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      {archived ? (
                        <span className="rounded-full bg-brand-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-brand-primary/70">
                          Archived
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-600/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-emerald-800">
                          Live
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <input
                          type="number"
                          min={0}
                          max={500}
                          value={restockDrafts[tie.tie_id] ?? ''}
                          onChange={(event) =>
                            setRestockDrafts((previous) => ({
                              ...previous,
                              [tie.tie_id]: event.target.value,
                            }))
                          }
                          placeholder="qty"
                          className="w-16 rounded-lg border border-brand-border bg-brand-bg px-2 py-1 font-mono text-[11px] text-brand-primary focus:border-brand-secondary focus:outline-none"
                        />
                        <button
                          type="button"
                          disabled={busy || !restockDrafts[tie.tie_id]}
                          onClick={() => restock(tie, Number(restockDrafts[tie.tie_id]))}
                          className="rounded-full bg-brand-primary px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-brand-bg disabled:opacity-40 cursor-pointer"
                        >
                          {busy ? <Loader2 size={10} className="animate-spin" /> : 'Set'}
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => archive(tie, !archived)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-brand-border px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-brand-primary hover:bg-brand-card disabled:opacity-40 cursor-pointer"
                        >
                          {archived ? <ArchiveRestore size={10} /> : <Archive size={10} />}
                          {archived ? 'Restore' : 'Archive'}
                        </button>
                        {tie.image_url && (
                          <button
                            type="button"
                            onClick={() => navigator.clipboard?.writeText(tie.image_url || '')}
                            className="rounded-full border border-brand-border p-1.5 text-brand-primary/60 hover:bg-brand-card cursor-pointer"
                            title="Copy image URL"
                          >
                            <Copy size={10} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-[10px] font-sans leading-relaxed text-brand-primary/55">
          Archiving sets <code className="font-mono">is_active = false</code>: the tie disappears from
          the storefront but keeps every order, hold and pic reference intact. Restocking sets
          <code className="mx-1 font-mono">is_active = true</code> again — a tie that sold out was
          switched off automatically.
        </p>
      </section>

      {/* Broadcast composer */}
      <section className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-brand-border p-5">
          <h2 className="text-xs font-sans font-bold uppercase tracking-widest text-brand-secondary">
            Restock announcement
          </h2>
          <p className="mt-1.5 text-[11px] font-sans leading-relaxed text-brand-primary/60">
            Composes the email/Telegram update. Sending is not wired yet — the copy below is what the
            template and the Telegram message will use.
          </p>

          <label className="mt-4 block text-[10px] font-sans font-bold uppercase tracking-widest text-brand-secondary">
            Tie
          </label>
          <select
            value={broadcastTie}
            onChange={(event) => setBroadcastTie(event.target.value)}
            className="mt-1.5 w-full rounded-xl border border-brand-border bg-brand-bg px-3 py-2.5 text-xs font-sans text-brand-primary focus:border-brand-secondary focus:outline-none"
          >
            <option value="">Select a tie</option>
            {activeTies.map((tie) => (
              <option key={tie.tie_id} value={tie.tie_id}>
                {tie.tie_name} · {tie.quantity} in stock
              </option>
            ))}
          </select>

          <label className="mt-4 block text-[10px] font-sans font-bold uppercase tracking-widest text-brand-secondary">
            Extra line (optional)
          </label>
          <input
            value={broadcastNote}
            onChange={(event) => setBroadcastNote(event.target.value)}
            placeholder="e.g. only 8 pieces this batch"
            className="mt-1.5 w-full rounded-xl border border-brand-border bg-brand-bg px-3 py-2.5 text-xs font-sans text-brand-primary focus:border-brand-secondary focus:outline-none"
          />

          <button
            type="button"
            disabled
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand-primary/40 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-brand-bg cursor-not-allowed"
            title="Requires the Brevo/Telegram sender and the outbox table"
          >
            <Send size={11} /> Send to subscribers
          </button>
          <p className="mt-2 text-[10px] font-sans text-brand-primary/50">
            Not wired yet: needs the Brevo key (or the Telegram subscriber table) and an
            <code className="mx-1 font-mono">outbox</code> table so a retry cannot double-send.
          </p>
        </div>

        <div className="rounded-2xl border border-brand-border bg-brand-card/40 p-5">
          <h3 className="text-[10px] font-mono uppercase tracking-widest text-brand-primary/55">
            Preview
          </h3>
          <div className="mt-3 rounded-xl border border-brand-border bg-brand-bg p-4">
            <p className="text-[9px] font-mono uppercase tracking-widest text-brand-secondary">
              Subject
            </p>
            <p className="mt-1 font-serif text-sm text-brand-primary">
              {broadcastTieRow
                ? `Back in stock: ${broadcastTieRow.tie_name}`
                : 'Back in stock at Knotify'}
            </p>

            <div className="mt-4 border-t border-brand-border/60 pt-3">
              <p className="text-xs font-sans leading-relaxed text-brand-primary">
                {broadcastTieRow
                  ? `${broadcastTieRow.tie_name} is available again — ${broadcastTieRow.quantity} in stock, hall delivery as usual.`
                  : 'Pick a tie to preview the announcement.'}
              </p>
              {broadcastNote && (
                <p className="mt-2 text-xs font-sans text-brand-primary/70">{broadcastNote}</p>
              )}
              <p className="mt-3 inline-block rounded-full bg-brand-secondary px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-brand-bg">
                Reserve yours
              </p>
              <p className="mt-3 border-t border-brand-border/60 pt-2 text-[9px] font-sans text-brand-primary/45">
                You asked for restock alerts at checkout. Unsubscribe · Knotify, Covenant University
              </p>
            </div>
          </div>
          <p className="mt-3 text-[10px] font-sans leading-relaxed text-brand-primary/55">
            Updates are the optional ₦{UPDATES_FEE} add-on. Keep receipts (transactional) separate from
            these announcements: receipts never need consent, restock mail always does.
          </p>
        </div>
      </section>
    </div>
  );
}
