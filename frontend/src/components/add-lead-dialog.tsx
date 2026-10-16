"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { UserRoundPlus, LoaderCircle } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLeadActions } from "@/hooks/use-leads";

const schema = z.object({
  name: z.string().trim().min(1, "Enter a name.").max(120, "Keep the name under 121 characters."),
  company: z.string().trim().max(160), phone: z.string().trim().max(40),
});
type Values = z.infer<typeof schema>;

export function AddLeadDialog({ onClose, onSaved }: { onClose: () => void; onSaved: (name: string) => void }) {
  const { create } = useLeadActions();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema), defaultValues: { name: "", company: "", phone: "" },
  });
  const busy = create.isPending || isSubmitting;
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
    <DialogContent className="add-dialog">
      <header className="modal-heading">
        <span className="modal-symbol"><UserRoundPlus size={22} /></span>
        <DialogTitle>Add a new lead</DialogTitle>
        <DialogDescription>A new connection. Start with the essentials.</DialogDescription>
      </header>
      <form onSubmit={handleSubmit(async (values) => {
        try { const lead = await create.mutateAsync(values); onSaved(lead.name); onClose(); } catch { /* Retain values; show mutation error below. */ }
      })} noValidate>
        <div className="form-fields">
          <div className="field"><label htmlFor="lead-name">Full name <span className="required">*</span></label>
            <input id="lead-name" placeholder="e.g. Alex Morgan" maxLength={120} aria-invalid={!!errors.name} aria-describedby={errors.name ? "name-error" : undefined} {...register("name")} />
            {errors.name && <p id="name-error" className="field-error" role="alert">{errors.name.message}</p>}
          </div>
          <div className="field"><label htmlFor="lead-company">Company <span>Optional</span></label>
            <input id="lead-company" placeholder="Where they work" maxLength={160} {...register("company")} />
          </div>
          <div className="field"><label htmlFor="lead-phone">Phone <span>Optional</span></label>
            <input id="lead-phone" type="tel" placeholder="e.g. +91 98765 43210" maxLength={40} {...register("phone")} />
          </div>
          <div className="form-hint"><span className="new-dot" />New leads start with the status <strong>New</strong>.</div>
          {create.error && <p className="error-box" role="alert">{create.error.message}</p>}
        </div>
        <footer className="modal-footer"><Button type="button" variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy && <LoaderCircle size={16} className="spin" />}{busy ? "Saving…" : "Add lead"}</Button></footer>
      </form>
    </DialogContent>
  </Dialog>;
}
