import { createContext, useContext, type ReactNode } from 'react';

import { useExpoPlayer } from '@/lib/adapters/expo-player';
import type { Player, UsePlayer } from '@/lib/domain';

const PlayerContext = createContext<UsePlayer | null>(null);

export function PlayerProvider({
  usePlayer,
  children,
}: {
  usePlayer: UsePlayer;
  children: ReactNode;
}) {
  return <PlayerContext.Provider value={usePlayer}>{children}</PlayerContext.Provider>;
}

/**
 * A Player for the given source: from an injected factory in tests, the expo
 * adapter otherwise. Provider presence is stable within a tree, so the chosen
 * implementation keeps a consistent hook order.
 */
export function usePlayerGateway(uri: string | null): Player {
  const usePlayerImpl = useContext(PlayerContext) ?? useExpoPlayer;
  return usePlayerImpl(uri);
}
