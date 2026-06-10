import { MobileBottomNav } from "@/components/ui/mobile-bottom-nav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col pb-16 sm:pb-0">
      <main className="flex-1 overflow-x-hidden">{children}</main>
      <MobileBottomNav />
    </div>
  );
}
