"use client";

import { Home, Search, List, User, Plus } from "lucide-react";

interface BottomNavProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const tabs = [
  { id: "home", icon: Home, label: "Home" },
  { id: "search", icon: Search, label: "Search" },
  { id: "lists", icon: List, label: "Lists" },
  { id: "profile", icon: User, label: "Profile" },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 w-full bg-white border-t border-pantry-ink pb-safe rounded-t-2xl shadow-[0_-2px_10px_rgba(0,0,0,0.08)]">
      <div className="flex items-end justify-around px-2 pt-2 pb-2 max-w-md mx-auto relative h-16">
        {tabs.slice(0, 2).map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange?.(tab.id)}
              className="flex flex-col items-center gap-1"
            >
              <div className="w-8 h-8 border-2 border-dashed border-pantry-ink/40 rounded-lg flex items-center justify-center">
                <Icon className="w-4 h-4 text-pantry-ink/60" />
              </div>
            </button>
          );
        })}

        {/* FAB */}
        <button
          onClick={() => onTabChange?.("add")}
          className="absolute left-1/2 -translate-x-1/2 -top-7 w-14 h-14 rounded-full bg-pantry-mustard border-2 border-pantry-ink shadow-[4px_4px_0px_0px_#1E293B] flex items-center justify-center"
        >
          <Plus className="w-6 h-6 text-pantry-ink" />
        </button>

        {/* Spacer for FAB */}
        <div className="w-14" />

        {tabs.slice(2).map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange?.(tab.id)}
              className="flex flex-col items-center gap-1"
            >
              <div className="w-8 h-8 border-2 border-dashed border-pantry-ink/40 rounded-lg flex items-center justify-center">
                <Icon className="w-4 h-4 text-pantry-ink/60" />
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
