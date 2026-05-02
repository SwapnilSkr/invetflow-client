import { useQueryClient } from "@tanstack/react-query";
import {
	createFileRoute,
	Link,
	redirect,
	useNavigate,
	useRouter,
} from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { BrandMark } from "#/components/onboarding/BrandMark";
import { OnboardingVisualPanel } from "#/components/onboarding/OnboardingVisualPanel";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { ApiError, loginWithPassword } from "#/integrations/api/client";
import { useAuth, useLogout } from "#/integrations/api/hooks";
import {
	ensureAuthResolved,
	useAuthStore,
} from "#/integrations/auth/auth-store";
import { getSafeInternalRedirect } from "#/lib/safe-redirect";

type SignInSearch = { redirect?: string };

export const Route = createFileRoute("/sign-in")({
	validateSearch: (search: Record<string, unknown>): SignInSearch => ({
		redirect: typeof search.redirect === "string" ? search.redirect : undefined,
	}),
	beforeLoad: async ({ search }) => {
		if (typeof window === "undefined") return;
		await ensureAuthResolved();
		const { status, user } = useAuthStore.getState();
		if (status !== "authenticated" || !user) return;
		const next = getSafeInternalRedirect(
			typeof search.redirect === "string" ? search.redirect : undefined,
		);
		if (next) {
			throw redirect({ href: next, replace: true });
		}
		if (user.role === "Candidate") {
			throw redirect({ to: "/candidate", replace: true });
		}
		if (!user.onboarding_completed_at) {
			throw redirect({
				to: "/onboarding",
				search: { step: "profile" },
				replace: true,
			});
		}
		throw redirect({ to: "/dashboard", replace: true });
	},
	component: SignInPage,
});

const fieldInputClass =
	"h-[50px] rounded-[12px] border border-black/8 bg-white px-4 text-base text-[#111827] shadow-none placeholder:text-[#111827]/50 focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0";

