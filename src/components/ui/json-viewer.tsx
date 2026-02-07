import {useState, type CSSProperties} from "react";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

interface JsonViewerProps {
    data: JsonValue;
}

const styles: Record<string, CSSProperties> = {
    container: {
        background: "#f9fafb",
        borderRadius: 4,
        border: "1px solid #e5e7eb",
        padding: 12,
        marginTop: 12,
        fontFamily: "'SF Mono', Monaco, 'Courier New', monospace",
        fontSize: 12,
        lineHeight: 1.6,
        overflowX: "auto",
    },
    key: {
        color: "#0550ae",
        fontWeight: 500,
    },
    string: {
        color: "#0a3069",
    },
    number: {
        color: "#0550ae",
    },
    boolean: {
        color: "#cf222e",
    },
    null: {
        color: "#6b7280",
        fontStyle: "italic",
    },
    brace: {
        color: "#6b7280",
    },
    toggle: {
        cursor: "pointer",
        userSelect: "none" as const,
        background: "none",
        border: "none",
        padding: 0,
        fontFamily: "inherit",
        fontSize: "inherit",
        color: "#6b7280",
        marginRight: 4,
    },
    row: {
        display: "flex",
        alignItems: "flex-start",
    },
};

function Indent({level}: { level: number }) {
    return <span style={{paddingLeft: level * 16}}/>;
}

function JsonString({value}: { value: string }) {
    return <span style={styles.string}>"{value}"</span>;
}

function JsonNumber({value}: { value: number }) {
    return <span style={styles.number}>{String(value)}</span>;
}

function JsonBoolean({value}: { value: boolean }) {
    return <span style={styles.boolean}>{String(value)}</span>;
}

function JsonNull() {
    return <span style={styles.null}>null</span>;
}

function JsonObject({data, level}: { data: Record<string, JsonValue>; level: number }) {
    const [collapsed, setCollapsed] = useState(false);
    const entries = Object.entries(data);

    if (entries.length === 0) {
        return <span style={styles.brace}>{"{}"}</span>;
    }

    if (collapsed) {
        return (
            <span>
                <button style={styles.toggle} onClick={() => setCollapsed(false)} aria-label="Expand">▶</button>
                <span style={styles.brace}>{"{ "}</span>
                <span style={{color: "#6b7280"}}>{entries.length} {entries.length === 1 ? "key" : "keys"}</span>
                <span style={styles.brace}>{" }"}</span>
            </span>
        );
    }

    return (
        <span>
            <button style={styles.toggle} onClick={() => setCollapsed(true)} aria-label="Collapse">▼</button>
            <span style={styles.brace}>{"{"}</span>
            {entries.map(([key, value], i) => (
                <div key={key} style={styles.row}>
                    <Indent level={level + 1}/>
                    <span>
                        <span style={styles.key}>"{key}"</span>
                        <span style={styles.brace}>: </span>
                        <JsonValueNode data={value} level={level + 1}/>
                        {i < entries.length - 1 && <span style={styles.brace}>,</span>}
                    </span>
                </div>
            ))}
            <div style={styles.row}>
                <Indent level={level}/>
                <span style={styles.brace}>{"}"}</span>
            </div>
        </span>
    );
}

function JsonArray({data, level}: { data: JsonValue[]; level: number }) {
    const [collapsed, setCollapsed] = useState(false);

    if (data.length === 0) {
        return <span style={styles.brace}>{"[]"}</span>;
    }

    if (collapsed) {
        return (
            <span>
                <button style={styles.toggle} onClick={() => setCollapsed(false)} aria-label="Expand">▶</button>
                <span style={styles.brace}>{"[ "}</span>
                <span style={{color: "#6b7280"}}>{data.length} {data.length === 1 ? "item" : "items"}</span>
                <span style={styles.brace}>{" ]"}</span>
            </span>
        );
    }

    return (
        <span>
            <button style={styles.toggle} onClick={() => setCollapsed(true)} aria-label="Collapse">▼</button>
            <span style={styles.brace}>{"["}</span>
            {data.map((value, i) => (
                <div key={i} style={styles.row}>
                    <Indent level={level + 1}/>
                    <span>
                        <JsonValueNode data={value} level={level + 1}/>
                        {i < data.length - 1 && <span style={styles.brace}>,</span>}
                    </span>
                </div>
            ))}
            <div style={styles.row}>
                <Indent level={level}/>
                <span style={styles.brace}>{"]"}</span>
            </div>
        </span>
    );
}

function JsonValueNode({data, level}: { data: JsonValue; level: number }) {
    if (data === null) return <JsonNull/>;
    if (typeof data === "string") return <JsonString value={data}/>;
    if (typeof data === "number") return <JsonNumber value={data}/>;
    if (typeof data === "boolean") return <JsonBoolean value={data}/>;
    if (Array.isArray(data)) return <JsonArray data={data} level={level}/>;
    if (typeof data === "object") return <JsonObject data={data as Record<string, JsonValue>} level={level}/>;
    return <span>{String(data)}</span>;
}

export function JsonViewer({data}: JsonViewerProps) {
    return (
        <div style={styles.container}>
            <JsonValueNode data={data} level={0}/>
        </div>
    );
}
