"use client";

import { useState } from "react";
import Icon from "@/components/Icon";
import { PageHeader, Panel, td, th } from "@/components/admin/ui";
import { useAdminData } from "@/lib/admin";
import { inviteStaff, removeStaff, type Staff } from "@/lib/store";

const access: [string, boolean, boolean][] = [
  ["Today, bookings and calendar", true, true],
  ["Block and unblock dates", true, true],
  ["Guest messages and door codes", true, true],
  ["Cancel direct bookings", true, true],
  ["Finance and exports", true, false],
  ["Team and roles", true, false],
];

function Invite() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Staff["role"]>("Property staff");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const input = "h-11 w-full rounded-xl border border-line bg-paper px-3.5 text-[15px] placeholder:text-faint";

  return (
    <Panel title="Give someone access" className="mt-5">
      <form
        noValidate
        className="grid gap-3 border-t border-line p-5 sm:grid-cols-[1fr_1fr_auto_auto]"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setNote(null);
          try {
            const to = email.trim().toLowerCase();
            await inviteStaff(to, name, role);
            setNote({ ok: true, text: `${to} now has access. New team members are emailed a link to choose a password.` });
            setEmail("");
            setName("");
          } catch (err) {
            setNote({ ok: false, text: err instanceof Error ? err.message : "We couldn't add them." });
          } finally {
            setBusy(false);
          }
        }}
      >
        <input
          aria-label="Name"
          placeholder="Name"
          autoComplete="off"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={input}
        />
        <input
          aria-label="Email"
          type="email"
          placeholder="name@example.com"
          autoComplete="off"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={input}
        />
        <select
          aria-label="Role"
          value={role}
          onChange={(e) => setRole(e.target.value as Staff["role"])}
          className={input}
        >
          <option>Property staff</option>
          <option>Administrator</option>
        </select>
        <button
          type="submit"
          disabled={busy}
          className="h-11 rounded-xl bg-brand px-5 text-[14px] font-medium text-white disabled:bg-faint"
        >
          {busy ? "Sending…" : "Invite"}
        </button>
        {note && (
          <p
            role={note.ok ? "status" : "alert"}
            className={`text-[13px] sm:col-span-4 ${note.ok ? "text-muted" : "text-danger"}`}
          >
            {note.text}
          </p>
        )}
      </form>
    </Panel>
  );
}

export default function Team() {
  const [failed, setFailed] = useState<string | null>(null);
  const { staff, state } = useAdminData();
  const mark = (ok: boolean) =>
    ok ? <Icon name="check" size={18} /> : <span className="text-faint">—</span>;

  return (
    <>
      <PageHeader title="Team" sub="Who can sign in to the back office" />
      <Panel className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              {["Name", "Email", "Role", ""].map((h, i) => (
                <th key={i} className={th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line border-t border-line">
            {state.team.map((s) => (
              <tr key={s.email}>
                <td className={`${td} font-medium`}>{s.name}</td>
                <td className={`${td} text-muted`}>{s.email}</td>
                <td className={td}>{s.role}</td>
                <td className={`${td} text-right text-muted`}>
                  {s.email === staff?.email ? (
                    "You"
                  ) : (
                    <button
                      type="button"
                      className="text-danger underline underline-offset-2"
                      onClick={async () => {
                        if (!window.confirm(`Remove back-office access for ${s.email}?`)) return;
                        setFailed(null);
                        try {
                          await removeStaff(s.email);
                        } catch (err) {
                          setFailed(err instanceof Error ? err.message : "We couldn't remove them.");
                        }
                      }}
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
      {failed && (
        <p role="alert" className="pt-3 text-[13px] text-danger">
          {failed}
        </p>
      )}

      <Invite />

      <Panel title="What each role can do" className="mt-5 overflow-x-auto">
        <table className="w-full border-t border-line">
          <thead>
            <tr>
              {["Area", "Administrator", "Property staff"].map((h) => (
                <th key={h} className={th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line border-t border-line">
            {access.map(([area, admin, staffRole]) => (
              <tr key={area}>
                <td className={td}>{area}</td>
                <td className={td}>{mark(admin)}</td>
                <td className={td}>{mark(staffRole)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
      <p className="pt-3 text-[13px] text-muted">
        Sign-in is handled by Supabase. Removing someone takes away their access straight away.
      </p>
    </>
  );
}
