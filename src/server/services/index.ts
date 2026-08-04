import { createMockCredentialService } from "./credential";
import { createMockGovernanceService } from "./governance";
import { createMockWorkOrderService } from "./work-order";
import type { DaisyServices } from "./types";

export function createMockServices(): DaisyServices {
  return {
    governance: createMockGovernanceService(),
    credentials: createMockCredentialService(),
    workOrders: createMockWorkOrderService(),
  };
}

export type { DaisyServices };
export * from "./types";
export { createMockGovernanceService } from "./governance";
export { createMockCredentialService } from "./credential";
export { createMockWorkOrderService } from "./work-order";
