import { Suspense } from "react";
import VerifyEmailClient from "./verify-email-client";

export const dynamic = "force-dynamic";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="p-6">loading...</div>}>
      <VerifyEmailClient />
    </Suspense>
  );
}
