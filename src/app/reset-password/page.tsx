import { Suspense } from "react";
import ResetPasswordClient from "./reset-password-client";

export const dynamic = "force-dynamic";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-6">loading...</div>}>
      <ResetPasswordClient />
    </Suspense>
  );
}
