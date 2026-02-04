import React, {useEffect, useState} from 'react';
import {useParams, useNavigate} from 'react-router-dom';

type TestType = {
    id: number;
    name: string;
    createdAt: Date;
    startedAt: Date | null;
    finishedAt: Date | null;
    params: string;
};

const TestPage: React.FC = () => {
    const {testName} = useParams();
    const navigate = useNavigate();
    const [test, setTest] = useState<TestType | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        const url = `https://tracker.arkiv-global.net/public/test/${testName}/info`;

        async function load() {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(url, {signal: controller.signal});
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const item = await res.json();
                const parsed: TestType = {
                    id: Number(item.id),
                    name: String(item.name ?? ""),
                    createdAt: item.createdAt,
                    startedAt: item.startedAt ? new Date(item.startedAt) : null,
                    finishedAt: item.finishedAt ? new Date(item.finishedAt) : null,
                    params: String(item.params ?? ""),
                };
                setTest(parsed);
            } catch (err: any) {
                if (err.name !== "AbortError") setError(err.message ?? "Failed to load tests");
            } finally {
                setLoading(false);
            }
        }

        load();
        return () => controller.abort();
    }, []);


    const displayName = testName ? decodeURIComponent(testName) : 'No testName provided';

    return (
        <div style={{padding: 20}}>
            <h1>Test Page</h1>
            <p>
                <strong>testName:</strong> {displayName}
            </p>
            {loading && <p>Loading...</p>}
            {error && <p style={{color: 'red'}}>Error: {error}</p>}
            {test && (
                <div>
                    <h2>Test Details:</h2>
                    <p><strong>ID:</strong> {test.id}</p>
                    <p><strong>Name:</strong> {test.name}</p>
                    <p><strong>Created At:</strong> {new Date(test.createdAt).toLocaleString()}</p>
                    <p><strong>Started At:</strong> {test.startedAt ? new Date(test.startedAt).toLocaleString() : 'N/A'}</p>
                    <p><strong>Finished At:</strong> {test.finishedAt ? new Date(test.finishedAt).toLocaleString() : 'N/A'}</p>
                    <p><strong>Params:</strong> {test.params}</p>
                </div>
            )}

            <button onClick={() => navigate(-1)}>Go Back</button>
        </div>
    );
};

export default TestPage;


