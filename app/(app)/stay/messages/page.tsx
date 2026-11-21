"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "@/components/Icon";
import StayGate from "@/components/StayGate";
import { ScreenHeader } from "@/components/ui";
import { addMessage, type Booking, type Message } from "@/lib/store";

const quick = ["Early check-in?", "Luggage storage", "Restaurant ideas", "Something isn't working"];

function Thread({ booking, messages }: { booking: Booking; messages: Message[] }) {
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false); // true while a message is sending
  const [error, setError] = useState<string | null>(null);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [messages.length, typing]);

  async function send(body: string) {
    const clean = body.trim();
    if (!clean || typing) return;
    setTyping(true);
    setError(null);
    try {
      await addMessage(booking.ref, "guest", clean);
      setText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Your message didn't send.");
    } finally {
      setTyping(false);
    }
  }

  const bubble = "max-w-[80%] rounded-3xl px-4 py-2.5 text-[15px] leading-relaxed";

  return (
    <>
      <div className="space-y-3 px-5 pt-2 pb-44">
        <div className={`${bubble} rounded-bl-lg bg-card shadow-soft`}>
          Hello {booking.name.split(" ")[0]}, welcome. Ask us anything about your stay ({booking.ref}
          ) and we&rsquo;ll help.
        </div>
        {messages.map((m) => (
          <div
            key={m.at}
            className={`${bubble} ${
              m.from === "guest"
                ? "ml-auto rounded-br-lg bg-brand text-paper"
                : "rounded-bl-lg bg-card shadow-soft"
            }`}
          >
            {m.text}
          </div>
        ))}
        {messages.at(-1)?.from === "guest" && (
          <p className="text-right text-[12px] text-muted">
            Sent. The Kokoro team replies here.
          </p>
        )}
        {error && (
          <p role="alert" className="text-right text-[13px] text-danger">
            {error}
          </p>
        )}
        <div ref={end} />
      </div>

      <div className="pb-safe fixed bottom-0 left-1/2 z-30 w-full max-w-[430px] -translate-x-1/2 border-t border-line bg-paper/95 pt-3 backdrop-blur">
        {messages.length === 0 && (
          <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto px-4">
            {quick.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => send(q)}
                className="h-9 shrink-0 rounded-full border border-line bg-card px-3.5 text-[13px]"
              >
                {q}
              </button>
            ))}
          </div>
        )}
        <form
          className="flex items-center gap-2 px-4"
          onSubmit={(e) => {
            e.preventDefault();
            send(text);
          }}
        >
          <label className="sr-only" htmlFor="message">
            Message
          </label>
          <input
            id="message"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a message"
            autoComplete="off"
            className="h-12 flex-1 rounded-full border border-line bg-card px-5 text-[16px] placeholder:text-faint"
          />
          <button
            type="submit"
            aria-label="Send"
            disabled={!text.trim() || typing}
            className="grid size-12 shrink-0 place-items-center rounded-full bg-brand text-paper disabled:bg-faint"
          >
            <Icon name="send" size={20} />
          </button>
        </form>
      </div>
    </>
  );
}

export default function MessagesPage() {
  return (
    <main>
      <ScreenHeader title="Message us" fallback="/stay" />
      <StayGate>
        {({ booking, state }) => (
          <Thread booking={booking} messages={state.messages[booking.ref] ?? []} />
        )}
      </StayGate>
    </main>
  );
}
