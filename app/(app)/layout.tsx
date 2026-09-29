import { AthleteSectionNav } from '@/components/ui/athlete-section-nav';
import { MobileBottomNav } from "@/components/ui/mobile-bottom-nav";
import { DesktopSidebar } from "@/components/ui/desktop-sidebar";
import { PushNotificationManager } from "@/components/chat/push-notification-manager";
import { NotificationProvider } from "@/components/providers/notification-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import { PageTransition } from "@/components/providers/page-transition";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ATHLETE_WEB_PATH, COACH_ONLY_EXIT_PATH, canUseProduct, isCoachOnlyHost, isNativeClient } from "@/lib/web-access";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const requestHeaders = await headers();
  const userAgent = requestHeaders.get('user-agent') ?? '';
  const isNativeApp = isNativeClient(userAgent, requestHeaders.get('x-triwavex-native'));

  // In a browser the product is for coaches; athletes are sent to the iOS app.
  // The coach host admits only coaches, even from the app.
  const host = requestHeaders.get('host');
  const coachOnly = isCoachOnlyHost(host);
  if (!isNativeApp || coachOnly) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
      const allowed = canUseProduct({ host, role: profile?.role, native: isNativeApp, athleteWebEnabled: process.env.ATHLETE_WEB_ACCESS === '1' });
      if (!allowed) redirect(coachOnly ? COACH_ONLY_EXIT_PATH : ATHLETE_WEB_PATH);
    }
  }

  return (
    <NotificationProvider>
      <ToastProvider>
        <div className="athlete-app-shell relative flex min-h-screen w-full">
          <DesktopSidebar />
          <div className={`flex-1 flex flex-col min-h-screen ${isNativeApp ? 'pb-[calc(env(safe-area-inset-bottom,0px)+5.75rem)]' : 'pb-[calc(env(safe-area-inset-bottom,0px)+4rem)]'} sm:pb-0 max-w-full`}>
            <main className="flex-1 overflow-x-hidden">
              {!isNativeApp && <AthleteSectionNav />}
              <PageTransition>{children}</PageTransition>
            </main>
          </div>
        </div>
        {!isNativeApp && <MobileBottomNav />}
        <PushNotificationManager />
      </ToastProvider>
    </NotificationProvider>
  );
}
