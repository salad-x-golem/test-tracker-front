import {useEffect, useState} from "react";

type TestType = {
  id: number;
  name: string;
  createdAt: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
  params: string;
};

export function OverviewPage() {
  const [tests, setTests] = useState<TestType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const url = "https://tracker.arkiv-global.net/public/test/list";

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(url, {signal: controller.signal});
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const parsed: TestType[] = (Array.isArray(data) ? data : []).map((item: any) => ({
          id: Number(item.id),
          name: String(item.name ?? ""),
          createdAt: item.createdAt,
          startedAt: item.startedAt ? new Date(item.startedAt) : null,
          finishedAt: item.finishedAt ? new Date(item.finishedAt) : null,
          params: String(item.params ?? ""),
        }));
        setTests(parsed);
      } catch (err: any) {
        if (err.name !== "AbortError") setError(err.message ?? "Failed to load tests");
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, []);

  const formatDate = (d: Date | null) => (d ? d.toLocaleString() : "-");


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Testing</h1>
          <p className="text-muted-foreground">List of last tests</p>
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
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Started</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Finished</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Planned length</th>
              </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
              {tests.map((t) => {
                  try {
                    const parameters = JSON.parse(t.params);
                    let realTime = 0;
                    if (t.startedAt && t.finishedAt) {
                      realTime = Math.max(0, Math.round((t.finishedAt.getTime() - t.startedAt.getTime()) / 1000))
                    } else if (t.startedAt) {
                      realTime = Math.max(0, Math.round(((new Date()).getTime() - t.startedAt.getTime()) / 1000))
                    }

                    return (
                      <tr key={t.id}>
                        <td className="px-4 py-2 text-sm text-gray-800">{t.name} ({parameters["runs-on"]})</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{formatDate(t.startedAt)}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{formatDate(t.finishedAt)}</td>
                        <td className="px-4 py-2 text-sm text-gray-800">{parameters["test-length"]}s ({realTime}s)</td>
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
              {tests.length === 0 && (
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