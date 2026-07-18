"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getBalance, getHistory, deposit, withdraw, type Transaction } from "@/lib/api";
import PullToRefresh from "@/components/PullToRefresh";
import EmptyState from "@/components/EmptyState";
import AnimatedCounter from "@/components/AnimatedCounter";

const typeMeta: Record<string, { label: string; color: string; sign: string }> = {
  deposit: { label: "Depósito", color: "text-blue-600", sign: "+" },
  release: { label: "Pago recibido", color: "text-blue-600", sign: "+" },
  refund: { label: "Reembolso", color: "text-blue-600", sign: "+" },
  withdraw: { label: "Retiro", color: "text-gray-600", sign: "-" },
};

const statusStyle: Record<string, string> = {
  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  pending: "bg-blue-50 text-blue-700 border-blue-200",
  pending_confirmation: "bg-blue-50 text-blue-600 border-blue-200",
  pending_blockchain: "bg-blue-50 text-blue-700 border-blue-200",
  failed: "bg-red-50 text-red-600 border-red-200",
};

// ─── ICONS ───
function IconArrowLeft() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}
function IconCopy({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
    </svg>
  );
}
function IconCheck({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}
function IconArrowUpRight() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 5.25h9m0 0v9m0-9L3 20.25" />
    </svg>
  );
}
function IconArrowDownLeft() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m0 0V9.75m0 9L21 3.75" />
    </svg>
  );
}
function IconInfo() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
  );
}
function IconWallet() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
    </svg>
  );
}

const DEPOSIT_ADDRESS = "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18";

