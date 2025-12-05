import { Suspense } from "react";
import ResetPasswordPage from "../components/reset-password/ResetPasswordForm";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordPage />
    </Suspense>
  );
}
