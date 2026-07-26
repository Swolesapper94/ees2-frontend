// This file is deprecated - the actual dev-login page is in (auth)/dev-login/page.tsx
// This redirect ensures any direct navigation here still works.
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DevLoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the actual dev-login page in the (auth) group
    // Note: In Next.js, route groups don't affect URL structure, so both
    // resolve to /dev-login. This file is kept for historical reasons.
    router.replace("/");
  }, [router]);

  return null;
}
