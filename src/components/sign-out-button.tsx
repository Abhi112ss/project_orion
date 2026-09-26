import { signOut } from "@/lib/auth/sign-out";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-[#9CA3AF] transition-colors hover:text-[#F9FAFB]"
      >
        Sign out
      </button>
    </form>
  );
}