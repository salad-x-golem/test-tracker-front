import React, {useEffect, useState, useCallback} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import type {TestParams} from "@/data/tests.ts";


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
                createdAt: item.createdAt,
                startedAt: item.startedAt ? new Date(item.startedAt) : null,
                finishedAt: item.finishedAt ? new Date(item.finishedAt) : null,
                params: String(item.params ?? ""),
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

    // Auto-refresh every 5 seconds
    useEffect(() => {
        const intervalId = setInterval(() => {
            fetchTestData();
        }, 5000);

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
        if (test.finishedAt) return {label: 'Completed', color: '#10b981', bg: '#d1fae5'};
        if (test.startedAt) return {label: 'Running', color: '#f59e0b', bg: '#fef3c7'};
        return {label: 'Pending', color: '#6b7280', bg: '#f3f4f6'};
    };

    const getEstimatedTime = (test: TestType, params: TestParams) => {
        const formatDuration = (seconds: number) => {
            if (seconds < 60) return `${Math.round(seconds)}s`;
            if (seconds < 3600) {
                const mins = Math.floor(seconds / 60);
                const secs = Math.round(seconds % 60);
                return `${mins}m ${secs}s`;
            }
            const hours = Math.floor(seconds / 3600);
            const mins = Math.floor((seconds % 3600) / 60);
            const secs = Math.round(seconds % 60);
            return `${hours}h ${mins}m ${secs}s`;
        };

        if (test.finishedAt && test.startedAt) {
            // Completed: actual time from start to finish
            const duration = (new Date(test.finishedAt).getTime() - new Date(test.startedAt).getTime()) / 1000;
            return formatDuration(duration);
        }

        if (test.startedAt && !test.finishedAt) {
            // Running: time elapsed since start
            const elapsed = (Date.now() - new Date(test.startedAt).getTime()) / 1000;
            return `${formatDuration(elapsed)} (running) / ~${formatDuration(params["test-length"])} (planned)`;
        }

        const elapsedFromCreate = (Date.now() - new Date(test.createdAt).getTime()) / 1000;
        const elapsedFromCreateEst = 65 - elapsedFromCreate;
        if (elapsedFromCreateEst >= 0) {
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
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '40px 20px',
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        },
        card: {
            maxWidth: 600,
            margin: '0 auto',
            background: '#fff',
            borderRadius: 16,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            overflow: 'hidden',
        },
        header: {
            background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%)',
            color: '#fff',
            padding: '30px',
            textAlign: 'center' as const,
        },
        title: {margin: 0, fontSize: 28, fontWeight: 600},
        subtitle: {margin: '8px 0 0', opacity: 0.8, fontSize: 14},
        badge: (bg: string, color: string) => ({
            display: 'inline-block',
            padding: '6px 16px',
            borderRadius: 20,
            background: bg,
            color: color,
            fontWeight: 600,
            fontSize: 12,
            marginTop: 16,
        }),
        body: {padding: 30},
        row: {
            display: 'flex',
            justifyContent: 'space-between',
            padding: '16px 0',
            borderBottom: '1px solid #e5e7eb',
        },
        label: {color: '#6b7280', fontSize: 14, fontWeight: 500},
        value: {color: '#111827', fontSize: 14, fontWeight: 600, textAlign: 'right' as const},
        paramsBox: {
            background: '#f9fafb',
            borderRadius: 8,
            padding: 16,
            marginTop: 20,
            fontFamily: 'monospace',
            fontSize: 13,
            wordBreak: 'break-all' as const,
        },
        button: {
            width: '100%',
            padding: '14px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
            marginTop: 24,
        },
        loader: {
            textAlign: 'center' as const,
            padding: 60,
            color: '#fff',
            fontSize: 18,
        },
        error: {
            maxWidth: 600,
            margin: '0 auto',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 12,
            padding: 24,
            textAlign: 'center' as const,
            color: '#dc2626',
        },
        filesSection: {
            marginTop: 24,
            borderTop: '1px solid #e5e7eb',
            paddingTop: 20,
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
            padding: '12px 16px',
            background: '#f9fafb',
            borderRadius: 8,
            marginBottom: 8,
        },
        fileName: {
            color: '#111827',
            fontSize: 14,
            fontWeight: 500,
        },
        viewLink: {
            color: '#667eea',
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 600,
            padding: '6px 12px',
            background: '#eef2ff',
            borderRadius: 6,
        },
        downloadLink: {
            color: '#667eea',
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 600,
            padding: '6px 12px',
            background: '#eef2ff',
            borderRadius: 6,
        },
    };

    if (loading) {
        return (
            <div style={styles.container}>
                <div style={styles.loader}>
                    <div style={{fontSize: 40, marginBottom: 16}}>⏳</div>
                    Loading test data...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={styles.container}>
                <div style={styles.error}>
                    <div style={{fontSize: 40, marginBottom: 16}}>⚠️</div>
                    <strong>Error:</strong> {error}
                    <button style={{...styles.button, marginTop: 20}} onClick={() => navigate(-1)}>
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
                <a
                    href={getViewUrl(file.id)}
                    style={styles.viewLink}
                    download
                >
                    {file.originalName} - View
                </a>
                <a
                    href={getDownloadUrl(file.id)}
                    style={styles.downloadLink}
                    download
                >
                    ⬇️ Download
                </a>
            </li>
        }
        return <li key={file.id} style={styles.fileItem}>

            <span style={styles.fileName}>{file.originalName}</span>
            <a
                href={getDownloadUrl(file.id)}
                style={styles.downloadLink}
                download
            >
                ⬇️ Download
            </a>
        </li>
    }

    const getInnerTestDom = (test: TestType) => {
        const params: TestParams = test.params ? JSON.parse(test.params) : {};
        const estimatedTime = getEstimatedTime(test, params);

        return <div style={styles.body}>
            <div style={styles.row}>
                <span style={styles.label}>📋 Name</span>
                <span style={styles.value}>{test.name}</span>
            </div>
            <div style={styles.row}>
                <span style={styles.label}>🆔 ID</span>
                <span style={styles.value}>{test.id}</span>
            </div>
            <div style={styles.row}>
                <span style={styles.label}>📅 Created</span>
                <span style={styles.value}>
                    {new Date(test.createdAt).toLocaleString()}
                </span>
            </div>
            <div style={styles.row}>
                <span style={styles.label}>▶️ Started</span>
                <span style={styles.value}>
                    {test.startedAt ? new Date(test.startedAt).toLocaleString() : '—'}
                </span>
            </div>
            <div style={styles.row}>
                <span style={styles.label}>✅ Finished</span>
                <span style={styles.value}>
                    {test.finishedAt ? new Date(test.finishedAt).toLocaleString() : '—'}
                </span>
            </div>
            <div style={{...styles.row, borderBottom: 'none'}}>
                <span style={styles.label}>⏱️ Time</span>
                <span style={styles.value}>
                    {estimatedTime}
                </span>
            </div>

            {test.params && (
                <>
                    <div style={{...styles.label, marginTop: 20}}>⚙️ Parameters</div>
                    <div style={styles.paramsBox}>{test.params}</div>
                </>
            )}

            {test.files && test.files.length > 0 && (
                <div style={styles.filesSection}>
                    <div style={styles.label}>📁 Files ({test.files.length})</div>
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
                        <span style={styles.badge(status.bg, status.color)}>
                            {status.label}
                        </span>
                    )}
                </div>

                {test && getInnerTestDom(test)}
            </div>
        </div>
    );
};

export default TestPage;