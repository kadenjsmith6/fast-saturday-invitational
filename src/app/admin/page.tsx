"use client";

import { useEffect, useState } from "react";
import { Button, Card, Input, Status } from "@/components/ui";
import { useEventData } from "@/lib/data";
import { CoursesSection, MatchesSection, PlayersSection, RoundsSection, SettingsSection, TeamsSection } from "./sections";

const ADMIN_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN ?? "7888";
const TABS = ["Matches", "Players", "Teams", "Rounds", "Courses", "Settings"] as const;
type Tab = (typeof TABS)[number];

export default function AdminPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [tab, setTab] = useState<Tab>("Matches");
  const data = useEventData();

  useEffect(() => {
    try {
      // Read after mount so the server-rendered page and the phone agree on first paint.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (localStorage.getItem("fsi-admin") === "1") setUnlocked(true);
    } catch {}
  }, []);

  if (!unlocked) {
    return (
      <Card className="max-w-sm mx-auto">
        <h1 className="font-display text-2xl gilt mb-3">Admin</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (pin === ADMIN_PIN) {
              setUnlocked(true);
              try {
                localStorage.setItem("fsi-admin", "1");
              } catch {}
            } else setPin("");
          }}
          className="space-y-3"
        >
          <Input type="password" inputMode="numeric" placeholder="PIN" value={pin} onChange={(e) => setPin(e.target.value)} />
          <Button className="w-full">Unlock</Button>
        </form>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <h1 className="font-display text-3xl gilt">Admin</h1>
        <Button
          variant="ghost"
          onClick={() => {
            setUnlocked(false);
            try {
              localStorage.removeItem("fsi-admin");
            } catch {}
          }}
        >
          Lock
        </Button>
      </div>
      <Status loading={data.loading} error={data.error} />
      <div className="flex gap-1 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
              tab === t ? "bg-pine text-ink font-semibold" : "bg-sand-2"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Matches" && <MatchesSection data={data} />}
      {tab === "Players" && <PlayersSection data={data} />}
      {tab === "Teams" && <TeamsSection data={data} />}
      {tab === "Rounds" && <RoundsSection data={data} />}
      {tab === "Courses" && <CoursesSection data={data} />}
      {tab === "Settings" && <SettingsSection data={data} />}
    </div>
  );
}
