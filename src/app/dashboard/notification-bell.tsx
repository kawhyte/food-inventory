"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { AppNotification } from "@/lib/types";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearReadNotifications,
} from "./actions";

export function NotificationBell() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    getNotifications().then(setNotifications);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  function handleClickNotification(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    markNotificationAsRead(id);
  }

  function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    markAllNotificationsAsRead();
  }

  function handleClearRead() {
    setNotifications((prev) => prev.filter((n) => !n.is_read));
    clearReadNotifications();
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 size-5 bg-destructive text-destructive-foreground rounded-full text-[10px] flex items-center justify-center font-medium">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full max-w-sm flex flex-col">
        <SheetHeader>
          <SheetTitle>Notifications</SheetTitle>
          <div className="flex gap-2 pt-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
            >
              Mark all read
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={handleClearRead}
              disabled={notifications.every((n) => !n.is_read)}
            >
              Clear read
            </Button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto mt-4">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
              <BellOff className="size-8" />
              <span className="text-sm">No notifications</span>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className="relative flex flex-col gap-1 p-4 pl-5 mb-2 rounded-2xl bg-card shadow-sm cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleClickNotification(n.id)}
              >
                {!n.is_read && (
                  <span className="absolute top-4 left-2 size-2 bg-primary rounded-full" />
                )}
                <span className={`text-sm leading-snug ${!n.is_read ? "font-bold" : "font-normal"}`}>
                  {n.title}
                </span>
                <span className="text-sm text-muted-foreground">{n.message}</span>
                <span className="text-xs text-muted-foreground mt-1">
                  {new Date(n.created_at).toLocaleDateString()}
                </span>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
