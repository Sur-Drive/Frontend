import type { ReactNode } from "react";

// Shared table cell primitives so every records table keeps the same look:
// a muted uppercase header row and evenly padded body cells with thin dividers.

export function Th({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <th
      scope="col"
      className={`whitespace-nowrap px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-ink-muted ${className}`}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <td className={`px-5 py-4 ${className}`}>{children}</td>;
}
