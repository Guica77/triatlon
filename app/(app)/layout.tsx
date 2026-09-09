import { AthleteSectionNav } from '@/components/ui/athlete-section-nav';
import { MobileBottomNav } from "@/components/ui/mobile-bottom-nav";
import { DesktopSidebar } from "@/components/ui/desktop-sidebar";
import { PushNotificationManager } from "@/components/chat/push-notification-manager";
import { NotificationProvider } from "@/components/providers/notification-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import { PageTransition } from "@/components/providers/page-transition";
import { headers } from "next/headers";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userAgent = (await headers()).get('user-agent') ?? '';
  const isNativeApp = userAgent.includes('TriWaveXNative/');

  return (
    <NotificationProvider>
      <ToastProvider>
        <div className="relative flex min-h-screen w-full">
          <DesktopSidebar />
          <div className={`flex-1 flex flex-col min-h-screen ${isNativeApp ? 'pb-[calc(env(safe-area-inset-bottom,0px)+5.75rem)]' : 'pb-[calc(env(safe-area-inset-bottom,0px)+4rem)]'} sm:pb-0 max-w-full`}>
            <main className="flex-1 overflow-x-hidden">
              {!isNativeApp && <AthleteSectionNav />}
              <PageTransition>{children}</PageTransition>
            </main>
          </div>
        </div>
        <MobileBottomNav />
        <PushNotificationManager />
      </ToastProvider>
    </NotificationProvider>
  );
}
