"use client";

import { useEffect, useState } from "react";
import { Users, LogOut, Copy } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
      <SheetContent side="bottom" className="rounded-t-xl">
        <SheetHeader className="text-center pb-2">
          <div className="w-16 h-16 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-2xl mx-auto mb-3">
            {initials}
          </div>
          <SheetTitle className="text-lg">{displayName}</SheetTitle>
          <p className="text-sm text-muted-foreground">{email}</p>
        </SheetHeader>

        <Separator className="my-4" />

        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Household</p>
            <p className="text-sm font-medium">{householdName ?? "Loading…"}</p>
          </div>

          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={handleCopyInviteLink}
            disabled={!inviteCode}
          >
            <Users className="size-4" />
            <Copy className="size-4" />
            Copy Invite Link
          </Button>

          <Separator />

          <form action={signOut}>
            <Button variant="ghost" type="submit" className="w-full justify-start gap-2 text-destructive hover:text-destructive">
              <LogOut className="size-4" />
              Sign out
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
