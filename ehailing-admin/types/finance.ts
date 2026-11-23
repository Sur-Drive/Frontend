import type { StatusTone } from "@/components/ui/StatusPill";
import type { Person } from "@/types/rides";

export type TransactionStatus =
  | "Successful"
  | "Processing"
  | "Pending"
  | "Failed"
  | "Refunded"
  | "Rejected";

export const TRANSACTION_STATUS_TONE: Record<TransactionStatus, StatusTone> = {
  Successful: "success",
  Processing: "info",
  Pending: "warning",
  Failed: "danger",
  Refunded: "neutral",
  Rejected: "danger",
};

export const REFUND_STATUS_TONE: Record<TransactionStatus, StatusTone> = {
  Successful: "success",
  Processing: "info",
  Pending: "warning",
  Failed: "danger",
  Refunded: "success",
  Rejected: "danger",
};

export interface Transaction {
  id: string;
  rideId: string;
  passenger: Person;
  method: string;
  // Naira amounts.
  gross: number;
  commission: number;
  earnings: number;
  status: TransactionStatus;
  dateLabel: string;
  reference: string | null;
}

export interface TransactionSummaryStat {
  label: string;
  value: string;
  note: string;
}

export interface TransactionsData {
  summary: TransactionSummaryStat[];
  transactions: Transaction[];
}
