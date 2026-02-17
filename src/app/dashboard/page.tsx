import { LogOut, User, Home } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signOut } from "@/app/auth/actions";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, household_id, households(name, invite_code)")
    .eq("id", user!.id)
    .single();

  return (
    <main className="min-h-svh p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Food Inventory</h1>
        <form action={signOut}>
          <Button variant="ghost" size="sm" type="submit">
            <LogOut className="size-4" />
            Sign out
          </Button>
        </form>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="size-5" />
            Profile
          </CardTitle>
          <CardDescription>Your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span>{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Display name</span>
            <span>{profile?.display_name ?? "—"}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="size-5" />
            Household
          </CardTitle>
          <CardDescription>Your shared household</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Name</span>
            {/* @ts-expect-error — nested select returns joined object */}
            <span>{profile?.households?.name ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Invite code</span>
            {/* @ts-expect-error — nested select returns joined object */}
            <span className="font-mono">{profile?.households?.invite_code ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Household ID</span>
            <span className="font-mono text-xs text-muted-foreground">{profile?.household_id ?? "—"}</span>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
