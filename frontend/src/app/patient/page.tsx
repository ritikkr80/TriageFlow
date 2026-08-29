import React from "react";
import { TriageWizard } from "@/components/triage/TriageWizard";

export const metadata = {
  title: "Patient Triage Intake | TriageFlow",
};

export default function PatientPage() {
  return (
    <div className="py-4">
      <TriageWizard />
    </div>
  );
}
