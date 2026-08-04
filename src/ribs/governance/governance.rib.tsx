"use client";

import { useState } from "react";
import { createRib, useRibLifecycle } from "nextjs-ribs";
import {
  GovernanceSummary,
  VerificationBadge,
} from "@/components/daisy";
import { riskLevelLabel, type RiskLevel } from "@/domain";
import type { DaisyServices } from "@/server/services";

export const GovernanceRib = createRib({
  name: "Governance",
  interactor: (deps: {
    services: DaisyServices;
    title: string;
    description: string;
  }) => {
    const [riskLevel, setRiskLevel] = useState<RiskLevel | null>(null);
    const [explanation, setExplanation] = useState("");
    const [loading, setLoading] = useState(true);

    useRibLifecycle({
      onAttach: () => {
        void deps.services.governance
          .assessWork({ title: deps.title, description: deps.description })
          .then((result) => {
            setRiskLevel(result.riskLevel);
            setExplanation(result.explanation);
            setLoading(false);
          });
      },
    });

    return { riskLevel, explanation, loading };
  },
  presenter: (state) => ({
    loading: state.loading,
    riskLevel: state.riskLevel,
    explanation: state.explanation,
    label: state.riskLevel ? riskLevelLabel(state.riskLevel) : null,
  }),
});

export function GovernancePanel() {
  const vm = GovernanceRib.useViewModel();
  if (vm.loading || !vm.riskLevel) {
    return <p className="text-sm text-muted-foreground">Assessing risk…</p>;
  }
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{vm.label}</p>
      <GovernanceSummary
        riskLevel={vm.riskLevel}
        explanation={vm.explanation}
      />
      <VerificationBadge />
    </div>
  );
}
