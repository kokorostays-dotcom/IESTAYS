"use client";

import { useState } from "react";
import Icon from "@/components/Icon";
import { Empty, PageHeader, Panel } from "@/components/admin/ui";
import { useAdminData } from "@/lib/admin";
import { fmtShort } from "@/lib/dates";
import { addMessage } from "@/lib/store";

export default function Inbox() {
  const { today, bookings, state } = useAdminData();
  const [picked, setPicked] = useState<string | null>(null);
  const [text, setText] = useState("");
  if (!today) return null;

  // Only direct guests message through the Kokoro app; channel guests use the channel's inbox.
  const threads = bookings
    .filter((b) => b.channel === "Direct" && !b.cancelled)
    .map((b) => ({ b, messages: state.messages[b.ref] ?? [] }))
    .sort((x, y) => (y.messages.at(-1)?.at ?? 0) - (x.messages.at(-1)?.at ?? 0));
  const active = threads.find((t) => t.b.ref === picked) ?? threads[0];

  return (
    <>
      <PageHeader title="Inbox" sub="Messages from guests who booked direct" />
      {threads.length === 0 ? (
        <Panel>
          <Empty>
            No direct bookings yet. Make one on the guest site and its conversation appears here.
          </Empty>
        </Panel>
      ) : (
        <Panel className="grid min-h-[520px] overflow-hidden md:grid-cols-[300px_1fr]">
          <ul className="divide-y divide-line border-b border-line md:border-r md:border-b-0">
            {threads.map(({ b, messages }) => {
              const last = messages.at(-1);
              const waiting = last?.from === "guest";
              return (
                <li key={b.ref}>
                  <button
                    type="button"
                    onClick={() => setPicked(b.ref)}
                    aria-current={b.ref === active.b.ref}
                    className={`block w-full px-5 py-3.5 text-left hover:bg-card ${
                      b.ref === active.b.ref ? "bg-card" : ""
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-[14px] font-medium">{b.name}</span>
                      {waiting && <span className="size-2 shrink-0 rounded-full bg-brand" />}
                    </span>
                    <span className="block truncate text-[12px] text-muted">
                      {b.property.name} · {fmtShort(b.checkIn)}
                    </span>
                    <span className="mt-0.5 block truncate text-[13px] text-muted">
                      {last ? last.text : "No messages yet"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="flex min-w-0 flex-col">
            <div className="border-b border-line px-5 py-3.5">
              <p className="text-[15px] font-semibold">{active.b.name}</p>
              <p className="text-[13px] text-muted">
                {active.b.ref} · {active.b.property.name} · {fmtShort(active.b.checkIn)} –{" "}
                {fmtShort(active.b.checkOut)}
              </p>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              {active.messages.length === 0 && (
                <p className="pt-10 text-center text-[14px] text-muted">
                  No messages yet. Say hello before they arrive.
                </p>
              )}
              {active.messages.map((m) => (
                <div
                  key={m.at}
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed ${
                    m.from === "kokoro" ? "ml-auto bg-brand text-white" : "bg-card"
                  }`}
                >
                  {m.text}
                </div>
              ))}
            </div>
            <form
              className="flex gap-2 border-t border-line p-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!text.trim()) return;
                addMessage(active.b.ref, "kokoro", text.trim());
                setText("");
              }}
            >
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={`Reply to ${active.b.name.split(" ")[0]}`}
                aria-label="Reply"
                autoComplete="off"
                className="h-11 flex-1 rounded-full border border-line px-4 text-[14px] placeholder:text-faint"
              />
              <button
                type="submit"
                aria-label="Send"
                disabled={!text.trim()}
                className="grid size-11 place-items-center rounded-full bg-brand text-white disabled:bg-faint"
              >
                <Icon name="send" size={18} />
              </button>
            </form>
          </div>
        </Panel>
      )}
    </>
  );
}
