import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import {
	AlertTriangle,
	Briefcase,
	ChevronLeft,
	ChevronRight,
	Search,
	Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Select } from "#/components/ui/select";
import { Skeleton } from "#/components/ui/skeleton";
import { applicationQueries, jobQueries } from "#/integrations/api/queries";
import { requireStaff } from "#/lib/require-role";

export const Route = createFileRoute("/dashboard/candidates")({
	beforeLoad: requireStaff,
	component: TalentPoolPage,
	validateSearch: (s: Record<string, unknown>) => ({
		search: typeof s.search === "string" ? s.search : undefined,
		job_id: typeof s.job_id === "string" ? s.job_id : undefined,
		status: typeof s.status === "string" ? s.status : undefined,
		page: typeof s.page === "number" ? s.page : 1,
	}),
});

const STATUS_OPTIONS = [
	"All",
	"Prospect",
	"Invited",
	"Applied",
	"Screening",
	"Interview",
	"Offer",
	"Hired",
	"Rejected",
];

const PAGE_SIZE = 20;
const SKELETON_ROWS = ["s1", "s2", "s3", "s4", "s5"];

function TalentPoolPage() {
	const navigate = useNavigate({ from: Route.fullPath });
	const searchParams = Route.useSearch();

	const [searchInput, setSearchInput] = useState(searchParams.search ?? "");

	useEffect(() => {
		const timer = setTimeout(() => {
			const next = searchInput.trim() || undefined;
			if (next !== searchParams.search) {
				navigate({
					search: (prev) => ({
						...prev,
						search: next,
						page: 1,
					}),
					replace: true,
				});
			}
		}, 300);
		return () => clearTimeout(timer);
	}, [searchInput, searchParams.search, navigate]);

	const { data, isLoading, error, refetch } = useQuery(
		applicationQueries.forOrg({
			search: searchParams.search,
			job_id: searchParams.job_id,
			status: searchParams.status,
			page: searchParams.page,
			limit: PAGE_SIZE,
		}),
	);

	const { data: jobsData } = useQuery(jobQueries.list());

	const totalPages = Math.ceil((data?.total ?? 0) / PAGE_SIZE);
	const hasFilters =
		!!searchParams.search || !!searchParams.job_id || !!searchParams.status;

	function handleJobFilterChange(value: string) {
		navigate({
			search: (prev) => ({
				...prev,
				job_id: value || undefined,
				page: 1,
			}),
			replace: true,
		});
	}

	function handleStatusFilterChange(value: string) {
		navigate({
			search: (prev) => ({
				...prev,
				status: value === "All" ? undefined : value,
				page: 1,
			}),
			replace: true,
		});
	}

	function handlePageChange(newPage: number) {
		navigate({
			search: (prev) => ({ ...prev, page: newPage }),
			replace: true,
		});
	}

	return (
		<div className="mx-auto w-full max-w-6xl">
			<div className="mb-6 flex flex-wrap items-end justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold tracking-tight text-foreground">
						Talent Pool
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						{data?.total ?? 0} candidate{data?.total === 1 ? "" : "s"} across
						all jobs
					</p>
				</div>
			</div>

			<div className="mb-4 flex flex-wrap items-center gap-3">
				<div className="relative flex-1 min-w-[240px] max-w-sm">
					<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder="Search by name or email..."
						value={searchInput}
						onChange={(e) => setSearchInput(e.target.value)}
						className="pl-9"
					/>
				</div>

				<Select
					value={searchParams.job_id ?? ""}
					onChange={(e) => handleJobFilterChange(e.target.value)}
					className="w-56"
				>
					<option value="">All jobs</option>
					{jobsData?.jobs.map((job) => (
						<option key={job.id} value={job.id}>
							{job.title}
						</option>
					))}
				</Select>

				<Select
					value={searchParams.status ?? "All"}
					onChange={(e) => handleStatusFilterChange(e.target.value)}
					className="w-40"
				>
					{STATUS_OPTIONS.map((status) => (
						<option key={status} value={status}>
							{status}
						</option>
					))}
				</Select>
			</div>

			{error ? (
				<Alert variant="destructive" className="mb-4">
					<AlertTriangle className="size-4" />
					<AlertTitle>Error loading candidates</AlertTitle>
					<AlertDescription>
						{(error as Error).message}
						<Button
							variant="outline"
							size="sm"
							className="ml-3"
							onClick={() => refetch()}
						>
							Try again
						</Button>
					</AlertDescription>
				</Alert>
			) : null}

			<div className="overflow-hidden rounded-lg border border-border bg-card">
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b border-border bg-muted/50">
							<th className="px-4 py-3 text-left font-medium text-muted-foreground">
								Name
							</th>
							<th className="px-4 py-3 text-left font-medium text-muted-foreground">
								Email
							</th>
							<th className="px-4 py-3 text-left font-medium text-muted-foreground">
								Job
							</th>
							<th className="px-4 py-3 text-left font-medium text-muted-foreground">
								Status
							</th>
							<th className="px-4 py-3 text-left font-medium text-muted-foreground">
								Added
							</th>
						</tr>
					</thead>
					<tbody>
						{isLoading ? (
							SKELETON_ROWS.map((key) => (
								<tr key={key} className="border-b border-border">
									<td className="px-4 py-3">
										<Skeleton className="h-4 w-32" />
									</td>
									<td className="px-4 py-3">
										<Skeleton className="h-4 w-40" />
									</td>
									<td className="px-4 py-3">
										<Skeleton className="h-4 w-28" />
									</td>
									<td className="px-4 py-3">
										<Skeleton className="h-5 w-16" />
									</td>
									<td className="px-4 py-3">
										<Skeleton className="h-4 w-20" />
									</td>
								</tr>
							))
						) : data?.applications.length === 0 ? (
							<tr>
								<td colSpan={5} className="px-4 py-12">
									<div className="flex flex-col items-center justify-center text-center">
										<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
											<Users className="size-5 text-muted-foreground" />
										</div>
										<p className="text-sm font-medium text-foreground">
											{hasFilters
												? "No candidates match your filters."
												: "No candidates yet."}
										</p>
										{!hasFilters ? (
											<p className="mt-1 text-sm text-muted-foreground">
												Invite someone from a job's{" "}
												<Link
													to="/dashboard/jobs"
													className="text-primary underline-offset-4 hover:underline"
												>
													pipeline board
												</Link>
												.
											</p>
										) : null}
									</div>
								</td>
							</tr>
						) : (
							data?.applications.map((app) => (
								<tr
									key={app.id}
									className="border-b border-border transition-colors hover:bg-muted/50 cursor-pointer"
									onClick={() =>
										navigate({
											to: "/jobs/$id/pipeline",
											params: { id: app.job_id },
										})
									}
								>
									<td className="px-4 py-3">
										<div className="flex items-center gap-3">
											<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
												{(app.candidate_name ?? app.candidate_email)
													.charAt(0)
													.toUpperCase() || "?"}
											</div>
											<span className="font-medium text-foreground">
												{app.candidate_name ?? app.candidate_email}
											</span>
										</div>
									</td>
									<td className="px-4 py-3 text-muted-foreground">
										{app.candidate_email}
									</td>
									<td className="px-4 py-3">
										<Link
											to="/jobs/$id/pipeline"
											params={{ id: app.job_id }}
											className="inline-flex items-center gap-1.5 text-primary hover:underline"
											onClick={(e) => e.stopPropagation()}
										>
											<Briefcase className="size-3.5" />
											<span className="max-w-[200px] truncate">
												{app.job_title}
											</span>
										</Link>
									</td>
									<td className="px-4 py-3">
										<StatusBadge status={app.board_status} />
									</td>
									<td
										className="px-4 py-3 text-muted-foreground"
										suppressHydrationWarning
									>
										{formatDistanceToNow(new Date(app.created_at), {
											addSuffix: true,
										})}
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>

			{totalPages > 1 && (
				<div className="mt-4 flex items-center justify-between">
					<Button
						variant="outline"
						size="sm"
						disabled={searchParams.page <= 1}
						onClick={() => handlePageChange(searchParams.page - 1)}
					>
						<ChevronLeft className="size-4 mr-1" />
						Previous
					</Button>
					<span className="text-sm text-muted-foreground">
						Page {searchParams.page} of {totalPages}
					</span>
					<Button
						variant="outline"
						size="sm"
						disabled={searchParams.page >= totalPages}
						onClick={() => handlePageChange(searchParams.page + 1)}
					>
						Next
						<ChevronRight className="size-4 ml-1" />
					</Button>
				</div>
			)}
		</div>
	);
}

function StatusBadge({ status }: { status: string }) {
	const style =
		status === "Invited"
			? "bg-primary/10 text-primary border-transparent"
			: status === "Rejected"
				? "bg-destructive/10 text-destructive border-transparent"
				: status === "Hired"
					? "bg-green-100 text-green-800 border-transparent"
					: "bg-secondary text-secondary-foreground border-transparent";

	return (
		<Badge variant="outline" className={style}>
			{status}
		</Badge>
	);
}
