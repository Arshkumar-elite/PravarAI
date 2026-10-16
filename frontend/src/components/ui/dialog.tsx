"use client";
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;
export function DialogContent({
  children,
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  const opener = React.useRef<HTMLElement | null>(null);
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="dialog-overlay" />
      <DialogPrimitive.Content
        className={cn("dialog-content", className)}
        {...props}
        onOpenAutoFocus={(event) => {
          opener.current = document.activeElement as HTMLElement;
          props.onOpenAutoFocus?.(event);
        }}
        onCloseAutoFocus={(event) => {
          props.onCloseAutoFocus?.(event);
          if (!event.defaultPrevented) {
            event.preventDefault();
            const target = opener.current?.isConnected
              ? opener.current
              : document.getElementById("add-lead-trigger");
            target?.focus();
          }
        }}
      >
        {children}
        <DialogPrimitive.Close
          className="dialog-close"
          aria-label="Close dialog"
        >
          <X size={19} />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
