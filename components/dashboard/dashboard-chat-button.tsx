'use client';

import * as React from 'react';
import { AnimatedButton } from '@/components/ui/animated-button';
import { MessageSquare } from 'lucide-react';
import { GroupChatPanel } from '@/components/coach/group-chat-panel';

export function DashboardChatButton({ groupId }: { groupId: string }) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <AnimatedButton 
        variant="ghost" 
        size="sm" 
        onClick={() => setIsOpen(true)}
        className="rounded-full text-xs py-1.5 px-3.5 border border-amber-500/20 bg-amber-500/10 flex items-center gap-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-500/20 transition-all duration-200"
      >
        <MessageSquare className="w-3.5 h-3.5" />
        <span className="font-semibold">Chat de Equipo</span>
      </AnimatedButton>
      
      <GroupChatPanel 
        groupId={groupId} 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </>
  );
}
