import { Badge } from "@/components/ui/badge";
import type { ProviderStatus } from "@/features/machines";

const statusConfig: Record<
  ProviderStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  working: { label: "Working", variant: "default" },
  waiting: { label: "Waiting", variant: "secondary" },
  unknown: { label: "Unknown", variant: "destructive" },
};

interface StatusBadgeProps {
  status: ProviderStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
