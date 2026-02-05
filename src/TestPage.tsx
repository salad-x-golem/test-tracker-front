import {useParams, useNavigate} from 'react-router-dom';
import {getGrafanaLink, type TestParams} from "@/data/tests.ts";
import {useCallback, useEffect, useState} from "react";

type FileType = {
    id: number;
    originalName: string;
    path: string;
    testId: number;
};

type TestType = {
    id: number;
    name: string;
    createdAt: Date;
    startedAt: Date | null;
    finishedAt: Date | null;
    params: string;
    files: FileType[];
};

const TestPage: React.FC = () => {
    const {testName} = useParams();
    const navigate = useNavigate();
    const [test, setTest] = useState<TestType | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTestData = useCallback(async (controller?: AbortController, isInitialLoad = false) => {
        const url = `https://tracker.arkiv-global.net/public/test/${testName}/info`;
        if (isInitialLoad) {
            setLoading(true);
        }
        setError(null);
        try {
            const res = await fetch(url, {signal: controller?.signal});
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const item = await res.json();
            const parsed: TestType = {
                id: Number(item.id),
                name: String(item.name ?? ""),
                createdAt: new Date(item.createdAt),
                startedAt: item.startedAt ? new Date(item.startedAt) : null,
                finishedAt: item.finishedAt ? new Date(item.finishedAt) : null,
                params: String(item.parameters ?? ""),
                files: Array.isArray(item.files) ? item.files : [],
            };
            setTest(parsed);
        } catch (err: unknown) {
            if (err instanceof Error && err.name !== "AbortError") {
                setError(err.message ?? "Failed to load tests");
            }
        } finally {
            if (isInitialLoad) {
                setLoading(false);
            }
        }
    }, [testName]);

    useEffect(() => {
        const controller = new AbortController();
        fetchTestData(controller, true);
        return () => controller.abort();
    }, [testName, fetchTestData]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            fetchTestData();
        },5000);

        return () => clearInterval(intervalId);
    }, [testName, fetchTestData]);

    const getDownloadUrl = (id: number) => {
        return `https://tracker.arkiv-global.net/public/file/${id}/download`;
    };
    const getViewUrl = (id: number) => {
        return `https://tracker.arkiv-global.net/public/file/${id}/view`;
    };

    const getStatus = () => {
        if (!test) return null;
        if (test.finishedAt) return {label: 'Completed', color: '#065f46', bg: '#ecfdf5', border: '#a7f3d0'};
        if (test.startedAt) return {label: 'Running', color: '#92400e', bg: '#fffbeb', border: '#fde68a'};
        return {label: 'Pending', color: '#374151', bg: '#f9fafb', border: '#e5e7eb'};
    };

    const getEstimatedTime = (test: TestType, params: TestParams) => {
        const formatDuration = (seconds: number) => {
            if (seconds <60) return `${Math.round(seconds)}s`;
            if (seconds <3600) {
                const mins = Math.floor(seconds /60);
                const secs = Math.round(seconds %60);
                return `${mins}m ${secs}s`;
            }
            const hours = Math.floor(seconds /3600);
            const mins = Math.floor((seconds %3600) /60);
            const secs = Math.round(seconds %60);
            return `${hours}h ${mins}m ${secs}s`;
        };

        if (test.finishedAt && test.startedAt) {
            const duration = (new Date(test.finishedAt).getTime() - new Date(test.startedAt).getTime()) /1000;
            return formatDuration(duration);
        }

        if (test.startedAt && !test.finishedAt) {
            const elapsed = (Date.now() - new Date(test.startedAt).getTime()) /1000;
            return `${formatDuration(elapsed)} (running) / ~${formatDuration(params.testLength)} (planned)`;
        }

        const elapsedFromCreate = (Date.now() - new Date(test.createdAt).getTime()) /1000;
        const elapsedFromCreateEst =65 - elapsedFromCreate;
        if (elapsedFromCreateEst >=0) {
            return `~${formatDuration(elapsedFromCreateEst)} (estimated start)`;
        } else {
            return `Staring due ${-elapsedFromCreateEst}s`;
        }
    };

    const status = getStatus();
    const displayName = testName ? decodeURIComponent(testName) : 'No testName provided';

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
            margin: '0 auto',
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
        body: {padding: 24},
        row: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
            padding: '12px 0',
            borderBottom: '1px solid #f3f4f6',
        },
        label: {color: '#6b7280', fontSize: 13, fontWeight: 500},
        value: {color: '#1f2937', fontSize: 13, fontWeight: 500, textAlign: 'right' as const},
        paramsBox: {
            background: '#f9fafb',
            borderRadius: 4,
            border: '1px solid #e5e7eb',
            padding: 12,
            marginTop: 12,
            fontFamily: "'SF Mono', Monaco, 'Courier New', monospace",
            fontSize: 12,
            wordBreak: 'break-all' as const,
            lineHeight: 1.5,
        },
        button: {
            width: '100%',
            padding: '10px 16px',
            background: '#1f2937',
            color: '#ffffff',
            border: 'none',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            marginTop: 16,
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
        filesSection: {
            marginTop: 20,
            borderTop: '1px solid #e5e7eb',
            paddingTop: 16,
        },
        filesList: {
            listStyle: 'none',
            padding: 0,
            margin: '12px 0 0',
        },
        fileItem: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            background: '#fafafa',
            borderRadius: 6,
            border: '1px solid #e5e7eb',
            marginBottom: 8,
        },
        fileName: {
            color: '#1f2937',
            fontSize: 13,
            fontWeight: 500,
        },
        viewLink: {
            color: '#2563eb',
            textDecoration: 'none',
            fontSize: 13,
            fontWeight: 500,
            padding: '6px 12px',
            background: '#f3f4f6',
            borderRadius: 4,
            border: '1px solid #e5e7eb',
        },
        downloadLink: {
            color: '#2563eb',
            textDecoration: 'none',
            fontSize: 13,
            fontWeight: 500,
            padding: '6px 12px',
            background: '#f3f4f6',
            borderRadius: 4,
            border: '1px solid #e5e7eb',
            marginLeft: 8,
        },
    };

    if (loading) {
        return (
            <div style={styles.container}>
                <div style={styles.loader}>
                    Loading test data...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={styles.container}>
                <div style={styles.error}>
                    <strong>Error:</strong> {error}
                    <button style={{...styles.button, marginTop: 16}} onClick={() => navigate(-1)}>
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const renderFile = (file: FileType) => {
        if (file.originalName.endsWith(".html")
            || file.originalName.endsWith(".json")
            || file.originalName.endsWith(".log")
        ) {
            return <li key={file.id} style={styles.fileItem}>
                <span style={styles.fileName}>{file.originalName}</span>
                <div>
                    <a href={getViewUrl(file.id)} style={styles.viewLink}>
                        View
                    </a>
                    <a href={getDownloadUrl(file.id)} style={styles.downloadLink} download>
                        Download
                    </a>
                </div>
            </li>
        }
        return <li key={file.id} style={styles.fileItem}>
            <span style={styles.fileName}>{file.originalName}</span>
            <a href={getDownloadUrl(file.id)} style={styles.downloadLink} download>
                Download
            </a>
        </li>
    }

    const getInnerTestDom = (test: TestType) => {
        const params: TestParams = test.params ? JSON.parse(test.params) : {};
        const estimatedTime = getEstimatedTime(test, params);

        return <div style={styles.body}>
            <div style={styles.row}>
                <span style={styles.label}>Name</span>
                <span style={styles.value}>{test.name}</span>
            </div>
            <div style={styles.row}>
                <span style={styles.label}>ID</span>
                <span style={styles.value}>{test.id}</span>
            </div>
            <div style={styles.row}>
                <span style={styles.label}>Created</span>
                <span style={styles.value}>
                    {new Date(test.createdAt).toLocaleString()}
                </span>
            </div>
            <div style={styles.row}>
                <span style={styles.label}>Started</span>
                <span style={styles.value}>
                    {test.startedAt ? new Date(test.startedAt).toLocaleString() : '—'}
                </span>
            </div>
            <div style={styles.row}>
                <span style={styles.label}>Finished</span>
                <span style={styles.value}>
                    {test.finishedAt ? new Date(test.finishedAt).toLocaleString() : '—'}
                </span>
            </div>
            <div style={{...styles.row, borderBottom: 'none'}}>
                <span style={styles.label}>Duration</span>
                <span style={styles.value}>
                    {estimatedTime}
                </span>
            </div>

            {test.params && (
                <>
                    <div style={{...styles.label, marginTop: 16}}>Parameters</div>
                    <div style={styles.paramsBox}>{test.params}</div>
                </>
            )}

            {test.files && test.files.length > 0 && (
                <div style={styles.filesSection}>
                    <div style={styles.label}>Files ({test.files.length})</div>
                    <ul style={styles.filesList}>
                        {test.files.map((file) => renderFile(file))}
                    </ul>
                </div>
            )}
        </div>
    }

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.header}>
                    <h1 style={styles.title}>{displayName}</h1>
                    <p style={styles.subtitle}>Test #{test?.id}</p>

                    {status && (
                        <span style={styles.badge(status.bg, status.color, status.border)}>
                            {status.label}
                        </span>
                    )}
                    {test && (
                        <a
                            href={getGrafanaLink(test)}
                            style={{
                                marginLeft: 12,
                                color: '#2563eb',
                                textDecoration: 'none',
                                fontSize: 13,
                                fontWeight: 500,
                                display: 'inline-block',
                                marginTop: 8,
                                marginRight: 8
                            }}
                        >
                            Grafana
                        </a>
                    )}
                </div>

                {test && getInnerTestDom(test)}
            </div>
        </div>
    );
};

export default TestPage;