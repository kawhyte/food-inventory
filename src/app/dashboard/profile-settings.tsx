"use client";

import { useEffect, useState } from "react";
import { Users, LogOut, Copy } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/app/auth/actions";
import { toast } from "sonner";

interface ProfileSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileSettings({ open, onOpenChange }: ProfileSettingsProps) {
  const [householdName, setHouseholdName] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    async function fetchHousehold() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("household_id")
        .eq("id", user.id)
        .single();
      if (!profile) return;

      const { data: household } = await supabase
        .from("households")
        .select("name, invite_code")
        .eq("id", profile.household_id)
        .single();
      if (!household) return;

      setHouseholdName(household.name);
      setInviteCode(household.invite_code);
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
        <SheetHeader className="text-left pb-4">
          <SheetTitle>Account</SheetTitle>
        </SheetHeader>

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
