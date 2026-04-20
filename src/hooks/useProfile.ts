import { useCallback, useEffect, useState } from "react";
import type { ProfileType } from "@/types/cronos";
import { logProfileChange } from "@/services/analyticsService";

const STORAGE_KEY = "cronos:profile";
const SESSION_KEY = "cronos:session_id";
const DEFAULT_PROFILE: ProfileType = "moderado";

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function useProfile() {
  const [profile, setProfileState] = useState<ProfileType>(() => {
    if (typeof window === "undefined") return DEFAULT_PROFILE;
    const stored = localStorage.getItem(STORAGE_KEY) as ProfileType | null;
    return stored ?? DEFAULT_PROFILE;
  });

  const [sessionId] = useState<string>(() => getOrCreateSessionId());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, profile);
  }, [profile]);

  const setProfile = useCallback(
    (next: ProfileType) => {
      setProfileState((prev) => {
        if (prev !== next) {
          // fire-and-forget log
          logProfileChange({ session_id: sessionId, from: prev, to: next });
        }
        return next;
      });
    },
    [sessionId],
  );

  return { profile, setProfile, sessionId };
}