function SignInPage() {
	const { user, isAuthenticated, isLoading } = useAuth();
	const navigate = useNavigate();
	const router = useRouter();
	const { redirect: redirectTo } = Route.useSearch();
	const queryClient = useQueryClient();
	const doLogout = useLogout();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [, startTransition] = useTransition();

	if (isLoading) {
		return (
			<div className="flex min-h-svh items-center justify-center bg-[#f9fafb]">
				<Loader2
					className="h-6 w-6 animate-spin text-[#0052cc]"
					aria-label="Loading"
				/>
			</div>
		);
	}

	if (isAuthenticated && user) {
		return (
			<div className="min-h-svh bg-[#f9fafb] px-4 py-10 text-[#111827]">
				<div className="mx-auto w-full max-w-md rounded-[12px] border border-black/8 bg-white p-8 shadow-sm">
					<BrandMark className="mb-6" />
					<h1 className="text-2xl font-bold tracking-wide">Welcome back</h1>
					<p className="mt-2 text-[13.33px] text-[#6b7280]">
						You&rsquo;re signed in as {user.email}
					</p>
					<div className="mt-6 flex items-center gap-3 rounded-xl border border-black/8 p-4">
						<div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0052cc]/10 text-sm font-semibold text-[#0052cc]">
							{user.name?.charAt(0).toUpperCase() || "U"}
						</div>
						<div className="min-w-0 flex-1">
							<p className="truncate text-sm font-medium">{user.name ?? "—"}</p>
							<p className="truncate text-xs text-[#6b7280]">{user.email}</p>
						</div>
					</div>
					<div className="mt-6 flex flex-col gap-3 sm:flex-row">
						<Button
							className="h-12 flex-1 rounded-[12px] bg-[#0052cc] font-medium text-white hover:bg-[#0041a3]"
							onClick={() => {
								const next = getSafeInternalRedirect(redirectTo);
								startTransition(() => {
									if (next) {
										void router.history.push(next);
									} else {
										void navigate({
											to:
												user.role === "Candidate" ? "/candidate" : "/dashboard",
										});
									}
								});
							}}
						>
							{getSafeInternalRedirect(redirectTo)
								? "Continue"
								: user.role === "Candidate"
									? "My interviews"
									: "Go to dashboard"}
						</Button>
						<Button
							variant="outline"
							className="h-12 flex-1 rounded-[12px] border-black/8 bg-white"
							onClick={() => {
								doLogout();
							}}
						>
							Sign out
						</Button>
					</div>
				</div>
			</div>
		);
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setSubmitting(true);

		try {
			await loginWithPassword({ email, password });
			await queryClient.invalidateQueries({ queryKey: ["interviews"] });
			const role = useAuthStore.getState().user?.role;
			const next = getSafeInternalRedirect(redirectTo);
			startTransition(() => {
				if (next) {
					void router.history.push(next);
				} else {
					const to = role === "Candidate" ? "/candidate" : "/dashboard";
					void navigate({ to });
				}
			});
		} catch (err) {
			const msg =
				err instanceof ApiError
					? err.message
					: "An unexpected error occurred. Is the API running on VITE_API_URL?";
			setError(msg);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="min-h-svh bg-[#f9fafb] text-[#111827]">
			<div className="mx-auto flex min-h-svh max-w-[1200px] flex-col gap-8 px-4 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-[30px] lg:px-[30px] lg:py-[30px]">
				<div className="flex min-h-0 w-full max-w-[477px] flex-1 flex-col justify-center lg:min-h-[628px]">
					<div className="flex flex-col gap-[18px] p-[18px]">
						<BrandMark linkTo="/onboarding" />
						<div className="flex flex-col gap-3">
							<h1 className="text-[29.33px] font-bold leading-8 tracking-wide text-[#111827]">
								Sign in to Invetflow
							</h1>
							<p className="max-w-md text-[13.33px] leading-5 tracking-tight text-[#6b7280]">
								Enter your work email and password to open your hiring
								dashboard.
							</p>
						</div>
						<form className="flex flex-col gap-6" onSubmit={handleSubmit}>
							<div className="flex flex-col gap-2">
								<label
									htmlFor="signin-email"
									className="text-[13.33px] font-medium text-[#111827]"
								>
									Email address
								</label>
								<Input
									id="signin-email"
									type="email"
									autoComplete="email"
									placeholder="you@company.com"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									className={fieldInputClass}
									required
								/>
							</div>
							<div className="flex flex-col gap-2">
								<label
									htmlFor="signin-password"
									className="text-[13.33px] font-medium text-[#111827]"
								>
									Password
								</label>
								<Input
									id="signin-password"
									type="password"
									autoComplete="current-password"
									placeholder="Your password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									className={fieldInputClass}
									required
								/>
							</div>
							{error !== "" ? (
								<p
									className="text-[13.33px] leading-snug text-[#6B1D1D]"
									role="alert"
								>
									{error}
								</p>
							) : null}
							<button
								type="submit"
								disabled={submitting}
								className="h-12 w-full rounded-[12px] bg-[#0052cc] text-base font-medium text-white hover:bg-[#0041a3] disabled:opacity-50"
							>
								{submitting ? "Please wait…" : "Sign in"}
							</button>
						</form>
						<p className="text-[13.33px] text-[#6b7280]">
							New to Invetflow?{" "}
							<Link
								to="/onboarding"
								className="font-medium text-[#0052cc] no-underline hover:underline"
							>
								Create an account
							</Link>
						</p>
						<p className="text-[13.33px] leading-5 text-[#6b7280]">
							By proceeding, you agree to our{" "}
							<Link
								to="/about"
								className="text-[#0052cc] no-underline hover:underline"
							>
								Terms of Service
							</Link>{" "}
							and{" "}
							<Link
								to="/about"
								className="text-[#0052cc] no-underline hover:underline"
							>
								Privacy Policy
							</Link>
							.
						</p>
					</div>
				</div>
				<OnboardingVisualPanel />
			</div>
		</div>
	);
}
