import Link from "next/link";
import { Sparkles, CloudSun } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-svh bg-pantry-paper text-pantry-ink overflow-hidden flex flex-col items-center justify-center relative">
      {/* Background decorations */}
      <Sparkles className="absolute top-12 left-8 w-8 h-8 opacity-20 animate-gentle-bounce" />
      <CloudSun className="absolute bottom-16 right-8 w-10 h-10 opacity-20 animate-gentle-bounce [animation-delay:500ms]" />

      {/* Main content */}
      <div className="flex flex-col items-center gap-8 px-8 text-center animate-fade-in">
        {/* Title */}
        <h1 className="text-5xl font-handwritten tracking-tight uppercase leading-none">
          <span className="text-pantry-ink">PANTRY</span>
          <br />
          <span className="text-pantry-teal">PAL</span>
        </h1>

        {/* Character placeholder */}
        <div className="relative w-48 h-48 mx-auto">
          <div className="absolute inset-0 rounded-full bg-pantry-sky border-2 border-pantry-ink rotate-6" />
          <div className="relative z-10 w-full h-full rounded-full bg-white border-2 border-pantry-ink flex items-center justify-center text-xs text-center text-pantry-ink/50 leading-relaxed">
            Character
            <br />
            Here
          </div>
        </div>

        {/* Tagline */}
        <p className="text-lg font-medium text-pantry-ink/80">
          Your kitchen, organized.
        </p>

        {/* Loader dots */}
        <div className="flex gap-2 items-center">
          <div className="w-3 h-3 rounded-full bg-pantry-teal animate-bounce [animation-delay:0ms]" />
          <div className="w-3 h-3 rounded-full bg-pantry-coral animate-bounce [animation-delay:150ms]" />
          <div className="w-3 h-3 rounded-full bg-pantry-mustard animate-bounce [animation-delay:300ms]" />
        </div>

        {/* Auth buttons */}
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Button
            asChild
            className="bg-pantry-ink text-white hover:bg-pantry-ink/90 w-full"
          >
            <Link href="/auth/sign-up">Get Started</Link>
          </Button>
          <Button
            variant="outline"
            asChild
            className="border-pantry-ink text-pantry-ink w-full"
          >
            <Link href="/auth/sign-in">Sign in</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
