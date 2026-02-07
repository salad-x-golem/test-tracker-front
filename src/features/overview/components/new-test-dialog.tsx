import {useState} from "react";
import {Plus} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
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

const DEFAULT_FORM_VALUES = {
  runsOn: "",
  testLength: 300,
  blockEvery: 5,
  arkivOpGeth: "",
  blockLimit: 100,
  testScenario: "",
};

export function NewTestDialog({onTestCreated}: { onTestCreated?: () => void }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState(DEFAULT_FORM_VALUES);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({...prev, [field]: value}));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetchWithAuth("https://tracker.arkiv-global.net/public/test/new", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      setFormData(DEFAULT_FORM_VALUES);
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
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="runsOn" className="text-right">Runs On</Label>
            <Input
              id="runsOn"
              value={formData.runsOn}
              onChange={(e) => handleChange("runsOn", e.target.value)}
              className="col-span-3"
              required
            />
          </div>
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
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="blockEvery" className="text-right">Block Every</Label>
            <Input
              id="blockEvery"
              type="number"
              value={formData.blockEvery}
              onChange={(e) => handleChange("blockEvery", Number(e.target.value))}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="arkivOpGeth" className="text-right">Arkiv Op Geth</Label>
            <Input
              id="arkivOpGeth"
              value={formData.arkivOpGeth}
              onChange={(e) => handleChange("arkivOpGeth", e.target.value)}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="blockLimit" className="text-right">Block Limit</Label>
            <Input
              id="blockLimit"
              type="number"
              value={formData.blockLimit}
              onChange={(e) => handleChange("blockLimit", Number(e.target.value))}
              className="col-span-3"
              required
            />
          </div>
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
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating…" : "Create Test"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
