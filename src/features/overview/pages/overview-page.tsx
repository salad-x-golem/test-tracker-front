import {useCallback, useEffect, useMemo, useState} from "react";
import {getGrafanaLink, isTestExternal, type TestParams, type TestType} from "@/data/tests.ts";
import {NewTestDialog} from "@/features/overview/components/new-test-dialog.tsx";
import {fetchWithAuth} from "@/lib/fetch-with-auth.ts";
import {AdminKeyDialog} from "@/components/admin-key-dialog.tsx";
import {Badge} from "@/components/ui/badge.tsx";
import {SearchInput} from "@/components/ui/search-input.tsx";
import {Button} from "@/components/ui/button.tsx";

type ExternalFilter = "all" | "internal" | "external";


export function OverviewPage() {
  const [tests, setTests] = useState<TestType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [search, setSearch] = useState("");
  const [externalFilter, setExternalFilter] = useState<ExternalFilter>("all");

  const handleTestCreated = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const url = "https://tracker.arkiv-global.net/public/test/list";

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchWithAuth(url, {signal: controller.signal});
        if (res.status === 401) {
          setShowAuthDialog(true);
          setLoading(false);
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const parsed: TestType[] = (Array.isArray(data) ? data : []).map((item: Record<string, unknown>) => ({
          id: Number(item.id),
          name: String(item.name ?? ""),
          createdAt: new Date(item.createdAt as string | number | Date),
          startedAt: item.startedAt ? new Date(item.startedAt as string | number | Date) : null,
          finishedAt: item.finishedAt ? new Date(item.finishedAt as string | number | Date) : null,
          params: String(item.params ?? ""),
        }));
        setTests(parsed);
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") setError(err.message ?? "Failed to load tests");
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [refreshKey]);

  const formatDate = (d: Date | null) => (d ? d.toLocaleString() : "-");

  const filteredTests = useMemo(() => {
    return tests.filter((t) => {
      // Search filter
      if (search) {
        const lowerSearch = search.toLowerCase();
        if (!t.name.toLowerCase().includes(lowerSearch)) {
          return false;
        }
      }
      // External/Internal filter
      if (externalFilter !== "all") {
        try {
          const parameters: TestParams = JSON.parse(t.params);
          const external = isTestExternal(parameters);
          if (externalFilter === "external" && !external) return false;
          if (externalFilter === "internal" && external) return false;
        } catch {
          return externalFilter === "internal";
        }
      }
      return true;
    });
  }, [tests, search, externalFilter]);

  const handleAuthKeySaved = useCallback(() => {
    setShowAuthDialog(false);
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className="space-y-6">
      <AdminKeyDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        onKeySaved={handleAuthKeySaved}
        description="Authentication required. Please enter your admin/bearer key to access the test list."
        showTrigger={false}
      />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Testing</h1>
          <p className="text-muted-foreground">List of last tests</p>
        </div>
        <NewTestDialog onTestCreated={handleTestCreated} />
      </div>

      <div className="flex items-center gap-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search tests…"
          className="w-64"
        />
        <div className="flex gap-1">
          <Button
            variant={externalFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setExternalFilter("all")}
          >
            All
          </Button>
          <Button
            variant={externalFilter === "internal" ? "default" : "outline"}
            size="sm"
            onClick={() => setExternalFilter("internal")}
          >
            Internal
          </Button>
          <Button
            variant={externalFilter === "external" ? "default" : "outline"}
            size="sm"
            onClick={() => setExternalFilter("external")}
          >
            External
          </Button>
        </div>
      </div>

      <div>
        {loading && <p>Loading tests…</p>}
        {error && <p className="text-red-600">Error: {error}</p>}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Test Name (machine)</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Type</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Started</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Finished</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Planned test time (real)</th>
              </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
              {filteredTests.map((t) => {
                  try {
                    const parameters: TestParams = JSON.parse(t.params);
                    const external = isTestExternal(parameters);
                    let realTime = 0;
                    if (t.startedAt && t.finishedAt) {
                      realTime = Math.max(0, Math.round((t.finishedAt.getTime() - t.startedAt.getTime()) / 1000))
                    } else if (t.startedAt) {
                      realTime = Math.max(0, Math.round(((new Date()).getTime() - t.startedAt.getTime()) / 1000))
                    }

                    return (
                      <tr key={t.id}>
                        <td className="px-4 py-2 text-sm text-gray-800">
                          <a href={"/test/" + encodeURIComponent(t.name)} className="text-blue-600 hover:underline">
                          {t.name} ({parameters.runsOn})</a>
                          <a className="px-2 text-blue-600 hover:underline" href={getGrafanaLink(t)}>🔗 Grafana</a>
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <Badge variant={external ? "default" : "secondary"}>
                            {external ? "External" : "Internal"}
                          </Badge>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">{formatDate(t.startedAt)}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{formatDate(t.finishedAt)}</td>
                        <td className="px-4 py-2 text-sm text-gray-800">{parameters.testLength}s ({realTime}s)</td>
                      </tr>
                    )
                  } catch (e) {
                    if (e instanceof Error) {
                      return <tr><td>Error {e.message}</td></tr>;
                    }
                    return <tr><td>Unknown error</td></tr>;
                  }
                }
              )}
              {filteredTests.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">
                    No tests found
                  </td>
                </tr>
              )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}