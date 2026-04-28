import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { ChipSelect } from "#/components/onboarding/ChipSelect";
import { COMPANY_SIZES, JOB_TITLES } from "#/components/onboarding/labels";
import { MarketingColumn } from "#/components/onboarding/MarketingColumn";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import {
	ApiError,
	registerWithPassword,
	resendVerificationEmail,
	updateRecruiterOnboarding,
} from "#/integrations/api/client";
import { useAuth } from "#/integrations/api/hooks";
import {
	evaluatePasswordRules,
	passwordMeetsPolicy,
} from "#/lib/password-policy";
import { cn } from "#/lib/utils";

const EMAIL_KEY = "invetflow.onboarding_email";

type Step = "email" | "password" | "profile" | "verify";

function parseStep(raw: unknown): Step {
	if (
		raw === "email" ||
		raw === "password" ||
		raw === "profile" ||
		raw === "verify"
	) {
		return raw;
	}
	return "email";
}

function readStoredEmail(): string | null {
	if (typeof sessionStorage === "undefined") return null;
	return sessionStorage.getItem(EMAIL_KEY);
}

function writeStoredEmail(email: string) {
	sessionStorage.setItem(EMAIL_KEY, email.trim().toLowerCase());
}

function GoogleMark() {
	return (
		<svg aria-hidden className="h-5 w-5" viewBox="0 0 24 24">
			<title>Google</title>
			<path
				fill="#4285F4"
				d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
			/>
			<path
				fill="#34A853"
				d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
			/>
			<path
				fill="#FBBC05"
				d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
			/>
			<path
				fill="#EA4335"
				d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
			/>
		</svg>
	);
}

type OnboardingSearch = { step?: Step };

export const Route = createFileRoute("/onboarding")({
	validateSearch: (search: Record<string, unknown>): OnboardingSearch => ({
		step: parseStep(search.step),
	}),
	component: OnboardingPage,
});

function BrandLink() {
	return (
		<Link
			to="/"
			className="text-lg font-bold tracking-tight text-(--onb-text) no-underline"
		>
			InvetFlow
		</Link>
	);
}

function OnboardingPage() {
	const navigate = useNavigate();
	const { step: stepParam } = Route.useSearch();
	const { isAuthenticated, isLoading, user } = useAuth();

	const step = stepParam;

	useLayoutEffect(() => {
		if (typeof window === "undefined") return;
		if (step === "password" && !readStoredEmail()) {
			void navigate({
				to: "/onboarding",
				search: { step: "email" },
				replace: true,
			});
		}
	}, [step, navigate]);

	useLayoutEffect(() => {
		if (typeof window === "undefined") return;
		if (
			(step === "profile" || step === "verify") &&
			!isLoading &&
			!isAuthenticated
		) {
			void navigate({
				to: "/onboarding",
				search: { step: "email" },
				replace: true,
			});
		}
	}, [step, isLoading, isAuthenticated, navigate]);

	useEffect(() => {
		if (isLoading || !user) return;
		if (user.role === "Candidate") {
			void navigate({ to: "/candidate", replace: true });
		}
	}, [isLoading, user, navigate]);

	if (isLoading) {
		return (
			<div className="flex min-h-svh items-center justify-center bg-(--onb-page)">
				<Loader2
					aria-label="Loading"
					className="h-6 w-6 animate-spin text-(--onb-primary)"
				/>
			</div>
		);
	}

	if (user?.role === "Candidate") {
		return null;
	}

	/* --- Email --- */
	if (step === "email") {
		return <EmailStep navigate={navigate} />;
	}
	if (step === "password") {
		return <PasswordStep navigate={navigate} />;
	}
	if (step === "profile") {
		if (!isAuthenticated) {
			return null;
		}
		return <ProfileStep navigate={navigate} />;
	}
	if (step === "verify") {
		if (!isAuthenticated) {
			return null;
		}
		return <VerifyStep navigate={navigate} />;
	}

	return null;
}

