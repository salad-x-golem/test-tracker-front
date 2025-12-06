// Seeded random number generator for deterministic data
function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

export type ProviderStatus = "working" | "waiting" | "unknown";
export type ProviderType =
  | "storage"
  | "compute"
  | "network"
  | "auth"
  | "monitoring"
  | "logging"
  | "cache"
  | "queue";

export interface Provider {
  id: string;
  type: ProviderType;
  status: ProviderStatus;
  last_seen: string | null;
  latency_ms: number | null;
  yagna_running: boolean;
  provider_running: boolean;
  notes?: string;
}

export interface MachineSummary {
  working: number;
  stale: number;
  unknown: number;
  total: number;
  working_percent: number;
}

export interface Machine {
  machine_id: string;
  hostname: string;
  location: string;
  reported_at: string;
  summary: MachineSummary;
}

export interface MachineWithProviders extends Machine {
  providers: Provider[];
}

const LOCATIONS = [
  "us-east-1",
  "us-west-2",
  "eu-west-1",
  "eu-central-1",
  "ap-northeast-1",
  "ap-southeast-1",
  "sa-east-1",
  "ca-central-1",
];

const PROVIDER_TYPES: ProviderType[] = [
  "storage",
  "compute",
  "network",
  "auth",
  "monitoring",
  "logging",
  "cache",
  "queue",
];

const STALE_NOTES = [
  "no heartbeat in last 30m",
  "restarting agent",
  "connection timeout",
  "rate limited",
  "maintenance mode",
];

const UNKNOWN_NOTES = [
  "never reported",
  "pending initialization",
  "configuration error",
  "awaiting credentials",
];

function generateDate(
  rng: () => number,
  baseDate: Date,
  maxOffsetMinutes: number
): string {
  const offsetMs = Math.floor(rng() * maxOffsetMinutes * 60 * 1000);
  const date = new Date(baseDate.getTime() - offsetMs);
  return date.toISOString();
}

function generateProviders(
  machineIndex: number,
  providerCount: number
): Provider[] {
  const rng = seededRandom(machineIndex * 10000);
  const baseDate = new Date("2025-12-04T10:23:00Z");
  const providers: Provider[] = [];

  for (let i = 0; i < providerCount; i++) {
    const statusRoll = rng();
    let status: ProviderStatus;
    let latency_ms: number | null = null;
    let last_seen: string | null = null;
    let notes: string | undefined;

    if (statusRoll < 0.7) {
      status = "working";
      latency_ms = Math.floor(rng() * 100) + 5;
      last_seen = generateDate(rng, baseDate, 5); // within last 5 minutes
    } else if (statusRoll < 0.9) {
      status = "waiting";
      last_seen = generateDate(rng, baseDate, 120); // within last 2 hours
      notes = STALE_NOTES[Math.floor(rng() * STALE_NOTES.length)];
    } else {
      status = "unknown";
      if (rng() > 0.5) {
        last_seen = null;
      } else {
        last_seen = generateDate(rng, baseDate, 1440); // within last day
      }
      notes = UNKNOWN_NOTES[Math.floor(rng() * UNKNOWN_NOTES.length)];
    }

    const providerType =
      PROVIDER_TYPES[Math.floor(rng() * PROVIDER_TYPES.length)];

    providers.push({
      id: `prov-${machineIndex}-${i}`,
      type: providerType,
      status,
      last_seen,
      latency_ms,
      ...(notes && { notes }),
      yagna_running: status === "working" || (status === "waiting" && rng() > 0.5),
      provider_running:
        status === "working" ||
        (status === "waiting" && rng() > 0.3),
    });
  }

  return providers;
}

function calculateSummary(providers: Provider[]): MachineSummary {
  const working = providers.filter((p) => p.status === "working").length;
  const stale = providers.filter((p) => p.status === "waiting").length;
  const unknown = providers.filter((p) => p.status === "unknown").length;
  const total = providers.length;

  return {
    working,
    stale,
    unknown,
    total,
    working_percent: total > 0 ? Math.round((working / total) * 1000) / 10 : 0,
  };
}

function generateMachine(index: number): MachineWithProviders {
  const rng = seededRandom(index);
  const baseDate = new Date("2025-12-04T10:23:00Z");

  const providerCount = Math.floor(rng() * 150) + 50;

  const providers = generateProviders(index, providerCount);
  const summary = calculateSummary(providers);
  const location = LOCATIONS[Math.floor(rng() * LOCATIONS.length)];

  return {
    machine_id: `machine-${index}`,
    hostname: `edge-${index}.example.net`,
    location,
    reported_at: generateDate(rng, baseDate, 10),
    summary,
    providers,
  };
}

const machineCache = new Map<number, MachineWithProviders>();

function getOrGenerateMachine(index: number): MachineWithProviders {
  const cached = machineCache.get(index);
  if (cached) {
    return cached;
  }
  const machine = generateMachine(index);
  machineCache.set(index, machine);
  return machine;
}

const TOTAL_MACHINES = 500;

function toMachine(machineWithProviders: MachineWithProviders): Machine {
  return {
    machine_id: machineWithProviders.machine_id,
    hostname: machineWithProviders.hostname,
    location: machineWithProviders.location,
    reported_at: machineWithProviders.reported_at,
    summary: machineWithProviders.summary,
  };
}

export function getMachines(): Machine[] {
  const machines: Machine[] = [];

  for (let i = 0; i < TOTAL_MACHINES; i++) {
    machines.push(toMachine(getOrGenerateMachine(i)));
  }

  return machines;
}

export function getMachine(machineId: string): Machine | null {
  const match = machineId.match(/^machine-(\d+)$/);
  if (!match) return null;

  const index = parseInt(match[1], 10);
  if (index < 0 || index >= TOTAL_MACHINES) return null;

  return toMachine(getOrGenerateMachine(index));
}

export async function getMachineProviders(machineId: string): Promise<Provider[] | null> {
  const match = machineId.match(/^machine-(\d+)$/);
  if (!match) return null;

  const secret = window.localStorage.getItem("secret_token");
  const query = await fetch(`https://rock.vanity.market/${secret}/process_info.json`);
  const json = await query.json();

  const providers = json as Provider[];


  //const providers = [];
  if (!providers) {
    throw new Error(`Machine ${machineId} not found`);
  }

  for (let i = 0; i < providers.length; i++) {
    console.log(providers[i]);
  }
  return providers;
}

export function getMachineWithProviders(
  machineId: string
): MachineWithProviders | null {
  const match = machineId.match(/^machine-(\d+)$/);
  if (!match) return null;

  const index = parseInt(match[1], 10);
  if (index < 0 || index >= TOTAL_MACHINES) return null;

  return getOrGenerateMachine(index);
}
