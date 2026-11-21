"use client";

import Icon from "@/components/Icon";
import { PageHeader, Panel, td, th } from "@/components/admin/ui";
import { useAdminData } from "@/lib/admin";

const access: [string, boolean, boolean][] = [
  ["Today, bookings and calendar", true, true],
  ["Block and unblock dates", true, true],
  ["Guest messages and door codes", true, true],
  ["Cancel direct bookings", true, true],
  ["Finance and exports", true, false],
  ["Team and roles", true, false],
];

export default function Team() {
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
                <td className={`${td} text-muted`}>{s.email === staff?.email ? "You" : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

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
        Accounts are stored on the server with hashed passwords. Inviting and removing staff from this screen comes next.
      </p>
    </>
  );
}
