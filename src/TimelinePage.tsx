import {useCallback, useEffect, useMemo, useState} from "react";
import {type TestType} from "@/data/tests.ts";
import {fetchWithAuth} from "@/lib/fetch-with-auth.ts";
import {AdminKeyDialog} from "@/components/admin-key-dialog.tsx";
import {Badge} from "@/components/ui/badge.tsx";

const LANE_COLORS = [
  {bg: "bg-blue-500", text: "text-white"},
  {bg: "bg-emerald-500", text: "text-white"},
  {bg: "bg-amber-500", text: "text-white"},
  {bg: "bg-purple-500", text: "text-white"},
  {bg: "bg-rose-500", text: "text-white"},
];

function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 60) return `${minutes}m ${seconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"});
}

function formatDate(d: Date): string {
  return d.toLocaleDateString([], {month: "short", day: "numeric"});
}

const TimelinePage: React.FC = () => {
  const [tests, setTests] = useState<TestType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchTests = useCallback(
    async (controller?: AbortController, isInitialLoad = false) => {
      const url = "https://tracker.arkiv-global.net/public/test/list";
      if (isInitialLoad) setLoading(true);
      setError(null);
      try {
        const res = await fetchWithAuth(url, {signal: controller?.signal});
        if (res.status === 401) {
          setShowAuthDialog(true);
          if (isInitialLoad) setLoading(false);
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const parsed: TestType[] = (Array.isArray(data) ? data : []).map(
          (item: Record<string, unknown>) => ({
            id: Number(item.id),
            name: String(item.name ?? ""),
            createdAt: new Date(item.createdAt as string | number | Date),
            startedAt: item.startedAt
              ? new Date(item.startedAt as string | number | Date)
              : null,
            finishedAt: item.finishedAt
              ? new Date(item.finishedAt as string | number | Date)
              : null,
            params: String(item.params ?? ""),
          })
        );
        // filter out tests older than 1 day to avoid clutter
        const freshTestList = parsed.filter((t) => {
          const cutoff = Date.now() - 8 * 60 * 60 * 1000;
          const started = t.startedAt ? t.startedAt.getTime() : 0;
          const finished = t.finishedAt ? t.finishedAt.getTime() : 0;
          return started >= cutoff || finished >= cutoff;
        });
        setTests(freshTestList);
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err.message ?? "Failed to load tests");
        }
      } finally {
        if (isInitialLoad) setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchTests(controller, true);
    return () => controller.abort();
  }, [fetchTests, refreshKey]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchTests();
    }, 5000);
    return () => clearInterval(intervalId);
  }, [fetchTests]);

  const handleAuthKeySaved = useCallback(() => {
    setShowAuthDialog(false);
    setRefreshKey((k) => k + 1);
  }, []);

  // Take only tests that have startedAt (meaningful for timeline)
  const timelineTests = useMemo(() => {
    return tests
      .filter((t) => t.startedAt)
      .sort(
        (a, b) => (a.startedAt!.getTime()) - (b.startedAt!.getTime())
      );
  }, [tests]);

  // Compute global time range for the visible tests
  const {timeMin, totalMs} = useMemo(() => {
    if (timelineTests.length === 0)
      return {timeMin: 0, timeMax: 1, totalMs: 1};
    const now = Date.now();
    const starts = timelineTests.map((t) => t.startedAt!.getTime());
    const ends = timelineTests.map((t) =>
      t.finishedAt ? t.finishedAt.getTime() : now
    );
    const min = Math.min(...starts);
    const max = Math.max(...ends);
    const range = max - min || 1;
    return {timeMin: min, timeMax: max, totalMs: range};
  }, [timelineTests]);

  // Assign each test to a lane (row) to avoid overlaps, up to 5 lanes
  const lanesData = useMemo(() => {
    const lanes: TestType[][] = [];
    for (const test of timelineTests) {
      const start = test.startedAt!.getTime();
      let placed = false;
      for (let i = 0; i < lanes.length; i++) {
        const lastInLane = lanes[i][lanes[i].length - 1];
        const lastEnd = lastInLane.finishedAt
          ? lastInLane.finishedAt.getTime()
          : Date.now();
        if (start >= lastEnd) {
          lanes[i].push(test);
          placed = true;
          break;
        }
      }
      if (!placed && lanes.length < 5) {
        lanes.push([test]);
      } else if (!placed) {
        // If more than 5 concurrent, place in the least-loaded lane
        const leastLoaded = lanes.reduce((min, lane, idx) =>
          lane.length < lanes[min].length ? idx : min, 0);
        lanes[leastLoaded].push(test);
      }
    }
    return lanes;
  }, [timelineTests]);

  // Generate time axis ticks
  const ticks = useMemo(() => {
    const count = 6;
    const result: { pos: number; label: string; date: Date }[] = [];
    for (let i = 0; i <= count; i++) {
      const t = timeMin + (totalMs * i) / count;
      const d = new Date(t);
      result.push({
        pos: (i / count) * 100,
        label: formatTime(d),
        date: d,
      });
    }
    return result;
  }, [timeMin, totalMs]);

  // Check if ticks span multiple days
  const spansMultipleDays = useMemo(() => {
    if (ticks.length < 2) return false;
    return (
      ticks[0].date.toDateString() !==
      ticks[ticks.length - 1].date.toDateString()
    );
  }, [ticks]);

  const getTestStatus = (t: TestType) => {
    if (t.finishedAt) return "Completed";
    if (t.startedAt) return "Running";
    return "Pending";
  };

  const authDialog = (
    <AdminKeyDialog
      open={showAuthDialog}
      onOpenChange={setShowAuthDialog}
      onKeySaved={handleAuthKeySaved}
      description="Authentication required. Please enter your admin/bearer key to access the timeline."
      showTrigger={false}
    />
  );

  if (loading) {
    return (
      <div className="space-y-6">
        {authDialog}
        <p className="text-muted-foreground">Loading tests…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        {authDialog}
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {authDialog}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Timeline</h1>
        <p className="text-muted-foreground">
          Visual timeline of test execution ({timelineTests.length} tests with
          start times)
        </p>
      </div>

      {timelineTests.length === 0 ? (
        <p className="text-muted-foreground">
          No tests with start times found.
        </p>
      ) : (
        <div className="rounded-lg border bg-card p-6">
          {/* Timeline chart */}
          <div className="relative">
            {/* Lanes */}
            <div className="space-y-2">
              {lanesData.map((lane, laneIdx) => (
                <div key={laneIdx} className="relative h-12">
                  {/* Lane background */}
                  <div className="absolute inset-0 rounded bg-muted/30"/>
                  {/* Lane label */}
                  <div
                    className="absolute left-0 top-0 bottom-0 flex items-center pl-2 text-xs text-muted-foreground font-medium z-10">
                    Lane {laneIdx + 1}
                  </div>
                  {/* Test bars */}
                  {lane.map((test) => {
                    const start = test.startedAt!.getTime();
                    const end = test.finishedAt
                      ? test.finishedAt.getTime()
                      : Date.now();
                    const leftPct =
                      ((start - timeMin) / totalMs) * 100;
                    const widthPct = Math.max(
                      ((end - start) / totalMs) * 100,
                      0.5
                    );
                    const color = LANE_COLORS[laneIdx % LANE_COLORS.length];
                    const status = getTestStatus(test);
                    const duration = end - start;

                    return (
                      <a
                        key={test.id}
                        href={"/test/" + encodeURIComponent(test.name)}
                        className={`absolute top-1 bottom-1 rounded ${color.bg} ${color.text} flex items-center px-2 text-xs font-medium truncate hover:opacity-80 transition-opacity cursor-pointer`}
                        style={{
                          left: `${leftPct}%`,
                          width: `${widthPct}%`,
                          minWidth: "4px",
                        }}
                        title={`${test.name}\nStatus: ${status}\nStarted: ${test.startedAt!.toLocaleString()}\n${test.finishedAt ? "Finished: " + test.finishedAt.toLocaleString() : "Still running"}\nDuration: ${formatDuration(duration)}`}
                      >
                        <span className="truncate">
                          {test.name}
                        </span>
                      </a>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Time axis */}
            <div className="relative mt-2 h-8 border-t">
              {ticks.map((tick, i) => (
                <div
                  key={i}
                  className="absolute top-0 flex flex-col items-center"
                  style={{left: `${tick.pos}%`, transform: "translateX(-50%)"}}
                >
                  <div className="h-2 w-px bg-muted-foreground/40"/>
                  <span className="text-[10px] text-muted-foreground mt-0.5 whitespace-nowrap">
                    {spansMultipleDays && formatDate(tick.date) + " "}
                    {tick.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 border-t pt-4">
            <h3 className="text-sm font-semibold mb-3">Test Details</h3>
            <div className="grid gap-2">
              {timelineTests.map((test) => {
                const status = getTestStatus(test);
                const duration = test.finishedAt
                  ? test.finishedAt.getTime() - test.startedAt!.getTime()
                  : Date.now() - test.startedAt!.getTime();
                // Find which lane this test is in
                const laneIdx = lanesData.findIndex((lane) =>
                  lane.some((t) => t.id === test.id)
                );
                const color = LANE_COLORS[laneIdx >= 0 ? laneIdx % LANE_COLORS.length : 0];

                return (
                  <div
                    key={test.id}
                    className="flex items-center gap-3 text-sm"
                  >
                    <div
                      className={`w-3 h-3 rounded-sm ${color.bg} shrink-0`}
                    />
                    <a
                      href={"/test/" + encodeURIComponent(test.name)}
                      className="text-blue-600 hover:underline font-medium truncate max-w-xs"
                    >
                      {test.name}
                    </a>
                    <Badge
                      variant={
                        status === "Completed"
                          ? "default"
                          : status === "Running"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {status}
                    </Badge>
                    <span className="text-muted-foreground">
                      {formatDuration(duration)}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {test.startedAt!.toLocaleString()}
                      {test.finishedAt
                        ? ` → ${test.finishedAt.toLocaleString()}`
                        : " → running"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelinePage;
