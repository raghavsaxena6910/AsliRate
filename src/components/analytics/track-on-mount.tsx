"use client";

import { useEffect } from "react";
import { identify, track, type AnalyticsEvent } from "@/lib/analytics";

/** Fires one analytics event when a server-rendered page appears. Renders nothing. */
export function TrackOnMount({
  event,
  props,
  userId,
}: {
  event?: AnalyticsEvent;
  props?: Record<string, string | number | boolean>;
  userId?: string;
}) {
  const key = JSON.stringify([event, props, userId]);
  useEffect(() => {
    if (userId) identify(userId);
    if (event) track(event, props);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return null;
}
