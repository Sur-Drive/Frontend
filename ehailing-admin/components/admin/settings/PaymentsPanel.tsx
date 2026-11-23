"use client";

import { Select } from "@/components/ui/Select";
import { SettingRow, SettingToggleRow } from "@/components/admin/settings/SettingRow";
import { PAYMENT_PROVIDERS } from "@/types/platform-settings";
import type { SectionErrors } from "@/types/platform-settings";
import { Toggle, MoneyField } from "@/components/admin/growth/PricingConfigurationPanel";

interface PaymentsPanelProps {
  card: boolean;
  bankTransfer: boolean;
  wallet: boolean;
  cash: boolean;
  provider: string;
  savedProvider: string;
  refundWindow: number;
  errors: SectionErrors;
  onToggle: (key: "card" | "bankTransfer" | "wallet" | "cash", value: boolean) => void;
  onProvider: (value: string) => void;
  onRefundWindow: (value: number) => void;
}

export function PaymentsPanel(props: PaymentsPanelProps) {
  const { errors } = props;
  return (
    <div className="divide-y divide-border">
      {errors.methods ? (
        <p role="alert" className="pt-5 text-xs text-danger">
          {errors.methods}
        </p>
      ) : null}
      <SettingToggleRow
        label="Card payments"
        helper="Visa, Mastercard and Verve via Paystack"
        control={
          <Toggle
            checked={props.card}
            onChange={(value) => props.onToggle("card", value)}
            label="Card payments"
          />
        }
      />
      <SettingToggleRow
        label="Bank transfer"
        helper="Dedicated virtual accounts and transfer references"
        control={
          <Toggle
            checked={props.bankTransfer}
            onChange={(value) => props.onToggle("bankTransfer", value)}
            label="Bank transfer"
          />
        }
      />
      <SettingToggleRow
        label="SUR Wallet"
        helper="Stored balance for passenger payments"
        control={
          <Toggle
            checked={props.wallet}
            onChange={(value) => props.onToggle("wallet", value)}
            label="SUR Wallet"
          />
        }
      />
      <SettingToggleRow
        label="Cash payments"
        helper="Allow cash collection in approved cities"
        control={
          <Toggle
            checked={props.cash}
            onChange={(value) => props.onToggle("cash", value)}
            label="Cash payments"
          />
        }
      />
      <SettingRow
        label="Payment provider"
        helper="Primary gateway for online transactions"
        controlId="settings-provider"
        warning={
          props.provider !== props.savedProvider
            ? "Changing the primary gateway affects all online payments."
            : undefined
        }
      >
        <Select
          id="settings-provider"
          label="Payment provider"
          options={PAYMENT_PROVIDERS}
          value={props.provider}
          onChange={(event) => props.onProvider(event.target.value)}
        />
      </SettingRow>
      <SettingRow
        label="Automatic refund window"
        helper="Auto-process eligible refunds below this amount"
        controlId="settings-refund-window"
        error={errors.refundWindow}
      >
        <MoneyField
          id="settings-refund-window"
          label="Automatic refund window"
          hideLabel
          value={props.refundWindow}
          onChange={props.onRefundWindow}
        />
      </SettingRow>
    </div>
  );
}
