import { RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type Column, DataTable } from "@/components/ui/data-table";
import { LoadingState } from "@/components/ui/loading-state";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { type Machine, useMachines } from "@/features/machines";
import { useTableState } from "@/hooks";

const columns: Column<Machine>[] = [
  {
    key: "machine_id",
    header: "Machine ID",
    sortable: true,
    render: (machine) => (
      <span className="font-mono text-sm">{machine.machine_id}</span>
    ),
  },
  {
    key: "hostname",
    header: "Hostname",
    sortable: true,
    render: (machine) => machine.hostname,
  },
  {
    key: "location",
    header: "Location",
    sortable: true,
    render: (machine) => <Badge variant="outline">{machine.location}</Badge>,
  },
  {
    key: "summary.total",
    header: "Providers",
    sortable: true,
    render: (machine) => machine.summary.total,
    className: "text-right",
  },
  {
    key: "summary.working_percent",
    header: "Health",
    sortable: true,
    render: (machine) => {
      const percent = machine.summary.working_percent;
      const variant =
        percent >= 80 ? "default" : percent >= 50 ? "secondary" : "destructive";
      return <Badge variant={variant}>{percent}%</Badge>;
    },
    className: "text-right",
  },
  {
    key: "summary.working",
    header: "Working",
    sortable: true,
    render: (machine) => (
      <span className="text-green-600 dark:text-green-400">
        {machine.summary.working}
      </span>
    ),
    className: "text-right",
  },
  {
    key: "summary.stale",
    header: "Waiting",
    sortable: true,
    render: (machine) => (
      <span className="text-yellow-600 dark:text-yellow-400">
        {machine.summary.stale}
      </span>
    ),
    className: "text-right",
  },
  {
    key: "summary.unknown",
    header: "Unknown",
    sortable: true,
    render: (machine) => (
      <span className="text-red-600 dark:text-red-400">
        {machine.summary.unknown}
      </span>
    ),
    className: "text-right",
  },
];

export function MachinesPage() {
  const navigate = useNavigate();
  const {
    data: machines,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useMachines();

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
    data: machines,
    searchFields: ["machine_id", "hostname", "location"] as const,
    pageSize: 20,
  });

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-800">
        Error loading machines: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Machines</h1>
          <p className="text-muted-foreground">
            View and manage all machines in your system
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <div className="flex items-center justify-between gap-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search machines..."
          className="w-80"
        />
        <div className="text-sm text-muted-foreground">
          Showing {paginatedData.length} of {filteredCount} machines
        </div>
      </div>

      {isLoading ? (
        <LoadingState rows={10} />
      ) : (
        <>
          <DataTable
            data={paginatedData}
            columns={columns}
            sort={sort}
            onSort={handleSort}
            onRowClick={(machine) =>
              navigate(`/machines/${machine.machine_id}`)
            }
            rowKey={(machine) => machine.machine_id}
            emptyMessage="No machines found"
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
  );
}
