export const PHASES = ["interview", "stack", "setup", "build", "publish"] as const;
export type Phase = (typeof PHASES)[number];

export const READY_PHASE = "ready";

export const LIMITS = {
  name: 80,
  idea: 200,
  url: 500,
  participants: 300,
} as const;
