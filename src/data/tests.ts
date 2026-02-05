export type TestParams = {
    "runs-on": string;
    "test-length": number;
    "block-every": number;
    "arkiv-op-geth": string;
    "block-limit": number;
    "test-scenario": string;
}

export type TestType = {
    id: number;
    name: string;
    createdAt: Date;
    startedAt: Date | null;
    finishedAt: Date | null;
    params: string;
};
