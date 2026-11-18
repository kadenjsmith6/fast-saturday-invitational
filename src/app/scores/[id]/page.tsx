import { Suspense } from "react";
import EnterMatch from "./EnterMatch";

export default function Page() {
  return (
    <Suspense fallback={<div className="text-sm text-muted">Loading…</div>}>
      <EnterMatch />
    </Suspense>
  );
}
