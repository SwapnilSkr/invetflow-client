import { Link, type LinkProps } from "@tanstack/react-router";
import { cn } from "#/lib/utils";

type BrandMarkProps = {
	className?: string;
	linkTo?: LinkProps["to"];
};

export function BrandMark({ className, linkTo }: BrandMarkProps) {
	const inner = (
		<>
			<div
				aria-hidden
				className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#0052cc]"
			>
				<span className="font-mono text-sm font-bold leading-5 tracking-tight text-white">
					I
				</span>
			</div>
			<span className="text-xl font-semibold leading-[30px] tracking-tight text-[#111827]">
				Invetflow
			</span>
		</>
	);

	if (linkTo) {
		return (
			<Link
				to={linkTo}
				className={cn(
					"inline-flex items-center gap-2 no-underline text-inherit",
					className,
				)}
			>
				{inner}
			</Link>
		);
	}

	return (
		<div className={cn("inline-flex items-center gap-2", className)}>{inner}</div>
	);
}
