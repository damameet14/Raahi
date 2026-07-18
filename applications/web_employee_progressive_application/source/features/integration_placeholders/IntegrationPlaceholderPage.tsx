import { MessageCircle, WalletCards } from "lucide-react";

import { EmployeeAppHeader } from "../../shared_user_interface_infrastructure/layout/EmployeeAppHeader";

interface IntegrationPlaceholderPageProps {
  kind: "payments" | "chat";
}

const placeholderCopy = {
  payments: {
    title: "Payment Methods",
    heading: "Payments are being integrated",
    description:
      "This route is reserved for cash, card, UPI, and wallet management once the payment module is merged.",
    icon: WalletCards,
  },
  chat: {
    title: "Chat",
    heading: "Chat is being integrated",
    description:
      "This route is reserved for ride coordination chat and call handoff once the chat server is merged.",
    icon: MessageCircle,
  },
};

export function IntegrationPlaceholderPage({
  kind,
}: IntegrationPlaceholderPageProps) {
  const copy = placeholderCopy[kind];

  return (
    <div className="min-h-screen pb-10">
      <EmployeeAppHeader title={copy.title} leftAction="menu" />
      <div className="px-4 py-4">
        <section className="rounded-2xl border border-dashed border-[color:var(--color-border-secondary)] bg-surface-secondary p-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-raahi-700">
            <copy.icon size={26} />
          </div>
          <h2 className="text-lg font-bold">{copy.heading}</h2>
          <p className="mt-2 text-sm text-text-secondary">{copy.description}</p>
        </section>
      </div>
    </div>
  );
}
