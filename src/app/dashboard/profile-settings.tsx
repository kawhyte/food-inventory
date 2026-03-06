"use client";

import { useEffect, useState } from "react";
import { Users, LogOut, Copy } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { signOut } from "@/app/auth/actions";
import { getUserProfile } from "@/app/dashboard/actions";
import { toast } from "sonner";

interface ProfileSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  displayName: string;
  email: string;
}

export function ProfileSettings({ open, onOpenChange, displayName, email }: ProfileSettingsProps) {
  const initials = displayName.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  const [householdName, setHouseholdName] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    async function fetchHousehold() {
      const profile = await getUserProfile();
      if (!profile) return;
      setHouseholdName(profile.householdName);
      setInviteCode(profile.inviteCode);
    }

    fetchHousehold();
  }, [open]);

  async function handleCopyInviteLink() {
    if (!inviteCode) return;
    const url = `${window.location.origin}/auth/sign-up?invite=${inviteCode}`;
    await navigator.clipboard.writeText(url);
    toast.success("Invite link copied!");
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl px-0 pb-0">
        {/* Drag handle */}
        <div className="mx-auto mt-1 mb-4 h-1 w-10 rounded-full bg-muted" />

        {/* Identity */}
        <SheetHeader className="text-center px-6 pb-5">
          <div className="w-16 h-16 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-2xl mx-auto mb-3">
            {initials}
          </div>
          <SheetTitle className="text-lg">{displayName}</SheetTitle>
          <p className="text-sm text-muted-foreground">{email}</p>
        </SheetHeader>

        {/* Grouped sections */}
        <div className="px-4 space-y-3 pb-8 pb-[calc(2rem+env(safe-area-inset-bottom))]">

          {/* Household section */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1 mb-1">Household</p>
            <div className="rounded-xl bg-muted/40 overflow-hidden divide-y divide-border">
              <div className="flex items-center px-4 py-3">
                <span className="text-sm font-medium text-foreground">{householdName ?? "Loading…"}</span>
              </div>
              <button
                className="flex items-center gap-3 w-full px-4 py-3 text-left active:bg-muted/60 disabled:opacity-40 transition-colors"
                onClick={handleCopyInviteLink}
                disabled={!inviteCode}
              >
                <div className="w-7 h-7 rounded-lg bg-pantry-teal/20 flex items-center justify-center shrink-0">
                  <Users className="size-4 text-pantry-teal" />
                </div>
                <span className="text-sm font-medium flex-1">Copy Invite Link</span>
                <Copy className="size-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Account section */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1 mb-1">Account</p>
            <div className="rounded-xl bg-muted/40 overflow-hidden">
              <form action={signOut}>
                <button
                  type="submit"
                  className="flex items-center gap-3 w-full px-4 py-3 text-left active:bg-muted/60 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-destructive/15 flex items-center justify-center shrink-0">
                    <LogOut className="size-4 text-destructive" />
                  </div>
                  <span className="text-sm font-medium text-destructive">Sign out</span>
                </button>
              </form>
            </div>
          </div>

        </div>
      </SheetContent>
    </Sheet>
  );
}
