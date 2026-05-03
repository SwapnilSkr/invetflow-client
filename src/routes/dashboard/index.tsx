import { useMemo } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  Briefcase,
  Crown,
  Headphones,
  type LucideIcon,
  Plus,
  ThumbsDown,
  ThumbsUp,
  Zap,
} from "lucide-react";
import { Avatar, AvatarFallback } from "#/components/ui/avatar";
import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import type {
  CandidateInterview,
  InterviewScores,
  Job,
} from "#/integrations/api/client";
import {
  candidateInterviewQueries,
  jobQueries,
} from "#/integrations/api/queries";
import { cn } from "#/lib/utils";

export const Route = createFileRoute("/dashboard/")({
  component: RecruiterDashboard,
});

const DASHBOARD_JOB_LIMIT = 100;
/** Overall score at or above this counts toward “Shortlisted”. */
const SHORTLIST_MIN_OVERALL = 7;

type InterviewWithJob = CandidateInterview & { job: Job };

function formatLongDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

function formatDurationFromSeconds(seconds: number) {
  const mins = Math.max(0, Math.round(seconds / 60));
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function candidateLabel(job: Job) {
  return job.candidate_name?.trim() || "Candidate";
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function DiagonalStripeDecoration() {
  return (
    <div
      className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rotate-12 opacity-[0.65]"
      style={{
        background:
          "repeating-linear-gradient(45deg, transparent, transparent 7px, rgb(243 244 246) 7px, rgb(243 244 246) 8px)",
      }}
      aria-hidden
    />
  );
}

function MetricTile({
  label,
  value,
  icon: Icon,
  iconClassName,
  loading,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  iconClassName: string;
  loading: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-black/8 bg-white p-5">
      <DiagonalStripeDecoration />
      <div className="relative flex flex-col gap-3">
        <Icon className={cn("size-7", iconClassName)} strokeWidth={1.5} />
        <p className="text-sm font-medium text-[#111827]">{label}</p>
        {loading ? (
          <Skeleton className="h-9 w-16 rounded-md" />
        ) : (
          <p className="text-3xl font-bold tabular-nums tracking-tight text-[#111827]">
            {value}
          </p>
        )}
      </div>
    </div>
  );
}

function RecruiterDashboard() {
  const { data: jobsPayload, isLoading: jobsLoading } = useQuery(
    jobQueries.list(DASHBOARD_JOB_LIMIT, 0),
  );

  const jobsList = jobsPayload?.jobs ?? [];
  const jobIds = useMemo(() => jobsList.map((j) => j.id), [jobsList]);

  const interviewQueries = useQueries({
    queries: jobIds.map((jobId) => ({
      ...jobQueries.jobInterviews(jobId),
      enabled: jobIds.length > 0 && !jobsLoading,
      staleTime: 60_000,
    })),
  });

  const interviewsWithJob = useMemo(() => {
    if (!jobsList.length) return [];
    const jobById = new Map(jobsList.map((j) => [j.id, j]));
    const rows: InterviewWithJob[] = [];
    for (let i = 0; i < jobIds.length; i++) {
      const jobId = jobIds[i];
      const job = jobById.get(jobId);
      if (!job) continue;
      const list = interviewQueries[i]?.data?.interviews;
      if (!list) continue;
      for (const inv of list) {
        rows.push({ ...inv, job });
      }
    }
    return rows;
  }, [jobsList, jobIds, interviewQueries]);

  const interviewsFetching = interviewQueries.some((q) => q.isFetching);

  const completedIds = useMemo(
    () =>
      interviewsWithJob
        .filter((r) => r.status === "Completed")
        .map((r) => r.id),
    [interviewsWithJob],
  );

  const scoreQueries = useQueries({
    queries: completedIds.map((id) => ({
      ...candidateInterviewQueries.scores(id),
      enabled: completedIds.length > 0,
      staleTime: 60_000,
    })),
  });

  const scoresByInterviewId = useMemo(() => {
    const m = new Map<string, InterviewScores | null>();
    for (let i = 0; i < completedIds.length; i++) {
      m.set(completedIds[i], scoreQueries[i]?.data ?? null);
    }
    return m;
  }, [completedIds, scoreQueries]);

  const scoresPending =
    completedIds.length > 0 &&
    scoreQueries.some((q) => q.isFetching || q.isPending);

  const metricsLoading = jobsLoading || interviewsFetching || scoresPending;

  const openJobsCount = useMemo(
    () =>
      jobsList.filter(
        (j) => j.status !== "Completed" && j.status !== "Cancelled",
      ).length,
    [jobsList],
  );

  const interviewSessionsTotal = interviewsWithJob.length;

  let shortlistedCount = 0;
  let notRecommendedCount = 0;
  for (const id of completedIds) {
    const s = scoresByInterviewId.get(id);
    if (!s) continue;
    if (s.overall >= SHORTLIST_MIN_OVERALL) shortlistedCount += 1;
    else notRecommendedCount += 1;
  }

  const activityRows = useMemo(() => {
    const completed = interviewsWithJob
      .filter((r) => r.status === "Completed" && r.ended_at)
      .sort(
        (a, b) =>
          new Date(b.ended_at!).getTime() - new Date(a.ended_at!).getTime(),
      );
    return completed.slice(0, 12);
  }, [interviewsWithJob]);

  const topCandidates = useMemo(() => {
    const withScores: {
      interview: InterviewWithJob;
      score: InterviewScores;
    }[] = [];
    for (const inv of interviewsWithJob) {
      if (inv.status !== "Completed") continue;
      const s = scoresByInterviewId.get(inv.id);
      if (s && typeof s.overall === "number") {
        withScores.push({ interview: inv, score: s });
      }
    }
    withScores.sort((a, b) => b.score.overall - a.score.overall);
    return withScores.slice(0, 8);
  }, [interviewsWithJob, scoresByInterviewId]);

  return (
    <div className="font-sans text-[#111827]">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#111827]">
              Dashboard
            </h1>
          </div>
          <Button
            asChild
            className="h-11 rounded-xl bg-[#0052cc] font-medium text-white hover:bg-[#0041a3]"
          >
            <Link to="/jobs/new">
              <Plus className="size-4" />
              <p className="text-sm">New job</p>
            </Link>
          </Button>
        </div>

        <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricTile
            label="Open jobs"
            value={openJobsCount}
            icon={Briefcase}
            iconClassName="text-[#2563eb]"
            loading={jobsLoading}
          />
          <MetricTile
            label="Interviews"
            value={interviewSessionsTotal}
            icon={Headphones}
            iconClassName="text-[#7c3aed]"
            loading={jobsLoading || interviewsFetching}
          />
          <MetricTile
            label="Shortlisted"
            value={shortlistedCount}
            icon={ThumbsUp}
            iconClassName="text-[#16a34a]"
            loading={metricsLoading}
          />
          <MetricTile
            label="Not recommended"
            value={notRecommendedCount}
            icon={ThumbsDown}
            iconClassName="text-[#dc2626]"
            loading={metricsLoading}
          />
        </div>

        <section className="mb-10">
          <h2 className="text-xl font-bold tracking-tight text-[#111827]">
            Activity feed
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#6b7280]">
            Here&rsquo;s a reminder of what your team have been up to recently.
          </p>
          <div className="mt-6 rounded-xl border border-black/8 bg-white">
            {jobsLoading || interviewsFetching ? (
              <ul className="divide-y divide-black/8 px-4 py-2">
                {["a", "b", "c"].map((k) => (
                  <li key={k} className="flex gap-4 py-4">
                    <Skeleton className="size-10 shrink-0 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/5 max-w-md" />
                      <Skeleton className="h-3 w-2/5 max-w-sm" />
                    </div>
                  </li>
                ))}
              </ul>
            ) : activityRows.length === 0 ? (
              <div className="relative flex flex-col items-center justify-center overflow-hidden px-6 py-16 text-center">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#f3f4f6_1px,transparent_1px),linear-gradient(to_bottom,#f3f4f6_1px,transparent_1px)] bg-size-[1.5rem_1.5rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_50%,#000_10%,transparent_100%)]" />

                <div className="relative mb-5 flex h-16 w-16 items-center justify-center">
                  <div className="absolute inset-0 animate-pulse rounded-full bg-[#0052cc]/10 blur-xl" />
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-black/5 bg-linear-to-b from-white to-[#f9fafb] shadow-sm ring-1 ring-black/5">
                    <Activity className="size-6 text-[#0052cc]" />
                  </div>
                </div>

                <h3 className="relative text-base font-semibold tracking-tight text-[#111827]">
                  No activity to report
                </h3>
                <p className="relative mt-1.5 max-w-sm text-sm text-[#6b7280]">
                  Your activity feed is waiting for its first update. Once
                  candidates start and complete their interviews, you'll see a
                  timeline of events right here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-black/8">
                {activityRows.map((row) => {
                  const name = candidateLabel(row.job);
                  const score = scoresByInterviewId.get(row.id);
                  const strong = score && score.overall >= 8;
                  return (
                    <li key={row.id} className="px-4 py-4">
                      <div className="flex gap-4">
                        <Avatar className="size-10 border border-black/8 bg-[#f9fafb]">
                          <AvatarFallback className="bg-[#e5e7eb] text-xs font-semibold text-[#374151]">
                            {initials(name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm leading-snug text-[#111827]">
                            <span className="font-semibold">{name}</span>
                            {strong ? (
                              <Zap
                                className="mx-1 inline size-3.5 -translate-y-px text-amber-500"
                                aria-hidden
                              />
                            ) : null}{" "}
                            has completed{" "}
                            <Link
                              to="/jobs/$id"
                              params={{ id: row.job.id }}
                              className="font-medium text-[#0052cc] no-underline hover:underline"
                            >
                              {row.job.title}
                            </Link>{" "}
                            interview.
                          </p>
                          <p className="mt-1.5 text-xs leading-relaxed text-[#6b7280]">
                            {row.job.candidate_email ?? "—"}
                            <span className="mx-1.5 text-[#d1d5db]">✦</span>
                            {score ? (
                              <>
                                Score:{" "}
                                <span className="font-medium text-[#ca8a04]">
                                  {score.overall.toFixed(1)}/10
                                </span>
                              </>
                            ) : (
                              <>Score: pending</>
                            )}
                            <span className="mx-1.5 text-[#d1d5db]">✦</span>
                            Duration:{" "}
                            {formatDurationFromSeconds(row.duration_seconds)}
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        <section className="pb-4">
          <h2 className="text-xl font-bold tracking-tight text-[#111827]">
            Top scoring candidates
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#6b7280]">
            Elite candidates who have aced their interviews with flying colors.
          </p>
          {jobsLoading || interviewsFetching ? (
            <div className="mt-6 flex gap-4 overflow-x-auto pb-2">
              {[1, 2, 3].map((k) => (
                <Skeleton
                  key={k}
                  className="h-[200px] min-w-[260px] shrink-0 rounded-xl"
                />
              ))}
            </div>
          ) : topCandidates.length === 0 ? (
            <div className="relative mt-6 flex flex-col items-center justify-center overflow-hidden rounded-xl border border-black/8 bg-linear-to-b from-white to-[#f9fafb] px-6 py-14 text-center shadow-sm">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#f3f4f6_0%,transparent_70%)]" />

              <div className="relative mb-5 flex h-16 w-16 items-center justify-center">
                <div className="absolute inset-0 animate-pulse rounded-full bg-amber-500/15 blur-xl" />
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-black/5 bg-linear-to-b from-white to-[#fffbeb] shadow-sm ring-1 ring-black/5">
                  <Crown className="size-6 text-amber-500" />
                </div>
              </div>

              <h3 className="relative text-base font-semibold tracking-tight text-[#111827]">
                Waiting for top performers
              </h3>
              <p className="relative mt-1.5 max-w-sm text-sm text-[#6b7280]">
                As interviews are scored, your highest-performing candidates
                will be showcased here, making it easy to identify your top
                talent.
              </p>
            </div>
          ) : (
            <div className="mt-6 flex gap-4 overflow-x-auto pb-2">
              {topCandidates.map(({ interview, score }, rank) => {
                const name = candidateLabel(interview.job);
                const showCrown = rank === 0;
                const showZap = score.overall >= 8 && rank > 0;
                const ended = interview.ended_at ?? interview.started_at;
                return (
                  <div
                    key={interview.id}
                    className="min-w-[260px] shrink-0 overflow-hidden rounded-xl border border-black/8 bg-white"
                  >
                    <div className="p-4">
                      <div className="flex gap-3">
                        <Avatar className="size-11 border border-black/8 bg-[#f9fafb]">
                          <AvatarFallback className="text-sm font-semibold text-[#374151]">
                            {initials(name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate font-semibold text-[#111827]">
                              {name}
                            </p>
                            {showCrown ? (
                              <Crown
                                className="size-4 shrink-0 text-amber-500"
                                aria-label="Top score"
                              />
                            ) : null}
                            {showZap ? (
                              <Zap
                                className="size-4 shrink-0 text-amber-500"
                                aria-hidden
                              />
                            ) : null}
                          </div>
                          <p className="truncate text-xs text-[#6b7280]">
                            {interview.job.candidate_email ?? "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start justify-between gap-3 border-t border-black/8 px-4 py-3">
                      <div className="min-w-0">
                        <Link
                          to="/jobs/$id"
                          params={{ id: interview.job.id }}
                          className="block truncate text-sm font-semibold text-[#111827] no-underline hover:underline"
                        >
                          {interview.job.title}
                        </Link>
                        <p className="mt-0.5 text-xs text-[#6b7280]">
                          {formatLongDate(ended)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="text-2xl font-bold tabular-nums text-[#16a34a]">
                          {score.overall.toFixed(1)}
                        </span>
                        <span className="text-xs text-[#9ca3af]">/10</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
