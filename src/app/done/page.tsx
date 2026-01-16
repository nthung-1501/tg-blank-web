import { Suspense } from "react";
import DoneClient from "./DoneClient";

export default function DonePage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Loading...</div>}>
      <DoneClient />
    </Suspense>
  );
}
