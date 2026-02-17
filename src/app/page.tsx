import Link from "next/link";
import { ShoppingBasket } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 p-8 text-center">
      <ShoppingBasket className="size-16 text-primary" />
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Food Inventory</h1>
        <p className="text-muted-foreground max-w-sm">
          Track your household food items, reduce waste, and stay in sync with your household.
        </p>
      </div>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/auth/sign-up">Get started</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/auth/sign-in">Sign in</Link>
        </Button>
      </div>
    </main>
  );
}