function EmailStep({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
	const [email, setEmail] = useState(() => readStoredEmail() ?? "");

	return (
		<div className="min-h-svh bg-(--onb-form-bg) text-(--onb-text) lg:grid lg:min-h-0 lg:grid-cols-2">
			<div className="flex min-h-svh flex-col justify-center px-6 py-10 sm:px-10 lg:px-12 xl:px-16">
				<div className="mx-auto w-full max-w-md">
					<BrandLink />
					<h1 className="mt-8 text-2xl font-bold tracking-tight sm:text-3xl">
						Create your InvetFlow account
					</h1>
					<p className="mt-2 text-sm text-(--onb-muted)">
						Simple, fast, and no hidden fees.
					</p>

					<form
						className="mt-8 space-y-5"
						onSubmit={(e) => {
							e.preventDefault();
							const t = email.trim();
							if (!t.includes("@")) return;
							writeStoredEmail(t);
							void navigate({
								to: "/onboarding",
								search: { step: "password" },
							});
						}}
					>
						<div className="space-y-2">
							<label
								htmlFor="ob-email"
								className="text-sm font-semibold text-(--onb-text)"
							>
								Email address
							</label>
							<Input
								id="ob-email"
								type="email"
								autoComplete="email"
								placeholder="john@example.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className="h-11 rounded-[var(--onb-radius)] border-(--onb-border) bg-(--onb-form-bg) text-(--onb-text) placeholder:text-(--onb-legal) focus-visible:ring-(--onb-primary)"
								required
							/>
						</div>
						<Button
							type="submit"
							className="h-11 w-full rounded-[var(--onb-radius)] bg-(--onb-primary) text-base font-semibold text-white shadow-sm hover:bg-(--onb-primary-hover)"
						>
							Continue
						</Button>
					</form>

					<div className="mt-6 flex items-center gap-3">
						<div className="h-px flex-1 bg-(--onb-border)" />
						<span className="text-xs font-medium text-(--onb-muted)">Or</span>
						<div className="h-px flex-1 bg-(--onb-border)" />
					</div>

					<Button
						type="button"
						variant="outline"
						disabled
						className="mt-2 h-11 w-full gap-2 rounded-[var(--onb-radius)] border-(--onb-border) bg-(--onb-form-bg) text-(--onb-text) opacity-80"
					>
						<GoogleMark />
						Continue with Google
					</Button>
					<p className="mt-2 text-center text-xs text-(--onb-legal)">
						Google sign-in is coming soon.
					</p>

					<p className="mt-8 text-center text-sm text-(--onb-muted)">
						Already have an account?{" "}
						<Link
							to="/auth"
							className="font-semibold text-(--onb-primary) no-underline hover:underline"
						>
							Sign in
						</Link>
					</p>
					<p className="mt-4 text-center text-xs leading-relaxed text-(--onb-legal)">
						By proceeding, you agree to our{" "}
						<Link
							to="/about"
							className="text-(--onb-primary) no-underline hover:underline"
						>
							Terms
						</Link>{" "}
						and{" "}
						<Link
							to="/about"
							className="text-(--onb-primary) no-underline hover:underline"
						>
							Privacy
						</Link>
						.
					</p>
				</div>
			</div>
			<MarketingColumn className="hidden min-h-0 lg:flex" />
		</div>
	);
}

function PasswordStep({
	navigate,
}: {
	navigate: ReturnType<typeof useNavigate>;
}) {
	const email = readStoredEmail() ?? "";
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [showPw, setShowPw] = useState(false);
	const [showCf, setShowCf] = useState(false);
	const [error, setError] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const rules = useMemo(() => evaluatePasswordRules(password), [password]);
	const valid = passwordMeetsPolicy(rules);
	const mismatch = confirm.length > 0 && password !== confirm;

	if (!email) {
		return null;
	}

	return (
		<div className="min-h-svh bg-(--onb-form-bg) text-(--onb-text) lg:grid lg:min-h-0 lg:grid-cols-2">
			<div className="flex min-h-svh flex-col justify-center px-6 py-10 sm:px-10 lg:px-12 xl:px-16">
				<div className="mx-auto w-full max-w-md">
					<BrandLink />
					<h1 className="mt-8 text-2xl font-bold tracking-tight sm:text-3xl">
						Create your InvetFlow account
					</h1>
					<p className="mt-2 text-sm text-(--onb-muted)">
						Simple, fast, and no hidden fees.
					</p>

					<form
						className="mt-8 space-y-5"
						onSubmit={async (e) => {
							e.preventDefault();
							setError("");
							if (!valid || !password) {
								return;
							}
							if (password !== confirm) {
								return;
							}
							setSubmitting(true);
							try {
								await registerWithPassword({
									email,
									password,
									role: "Recruiter",
								});
								void navigate({
									to: "/onboarding",
									search: { step: "profile" },
									replace: true,
								});
							} catch (err) {
								const msg =
									err instanceof ApiError
										? err.message
										: "Could not create account. Is the API running?";
								setError(msg);
							} finally {
								setSubmitting(false);
							}
						}}
					>
						<div className="space-y-2">
							<label
								htmlFor="ob-pw"
								className={cn(
									"text-sm font-semibold",
									!valid && password.length > 0
										? "text-red-600 dark:text-red-400"
										: "text-(--onb-text)",
								)}
							>
								Password
							</label>
							<div className="relative">
								<Input
									id="ob-pw"
									type={showPw ? "text" : "password"}
									autoComplete="new-password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									className={cn(
										"h-11 rounded-[var(--onb-radius)] border-(--onb-border) pr-10",
										!valid &&
											password.length > 0 &&
											"border-red-300 dark:border-red-800",
									)}
								/>
								<button
									type="button"
									aria-label={showPw ? "Hide password" : "Show password"}
									className="absolute right-2 top-1/2 -translate-y-1/2 text-(--onb-muted)"
									onClick={() => setShowPw((s) => !s)}
								>
									{showPw ? (
										<EyeOff className="h-4 w-4" />
									) : (
										<Eye className="h-4 w-4" />
									)}
								</button>
							</div>
							{!valid && password.length > 0 && (
								<div className="rounded-[var(--onb-radius)] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
									Follow the requirements below.
								</div>
							)}
							<ul className="mt-1 space-y-1 text-sm text-(--onb-muted)">
								{rules.map((r) => (
									<li key={r.id} className="flex items-center gap-2">
										<Check
											className={cn(
												"h-4 w-4 shrink-0",
												r.ok ? "text-blue-600" : "text-(--onb-border)",
											)}
										/>
										<span className={r.ok ? "text-(--onb-text)" : ""}>
											{r.label}
										</span>
									</li>
								))}
							</ul>
						</div>

						<div className="space-y-2">
							<label
								htmlFor="ob-confirm"
								className="text-sm font-semibold text-(--onb-text)"
							>
								Confirm password
							</label>
							<div className="relative">
								<Input
									id="ob-confirm"
									type={showCf ? "text" : "password"}
									autoComplete="new-password"
									value={confirm}
									onChange={(e) => setConfirm(e.target.value)}
									className="h-11 rounded-[var(--onb-radius)] border-(--onb-border) pr-10"
								/>
								<button
									type="button"
									aria-label={showCf ? "Hide password" : "Show password"}
									className="absolute right-2 top-1/2 -translate-y-1/2 text-(--onb-muted)"
									onClick={() => setShowCf((s) => !s)}
								>
									{showCf ? (
										<EyeOff className="h-4 w-4" />
									) : (
										<Eye className="h-4 w-4" />
									)}
								</button>
							</div>
						</div>

						{error && (
							<div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
								{error}
							</div>
						)}

						<Button
							type="submit"
							disabled={submitting || !valid || mismatch || !password}
							className="h-11 w-full rounded-[var(--onb-radius)] bg-(--onb-primary) text-base font-semibold text-white hover:bg-(--onb-primary-hover)"
						>
							{submitting ? "…" : "Continue"}
						</Button>
					</form>

					<p className="mt-8 text-center text-sm text-(--onb-muted)">
						Already have an account?{" "}
						<Link
							className="font-semibold text-(--onb-primary) no-underline hover:underline"
							to="/auth"
						>
							Sign in
						</Link>
					</p>
					<p className="mt-4 text-center text-xs text-(--onb-legal)">
						By proceeding, you agree to our{" "}
						<Link
							to="/about"
							className="text-(--onb-primary) no-underline hover:underline"
						>
							Terms
						</Link>{" "}
						and{" "}
						<Link
							to="/about"
							className="text-(--onb-primary) no-underline hover:underline"
						>
							Privacy
						</Link>
						.
					</p>
				</div>
			</div>
			<MarketingColumn className="hidden min-h-0 lg:flex" />
		</div>
	);
}

