import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import { authClient } from "#/lib/auth-client";

export const Route = createFileRoute("/auth")({
	component: AuthPage,
});

function AuthPage() {
	const { data: session, isPending } = authClient.useSession();
	const navigate = useNavigate();
	const [isSignUp, setIsSignUp] = useState(false);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [name, setName] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	if (isPending) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--line)] border-t-[var(--lagoon)]" />
			</div>
		);
	}

	if (session?.user) {
		return (
			<main className="page-wrap flex justify-center px-4 py-12">
				<Card className="w-full max-w-md">
					<CardHeader>
						<CardTitle>Welcome back</CardTitle>
						<p className="text-sm text-muted-foreground">
							You&rsquo;re signed in as {session.user.email}
						</p>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-center gap-3">
							{session.user.image ? (
								<img
									src={session.user.image}
									alt=""
									className="h-10 w-10 rounded-full"
								/>
							) : (
								<div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(79,184,178,0.14)] text-[var(--lagoon-deep)]">
									<span className="text-sm font-semibold">
										{session.user.name?.charAt(0).toUpperCase() || "U"}
									</span>
								</div>
							)}
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm font-medium">
									{session.user.name}
								</p>
								<p className="truncate text-xs text-muted-foreground">
									{session.user.email}
								</p>
							</div>
						</div>

						<div className="flex gap-3">
							<Button
								className="flex-1"
								onClick={() => navigate({ to: "/dashboard" })}
							>
								Go to Dashboard
							</Button>
							<Button
								variant="outline"
								onClick={() => void authClient.signOut()}
							>
								Sign out
							</Button>
						</div>
					</CardContent>
				</Card>
			</main>
		);
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			if (isSignUp) {
				const result = await authClient.signUp.email({
					email,
					password,
					name,
				});
				if (result.error) {
					setError(result.error.message || "Sign up failed");
				}
			} else {
				const result = await authClient.signIn.email({
					email,
					password,
				});
				if (result.error) {
					setError(result.error.message || "Sign in failed");
				}
			}
		} catch {
			setError("An unexpected error occurred");
		} finally {
			setLoading(false);
		}
	};

	return (
		<main className="page-wrap flex justify-center px-4 py-12">
			<Card className="w-full max-w-md">
				<CardHeader>
					<div className="mb-2 flex items-center gap-2">
						<span className="h-2 w-2 rounded-full bg-[linear-gradient(90deg,#56c6be,#7ed3bf)]" />
						<span className="text-sm font-semibold text-[var(--sea-ink)]">
							InvetFlow
						</span>
					</div>
					<CardTitle className="text-xl">
						{isSignUp ? "Create an account" : "Sign in"}
					</CardTitle>
					<p className="text-sm text-muted-foreground">
						{isSignUp
							? "Enter your information to get started"
							: "Enter your email below to access your account"}
					</p>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="grid gap-4">
						{isSignUp && (
							<div className="grid gap-2">
								<label
									htmlFor="name"
									className="text-sm font-medium leading-none"
								>
									Name
								</label>
								<Input
									id="name"
									type="text"
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder="Your full name"
									required
								/>
							</div>
						)}

						<div className="grid gap-2">
							<label
								htmlFor="email"
								className="text-sm font-medium leading-none"
							>
								Email
							</label>
							<Input
								id="email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="you@example.com"
								required
							/>
						</div>

						<div className="grid gap-2">
							<label
								htmlFor="password"
								className="text-sm font-medium leading-none"
							>
								Password
							</label>
							<Input
								id="password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="Min. 8 characters"
								required
								minLength={8}
							/>
						</div>

						{error && (
							<div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
								<p className="text-sm text-red-600 dark:text-red-400">
									{error}
								</p>
							</div>
						)}

						<Button type="submit" disabled={loading} className="w-full">
							{loading ? (
								<span className="flex items-center gap-2">
									<span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
									Please wait
								</span>
							) : isSignUp ? (
								"Create account"
							) : (
								"Sign in"
							)}
						</Button>
					</form>

					<div className="mt-4 text-center">
						<button
							type="button"
							onClick={() => {
								setIsSignUp(!isSignUp);
								setError("");
							}}
							className="text-sm text-muted-foreground transition-colors hover:text-foreground"
						>
							{isSignUp
								? "Already have an account? Sign in"
								: "Don't have an account? Sign up"}
						</button>
					</div>
				</CardContent>
			</Card>
		</main>
	);
}
