/*src/app/login/page.tsx*/
import { Suspense } from "react";
import { LoginSection } from "@/sections/login-section";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginSection />
    </Suspense>
  );
}