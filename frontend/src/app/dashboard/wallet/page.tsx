"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getBalance, getHistory, deposit, withdraw, type Transaction } from "@/lib/api";
import PullToRefresh from "@/components/PullToRefresh";

const typeMeta: Record<string, { icon: string; label: string; color: string; sign: string }> = {
  deposit: { icon: "📥", label: "Depósito", color: "text-secondary", sign: "+" },
  release: { icon: "💸", label: "Pago recibido", color: "text-primary", sign: "+" },
  refund: { icon: "↩️", label: "Reembolso", color: "text-accent", sign: "+" },
  withdraw: { icon: "🏦", label: "Retiro", color: "text-red-500", sign: "-" },
};

const statusStyle: Record<string, string> = {
  confirmed: "bg-emerald-50 text-emerald-600 border-emerald-200",
  pending: "bg-amber-50 text-amber-600 border-amber-200",
  pending_confirmation: "bg-blue-50 text-blue-600 border-blue-200",
  pending_blockchain: "bg-purple-50 text-purple-600 border-purple-200",
  failed: "bg-red-50 text-red-600 border-red-200",
};

export default function WalletPage() {
  const { user } = useAuth();

  // Data
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Tabs
  const [tab, setTab] = useState<"deposit" | "withdraw">("deposit");

  // Deposit
  const [txHash, setTxHash] = useState("");
  const [amount, setAmount] = useState("");
  const [depositing, setDepositing] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState(false);

  // Withdraw
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const isContractor = user?.role === "contractor";
  const walletAddr = user?.wallet_address;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    await Promise.all([
      getBalance().then((b) => setBalance(b.balance)).catch(() => {}),
      getHistory().then(setHistory).catch(() => {}),
    ]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  // ─── Stats ───
  const totalDeposits = history.filter((t) => t.type === "deposit" && t.status === "confirmed").reduce((s, t) => s + t.amount, 0);
  const totalWithdrawals = history.filter((t) => t.type === "withdraw" && t.status === "confirmed").reduce((s, t) => s + t.amount, 0);
  const totalEarned = history.filter((t) => t.type === "release" && t.status === "confirmed").reduce((s, t) => s + t.amount, 0);

  // ─── Actions ───
  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setDepositSuccess(false);
    if (!txHash || !amount) { setError("Completa todos los campos"); return; }
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) { setError("Monto inválido"); return; }
    setDepositing(true);
    try {
      await deposit({ tx_hash: txHash, amount: num });
      setDepositSuccess(true); setTxHash(""); setAmount("");
      loadData();
    } catch (e: any) { setError(e.message); }
    finally { setDepositing(false); }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setWithdrawSuccess(false);
    if (!withdrawAmount) { setError("Ingresa el monto a retirar"); return; }
    const num = parseFloat(withdrawAmount);
    if (isNaN(num) || num <= 0) { setError("Monto inválido"); return; }
    if (!walletAddr) { setError("No tienes una wallet registrada. Ve a Configuración para agregar una."); return; }
    setWithdrawing(true);
    try {
      await withdraw({ amount: num, to_address: walletAddr });
      setWithdrawSuccess(true); setWithdrawAmount("");
      loadData();
    } catch (e: any) { setError(e.message); }
    finally { setWithdrawing(false); }
  };

  const copyAddress = () => {
    if (walletAddr) {
      navigator.clipboard.writeText(walletAddr);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ─── HEADER ─── */}
      <div className="flex items-center gap-2">
        <Link href="/dashboard" className="text-gray hover:text-primary transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-dark">Wallet</h1>
      </div>

      {/* ─── BALANCE CARD ─── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-6 sm:p-8 text-white shadow-xl">
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                <svg width="22" height="22" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="24" cy="24" r="22" fill="white" opacity="0.25"/>
                  <path d="M17 16h14M24 16v14" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M31 26c2.5-2 3.5-5 3-7.5" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
                  <circle cx="34" cy="18.5" r="1.5" fill="white" opacity="0.6"/>
                </svg>
              </div>
              <div>
                <p className="text-sm text-white/70">Balance disponible</p>
                <p className="text-3xl sm:text-4xl font-bold tracking-tight">
                  ${balance.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 text-xs backdrop-blur-sm">
              <span className="text-white/70">USDT</span>
              <span className="text-white font-semibold">Polygon</span>
            </div>
          </div>

          {/* Mini stats */}
          <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-white/15">
            <div>
              <p className="text-xs text-white/60">Depositado</p>
              <p className="text-sm font-semibold">${totalDeposits.toFixed(2)}</p>
            </div>
            {isContractor ? (
              <div>
                <p className="text-xs text-white/60">Retirado</p>
                <p className="text-sm font-semibold">${totalWithdrawals.toFixed(2)}</p>
              </div>
            ) : (
              <div>
                <p className="text-xs text-white/60">Ganado</p>
                <p className="text-sm font-semibold">${totalEarned.toFixed(2)}</p>
              </div>
            )}
            <div className="text-right">
              <p className="text-xs text-white/60">Transacciones</p>
              <p className="text-sm font-semibold">{history.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── WALLET ADDRESS INFO (if set) ─── */}
      {walletAddr && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray mb-0.5">Wallet registrada</p>
            <p className="text-sm font-mono text-dark truncate">{walletAddr}</p>
          </div>
          <button
            onClick={copyAddress}
            className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-gray-100 text-gray text-xs font-medium hover:bg-gray-200 transition-colors"
          >
            {copied ? "✅ Copiado" : "Copiar"}
          </button>
        </div>
      )}

      {/* ─── MESSAGES ─── */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-start gap-2">
          <span className="mt-0.5">⚠️</span>
          <span>{error}</span>
        </div>
      )}
      {depositSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-600 flex items-start gap-2">
          <span className="mt-0.5">✅</span>
          <span>Depósito registrado. Los fondos se acreditarán después de la verificación en blockchain.</span>
        </div>
      )}
      {withdrawSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-600 flex items-start gap-2">
          <span className="mt-0.5">✅</span>
          <span>Retiro procesado. Si supera los $100, revisa tu correo para confirmar.</span>
        </div>
      )}

      {/* ─── DEPOSIT / WITHDRAW ─── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        {/* Tab bar — solo contractors */}
        {isContractor && (
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setTab("deposit")}
              className={`flex-1 py-3.5 text-sm font-medium text-center transition-all relative ${
                tab === "deposit" ? "text-primary" : "text-gray hover:text-dark"
              }`}
            >
              📥 Depositar
              {tab === "deposit" && <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary rounded-full" />}
            </button>
            <button
              onClick={() => setTab("withdraw")}
              className={`flex-1 py-3.5 text-sm font-medium text-center transition-all relative ${
                tab === "withdraw" ? "text-primary" : "text-gray hover:text-dark"
              }`}
            >
              🏦 Retirar
              {tab === "withdraw" && <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary rounded-full" />}
            </button>
          </div>
        )}

        <div className="p-6">
          {/* Workers ven solo el retiro directamente */}
          {!isContractor && (
            <div className="mb-4">
              <h3 className="font-semibold text-dark">🏦 Retirar fondos</h3>
              <p className="text-sm text-gray mt-0.5">Retira tus ganancias a tu wallet registrada</p>
            </div>
          )}
          {tab === "deposit" && isContractor ? (
              <form onSubmit={handleDeposit} className="max-w-md mx-auto space-y-5">
                {/* Guide */}
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 text-sm text-blue-700">
                  <p className="font-medium mb-1">📍 Cómo depositar</p>
                  <ol className="space-y-1 text-xs text-blue-600 ml-4 list-decimal">
                    <li>Envía USDT desde tu wallet externa a la dirección de TurnoGO</li>
                    <li>Ingresa el hash de la transacción y el monto</li>
                    <li>Espera la confirmación en blockchain (minutos)</li>
                  </ol>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark mb-1.5">Monto en USDT</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-primary">$</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      min="1"
                      step="0.5"
                      className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark mb-1.5">Hash de transacción</label>
                  <input
                    type="text"
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm font-mono"
                  />
                </div>
                <button
                  type="submit"
                  disabled={depositing}
                  className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {depositing ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Verificando...
                    </span>
                  ) : (
                    "Verificar depósito"
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleWithdraw} className="max-w-md mx-auto space-y-5">
                {/* Guide */}
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 text-sm text-amber-700">
                  <p className="font-medium mb-1">⚡ Importante</p>
                  <ul className="space-y-1 text-xs text-amber-600 ml-4 list-disc">
                    <li>Retiro mínimo: <strong>$1</strong></li>
                    <li>Máximo <strong>3 retiros</strong> por día</li>
                    <li>Retiros &gt;$100 requieren confirmación por email</li>
                    <li>Usa una dirección <strong>Polygon (USDT)</strong> válida</li>
                  </ul>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark mb-1.5">Monto a retirar</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-primary">$</span>
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="0.00"
                      min="1"
                      step="0.5"
                      className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm"
                    />
                  </div>
                </div>
                {/* Wallet registrada (solo lectura) */}
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <svg width="16" height="16" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17 16h14M24 16v14" stroke="#6B7280" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray mb-0.5">Retirar a tu wallet registrada</p>
                      <p className="text-sm font-mono text-dark break-all">{walletAddr || "—"}</p>
                    </div>
                  </div>
                  {!walletAddr && (
                    <p className="text-xs text-red-500 mt-2">
                      ⚠️ No tienes una wallet registrada.{' '}
                      <Link href="/dashboard/settings" className="text-primary hover:underline font-medium">
                        Agregar en Configuración
                      </Link>
                    </p>
                  )}
                  {walletAddr && (
                    <p className="text-xs text-gray mt-2">
                      Para cambiar la wallet, ve a{' '}
                      <Link href="/dashboard/settings" className="text-primary hover:underline">
                        Configuración
                      </Link>
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={withdrawing}
                  className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {withdrawing ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Procesando...
                    </span>
                  ) : (
                    "Retirar fondos"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

      {/* ─── HISTORY ─── */}
      <PullToRefresh onRefresh={loadData}>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-dark">Historial</h3>
            {history.length > 0 && (
              <span className="text-xs text-gray">{history.length} transacciones</span>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-14">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-3xl mx-auto mb-4">💳</div>
              <p className="text-dark font-medium">Sin movimientos</p>
              <p className="text-sm text-gray mt-1">
                {isContractor ? "Deposita fondos para empezar" : "Completa trabajos para recibir pagos"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {history.map((tx) => {
                const meta = typeMeta[tx.type] || { icon: "💱", label: tx.type, color: "text-dark", sign: "" };
                const stStyle = statusStyle[tx.status] || "bg-gray-50 text-gray border-gray-200";
                return (
                  <div
                    key={tx.id}
                    className="px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-lg flex-shrink-0">
                        {meta.icon}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-dark">{meta.label}</p>
                        <p className="text-xs text-gray mt-0.5">
                          {new Date(tx.created_at).toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <p className={`text-sm font-semibold ${meta.color}`}>
                        {meta.sign}${tx.amount.toFixed(2)}
                      </p>
                      <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full border ${stStyle}`}>
                        {tx.status.replace(/_/g, " ")}
                      </span>
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
