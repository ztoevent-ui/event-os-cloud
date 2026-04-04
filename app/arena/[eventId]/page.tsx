'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Redirect Page for Legacy /arena/[eventId] links
 * Since the Hub was moved to /apps/zto-arena, we catch old links and 
 * send users to the correct central management interface.
 */
export default function ArenaRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/apps/zto-arena');
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-zinc-500 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">
        Redirecting to Arena Hub...
      </div>
    </div>
  );
}
