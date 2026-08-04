import { CredentialStatus } from "@/domain";
import { seedCredentials } from "../mocks/seed";
import type {
  CredentialService,
  EvaluateCredentialInput,
  SubmitCredentialInput,
} from "./types";
import {
  evaluateCredentialInputSchema,
  submitCredentialInputSchema,
} from "./types";

export function createMockCredentialService(): CredentialService {
  return {
    async submitCredential(raw: SubmitCredentialInput) {
      const input = submitCredentialInputSchema.parse(raw);
      return {
        credentialId: `cred_mock_${input.workerProfileId}_${Date.now()}`,
        isMocked: true as const,
      };
    },

    async evaluateCredential(raw: EvaluateCredentialInput) {
      const input = evaluateCredentialInputSchema.parse(raw);
      const found = seedCredentials.find((c) => c.id === input.credentialId);

      if (!found) {
        return {
          status: "rejected" as const,
          explanation: "Credential not found in mock store.",
          isMocked: true as const,
        };
      }

      if (found.verificationStatus === CredentialStatus.Expired) {
        return {
          status: "expired" as const,
          explanation:
            "Mocked evaluation: credential appears expired. Not a real licensing check.",
          isMocked: true as const,
        };
      }

      if (found.verificationStatus === CredentialStatus.Pending) {
        return {
          status: "pending" as const,
          explanation:
            "Mocked evaluation: document received; awaiting review. Not real verification.",
          isMocked: true as const,
        };
      }

      if (found.verificationStatus === CredentialStatus.Verified) {
        return {
          status: "verified" as const,
          explanation:
            "Mocked evaluation: credential marked verified in seed data. Mocked — not real verification.",
          isMocked: true as const,
        };
      }

      return {
        status: "pending" as const,
        explanation:
          "Mocked evaluation: status unresolved. Mocked — not real verification.",
        isMocked: true as const,
      };
    },
  };
}
