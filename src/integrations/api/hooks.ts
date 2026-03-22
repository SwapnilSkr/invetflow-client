// Auth-related React hooks
// Interview/session query hooks and mutations live in ./queries.ts

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { demoLogin, getApiToken, logout, type User } from "./client";

export type AuthUser = User & { role: string };

export function useAuth() {
	const { data: session } = useQuery({
		queryKey: ["auth", "session"],
		queryFn: async () => {
			try {
				const token = await getApiToken();
				const payload = JSON.parse(atob(token.split(".")[1]));
				return {
					user: {
						id: payload.sub,
						email: payload.email,
						name: payload.name,
						email_verified: true,
						role: payload.role,
					} as AuthUser,
					isAuthenticated: true,
				};
			} catch {
				return { user: null, isAuthenticated: false };
			}
		},
		staleTime: 5 * 60 * 1000,
		retry: false,
	});

	return {
		user: session?.user ?? null,
		isAuthenticated: session?.isAuthenticated ?? false,
		isLoading: !session,
	};
}

export function useDemoLogin() {
	const queryClient = useQueryClient();

	return {
		login: async (email: string, name?: string, role?: string) => {
			const result = await demoLogin(email, name, role);
			queryClient.invalidateQueries({ queryKey: ["auth"] });
			return result;
		},
	};
}

export function useLogout() {
	const queryClient = useQueryClient();

	return async () => {
		await logout();
		queryClient.clear();
	};
}
