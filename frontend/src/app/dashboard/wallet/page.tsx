"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getBalance, getHistory, deposit, withdraw, type Transaction } from "@/lib/api";
import PullToRefresh from "@/components/PullToRefresh";
import EmptyState from "@/components/EmptyState";
import AnimatedCounter from "@/components/AnimatedCounter";

const typeMeta: Record<string, { label: string; color: string; sign: string }> = {
  deposit: { label: "Depósito", color: "text-emerald-600", sign: "+" },
  release: { label: "Pago recibido", color: "text-emerald-600", sign: "+" },
  refund: { label: "Reembolso", color: "text-emerald-600", sign: "+" },
  withdraw: { label: "Retiro", color: "text-red-500", sign: "-" },
};

const statusStyle: Record<string, string> = {
  confirmed: "bg-emerald-50 text-emerald-600 border-emerald-200",
  pending: "bg-amber-50 text-amber-600 border-amber-200",
  pending_confirmation: "bg-blue-50 text-blue-600 border-blue-200",
  pending_blockchain: "bg-purple-50 text-purple-600 border-purple-200",
  failed: "bg-red-50 text-red-600 border-red-200",
};

function IconArrowLeft() { return (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>); }
function IconCopy() { return (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" /></svg>); }
function IconCheck() { return (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>); }
function IconWallet() { return (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" /></svg>); }
function IconArrowUpRight() { return (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 5.25h9m0 0v9m0-9L3 20.25" /></svg>); }
function IconArrowDownLeft() { return (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m0 0V9.75m0 9L21 3.75" /></svg>); }
function IconInfo() { return (<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>); }

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
  const [error, setError] = useState("");
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [copiedDeposit, setCopiedDeposit] = useState(false);

  const isContractor = user?.role === "contractor";
  const walletAddr = user?.wallet_address;

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

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setDepositSuccess(false);
    if (!txHash || !amount) { setError("Completa todos los campos"); return; }
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) { setError("Monto invalido"); return; }
    setDepositing(true);
    try { await deposit({ tx_hash: txHash, amount: num }); setDepositSuccess(true); setTxHash(""); setAmount(""); loadData(); }
    catch (e: any) { setError(e.message); }
    finally { setDepositing(false); }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setWithdrawSuccess(false);
    if (!withdrawAmount) { setError("Ingresa el monto a retirar"); return; }
    const num = parseFloat(withdrawAmount);
    if (isNaN(num) || num <= 0) { setError("Monto invalido"); return; }
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
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/dashboard" className="text-gray hover:text-primary transition-colors"><IconArrowLeft /></Link>
        <h1 className="text-lg font-bold text-dark">Wallet</h1>
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-5 text-white shadow-lg">
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5" />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/5" />
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
              <svg width="20" height="20" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="22" fill="white" opacity="0.25"/><path d="M17 16h14M24 16v14" stroke="white" strokeWidth="3.5" strokeLinecap="round"/></svg>
            </div>
            <div>
              <p className="text-xs text-white/70">Balance disponible</p>
              <p className="text-2xl sm:text-3xl font-bold tracking-tight">$<AnimatedCounter value={balance} duration={1000} /></p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-white/80">
            <div className="text-right"><p className="text-white/50">Depositado</p><p className="font-semibold">${totalDeposits.toFixed(2)}</p></div>
            <div className="w-px h-8 bg-white/15" />
            <div className="text-right"><p className="text-white/50">{isContractor ? "Retirado" : "Ganado"}</p><p className="font-semibold">${isContractor ? totalWithdrawals.toFixed(2) : totalEarned.toFixed(2)}</p></div>
          </div>
        </div>
      </div>

      {walletAddr && (
        <div className="bg-white rounded-xl border border-gray-200 p-3 flex items-center justify-between gap-3 shadow-sm">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Tu wallet</p>
            <p className="text-sm font-mono text-dark truncate mt-0.5">{walletAddr}</p>
          </div>
          <button onClick={() => copyToClipboard(walletAddr, setCopiedAddr)} className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 text-gray text-xs font-medium hover:bg-gray-200 transition-all">
            {copiedAddr ? <><IconCheck /> Copiada</> : <><IconCopy /> Copiar</>}
          </button>
        </div>
      )}

      {error && (<div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-start gap-2"><IconInfo />{error}</div>)}
      {depositSuccess && (<div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-600 flex items-start gap-2"><IconCheck />Deposito registrado. Fondos se acreditaran tras verificacion.</div>)}
      {withdrawSuccess && (<div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-600 flex items-start gap-2"><IconCheck />Retiro procesado. &gt;$100 requiere confirmacion por email.</div>)}

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
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

        <div className="p-5">
          {!isContractor && (
            <div className="mb-4"><h3 className="font-semibold text-dark">Retirar fondos</h3><p className="text-xs text-gray mt-0.5">Retira tus ganancias a tu wallet registrada</p></div>
          )}

          {tab === "deposit" && isContractor ? (
            <div className="max-w-xl mx-auto space-y-4">
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-24 h-24 bg-white rounded-xl border border-gray-200 p-1.5 shadow-sm overflow-hidden">
                  <img src={"https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" + encodeURIComponent(DEPOSIT_ADDRESS)} alt="QR" className="w-full h-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-dark mb-1">Envia USDT (red Polygon) a la direccion de TurnoGO:</p>
                  <div className="flex items-center gap-1 bg-gray-50 rounded-xl border border-gray-200 p-2.5">
                    <code className="flex-1 text-xs font-mono text-dark break-all leading-relaxed">{DEPOSIT_ADDRESS}</code>
                    <button onClick={() => copyToClipboard(DEPOSIT_ADDRESS, setCopiedDeposit)}
                      className="flex-shrink-0 w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                      {copiedDeposit ? <IconCheck /> : <IconCopy />}
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-700 font-medium">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                    Solo red Polygon (MATIC) - no envies desde otras redes
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { step: "1", title: "Envia USDT", desc: "a la direccion de TurnoGO" },
                  { step: "2", title: "Ingresa hash", desc: "y el monto exacto" },
                  { step: "3", title: "Espera", desc: "confirmacion en minutos" },
                ].map((s, i) => (
                  <div key={i} className="flex items-start gap-2 p-2.5 rounded-xl bg-blue-50/50 border border-blue-100">
                    <div className="w-6 h-6 rounded-lg bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">{s.step}</div>
                    <div><p className="text-xs font-medium text-blue-800">{s.title}</p><p className="text-[10px] text-blue-600">{s.desc}</p></div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleDeposit} className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-dark mb-1">Monto USDT</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary">$</span>
                      <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" min="1" step="0.5"
                        className="w-full pl-7 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-dark mb-1">Hash</label>
                    <input type="text" value={txHash} onChange={(e) => setTxHash(e.target.value)} placeholder="0x..."
                      className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm font-mono" />
                  </div>
                </div>
                <button type="submit" disabled={depositing}
                  className="w-full py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm inline-flex items-center justify-center gap-2">
                  {depositing ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Verificando...</> : "Verificar deposito"}
                </button>
              </form>
            </div>
          ) : (
            <form onSubmit={handleWithdraw} className="max-w-xl mx-auto space-y-4">
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

              <div className={"rounded-xl border p-4 " + (walletAddr ? "bg-white border-gray-200" : "bg-red-50 border-red-200")}>
                <div className="flex items-start gap-3">
                  <div className={"w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 " + (walletAddr ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-500")}>
                    {walletAddr ? <IconCheck /> : <IconWallet />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Retirar a</p>
                    {walletAddr ? (
                      <p className="text-sm font-mono text-dark break-all">{walletAddr}</p>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-red-600">No tienes wallet registrada</p>
                        <Link href="/dashboard/settings" className="inline-flex items-center gap-1 mt-1.5 text-xs font-medium text-primary hover:underline">
                          Agregar wallet en Configuracion
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
                {walletAddr && (
                  <p className="text-[10px] text-gray-400 mt-2">Otra wallet? <Link href="/dashboard/settings" className="text-primary hover:underline">Cambiar en Configuracion</Link></p>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "Min $1", color: "bg-amber-50 text-amber-700 border-amber-200" },
                  { label: "Max 3/dia", color: "bg-amber-50 text-amber-700 border-amber-200" },
                  { label: "> $100 requiere email", color: "bg-amber-50 text-amber-700 border-amber-200" },
                  { label: "Polygon USDT", color: "bg-amber-50 text-amber-700 border-amber-200" },
                ].map((pill, i) => (
                  <span key={i} className={"inline-flex items-center px-2 py-1 text-[10px] font-medium rounded-full border " + pill.color}>
                    {pill.label}
                  </span>
                ))}
              </div>

              <button type="submit" disabled={withdrawing || !walletAddr}
                className="w-full py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm inline-flex items-center justify-center gap-2">
                {withdrawing ? (
                  <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Procesando...</>
                ) : walletAddr ? "Retirar fondos" : "Registra una wallet primero"}
              </button>
            </form>
          )}
        </div>
      </div>

      <PullToRefresh onRefresh={loadData}>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-dark">Historial</h3>
            {history.length > 0 && <span className="text-xs text-gray-400">{history.length} transacciones</span>}
          </div>
          {loading ? (
            <div className="flex justify-center py-10"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : history.length === 0 ? (
            <EmptyState title="Sin movimientos" description={isContractor ? "Deposita fondos para empezar" : "Completa trabajos para recibir pagos"} variant="wallet" actionLabel={isContractor ? "Depositar fondos" : undefined} actionFn={isContractor ? () => setTab("deposit") : undefined} />
          ) : (
            <div className="divide-y divide-gray-100">
              {history.map((tx) => {
                const meta = typeMeta[tx.type] || { label: tx.type, color: "text-dark", sign: "" };
                const stStyle = statusStyle[tx.status] || "bg-gray-50 text-gray border-gray-200";
                return (
                  <div key={tx.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                        {tx.type === "deposit" ? <IconArrowUpRight /> : tx.type === "withdraw" ? <IconArrowDownLeft /> : <IconWallet />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-dark">{meta.label}</p>
                        <p className="text-xs text-gray-400">{new Date(tx.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-2 flex-shrink-0">
                      <p className={"text-sm font-semibold " + meta.color}>{meta.sign}${tx.amount.toFixed(2)}</p>
                      <span className={"px-2 py-0.5 text-[10px] font-medium rounded-full border " + stStyle}>{tx.status.replace(/_/g, " ")}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </PullToRefresh>
    </div>
  );
}
