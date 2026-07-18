/**
 * Payments screen (replaces the payments placeholder route).
 *
 * Shows fares the employee still owes as a passenger with a method chooser,
 * a shortcut into the wallet, and a receipt list of past payments they made
 * or earned.
 */

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ArrowRight, IndianRupee, Wallet } from "lucide-react";

import { EmployeeAppHeader } from "../../shared_user_interface_infrastructure/layout/EmployeeAppHeader";
import { PrimaryButton } from "../../shared_user_interface_infrastructure/reusable_components/PrimaryButton";
import { listMyPassengerBookings } from "../../shared_user_interface_infrastructure/backend_communication/employee_ride_api";
import { listMyPayments } from "../../shared_user_interface_infrastructure/backend_communication/employee_payment_api";
import type { PaymentResponse } from "../../shared_user_interface_infrastructure/backend_communication/employee_payment_api";
import type { RideBooking } from "../../shared_user_interface_infrastructure/backend_communication/employee_api_types";
import { useEmployeeProfileQuery } from "../../shared_user_interface_infrastructure/employee_profile/useEmployeeProfileQuery";
import { formatTravelDate } from "../upcoming_rides/upcomingRideSelectors";
import { PayFareDialog } from "./PayFareDialog";

export function PaymentsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const profileQuery = useEmployeeProfileQuery();
  const [bookingToPay, setBookingToPay] = useState<RideBooking | null>(null);

  const passengerBookingsQuery = useQuery({
    queryKey: ["employee-passenger-bookings"],
    queryFn: listMyPassengerBookings,
  });
  const paymentsQuery = useQuery({
    queryKey: ["employee-payments"],
    queryFn: listMyPayments,
  });

  const unpaidBookings = (passengerBookingsQuery.data ?? []).filter(
    (booking) =>
      booking.trip_status === "COMPLETED" &&
      booking.payment_status === "UNPAID",
  );
  const payments = paymentsQuery.data ?? [];

  async function handlePaid() {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["employee-passenger-bookings"],
      }),
      queryClient.invalidateQueries({ queryKey: ["employee-payments"] }),
      queryClient.invalidateQueries({ queryKey: ["employee-wallet"] }),
      queryClient.invalidateQueries({ queryKey: ["employee-ride-history"] }),
    ]);
  }

  return (
    <div className="min-h-screen pb-10">
      <EmployeeAppHeader title="Payments" leftAction="menu" />

      <div className="flex flex-col gap-6 px-4 py-4">
        <button
          type="button"
          onClick={() => navigate("/wallet")}
          className="flex items-center gap-3 rounded-2xl border border-[color:var(--color-border-primary)] bg-white p-4 text-left transition hover:bg-surface-secondary"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-secondary text-raahi-700">
            <Wallet size={20} />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-bold">Raahi Wallet</span>
            <span className="block text-xs text-text-muted">
              View balance, recharge, and see transactions
            </span>
          </span>
          <ArrowRight size={18} className="text-text-muted" />
        </button>

        <section>
          <h2 className="mb-3 text-lg font-bold">Fares to pay</h2>
          {passengerBookingsQuery.isLoading ? (
            <EmptyState message="Loading your fares..." />
          ) : unpaidBookings.length > 0 ? (
            <div className="flex flex-col gap-3">
              {unpaidBookings.map((booking) => (
                <FareToPayCard
                  key={booking.id}
                  booking={booking}
                  onPay={() => setBookingToPay(booking)}
                />
              ))}
            </div>
          ) : (
            <EmptyState message="You're all settled up — no fares due" />
          )}
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold">Receipts</h2>
          {paymentsQuery.isLoading ? (
            <EmptyState message="Loading receipts..." />
          ) : payments.length > 0 ? (
            <div className="flex flex-col gap-3">
              {payments.map((payment) => (
                <ReceiptCard
                  key={payment.id}
                  payment={payment}
                  isEarning={
                    payment.payee_employee_id === profileQuery.data?.id
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyState message="No payments yet" />
          )}
        </section>
      </div>

      {bookingToPay && (
        <PayFareDialog
          isOpen={bookingToPay !== null}
          onClose={() => setBookingToPay(null)}
          rideBookingId={bookingToPay.id}
          fareAmount={bookingToPay.fare_amount}
          currency="INR"
          onPaid={handlePaid}
          prefill={{
            name: profileQuery.data?.full_name,
            email: profileQuery.data?.email,
            phone: profileQuery.data?.phone,
          }}
        />
      )}
    </div>
  );
}

function FareToPayCard({
  booking,
  onPay,
}: {
  booking: RideBooking;
  onPay: () => void;
}) {
  return (
    <article className="rounded-2xl border border-[color:var(--color-border-primary)] bg-white p-4">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold">
            {formatTravelDate(booking.travel_date)} · {booking.departure_time}
          </p>
          <p className="text-xs text-text-muted">
            Driver: {booking.driver_full_name}
          </p>
        </div>
        <span className="flex items-center gap-1 text-sm font-bold">
          <IndianRupee size={14} />
          {booking.fare_amount.toFixed(0)}
        </span>
      </div>
      <div className="mb-3 flex items-center gap-2 text-sm">
        <span className="truncate">{booking.pickup_label ?? "Pickup"}</span>
        <ArrowRight size={14} className="shrink-0 text-text-muted" />
        <span className="truncate">{booking.drop_label ?? "Destination"}</span>
      </div>
      <PrimaryButton onClick={onPay}>Pay fare</PrimaryButton>
    </article>
  );
}

function ReceiptCard({
  payment,
  isEarning,
}: {
  payment: PaymentResponse;
  isEarning: boolean;
}) {
  return (
    <article className="flex items-center justify-between gap-3 rounded-2xl border border-[color:var(--color-border-primary)] bg-white p-4">
      <div>
        <p className="text-sm font-semibold">
          {isEarning ? "Fare earned" : "Fare paid"} · {payment.method}
        </p>
        <p className="text-xs text-text-muted">
          {new Date(payment.created_at).toLocaleDateString()} ·{" "}
          {payment.status}
        </p>
      </div>
      <span
        className={`flex items-center gap-1 text-sm font-bold ${
          isEarning ? "text-raahi-700" : "text-text-primary"
        }`}
      >
        {isEarning ? "+" : "−"}
        <IndianRupee size={13} />
        {payment.amount.toFixed(0)}
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
