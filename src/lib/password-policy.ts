/**
 * Mirrors `invetflow-server` `auth::password::validate_password_policy` for client-side UX.
 * Keep in sync when server rules change.
 */
export type PasswordRuleId =
	| "length"
	| "mixed_case"
	| "digit"
	| "punctuation";

export interface PasswordRuleState {
	id: PasswordRuleId;
	label: string;
	ok: boolean;
}

/** Ranges that match typical `char::is_ascii_punctuation` (ASCII). */
const ASCII_PUNCT = /[\x21-\x2F\x3A-\x40\x5B-\x60\x7B-\x7E]/;

export function evaluatePasswordRules(password: string): PasswordRuleState[] {
	const chars = [...password];
	const hasUpper = chars.some(
		(c) => c === c.toUpperCase() && c !== c.toLowerCase(),
	);
	const hasLower = chars.some(
		(c) => c === c.toLowerCase() && c !== c.toUpperCase(),
	);
	const hasDigit = chars.some((c) => c >= "0" && c <= "9");
	const hasPunct = chars.some((c) => ASCII_PUNCT.test(c));

	return [
		{
			id: "length",
			label: "Minimum 7 characters long",
			ok: chars.length >= 7,
		},
		{
			id: "mixed_case",
			label: "Mix of uppercase and lowercase letters",
			ok: hasUpper && hasLower,
		},
		{
			id: "digit",
			label: "Contains at least 1 number",
			ok: hasDigit,
		},
		{
			id: "punctuation",
			label: "Contains at least 1 punctuation character",
			ok: hasPunct,
		},
	];
}

export function passwordMeetsPolicy(rules: PasswordRuleState[]): boolean {
	return rules.every((r) => r.ok);
}
