import {
	createFileRoute,
	Link,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import { Check, Eye, EyeOff, Loader2, MailCheck } from "lucide-react";
import {
	useEffect,
	useLayoutEffect,
	useMemo,
	useState,
	useTransition,
} from "react";
import { BrandMark } from "#/components/onboarding/BrandMark";
import { ChipSelect } from "#/components/onboarding/ChipSelect";
import { GoogleMark } from "#/components/onboarding/GoogleMark";
import { COMPANY_SIZES, JOB_TITLES } from "#/components/onboarding/labels";
import { OnboardingVisualPanel } from "#/components/onboarding/OnboardingVisualPanel";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import {
	ApiError,
	checkEmailRegistered,
	registerRecruiterWithPassword,
	resendVerificationEmail,
	updateRecruiterOnboarding,
} from "#/integrations/api/client";
import { useAuth } from "#/integrations/api/hooks";
import {
	ensureAuthResolved,
	useAuthStore,
} from "#/integrations/auth/auth-store";
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

type OnboardingSearch = { step?: Step };

export const Route = createFileRoute("/onboarding")({
	validateSearch: (search: Record<string, unknown>): OnboardingSearch => ({
		step: parseStep(search.step),
	}),
	beforeLoad: async ({ search }) => {
		if (typeof window === "undefined") return;
		await ensureAuthResolved();
		const { status, user } = useAuthStore.getState();
		if (status !== "authenticated" || !user) return;

		if (user.role === "Candidate") {
			throw redirect({ to: "/candidate" });
		}

		const step = parseStep(search.step);
		if (step === "email" || step === "password") {
			if (user.onboarding_completed_at) {
				throw redirect({ to: "/dashboard" });
			}
			throw redirect({
				to: "/onboarding",
				search: { step: "profile" },
				replace: true,
			});
		}
	},
	component: OnboardingPage,
});

const fieldInputClass =
	"h-[50px] rounded-[12px] border border-black/[0.08] bg-white px-4 text-base text-[#111827] placeholder:text-[#111827]/50 focus-visible:border-[#0052cc] focus-visible:ring-[#0052cc]/25";

const primaryBtnClass =
	"h-12 w-full rounded-[12px] bg-[#0052cc] text-base font-medium text-white shadow-none hover:bg-[#0041a3]";

function OnboardingPage() {
	const navigate = useNavigate();
	const [, startTransition] = useTransition();
	const { step: stepParam } = Route.useSearch();
	const { isAuthenticated, isLoading, user } = useAuth();

	const step = stepParam;

	useLayoutEffect(() => {
		if (typeof window === "undefined") return;
		if (step === "password" && !readStoredEmail()) {
			startTransition(() => {
				void navigate({
					to: "/onboarding",
					search: { step: "email" },
					replace: true,
				});
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
			startTransition(() => {
				void navigate({
					to: "/onboarding",
					search: { step: "email" },
					replace: true,
				});
			});
		}
	}, [step, isLoading, isAuthenticated, navigate]);

	/** Mirrors route `beforeLoad` so email/password steps never flash after the session hydrates. */
	useLayoutEffect(() => {
		if (typeof window === "undefined" || isLoading) return;
		if (!isAuthenticated || !user) return;
		if (user.role === "Candidate") return;
		if (step !== "email" && step !== "password") return;
		if (user.onboarding_completed_at) {
			startTransition(() => {
				void navigate({ to: "/dashboard", replace: true });
			});
			return;
		}
		startTransition(() => {
			void navigate({
				to: "/onboarding",
				search: { step: "profile" },
				replace: true,
			});
		});
	}, [isLoading, isAuthenticated, user, step, navigate]);

	useEffect(() => {
		if (isLoading || !user) return;
		if (user.role === "Candidate") {
			startTransition(() => {
				void navigate({ to: "/candidate", replace: true });
			});
		}
	}, [isLoading, user, navigate]);

	if (isLoading) {
		return (
			<div className="flex min-h-svh items-center justify-center bg-[#f9fafb]">
				<Loader2
					aria-label="Loading"
					className="h-6 w-6 animate-spin text-[#0052cc]"
				/>
			</div>
		);
	}

	if (user?.role === "Candidate") {
		return null;
	}

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

function SplitShell({
	children,
	right,
}: {
	children: React.ReactNode;
	right?: React.ReactNode;
}) {
	return (
		<div className="min-h-svh bg-[#f9fafb] text-[#111827]">
			<div className="mx-auto flex min-h-svh max-w-[1200px] flex-col gap-8 px-4 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-[30px] lg:px-[30px] lg:py-[30px]">
				<div className="flex min-h-0 w-full max-w-[477px] flex-1 flex-col justify-center lg:min-h-[628px]">
					<div className="flex flex-col gap-[18px] p-[18px]">{children}</div>
				</div>
				{right ?? <OnboardingVisualPanel />}
			</div>
		</div>
	);
}

function EmailStep({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
	const [, startTransition] = useTransition();
	const [email, setEmail] = useState(() => readStoredEmail() ?? "");
	const [emailFeedback, setEmailFeedback] = useState<{
		message: string;
		/** Only for “already registered” — do not show after network/API failures. */
		signInLink?: boolean;
	} | null>(null);
	const [checkingEmail, setCheckingEmail] = useState(false);

	return (
		<SplitShell>
			<BrandMark linkTo="/onboarding" />
			<div className="flex flex-col gap-3">
				<h1 className="text-[29.33px] font-bold leading-8 tracking-wide text-[#111827]">
					Create your Invetflow account
				</h1>
				<p className="max-w-md text-[13.33px] leading-5 tracking-tight text-[#6b7280]">
					Start revolutionizing your hiring process with AI-powered interviews
				</p>
			</div>
			<form
				className="flex flex-col gap-6"
				onSubmit={async (e) => {
					e.preventDefault();
					setEmailFeedback(null);
					const t = email.trim().toLowerCase();
					if (!t.includes("@")) return;
					setCheckingEmail(true);
					try {
						const exists = await checkEmailRegistered(t);
						if (exists) {
							setEmailFeedback({
								message: "This email is already registered.",
								signInLink: true,
							});
							return;
						}
						writeStoredEmail(t);
						startTransition(() => {
							void navigate({
								to: "/onboarding",
								search: { step: "password" },
							});
						});
					} catch (err) {
						let message: string;
						if (err instanceof ApiError) {
							message = err.message;
						} else if (err instanceof TypeError) {
							message =
								"Could not reach the API. Check that invetflow-server is running and VITE_API_URL matches its address (for local dev, often http://localhost:3001).";
						} else if (err instanceof Error && err.message) {
							message = err.message;
						} else {
							message = "Something went wrong. Please try again.";
						}
						setEmailFeedback({ message });
					} finally {
						setCheckingEmail(false);
					}
				}}
			>
				<div className="flex flex-col gap-2">
					<label
						htmlFor="ob-email"
						className="text-[13.33px] font-medium text-[#111827]"
					>
						Email address
					</label>
					<Input
						id="ob-email"
						type="email"
						autoComplete="email"
						placeholder="you@company.com"
						value={email}
						onChange={(e) => {
							setEmail(e.target.value);
							setEmailFeedback(null);
						}}
						className={cn(
							fieldInputClass,
							"shadow-none",
							emailFeedback && "border-red-300",
						)}
						required
					/>
					{emailFeedback && (
						<p className="text-sm text-red-600">
							{emailFeedback.message}
							{emailFeedback.signInLink ? (
								<>
									{" "}
									<Link
										to="/sign-in"
										className="font-medium text-[#0052cc] no-underline hover:underline"
									>
										Sign in
									</Link>
								</>
							) : null}
						</p>
					)}
				</div>
				<button
					type="submit"
					className={primaryBtnClass}
					disabled={checkingEmail}
				>
					{checkingEmail ? "Checking…" : "Continue"}
				</button>
			</form>
			<div className="flex items-center gap-1">
				<div className="h-px flex-1 border-t border-black/[0.08]" />
				<span className="px-1 text-[13.33px] text-[#6b7280]">Or</span>
				<div className="h-px flex-1 border-t border-black/[0.08]" />
			</div>
			<button
				type="button"
				disabled
				className="flex h-[50px] w-full cursor-not-allowed items-center justify-center gap-2 rounded-[12px] border border-black/[0.08] bg-white opacity-70"
			>
				<GoogleMark />
				<span className="text-base font-medium text-[#111827]">
					Continue with Google
				</span>
			</button>
			<p className="text-center text-xs text-[#6b7280]">
				Google sign-in is coming soon.
			</p>
			<div className="flex flex-col gap-2.5 pt-2">
				<p className="text-[13.33px] text-[#6b7280]">
					Already have an account?{" "}
					<Link
						to="/sign-in"
						className="font-medium text-[#0052cc] no-underline hover:underline"
					>
						Sign in
					</Link>
				</p>
				<p className="text-[13.33px] leading-5 text-[#6b7280]">
					By proceeding, you agree to{" "}
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
		</SplitShell>
	);
}

function PasswordStep({
	navigate,
}: {
	navigate: ReturnType<typeof useNavigate>;
}) {
	const [, startTransition] = useTransition();
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
		<SplitShell>
			<BrandMark linkTo="/onboarding" />
			<div className="flex flex-col gap-3">
				<h1 className="text-[29.33px] font-bold leading-8 tracking-wide text-[#111827]">
					Create a secure password
				</h1>
				<p className="max-w-md text-[13.33px] leading-5 tracking-tight text-[#6b7280]">
					You&rsquo;ll use this with{" "}
					<span className="font-medium text-[#111827]">{email}</span> to sign in
					to Invetflow.
				</p>
			</div>
			<form
				className="flex flex-col gap-6"
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
						await registerRecruiterWithPassword({
							email,
							password,
						});
						startTransition(() => {
							void navigate({
								to: "/onboarding",
								search: { step: "profile" },
								replace: true,
							});
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
				<div className="flex flex-col gap-2">
					<label
						htmlFor="ob-pw"
						className={cn(
							"text-[13.33px] font-medium",
							!valid && password.length > 0 ? "text-red-600" : "text-[#111827]",
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
								fieldInputClass,
								"pr-11 shadow-none",
								!valid && password.length > 0 && "border-red-300",
							)}
						/>
						<button
							type="button"
							aria-label={showPw ? "Hide password" : "Show password"}
							className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-[#111827]"
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
						<p className="text-sm text-red-600">
							Follow the requirements below.
						</p>
					)}
					<ul className="mt-1 space-y-1.5 text-[13.33px] text-[#6b7280]">
						{rules.map((r) => (
							<li key={r.id} className="flex items-center gap-2">
								<Check
									className={cn(
										"h-4 w-4 shrink-0",
										r.ok ? "text-[#0052cc]" : "text-gray-300",
									)}
								/>
								<span className={cn(r.ok && "font-medium text-[#111827]")}>
									{r.label}
								</span>
							</li>
						))}
					</ul>
				</div>

				<div className="flex flex-col gap-2">
					<label
						htmlFor="ob-confirm"
						className="text-[13.33px] font-medium text-[#111827]"
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
							className={cn(
								fieldInputClass,
								"pr-11 shadow-none",
								mismatch && "border-red-300",
							)}
						/>
						<button
							type="button"
							aria-label={showCf ? "Hide password" : "Show password"}
							className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280]"
							onClick={() => setShowCf((s) => !s)}
						>
							{showCf ? (
								<EyeOff className="h-4 w-4" />
							) : (
								<Eye className="h-4 w-4" />
							)}
						</button>
					</div>
					{mismatch && (
						<p className="text-sm text-red-600">Passwords do not match.</p>
					)}
				</div>

				{error && (
					<div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
						{error}
					</div>
				)}

				<button
					type="submit"
					disabled={submitting || !valid || mismatch || !password}
					className={cn(primaryBtnClass, "disabled:opacity-50")}
				>
					{submitting ? "…" : "Continue"}
				</button>
			</form>
			<p className="text-[13.33px] text-[#6b7280]">
				Already have an account?{" "}
				<Link
					to="/sign-in"
					className="font-medium text-[#0052cc] no-underline hover:underline"
				>
					Sign in
				</Link>
			</p>
		</SplitShell>
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
	const [, startTransition] = useTransition();
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
		<SplitShell>
			<BrandMark />
			<div className="flex flex-col gap-3">
				<h1 className="text-[29.33px] font-bold leading-8 tracking-wide text-[#111827]">
					Create your Invetflow account
				</h1>
				<p className="max-w-md text-[13.33px] leading-5 tracking-tight text-[#6b7280]">
					We need some basic info to set you up. You&rsquo;ll be able to edit
					this later.
				</p>
			</div>
			<form
				className="flex flex-col gap-6"
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
						startTransition(() => {
							void navigate({
								to: "/onboarding",
								search: { step: "verify" },
							});
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
				<div className="flex flex-col gap-2">
					<label
						htmlFor="ob-name"
						className="text-[13.33px] font-medium text-[#111827]"
					>
						Your Name
					</label>
					<Input
						id="ob-name"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="John Doe"
						className={cn(fieldInputClass, "shadow-none")}
					/>
				</div>
				<div className="flex flex-col gap-2">
					<label
						htmlFor="ob-company"
						className="text-[13.33px] font-medium text-[#111827]"
					>
						Your Company Name
					</label>
					<Input
						id="ob-company"
						value={company}
						onChange={(e) => setCompany(e.target.value)}
						placeholder="Acme Enterprises Inc"
						className={cn(fieldInputClass, "shadow-none")}
					/>
				</div>
				<ChipSelect
					label="Your Company Size"
					options={COMPANY_SIZES}
					value={size}
					onChange={setSize}
					layout="row"
				/>
				<ChipSelect
					label="Your Job Title"
					options={JOB_TITLES}
					value={title}
					onChange={setTitle}
					layout="grid"
				/>
				{error && <p className="text-sm text-red-600">{error}</p>}
				<button
					type="submit"
					disabled={submitting}
					className={cn(primaryBtnClass, "disabled:opacity-50")}
				>
					{submitting ? "…" : "Continue"}
				</button>
			</form>
		</SplitShell>
	);
}

function VerifyStep({
	navigate,
}: {
	navigate: ReturnType<typeof useNavigate>;
}) {
	const [, startTransition] = useTransition();
	const { user } = useAuth();
	const [resendState, setResendState] = useState<"idle" | "sending" | "done">(
		"idle",
	);
	const [resendMessage, setResendMessage] = useState("");

	if (!user) return null;

	return (
		<div className="flex min-h-svh flex-col items-center justify-center bg-white px-4 py-10 text-[#111827]">
			<div className="w-full max-w-[445px] rounded-[12px] border border-black/[0.08] bg-white p-5 shadow-sm">
				<MailCheck
					className="mb-4 size-[30px] text-emerald-600"
					strokeWidth={1.75}
					aria-hidden
				/>
				<div className="flex flex-col gap-2.5">
					<h1 className="text-2xl font-bold tracking-wide">
						Check your email!
					</h1>
					<p className="text-xs leading-relaxed tracking-wide text-[#706e6e]">
						We have sent a confirmation email to{" "}
						<span className="font-medium text-black">{user.email}</span>. Verify
						the email and start using Invetflow!
					</p>
					<p className="text-[11px] leading-relaxed text-[#9ca3af]">
						(Verification mail is a stub until SMTP is connected — your account
						is active.)
					</p>
					<div className="flex flex-col gap-2.5 sm:flex-row">
						<button
							type="button"
							className="flex h-[42px] flex-1 items-center justify-center gap-2.5 rounded-lg border border-black/[0.08] bg-white px-2.5 text-xs text-black hover:bg-gray-50"
							onClick={() =>
								window.open("https://mail.google.com", "_blank", "noopener")
							}
						>
							<GoogleMark />
							Open in Gmail
						</button>
						<button
							type="button"
							className="flex h-[42px] flex-1 items-center justify-center gap-2.5 rounded-lg border border-black/[0.08] bg-white px-2.5 text-xs text-black hover:bg-gray-50"
							onClick={() =>
								window.open("https://outlook.live.com", "_blank", "noopener")
							}
						>
							<span className="inline-flex h-4 w-4 items-center justify-center rounded bg-[#0078d4] text-[10px] font-bold text-white">
								O
							</span>
							Open in Outlook
						</button>
					</div>
				</div>
				<div className="mt-4">
					<button
						type="button"
						className="text-xs text-black underline decoration-solid underline-offset-2 disabled:opacity-50"
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
						<p className="mt-1 text-xs text-[#6b7280]">{resendMessage}</p>
					)}
				</div>
				<Button
					type="button"
					className="mt-6 h-12 w-full rounded-[12px] bg-[#0052cc] text-base font-medium text-white hover:bg-[#0041a3]"
					onClick={() =>
						startTransition(() => {
							void navigate({ to: "/dashboard" });
						})
					}
				>
					Continue to dashboard
				</Button>
			</div>
		</div>
	);
}
