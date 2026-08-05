export type OnboardingChoice = "hire" | "provide";

/** The visible mode label (§5.6 — the mode must never be invisible state). */
export const MODE_LABEL: Record<OnboardingChoice, string> = {
  hire: "Hiring",
  provide: "Providing",
};

export function isWorker(choice: string | null | undefined): boolean {
  return choice === "provide";
}

export function isCustomer(choice: string | null | undefined): boolean {
  return choice === "hire";
}

/** Slot-1 destination for a mode — where a role switch lands you. */
export function roleHomePath(choice: OnboardingChoice): string {
  return choice === "provide" ? "/services" : "/home";
}

/** Where to send someone after auth based on their intent. */
export function postAuthPath(
  choice: OnboardingChoice,
  hasProfile: boolean,
): string {
  if (choice === "provide") {
    return hasProfile ? "/work" : "/onboarding/provider";
  }
  return "/home";
}
