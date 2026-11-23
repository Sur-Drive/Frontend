"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface NotesFieldProps {
  title: string;
  placeholder: string;
}

// Local-only reviewer notes: state resets when the section unmounts (tab
// change / drawer close) and is never persisted. Submitting fires a toast.
export function NotesField({ title, placeholder }: NotesFieldProps) {
  const [value, setValue] = useState("");
  const id = useId();
  const toast = useToast();

  function handleAdd() {
    if (!value.trim()) return;
    toast.success({
      title: "Note added",
      description: "Your internal note was recorded.",
    });
    setValue("");
  }

  return (
    <section>
      <h3 className="text-base font-normal text-ink">{title}</h3>
      <div className="mt-3 border-t border-border pt-3">
        <label htmlFor={id} className="sr-only">
          {title}
        </label>
        <textarea
          id={id}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          className="min-h-30 w-full resize-none rounded-xl border border-border bg-surface p-3 text-base text-ink placeholder:text-ink-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        />
        <div className="mt-3 flex justify-end">
          <Button
            variant="secondary"
            onClick={handleAdd}
            disabled={!value.trim()}
            className="h-10! px-4!"
          >
            Add note
          </Button>
        </div>
      </div>
    </section>
  );
}