export default function WalletPage() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"deposit" | "withdraw">("deposit");
  const [txHash, setTxHash] = useState("");
  const [amount, setAmount] = useState("");
  const [depositing, setDepositing] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [showStatement, setShowStatement] = useState(false);
  const [error, setError] = useState("");
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [copiedDeposit, setCopiedDeposit] = useState(false);

  const isContractor = user?.role === "contractor";
  const walletAddr = user?.wallet_address;
  const hasWallet = !!walletAddr;

  const loadData = useCallback(async () => {
    setLoading(true); setError("");
    await Promise.all([
      getBalance().then((b) => setBalance(b.balance)).catch(() => {}),
      getHistory().then(setHistory).catch(() => {}),
    ]);
    setLoading(false);
  }, []);

  useEffect(() => { if (user) loadData(); }, [user, loadData]);

  const totalDeposits = history.filter((t) => t.type === "deposit" && t.status === "confirmed").reduce((s, t) => s + t.amount, 0);
  const totalWithdrawals = history.filter((t) => t.type === "withdraw" && t.status === "confirmed").reduce((s, t) => s + t.amount, 0);
  const totalEarned = history.filter((t) => t.type === "release" && t.status === "confirmed").reduce((s, t) => s + t.amount, 0);
  const displayHistory = isContractor ? history : history.filter((t) => t.type !== "deposit");

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setDepositSuccess(false);
    if (!txHash || !amount) { setError("Completa todos los campos"); return; }
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) { setError("Monto inválido"); return; }
    setDepositing(true);
    try { await deposit({ tx_hash: txHash, amount: num }); setDepositSuccess(true); setTxHash(""); setAmount(""); loadData(); }
    catch (e: any) { setError(e.message); }
    finally { setDepositing(false); }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setWithdrawSuccess(false);
    if (!withdrawAmount) { setError("Ingresa el monto a retirar"); return; }
    const num = parseFloat(withdrawAmount);
    if (isNaN(num) || num <= 0) { setError("Monto inválido"); return; }
    if (!walletAddr) { setError("No tienes una wallet registrada"); return; }
    setWithdrawing(true);
    try { await withdraw({ amount: num, to_address: walletAddr }); setWithdrawSuccess(true); setWithdrawAmount(""); loadData(); }
    catch (e: any) { setError(e.message); }
    finally { setWithdrawing(false); }
  };

  const copyToClipboard = async (text: string, setter: (v: boolean) => void) => {
    try { await navigator.clipboard.writeText(text); setter(true); setTimeout(() => setter(false), 2000); } catch {}
  };

  return (
    <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4 w-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link href="/dashboard" className="text-gray hover:text-primary transition-colors"><IconArrowLeft /></Link>
        <h1 className="text-lg font-bold text-dark">Wallet</h1>
      </div>

      {/* ─── BALANCE CARD ─── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 p-4 sm:p-5 text-white shadow-lg">
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5" />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/5" />
        <div className="relative z-10">
          {/* Mobile: stack vertically. Desktop: row with stats */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="22" fill="white" opacity="0.25"/><path d="M17 16h14M24 16v14" stroke="white" strokeWidth="3.5" strokeLinecap="round"/></svg>
              </div>
              <div>
                <p className="text-[11px] sm:text-xs text-white/70">Balance disponible</p>
                <p className="text-2xl sm:text-3xl font-bold tracking-tight">$<AnimatedCounter value={balance} duration={1000} /></p>
              </div>
            </div>

            {/* Stats — hidden on small mobile, visible sm+ */}
            <div className="hidden sm:flex items-center gap-4 text-xs text-white/80">
              {isContractor && <><div className="text-right"><p className="text-white/50">Depositado</p><p className="font-semibold">${totalDeposits.toFixed(2)}</p></div><div className="w-px h-8 bg-white/15" /></>}
              <div className="text-right"><p className="text-white/50">{isContractor ? "Retirado" : "Ganado"}</p><p className="font-semibold">${isContractor ? totalWithdrawals.toFixed(2) : totalEarned.toFixed(2)}</p></div>
            </div>
          </div>

          {/* Mobile stats — below balance */}
          <div className="sm:hidden flex items-center gap-4 mt-3 pt-3 border-t border-white/10">
            {isContractor && <div className="flex-1">
              <p className="text-[10px] text-white/50">Depositado</p>
              <p className="text-xs font-semibold mt-0.5">${totalDeposits.toFixed(2)}</p>
            </div>}
            <div className="flex-1">
              <p className="text-[10px] text-white/50">{isContractor ? "Retirado" : "Ganado"}</p>
              <p className="text-xs font-semibold mt-0.5">${isContractor ? totalWithdrawals.toFixed(2) : totalEarned.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── ALERTS ─── */}
      {error && (<div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-start gap-2"><IconInfo />{error}</div>)}
      {depositSuccess && (<div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700 flex items-start gap-2"><IconCheck />Depósito registrado. Se acreditará tras verificación.</div>)}
      {withdrawSuccess && (<div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700 flex items-start gap-2"><IconCheck />Retiro procesado. &gt;$100 requiere confirmación por email.</div>)}

      {/* ─── TRANSACTIONS TABBED PANEL ─── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        {/* Tabs — only for contractor */}
        {isContractor && (
          <div className="flex bg-gray-50/50 p-1 gap-1 border-b border-gray-100">
            <button onClick={() => setTab("deposit")} className={"flex-1 py-2 text-sm font-medium text-center rounded-lg transition-all " + (tab === "deposit" ? "bg-white text-primary shadow-sm border border-gray-200" : "text-gray hover:text-dark")}>
              <span className="inline-flex items-center gap-1.5"><IconArrowUpRight />Depositar</span>
            </button>
            <button onClick={() => setTab("withdraw")} className={"flex-1 py-2 text-sm font-medium text-center rounded-lg transition-all " + (tab === "withdraw" ? "bg-white text-primary shadow-sm border border-gray-200" : "text-gray hover:text-dark")}>
              <span className="inline-flex items-center gap-1.5"><IconArrowDownLeft />Retirar</span>
            </button>
          </div>
        )}

        <div className="p-4 sm:p-5">
          {!isContractor && (
            <div className="mb-4"><h3 className="font-semibold text-dark">Retirar fondos</h3><p className="text-xs text-gray mt-0.5">Retira tus ganancias a tu wallet registrada</p></div>
          )}

          {/* ===== DEPOSIT TAB ===== */}
          {tab === "deposit" && isContractor ? (
            <div className="max-w-xl mx-auto space-y-4">
              {/* ── QR + Address (stacked on mobile, side-by-side on sm+) ── */}
              <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                {/* QR */}
                <div className="flex-shrink-0 flex sm:block justify-center">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-xl border border-gray-200 p-1.5 shadow-sm">
                    <img
                      src={"https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" + encodeURIComponent(DEPOSIT_ADDRESS)}
                      alt="QR TurnoGO"
                      className="w-full h-full"
                    />
                  </div>
                </div>

                {/* Address info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-dark mb-1.5">
                    Envía USDT (red Polygon) a TurnoGO:
                  </p>

                  {/* Address copy bar */}
                  <div className="flex items-center gap-1.5 bg-gray-50 rounded-xl border border-gray-200 p-2.5">
                    <code className="flex-1 text-xs font-mono text-dark break-all leading-relaxed select-all">{DEPOSIT_ADDRESS}</code>
                    <button
                      onClick={() => copyToClipboard(DEPOSIT_ADDRESS, setCopiedDeposit)}
                      className="flex-shrink-0 w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 transition-colors"
                      title="Copiar dirección"
                    >
                      {copiedDeposit ? <IconCheck className="w-4 h-4 text-primary" /> : <IconCopy className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Network warning */}
                  <div className="flex items-center gap-1.5 mt-2 px-2.5 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-[10px] sm:text-[11px] text-blue-700 font-medium">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                    Solo red Polygon (MATIC). No envíes desde otras redes.
                  </div>
                </div>
              </div>

              {/* ── Steps: horizontal pills on mobile, compact grid on sm+ ── */}
              <div className="flex gap-2">
                {[
                  { step: "1", title: "Envía USDT", desc: "a la dirección de arriba" },
                  { step: "2", title: "Ingresa hash", desc: "y el monto exacto" },
                  { step: "3", title: "Confirma", desc: "se acredita en minutos" },
                ].map((s, i) => (
                  <div key={i} className="flex-1 flex items-center gap-2 p-2.5 rounded-xl bg-blue-50/50 border border-blue-100">
                    <span className="w-5 h-5 rounded-md bg-primary text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">{s.step}</span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-blue-800 leading-tight">{s.title}</p>
                      <p className="text-[10px] text-blue-600/70 leading-tight">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Deposit form ── */}
              <form onSubmit={handleDeposit} className="bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-100 space-y-3">
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div>
                    <label className="block text-[11px] sm:text-xs font-medium text-dark mb-1">Monto USDT</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary">$</span>
                      <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" min="1" step="0.5"
                        className="w-full pl-7 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] sm:text-xs font-medium text-dark mb-1">Hash de transacción</label>
                    <input type="text" value={txHash} onChange={(e) => setTxHash(e.target.value)} placeholder="0x..."
                      className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm font-mono" />
                  </div>
                </div>
                <button type="submit" disabled={depositing}
                  className="w-full py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm inline-flex items-center justify-center gap-2">
                  {depositing ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Verificando...</> : "Verificar depósito"}
                </button>
              </form>
            </div>
          ) : (
            /* ===== WITHDRAW TAB ===== */
            <form onSubmit={handleWithdraw} className="max-w-md mx-auto space-y-4">
              {/* Amount input */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-medium text-dark">Monto a retirar</label>
                  <span className="text-[11px] text-gray-400">Disponible: <span className="font-semibold text-dark">${balance.toFixed(2)}</span></span>
                </div>
                <div className="relative mb-3">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-primary">$</span>
                  <input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="0.00" min="1" step="0.5"
                    className="w-full pl-8 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm" />
                </div>
                <div className="flex gap-1.5">
                  {[10, 25, 50, 100].map((v) => (
                    <button key={v} type="button" onClick={() => setWithdrawAmount(String(v))}
                      className="flex-1 py-1.5 text-[11px] font-medium rounded-lg border border-gray-200 bg-white text-gray hover:border-primary hover:text-primary transition-all">
                      ${v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Destination wallet */}
              <div className={"rounded-xl border p-3 sm:p-4 " + (hasWallet ? "bg-white border-gray-200" : "bg-gray-50 border-gray-200")}>
                <div className="flex items-start gap-3">
                  <div className={"w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center flex-shrink-0 " + (hasWallet ? "bg-blue-100 text-primary" : "bg-gray-100 text-gray-400")}>
                    {hasWallet ? <IconCheck className="w-4 h-4" /> : <IconWallet />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Retirar a</p>
                    {hasWallet ? (
                      <>
                        <p className="text-sm font-mono text-dark break-all leading-snug">{walletAddr}</p>
                        <p className="text-[10px] text-gray-400 mt-1.5">
                          ¿Otra wallet? <Link href="/dashboard/settings" className="text-primary hover:underline font-medium">Cambiar en Configuración</Link>
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-gray-500">No tienes wallet registrada</p>
                        <Link href="/dashboard/settings" className="inline-flex items-center gap-1 mt-1.5 text-xs font-medium text-primary hover:underline">
                          Agregar wallet en Configuración
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Withdraw info pills */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "Mín $1", color: "bg-blue-50 text-blue-700 border-blue-200" },
                  { label: "Máx 3/día", color: "bg-blue-50 text-blue-700 border-blue-200" },
                  { label: ">$100 requiere email", color: "bg-blue-50 text-blue-700 border-blue-200" },
                  { label: "Polygon USDT", color: "bg-blue-50 text-blue-700 border-blue-200" },
                ].map((pill, i) => (
                  <span key={i} className={"inline-flex items-center px-2 py-1 text-[10px] font-medium rounded-full border " + pill.color}>
                    {pill.label}
                  </span>
                ))}
              </div>

              <button type="submit" disabled={withdrawing || !hasWallet}
                className="w-full py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm inline-flex items-center justify-center gap-2">
                {withdrawing ? (
                  <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Procesando...</>
                ) : hasWallet ? "Retirar fondos" : "Registra una wallet primero"}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* ─── HISTORY ─── */}
      <PullToRefresh onRefresh={loadData}>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-dark">Historial</h3>
              {displayHistory.length > 0 && <span className="text-xs text-gray-400">{displayHistory.length} transacciones</span>}
            </div>
            {displayHistory.length > 0 && (
              <button onClick={() => setShowStatement(true)} className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-primary bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all flex-shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
                </svg>
                Estado de cuenta
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : history.length === 0 ? (
            <EmptyState
              title="Sin movimientos"
              description={isContractor ? "Deposita fondos para empezar" : "Completa trabajos para recibir pagos"}
              variant="wallet"
              actionLabel={isContractor ? "Depositar fondos" : undefined}
              actionFn={isContractor ? () => setTab("deposit") : undefined}
            />
          ) : (
            <div className="divide-y divide-gray-100">
              {history.map((tx) => {
                const meta = typeMeta[tx.type] || { label: tx.type, color: "text-dark", sign: "" };
                const stStyle = statusStyle[tx.status] || "bg-gray-50 text-gray-500 border-gray-200";
                return (
                  <div key={tx.id} className="px-4 sm:px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                        {tx.type === "deposit" || tx.type === "release" || tx.type === "refund" ? <IconArrowUpRight /> : <IconArrowDownLeft />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-dark truncate">{meta.label}</p>
                        <p className="text-[11px] text-gray-400">{new Date(tx.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-2 flex-shrink-0">
                      <p className={"text-sm font-semibold whitespace-nowrap " + meta.color}>{meta.sign}${tx.amount.toFixed(2)}</p>
                      <span className={"px-2 py-0.5 text-[10px] font-medium rounded-full border whitespace-nowrap " + stStyle}>{tx.status.replace(/_/g, " ")}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </PullToRefresh>

      {/* --- BANK STATEMENT MODAL --- */}
      {showStatement && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center pt-10 sm:pt-16 pb-10 px-4 overflow-y-auto" onClick={() => setShowStatement(false)}>
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50/50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-dark">Estado de cuenta</h3>
                  <p className="text-[11px] text-gray-400">Agrupado por mes</p>
                </div>
              </div>
              <button onClick={() => setShowStatement(false)} className="w-8 h-8 rounded-lg bg-gray-100 text-gray hover:bg-gray-200 transition-all flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="divide-y divide-gray-100 max-h-[70vh] overflow-y-auto dashboard-scroll">
              {(() => {
                const months = displayHistory.reduce((acc, tx) => {
                  const d = new Date(tx.created_at);
                  const key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
                  if (!acc[key]) acc[key] = [];
                  acc[key].push(tx);
                  return acc;
                }, {} as Record<string, any[]>);
                const sortedKeys = Object.keys(months).sort((a, b) => b.localeCompare(a));
                if (sortedKeys.length === 0) return <div className="p-8 text-center text-sm text-gray-400">No hay transacciones</div>;
                return sortedKeys.map((monthKey) => {
                  const txs = months[monthKey];
                  const [y, m] = monthKey.split("-");
                  const monthName = new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleDateString("es-ES", { month: "long", year: "numeric" });
                  const credits = txs.reduce((s, t) => s + (t.type === "deposit" || t.type === "release" || t.type === "refund" ? t.amount : 0), 0);
                  const debits = txs.reduce((s, t) => s + (t.type === "payment" || t.type === "withdraw" || t.type === "escrow" ? t.amount : 0), 0);
                  const net = credits - debits;
                  const cap = monthName.charAt(0).toUpperCase() + monthName.slice(1);
                  return (
                    <div key={monthKey}>
                      <div className="sticky top-0 bg-gradient-to-r from-blue-50/90 to-white/90 backdrop-blur-sm px-5 py-3 border-b border-blue-100/50">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-blue-800 uppercase tracking-widest">{cap}</span>
                          <span className={"text-sm font-bold " + (net >= 0 ? "text-emerald-600" : "text-red-600")}>
                            {net >= 0 ? "+" : ""}{net.toFixed(2)} USDT
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-[11px]">
                          <span className="text-blue-600">+{credits.toFixed(2)}</span>
                          <span className="text-gray-300">|</span>
                          <span className="text-red-500">-{debits.toFixed(2)}</span>
                          <span className="text-gray-400">{txs.length} {txs.length === 1 ? "op" : "ops"}</span>
                        </div>
                      </div>
                      <div className="divide-y divide-gray-50">
                        {txs.map((tx) => {
                          const meta = typeMeta[tx.type] || { label: tx.type, color: "text-dark", sign: "" };
                          const stStyle = statusStyle[tx.status] || "bg-gray-50 text-gray-500 border-gray-200";
                          const isCredit = tx.type === "deposit" || tx.type === "release" || tx.type === "refund";
                          return (
                            <div key={tx.id} className="px-5 py-2.5 flex items-center justify-between hover:bg-blue-50/20 transition-colors">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={"w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 " + (isCredit ? "bg-blue-50 text-blue-500" : "bg-gray-50 text-gray-400")}>
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    {isCredit ? <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" /> : <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 4.5l-15 15m0 0h11.25m-11.25 0V8.25" />}
                                  </svg>
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-dark">{meta.label}</p>
                                  <p className="text-[10px] text-gray-400">{new Date(tx.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                                </div>
                              </div>
                              <div className="text-right flex items-center gap-2 flex-shrink-0">
                                <p className={"text-sm font-semibold whitespace-nowrap " + (isCredit ? "text-blue-600" : "text-gray-600")}>
                                  {isCredit ? "+" : "-"}${tx.amount.toFixed(2)}
                                </p>
                                <span className={"px-2 py-0.5 text-[10px] font-medium rounded-full border whitespace-nowrap " + stStyle}>{tx.status.replace(/_/g, " ")}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
