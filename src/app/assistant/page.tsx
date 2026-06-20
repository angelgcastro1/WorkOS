import { AssistantChat } from "@/components/assistant-chat";

export default function AssistantPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Assistant</h1>
        <p className="text-sm text-muted-foreground">
          Ask about your data, draft client emails or invoice notes, and summarize notes — powered by Claude.
        </p>
      </header>
      <AssistantChat />
    </div>
  );
}
