import { ArrowLeft, Clock, MapPin, RefreshCw, Server } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type Column, DataTable } from "@/components/ui/data-table";
import { LoadingCard, LoadingState } from "@/components/ui/loading-state";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  type Provider,
  useMachine,
  useMachineProviders,
} from "@/features/machines";
import { useTableState } from "@/hooks";

const columns: Column<Provider>[] = [
  {
    key: "id",
    header: "Provider ID",
    sortable: true,
    render: (provider) => (
      <span className="font-mono text-sm">{provider.id}</span>
    ),
  },
  {
    key: "yagna_running",
    header: "Yagna",
    sortable: true,
    render: (provider) => provider.yagna_running ? <div>1</div> : <div>0</div>,
  },
  {
    key: "provider_running",
    header: "Provider",
    sortable: true,
    render: (provider) => provider.provider_running ? <div>1</div> : <div>0</div>,
  },
  {
    key: "type",
    header: "Type",
    sortable: true,
    render: (provider) => <Badge variant="outline">{provider.type}</Badge>,
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    render: (provider) => <StatusBadge status={provider.status} />,
  },
  {
    key: "latency_ms",
    header: "Latency",
    sortable: true,
    render: (provider) =>
      provider.latency_ms !== null ? `${provider.latency_ms}ms` : "—",
    className: "text-right",
  },
  {
    key: "last_seen",
    header: "Last Seen",
    sortable: true,
    render: (provider) => {
      if (!provider.last_seen) return "Never";
      const date = new Date(provider.last_seen);
      return date.toLocaleString();
    },
  },
  {
    key: "notes",
    header: "Notes",
    sortable: false,
    render: (provider) => (
      <span className="text-muted-foreground">{provider.notes || "—"}</span>
    ),
  },
];

export function MachineDetailPage() {
  const { machineId } = useParams<{ machineId: string }>();

  const {
    data: machine,
    isLoading: machineLoading,
    error: machineError,
    refetch: refetchMachine,
    isFetching: isFetchingMachine,
  } = useMachine(machineId ?? "");
  const {
    data: providers,
    isLoading: providersLoading,
    error: providersError,
    refetch: refetchProviders,
    isFetching: isFetchingProviders,
  } = useMachineProviders(machineId ?? "");

  const isFetching = isFetchingMachine || isFetchingProviders;
  const handleRefresh = () => {
    refetchMachine();
    refetchProviders();
  };

  const {
    search,
    setSearch,
    sort,
    handleSort,
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedData,
    filteredCount,
  } = useTableState({
    data: providers,
    searchFields: ["id", "yagna_running", "provider_running", "type", "status", "notes"] as const,
    pageSize: 500,
  });

  if (machineError || providersError) {
    return (
      <div className="space-y-4">
        <Link to="/machines">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Machines
          </Button>
        </Link>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-800">
          Error loading machine:{" "}
          {machineError?.message || providersError?.message}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/machines">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {machineLoading ? "Loading..." : machine?.hostname}
            </h1>
            <p className="font-mono text-muted-foreground">
              {machineLoading ? "" : machine?.machine_id}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={isFetching}>
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Machine Info Cards */}
      {machineLoading ? (
        <div className="grid gap-4 md:grid-cols-4">
          <LoadingCard />
          <LoadingCard />
          <LoadingCard />
          <LoadingCard />
        </div>
      ) : machine ? (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Location</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{machine.location}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Providers
              </CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{machine.summary.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold">
                  {machine.summary.working_percent}%
                </span>
                <Badge
                  variant={
                    machine.summary.working_percent >= 80
                      ? "default"
                      : machine.summary.working_percent >= 50
                      ? "secondary"
                      : "destructive"
                  }
                >
                  {machine.summary.working_percent >= 80
                    ? "Healthy"
                    : machine.summary.working_percent >= 50
                    ? "Degraded"
                    : "Critical"}
                </Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Report</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                {new Date(machine.reported_at).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Provider Status Summary */}
      {machine && (
        <div className="flex gap-4">
          <Badge variant="outline" className="text-green-600">
            Working: {machine.summary.working}
          </Badge>
          <Badge variant="outline" className="text-yellow-600">
            Stale: {machine.summary.stale}
          </Badge>
          <Badge variant="outline" className="text-red-600">
            Unknown: {machine.summary.unknown}
          </Badge>
        </div>
      )}

      {/* Providers Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">Providers</h2>
          <div className="flex items-center gap-4">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search providers..."
              className="w-80"
            />
            <div className="text-sm text-muted-foreground">
              Showing {paginatedData.length} of {filteredCount}
            </div>
          </div>
        </div>

        {providersLoading ? (
          <LoadingState rows={10} />
        ) : (
          <>
            <DataTable
              data={paginatedData}
              columns={columns}
              sort={sort}
              onSort={handleSort}
              rowKey={(provider) => provider.id}
              emptyMessage="No providers found"
            />

            {totalPages > 1 && (
              <div className="flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
