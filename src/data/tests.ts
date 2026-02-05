export type TestParams = {
    runsOn: string;
    testLength: number;
    blockEvery: number;
    arkivOpGeth: string;
    blockLimit: number;
    testScenario: string;
}

export type TestType = {
    id: number;
    name: string;
    createdAt: Date;
    startedAt: Date | null;
    finishedAt: Date | null;
    params: string;
};

export function getGrafanaLink(t: TestType): string {
    return "https://l2.arkiv-global.net/d/advfmrd/l2-tests?var-jobname=" + t.name + "&from=" + t.createdAt.toISOString();
}