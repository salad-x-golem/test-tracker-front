import { useState } from "react";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getAdminKey, setAdminKey } from "@/lib/admin-key";

export function AdminKeyDialog() {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState("");

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setKey(getAdminKey());
    }
    setOpen(isOpen);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminKey(key);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          title="Set Admin Key"
        >
          <KeyRound className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Admin Key</DialogTitle>
          <DialogDescription>
            Set the secret token used to authenticate backend requests.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="adminKey" className="text-right">Key</Label>
            <Input
              id="adminKey"
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="col-span-3"
              placeholder="Enter admin key"
            />
          </div>
          <DialogFooter>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
