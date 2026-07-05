import type { Metadata } from "next";
import { IntakeForm } from "@/components/intake-form";

export const metadata: Metadata = {
  title: "Work with Cham Media",
  description: "Tell us about your project and we'll get back to you.",
};

export default function IntakeFormPage() {
  return (
    <main className="min-h-screen bg-background">
      <IntakeForm />
    </main>
  );
}
