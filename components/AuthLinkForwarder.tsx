"use client";

import { useEffect } from "react";

/**
 * Staff invitations and password resets sent from the Supabase dashboard land
 * on the home page with their token in the URL fragment. This sends them on to
 * the page where the password is chosen.
 */
export default function AuthLinkForwarder() {
  useEffect(() => {
    const { hash, pathname } = window.location;
    if (pathname === "/admin/set-password") return;
    if (/[#&]type=(invite|recovery)\b/.test(hash) || /[#&]error_code=otp_expired\b/.test(hash)) {
      window.location.replace(`/admin/set-password${hash}`);
    }
  }, []);
  return null;
}
