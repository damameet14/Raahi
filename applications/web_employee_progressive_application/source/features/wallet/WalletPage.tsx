/**
 * Wallet screen: balance, Razorpay top-up, and the transaction ledger.
 *
 * Recharge opens Razorpay Checkout for the chosen amount and credits the
 * balance only after the signed result verifies server-side.
 */

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDownLeft, ArrowUpRight, IndianRupee } from "lucide-react";
import toast from "react-hot-toast";

import { EmployeeAppHeader } from "../../shared_user_interface_infrastructure/layout/EmployeeAppHeader";
import { PrimaryButton } from "../../shared_user_interface_infrastructure/reusable_components/PrimaryButton";
import { extractApiErrorMessage } from "../../shared_user_interface_infrastructure/backend_communication/extractApiErrorMessage";
import { useEmployeeProfileQuery } from "../../shared_user_interface_infrastructure/employee_profile/useEmployeeProfileQuery";
import {
  createWalletRechargeOrder,
  getWalletBalance,
  listWalletTransactions,
  verifyWalletRecharge,
} from "../../shared_user_interface_infrastructure/backend_communication/employee_payment_api";
import type { WalletTransactionResponse } from "../../shared_user_interface_infrastructure/backend_communication/employee_payment_api";
import { openRazorpayCheckout } from "../payments/razorpayCheckout";

const QUICK_RECHARGE_AMOUNTS = [100, 250, 500, 1000];

export function WalletPage() {
  const queryClient = useQueryClient();
  const profileQuery = useEmployeeProfileQuery();
  const [rechargeAmount, setRechargeAmount] = useState("500");
  const [isRecharging, setIsRecharging] = useState(false);

  const balanceQuery = useQuery({
    queryKey: ["employee-wallet"],
    queryFn: getWalletBalance,
  });
  const transactionsQuery = useQuery({
    queryKey: ["employee-wallet-transactions"],
    queryFn: listWalletTransactions,
  });

  async function refreshWallet() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["employee-wallet"] }),
      queryClient.invalidateQueries({
        queryKey: ["employee-wallet-transactions"],
      }),
    ]);
  }

  async function handleRecharge() {
    const amount = Number(rechargeAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter an amount greater than zero");
      return;
    }
    setIsRecharging(true);
    try {
      const order = await createWalletRechargeOrder(amount);
      await openRazorpayCheckout(order, {
        prefillName: profileQuery.data?.full_name,
        prefillEmail: profileQuery.data?.email,
        prefillContact: profileQuery.data?.phone ?? undefined,
        onVerified: async (checkoutResult) => {
          try {
            await verifyWalletRecharge(checkoutResult);
            toast.success("Wallet recharged");
            await refreshWallet();
          } catch (verificationError) {
            toast.error(
              extractApiErrorMessage(
                verificationError,
                "We could not verify the recharge",
              ),
            );
          } finally {
            setIsRecharging(false);
          }
        },
        onDismissed: () => {
          toast("Recharge cancelled");
          setIsRecharging(false);
        },
      });
    } catch (error) {
      toast.error(extractApiErrorMessage(error, "Recharge could not be started"));
      setIsRecharging(false);
    }
  }

  const balance = balanceQuery.data;
  const transactions = transactionsQuery.data ?? [];

  return (
    <div className="min-h-screen pb-10">
      <EmployeeAppHeader title="Wallet" leftAction="back" />

      <div className="flex flex-col gap-6 px-4 py-4">
        <section className="rounded-2xl bg-raahi-700 p-5 text-white">
          <p className="text-xs uppercase tracking-wide text-white/70">
            Available balance
          </p>
          <p className="mt-1 flex items-center gap-1 text-3xl font-bold">
            <IndianRupee size={24} />
            {balanceQuery.isLoading
              ? "…"
              : (balance?.balance_amount ?? 0).toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-white/70">
            {balance?.currency ?? "INR"} · Spendable on ride fares
          </p>
        </section>

        <section className="rounded-2xl border border-[color:var(--color-border-primary)] bg-white p-4">
          <h2 className="mb-3 text-sm font-bold">Add money</h2>
          <div className="mb-3 flex flex-wrap gap-2">
            {QUICK_RECHARGE_AMOUNTS.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => setRechargeAmount(String(amount))}
                className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                  rechargeAmount === String(amount)
                    ? "border-raahi-600 bg-raahi-50 text-raahi-700"
                    : "border-[color:var(--color-border-primary)] text-text-secondary"
                }`}
              >
                ₹{amount}
              </button>
            ))}
          </div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">
            Amount (₹)
          </label>
          <input
            type="number"
            min={1}
            value={rechargeAmount}
            onChange={(event) => setRechargeAmount(event.target.value)}
            className="mb-3 w-full rounded-xl border border-[color:var(--color-border-primary)] px-3 py-2.5 text-sm"
          />
          <PrimaryButton onClick={handleRecharge} isLoading={isRecharging}>
            Recharge with Razorpay
          </PrimaryButton>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold">Transactions</h2>
          {transactionsQuery.isLoading ? (
            <EmptyState message="Loading transactions..." />
          ) : transactions.length > 0 ? (
            <div className="flex flex-col gap-2">
              {transactions.map((transaction) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                />
              ))}
            </div>
          ) : (
            <EmptyState message="No transactions yet" />
          )}
        </section>
      </div>
    </div>
  );
}

function TransactionRow({
  transaction,
}: {
  transaction: WalletTransactionResponse;
}) {
  const isCredit = transaction.direction === "CREDIT";
  return (
    <article className="flex items-center justify-between gap-3 rounded-xl border border-[color:var(--color-border-primary)] bg-white p-3">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-full ${
            isCredit
              ? "bg-raahi-50 text-raahi-700"
              : "bg-surface-secondary text-text-secondary"
          }`}
        >
          {isCredit ? (
            <ArrowDownLeft size={16} />
          ) : (
            <ArrowUpRight size={16} />
          )}
        </span>
        <div>
          <p className="text-sm font-semibold">
            {transaction.description ?? transaction.transaction_type}
          </p>
          <p className="text-xs text-text-muted">
            {new Date(transaction.created_at).toLocaleString()} ·{" "}
            {transaction.status}
          </p>
        </div>
      </div>
      <span
        className={`flex items-center gap-0.5 text-sm font-bold ${
          isCredit ? "text-raahi-700" : "text-text-primary"
        }`}
      >
        {isCredit ? "+" : "−"}
        <IndianRupee size={13} />
        {transaction.amount.toFixed(0)}
      </span>
    </article>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[color:var(--color-border-secondary)] bg-surface-secondary p-6 text-center text-sm text-text-muted">
      {message}
    </div>
  );
}
