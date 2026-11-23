// Framework-agnostic toast store. The imperative `toast` API is usable from
// anywhere (components via useToast, and plain modules such as lib/csv and
// lib/actions); ToastProvider subscribes to render them. Kept free of React so
// non-"use client" utilities can fire toasts without pulling in JSX.

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastInput {
  title: string;
  description?: string;
}

export interface ToastData extends ToastInput {
  id: number;
  variant: ToastVariant;
}

const MAX_TOASTS = 3;

let toasts: ToastData[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getToasts(): ToastData[] {
  return toasts;
}

function push(variant: ToastVariant, input: ToastInput): number {
  const id = nextId++;
  // Newest on top, capped so the viewport never shows more than MAX_TOASTS.
  toasts = [{ id, variant, ...input }, ...toasts].slice(0, MAX_TOASTS);
  emit();
  return id;
}

export function dismissToast(id: number): void {
  toasts = toasts.filter((toast) => toast.id !== id);
  emit();
}

export const toast = {
  success: (input: ToastInput) => push("success", input),
  error: (input: ToastInput) => push("error", input),
  warning: (input: ToastInput) => push("warning", input),
  info: (input: ToastInput) => push("info", input),
};
