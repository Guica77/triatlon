import { MobileBottomNav } from "@/components/ui/mobile-bottom-nav";
import { PushNotificationManager } from "@/components/chat/push-notification-manager";
import { NotificationProvider } from "@/components/providers/notification-provider";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NotificationProvider>
      <div className="relative flex min-h-screen flex-col pb-16 sm:pb-0">
        <main className="flex-1 overflow-x-hidden">{children}</main>
        <MobileBottomNav />
        <PushNotificationManager />
      </div>
    </NotificationProvider>
  );
}
