import {getGrafanaLink, type TestParams, type TestType} from "@/data/tests.ts";
import {JsonViewer} from "@/components/ui/json-viewer.tsx";
import {formatFileSize} from "@/lib/utils.ts";

type FileType = {
    id: number;
    uid: number;
    originalName: string;
    path: string;
    testId: number;
    size: number;
};

export type TestWithFiles = TestType & {
    files: FileType[];
};

const styles = {
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
    fileSize: {
        color: '#6b7280',
        fontSize: 12,
        fontWeight: 400,
        marginLeft: 4,
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

const getDownloadUrl = (uid: number) => {
    return `https://tracker.arkiv-global.net/public/file/${uid}/download`;
};

const getViewUrl = (uid: number) => {
    return `https://tracker.arkiv-global.net/public/file/${uid}/view`;
};

function getEstimatedTime(test: TestWithFiles, params: TestParams) {
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
        const duration = (new Date(test.finishedAt).getTime() - new Date(test.startedAt).getTime()) / 1000;
        return formatDuration(duration);
    }

    if (test.startedAt && !test.finishedAt) {
        const elapsed = (Date.now() - new Date(test.startedAt).getTime()) / 1000;
        return `${formatDuration(elapsed)} (running) / ~${formatDuration(params.testLength)} (planned)`;
    }

    const elapsedFromCreate = (Date.now() - new Date(test.createdAt).getTime()) / 1000;
    const elapsedFromCreateEst = 115 - elapsedFromCreate;
    if (elapsedFromCreateEst >= 0) {
        return `~${formatDuration(elapsedFromCreateEst)} (estimated start)`;
    } else {
        return `Staring due ${-elapsedFromCreateEst}s`;
    }
}

function renderFile(file: FileType) {
    const sizeLabel = file.size != null ? `(${formatFileSize(file.size)})` : '';
    if (file.originalName.endsWith(".html")
        || file.originalName.endsWith(".json")
        || file.originalName.endsWith(".log")
    ) {
        return <li key={file.id} style={styles.fileItem}>
            <span style={styles.fileName}>{file.originalName}<span style={styles.fileSize}>{sizeLabel}</span></span>
            <div>
                <a href={getViewUrl(file.uid)} style={styles.viewLink}>
                    View
                </a>
                <a href={getDownloadUrl(file.uid)} style={styles.downloadLink} download>
                    Download
                </a>
            </div>
        </li>
    }
    return <li key={file.id} style={styles.fileItem}>
        <span style={styles.fileName}>{file.originalName}<span style={styles.fileSize}>{sizeLabel}</span></span>
        <a href={getDownloadUrl(file.uid)} style={styles.downloadLink} download>
            Download
        </a>
    </li>
}

interface TestDetailCardProps {
    test: TestWithFiles;
}

export function TestDetailCard({test}: TestDetailCardProps) {
    const params: TestParams = test.params ? JSON.parse(test.params) : {};
    const estimatedTime = getEstimatedTime(test, params);

    return <div style={styles.body}>

        <div style={styles.row}>
            <span style={styles.label}>Name</span>
            <span style={styles.value}>{test.name}</span>
        </div>
        {params.isExternal || (
            <div style={styles.row}>
                <span style={styles.label}>Grafana link</span>
                <span style={styles.value}><a
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
                </a></span>
            </div>

        )}
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
                <JsonViewer data={params}/>
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
