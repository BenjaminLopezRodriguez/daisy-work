export type OnboardingChoice = "hire" | "provide";

export function isWorker(choice: string | null | undefined): boolean {
  return choice === "provide";
}

export function isCustomer(choice: string | null | undefined): boolean {
  return choice === "hire";
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
