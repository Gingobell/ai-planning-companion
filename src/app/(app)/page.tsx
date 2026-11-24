import { Suspense } from "react";
import { ChatThread } from "@/components/chat/chat-thread";
import { Composer } from "@/components/chat/composer";

export default function ChatPage() {
  return (
    <section className="mx-auto flex w-full max-w-chat flex-1 flex-col gap-s6 px-s4 pt-s8 pb-s6 wide:px-s6">
      <h1 className="text-2xl">Chat</h1>
      <div className="flex-1">
        <Suspense fallback={<p className="text-chat text-muted">Loading today&apos;s conversation…</p>}>
          <ChatThread />
        </Suspense>
      </div>
      <Composer />
    </section>
  );
}