function coerceChip<T extends string>(
	value: string | null | undefined,
	list: readonly T[],
): T {
	if (value && list.includes(value as T)) {
		return value as T;
	}
	return list[0];
}

function ProfileStep({
	navigate,
}: {
	navigate: ReturnType<typeof useNavigate>;
}) {
	const { user } = useAuth();
	const [name, setName] = useState(user?.name ?? "");
	const [company, setCompany] = useState(user?.company_name ?? "");
	const [size, setSize] = useState(() =>
		coerceChip(user?.company_size, COMPANY_SIZES),
	);
	const [title, setTitle] = useState(() =>
		coerceChip(user?.job_title, JOB_TITLES),
	);
	const [error, setError] = useState("");
	const [submitting, setSubmitting] = useState(false);

	return (
		<div className="min-h-svh bg-(--onb-page) px-4 py-8">
			<div className="mx-auto max-w-md pt-2">
				<BrandLink />
			</div>
			<div className="mx-auto mt-6 w-full max-w-md rounded-[var(--onb-radius-lg)] border border-(--onb-border) bg-(--onb-form-bg) p-8 shadow-sm">
				<h1 className="text-2xl font-bold text-(--onb-text)">
					Welcome to InvetFlow
				</h1>
				<p className="mt-1 text-sm text-(--onb-muted)">
					Tell us a little about you and your team.
				</p>
				<form
					className="mt-8 space-y-5"
					onSubmit={async (e) => {
						e.preventDefault();
						setError("");
						setSubmitting(true);
						try {
							await updateRecruiterOnboarding({
								name: name.trim() || undefined,
								company_name: company.trim() || undefined,
								company_size: size,
								job_title: title,
							});
							void navigate({
								to: "/onboarding",
								search: { step: "verify" },
							});
						} catch (err) {
							setError(
								err instanceof ApiError
									? err.message
									: "Update failed. Try again.",
							);
						} finally {
							setSubmitting(false);
						}
					}}
				>
					<div className="space-y-2">
						<label
							htmlFor="ob-name"
							className="text-sm font-semibold text-(--onb-text)"
						>
							Your name
						</label>
						<Input
							id="ob-name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="John Doe"
							className="h-11 rounded-[var(--onb-radius)] border-(--onb-border)"
						/>
					</div>
					<div className="space-y-2">
						<label
							htmlFor="ob-company"
							className="text-sm font-semibold text-(--onb-text)"
						>
							Your company name
						</label>
						<Input
							id="ob-company"
							value={company}
							onChange={(e) => setCompany(e.target.value)}
							placeholder="Acme Enterprises Inc."
							className="h-11 rounded-[var(--onb-radius)] border-(--onb-border)"
						/>
					</div>
					<ChipSelect
						label="Your company size"
						options={COMPANY_SIZES}
						value={size}
						onChange={setSize}
					/>
					<ChipSelect
						label="Your job title"
						options={JOB_TITLES}
						value={title}
						onChange={setTitle}
					/>
					{error && (
						<p className="text-sm text-red-600 dark:text-red-400">{error}</p>
					)}
					<Button
						type="submit"
						disabled={submitting}
						className="h-11 w-full rounded-[var(--onb-radius)] bg-(--onb-primary) text-base font-semibold text-white hover:bg-(--onb-primary-hover)"
					>
						{submitting ? "…" : "Continue"}
					</Button>
				</form>
			</div>
		</div>
	);
}

