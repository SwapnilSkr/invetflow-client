import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import {
	ApiError,
	loginWithPassword,
	registerWithPassword,
} from "#/integrations/api/client";
import { useAuth, useLogout } from "#/integrations/api/hooks";

export const Route = createFileRoute("/auth")({
	component: AuthPage,
});

function AuthPage() {
	const { user, isAuthenticated, isLoading } = useAuth();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const doLogout = useLogout();
	const [isSignUp, setIsSignUp] = useState(false);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [name, setName] = useState("");
	const [error, setError] = useState("");
	const [submitting, setSubmitting] = useState(false);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="h-6 w-6 animate-spin rounded-full border-2 border-(--line) border-t-(--lagoon)" />
			</div>
		);
	}

	if (isAuthenticated && user) {
		return (
			<main className="page-wrap flex justify-center px-4 py-12">
				<Card className="w-full max-w-md">
					<CardHeader>
						<CardTitle>Welcome back</CardTitle>
						<p className="text-sm text-muted-foreground">
							You&rsquo;re signed in as {user.email}
						</p>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(79,184,178,0.14)] text-(--lagoon-deep)">
								<span className="text-sm font-semibold">
									{user.name?.charAt(0).toUpperCase() || "U"}
								</span>
							</div>
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm font-medium">
									{user.name ?? "—"}
								</p>
								<p className="truncate text-xs text-muted-foreground">
									{user.email}
								</p>
							</div>
						</div>

						<div className="flex gap-3">
							<Button
								className="flex-1"
								onClick={() => void navigate({ to: "/dashboard" })}
							>
								Go to Dashboard
							</Button>
							<Button
								variant="outline"
								onClick={() => {
									doLogout();
								}}
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
		setSubmitting(true);

		try {
			if (isSignUp) {
				await registerWithPassword({
					email,
					password,
					name: name.trim() || undefined,
				});
			} else {
				await loginWithPassword({ email, password });
			}
			await queryClient.invalidateQueries({ queryKey: ["interviews"] });
			void navigate({ to: "/dashboard" });
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
		<main className="page-wrap flex justify-center px-4 py-12">
			<Card className="w-full max-w-md">
				<CardHeader>
					<div className="mb-2 flex items-center gap-2">
						<span className="h-2 w-2 rounded-full bg-[linear-gradient(90deg,#56c6be,#7ed3bf)]" />
						<span className="text-sm font-semibold text-(--sea-ink)">
							InvetFlow
						</span>
					</div>
					<CardTitle className="text-xl">
						{isSignUp ? "Create an account" : "Sign in"}
					</CardTitle>
					<p className="text-sm text-muted-foreground">
						{isSignUp
							? "Enter your information to get started"
							: "Sign in with the email and password for your account"}
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

						<Button type="submit" disabled={submitting} className="w-full">
							{submitting ? (
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
