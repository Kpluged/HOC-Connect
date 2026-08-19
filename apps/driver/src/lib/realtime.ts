import type { RealtimeChannel } from '@supabase/supabase-js';

import { supabase } from './supabase';

/**
 * Subscribe to this driver's private offers topic. The matcher (or a dispatcher)
 * broadcasts to `driver:<profile>:offers` when a ride is offered; we just nudge
 * the caller to re-fetch, which surfaces the offered trip. RLS on
 * realtime.messages (migration 0026) restricts this topic to the driver, so the
 * channel needs the session's access token — set before subscribing.
 *
 * Returns an unsubscribe function.
 */
export function subscribeToOffers(onOffer: () => void): () => void {
  let channel: RealtimeChannel | null = null;
  let active = true;

  void (async () => {
    const { data } = await supabase.auth.getUser();
    const uid = data.user?.id;
    if (!uid || !active) return;
    // Authorize the socket for private channels (idempotent).
    await supabase.realtime.setAuth();
    if (!active) return;
    channel = supabase
      .channel(`driver:${uid}:offers`, { config: { private: true } })
      .on('broadcast', { event: '*' }, () => onOffer())
      .subscribe();
  })();

  return () => {
    active = false;
    if (channel) void supabase.removeChannel(channel);
  };
}
