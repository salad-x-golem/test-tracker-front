import {useState} from "react";
import {Plus} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {fetchWithAuth} from "@/lib/fetch-with-auth.ts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const WORKER_OPTIONS = ["luna", "flux", "pulse", "apex", "zeus"] as const;

const LS_KEY = "new_test_selected_worker";

function getSavedWorker(): string {
  try {
    const saved = localStorage.getItem(LS_KEY);
    if (saved && WORKER_OPTIONS.includes(saved as typeof WORKER_OPTIONS[number])) {
      return saved;
    }
  } catch { /* ignore */ }
  return "zeus";
}

function workerToFormValue(worker: string): string {
  return `["${worker}"]`;
}

function getDefaults(external: boolean, worker: string) {
  const base = {
    timeoutMinutes: "5",
    workers: workerToFormValue(worker),
    testLength: 60,
    testScenario: "dc_write_only",
    testUsers: 20,
  };
  if (external) {
    return {
      ...base,
      isExternal: true as const,
      externalRpcUrl: "https://kaolin.hoodi.arkiv.network/rpc",
    };
  }
  return {
    ...base,
    arkivOpGeth: "v1.101605.0-1.2",
    blockEvery: 1,
    blockLimit: 60000000,
    isExternal: false as const,
  };
}

type InternalFormData = ReturnType<typeof getDefaults> & { isExternal: false; arkivOpGeth: string; blockEvery: number; blockLimit: number };
type ExternalFormData = ReturnType<typeof getDefaults> & { isExternal: true; externalRpcUrl: string };
type FormData = InternalFormData | ExternalFormData;

export function NewTestDialog({onTestCreated}: { onTestCreated?: () => void }) {
  const [open, setOpen] = useState(false);
  const [isExternal, setIsExternal] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(getSavedWorker);
  const [formData, setFormData] = useState<FormData>(() => getDefaults(false, getSavedWorker()) as FormData);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({...prev, [field]: value}));
  };

  const handleWorkerChange = (worker: string) => {
    setSelectedWorker(worker);
    try { localStorage.setItem(LS_KEY, worker); } catch { /* ignore */ }
    handleChange("workers", workerToFormValue(worker));
  };

  const handleTestTypeChange = (external: boolean) => {
    setIsExternal(external);
    setFormData(getDefaults(external, selectedWorker) as FormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetchWithAuth("https://tracker.arkiv-global.net/public/test/run", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      setFormData(getDefaults(isExternal, selectedWorker) as FormData);
      setOpen(false);
      onTestCreated?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create test");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4"/>
          New Test
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Test</DialogTitle>
          <DialogDescription>
            Configure and start a new test run.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 py-2">
          <Button
            type="button"
            variant={!isExternal ? "default" : "outline"}
            onClick={() => handleTestTypeChange(false)}
            className="flex-1"
          >
            Internal
          </Button>
          <Button
            type="button"
            variant={isExternal ? "default" : "outline"}
            onClick={() => handleTestTypeChange(true)}
            className="flex-1"
          >
            External
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="timeoutMinutes" className="text-right">Timeout (min)</Label>
            <Input
              id="timeoutMinutes"
              value={formData.timeoutMinutes}
              onChange={(e) => handleChange("timeoutMinutes", e.target.value)}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="workers" className="text-right">Workers</Label>
            <Select value={selectedWorker} onValueChange={handleWorkerChange}>
              <SelectTrigger id="workers" className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WORKER_OPTIONS.map((w) => (
                  <SelectItem key={w} value={w}>{w}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {!isExternal && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="arkivOpGeth" className="text-right">Arkiv Op Geth</Label>
              <Input
                id="arkivOpGeth"
                value={(formData as InternalFormData).arkivOpGeth}
                onChange={(e) => handleChange("arkivOpGeth", e.target.value)}
                className="col-span-3"
                required
              />
            </div>
          )}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="testLength" className="text-right">Test Length (s)</Label>
            <Input
              id="testLength"
              type="number"
              value={formData.testLength}
              onChange={(e) => handleChange("testLength", Number(e.target.value))}
              className="col-span-3"
              required
            />
          </div>
          {!isExternal && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="blockEvery" className="text-right">Block Every</Label>
                <Input
                  id="blockEvery"
                  type="number"
                  value={(formData as InternalFormData).blockEvery}
                  onChange={(e) => handleChange("blockEvery", Number(e.target.value))}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="blockLimit" className="text-right">Block Limit</Label>
                <Input
                  id="blockLimit"
                  type="number"
                  value={(formData as InternalFormData).blockLimit}
                  onChange={(e) => handleChange("blockLimit", Number(e.target.value))}
                  className="col-span-3"
                  required
                />
              </div>
            </>
          )}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="testScenario" className="text-right">Test Scenario</Label>
            <Input
              id="testScenario"
              value={formData.testScenario}
              onChange={(e) => handleChange("testScenario", e.target.value)}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="testUsers" className="text-right">Test Users</Label>
            <Input
              id="testUsers"
              type="number"
              value={formData.testUsers}
              onChange={(e) => handleChange("testUsers", Number(e.target.value))}
              className="col-span-3"
              required
            />
          </div>
          {isExternal && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="externalRpcUrl" className="text-right">External RPC URL</Label>
              <Input
                id="externalRpcUrl"
                value={(formData as ExternalFormData).externalRpcUrl}
                onChange={(e) => handleChange("externalRpcUrl", e.target.value)}
                className="col-span-3"
                required
              />
            </div>
          )}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating…" : "Run Test"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
