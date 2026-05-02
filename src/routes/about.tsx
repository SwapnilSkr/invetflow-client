import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
	component: AboutLegalStub,
});

function AboutLegalStub() {
	return (
		<main className="mx-auto max-w-xl px-4 py-16 text-[#111827]">
			<h1 className="text-2xl font-bold tracking-wide">Terms &amp; privacy</h1>
			<p className="mt-4 text-[13.33px] leading-relaxed text-[#6b7280]">
				Legal copy for Terms of Service and Privacy Policy will go here. This page
				exists so onboarding and sign-in can link to a stable URL. Replace with your
				final policy content when ready.
			</p>
		</main>
	);
}
