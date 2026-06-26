import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useProgress } from "../../context/ProgressContext";
import { todayKey } from "../../lib/progress";
import { ChestModal } from "./ChestModal";

export function DailyRewardsGate({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { progress, loading: progressLoading, claimPendingChest } = useProgress();
  const [dismissed, setDismissed] = useState(false);
  const shownForUid = useRef<string | null>(null);

  const chest = progress.pendingChest;
  const showChest =
    !authLoading &&
    !progressLoading &&
    !!user &&
    !dismissed &&
    !!chest &&
    chest.date === todayKey();

  useEffect(() => {
    if (user?.uid && shownForUid.current !== user.uid) {
      shownForUid.current = user.uid;
      setDismissed(false);
    }
    if (!user) {
      shownForUid.current = null;
      setDismissed(false);
    }
  }, [user]);

  const handleClaimed = useCallback(() => {
    claimPendingChest();
    setDismissed(true);
  }, [claimPendingChest]);

  return (
    <>
      {showChest && chest ? (
        <ChestModal
          streakDay={chest.streakDay}
          chestLevel={chest.level}
          reward={chest.reward}
          onClaimed={handleClaimed}
        />
      ) : null}
      {children}
    </>
  );
}