function VerifyStep({
	navigate,
}: {
	navigate: ReturnType<typeof useNavigate>;
}) {
	const { user } = useAuth();
	const [resendState, setResendState] = useState<"idle" | "sending" | "done">(
		"idle",
	);
	const [resendMessage, setResendMessage] = useState("");

	if (!user) return null;

	return (
		<div className="min-h-svh bg-(--onb-page) px-4 py-8 text-(--onb-text)">
			<div className="mx-auto max-w-md pt-2">
				<BrandLink />
			</div>
			<div className="mx-auto mt-10 w-full max-w-md rounded-[var(--onb-radius-lg)] border border-(--onb-border) bg-(--onb-form-bg) p-8 text-center shadow-sm">
				<div
					className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
					style={{
						background: "color-mix(in oklab, var(--onb-primary) 12%, white)",
					}}
				>
					<svg
						aria-hidden
						className="h-7 w-7 text-(--onb-primary)"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<title>Email</title>
						<path
							d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
							strokeWidth="1.5"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				</div>
				<h1 className="mt-5 text-2xl font-bold">Check your email</h1>
				<p className="mt-2 text-sm text-(--onb-muted)">
					We&rsquo;ve sent a message to{" "}
					<strong className="text-(--onb-text)">{user.email}</strong>. Verify
					your email to finish setting up your workspace.
				</p>
				<p className="mt-2 text-xs text-(--onb-legal)">
					(Verification mail is a stub until SMTP is connected — your account is
					active.)
				</p>
				<div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
					<Button
						type="button"
						variant="outline"
						className="h-10 flex-1 gap-2 border-(--onb-border) bg-(--onb-form-bg)"
						onClick={() =>
							window.open("https://mail.google.com", "_blank", "noopener")
						}
					>
						<GoogleMark />
						Open Gmail
					</Button>
					<Button
						type="button"
						variant="outline"
						className="h-10 flex-1 border-(--onb-border) bg-(--onb-form-bg)"
						onClick={() =>
							window.open("https://outlook.live.com", "_blank", "noopener")
						}
					>
						Open Outlook
					</Button>
				</div>
				<div className="mt-6 text-left">
					<button
						type="button"
						className="text-sm font-medium text-(--onb-primary) underline decoration-1 underline-offset-2 disabled:opacity-50"
						disabled={resendState === "sending"}
						onClick={async () => {
							setResendState("sending");
							setResendMessage("");
							try {
								const r = await resendVerificationEmail();
								setResendState("done");
								setResendMessage(r.message);
							} catch {
								setResendState("idle");
							}
						}}
					>
						{resendState === "sending" ? "Sending…" : "Resend email"}
					</button>
					{resendMessage && (
						<p className="mt-1 text-xs text-(--onb-muted)">{resendMessage}</p>
					)}
				</div>
				<Button
					type="button"
					className="mt-8 h-11 w-full rounded-[var(--onb-radius)] bg-(--onb-primary) text-white hover:bg-(--onb-primary-hover)"
					onClick={() => void navigate({ to: "/dashboard" })}
				>
					Go to dashboard
				</Button>
			</div>
		</div>
	);
}
