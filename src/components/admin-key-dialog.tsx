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

interface AdminKeyDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onKeySaved?: () => void;
  description?: string;
  showTrigger?: boolean;
}

export function AdminKeyDialog({
  open: controlledOpen,
  onOpenChange,
  onKeySaved,
  description,
  showTrigger = true,
}: AdminKeyDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [key, setKey] = useState("");

  const isControlled = controlledOpen !== undefined;
  const isOpen = controlledOpen ?? internalOpen;

  const handleOpen = (nextOpen: boolean) => {
    if (nextOpen) {
      setKey(getAdminKey());
    }
    if (isControlled) {
      onOpenChange?.(nextOpen);
    } else {
      setInternalOpen(nextOpen);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminKey(key);
    if (isControlled) {
      onOpenChange?.(false);
    } else {
      setInternalOpen(false);
    }
    onKeySaved?.();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpen}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            title="Set Admin Key"
          >
            <KeyRound className="h-5 w-5" />
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Admin Key</DialogTitle>
          <DialogDescription>
            {description ?? "Set the secret token used to authenticate backend requests."}
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
