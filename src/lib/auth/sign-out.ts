/*src/lib/auth/sign-out.ts*/
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit/log";

export async function signOut() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase.auth.signOut();

  if (user) {
    await logAudit({
      actorId: user.id,
      actorEmail: user.email,
      action: "sign_out",
    });
  }

  redirect("/login");
}