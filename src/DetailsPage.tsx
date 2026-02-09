import {useCallback, useEffect, useState} from "react";
import {type TestParams} from "@/data/tests.ts";
import {fetchWithAuth} from "@/lib/fetch-with-auth.ts";
import {AdminKeyDialog} from "@/components/admin-key-dialog.tsx";
import {TestDetailCard, type TestWithFiles} from "@/components/test-detail-card.tsx";

const DetailsPage: React.FC = () => {
    const [recentTests, setRecentTests] = useState<TestWithFiles[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showAuthDialog, setShowAuthDialog] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const fetchRecentTests = useCallback(async (controller?: AbortController, isInitialLoad = false) => {
        const url = "https://tracker.arkiv-global.net/public/test/list";
        if (isInitialLoad) {
            setLoading(true);
        }
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
            const parsed: TestWithFiles[] = (Array.isArray(data) ? data : []).map((item: Record<string, unknown>) => ({
                id: Number(item.id),
                name: String(item.name ?? ""),
                createdAt: new Date(item.createdAt as string | number | Date),
                startedAt: item.startedAt ? new Date(item.startedAt as string | number | Date) : null,
                finishedAt: item.finishedAt ? new Date(item.finishedAt as string | number | Date) : null,
                params: String(item.params ?? ""),
                files: Array.isArray(item.files) ? item.files : [],
            }));
            setRecentTests(parsed.slice(0, 5));
        } catch (err: unknown) {
            if (err instanceof Error && err.name !== "AbortError") {
                setError(err.message ?? "Failed to load tests");
            }
        } finally {
            if (isInitialLoad) {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        fetchRecentTests(controller, true);
        return () => controller.abort();
    }, [fetchRecentTests, refreshKey]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            fetchRecentTests();
        }, 5000);

        return () => clearInterval(intervalId);
    }, [fetchRecentTests]);

    const handleAuthKeySaved = useCallback(() => {
        setShowAuthDialog(false);
        setRefreshKey((k) => k + 1);
    }, []);

    const getTestStatus = (t: TestWithFiles) => {
        if (t.finishedAt) return {label: 'Completed', color: '#065f46', bg: '#ecfdf5', border: '#a7f3d0'};
        if (t.startedAt) return {label: 'Running', color: '#92400e', bg: '#fffbeb', border: '#fde68a'};
        return {label: 'Pending', color: '#374151', bg: '#f9fafb', border: '#e5e7eb'};
    };

    const styles = {
        container: {
            minHeight: '100vh',
            background: '#fafafa',
            padding: '32px 16px',
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            color: '#1f2937',
        },
        card: {
            maxWidth: 720,
            margin: '0 auto 16px',
            background: '#ffffff',
            borderRadius: 8,
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            overflow: 'hidden',
        },
        header: {
            background: '#ffffff',
            borderBottom: '1px solid #e5e7eb',
            color: '#1f2937',
            padding: '20px 24px',
            textAlign: 'left' as const,
        },
        title: {margin: 0, fontSize: 18, fontWeight: 600, color: '#111827'},
        subtitle: {margin: '4px 0 0', color: '#6b7280', fontSize: 13, fontWeight: 400},
        badge: (bg: string, color: string, border: string) => ({
            display: 'inline-block',
            padding: '4px 12px',
            borderRadius: 4,
            background: bg,
            color: color,
            fontWeight: 500,
            fontSize: 12,
            marginTop: 12,
            border: `1px solid ${border}`,
        }),
        pageTitle: {
            maxWidth: 720,
            margin: '0 auto 24px',
            fontSize: 24,
            fontWeight: 700,
            color: '#111827',
        },
        loader: {
            textAlign: 'center' as const,
            padding: 60,
            color: '#6b7280',
            fontSize: 14,
        },
        error: {
            maxWidth: 720,
            margin: '0 auto',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 8,
            padding: 24,
            textAlign: 'center' as const,
            color: '#dc2626',
        },
    };

    const authDialog = (
        <AdminKeyDialog
            open={showAuthDialog}
            onOpenChange={setShowAuthDialog}
            onKeySaved={handleAuthKeySaved}
            description="Authentication required. Please enter your admin/bearer key to access the test details."
            showTrigger={false}
        />
    );

    if (loading) {
        return (
            <div style={styles.container}>
                {authDialog}
                <div style={styles.loader}>
                    Loading tests...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={styles.container}>
                {authDialog}
                <div style={styles.error}>
                    <strong>Error:</strong> {error}
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            {authDialog}
            <h1 style={styles.pageTitle}>Last 5 Tests</h1>
            {recentTests.length === 0 && (
                <div style={styles.loader}>No tests found</div>
            )}
            {recentTests.map((t) => {
                const tStatus = getTestStatus(t);
                let tParams: TestParams | null = null;
                try {
                    tParams = t.params ? JSON.parse(t.params) : null;
                } catch {
                    // ignore parse errors
                }
                const isExternal = tParams?.isExternal === true || !!tParams?.externalRpcUrl;
                return (
                    <div key={t.id} style={styles.card}>
                        <div style={styles.header}>
                            <h1 style={styles.title}>
                                <a href={"/test/" + encodeURIComponent(t.name)}
                                   style={{color: '#2563eb', textDecoration: 'none'}}>
                                    {t.name}
                                </a>
                            </h1>
                            <p style={styles.subtitle}>
                                Test #{t.id}
                                {isExternal ? ' · External' : ' · Internal'}
                            </p>
                            <span style={styles.badge(tStatus.bg, tStatus.color, tStatus.border)}>
                                {tStatus.label}
                            </span>
                        </div>
                        <TestDetailCard test={t}/>
                    </div>
                );
            })}
        </div>
    );
};

export default DetailsPage;
