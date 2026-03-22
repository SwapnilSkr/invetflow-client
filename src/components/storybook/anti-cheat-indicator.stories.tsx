import type { Meta, StoryObj } from "@storybook/react";
import { AntiCheatIndicator } from "../src/components/candidate/AntiCheatIndicator";

const meta: Meta<typeof AntiCheatIndicator> = {
	title: "Candidate/AntiCheatIndicator",
	component: AntiCheatIndicator,
	parameters: {
		layout: "centered",
	},
};

export default meta;
type Story = StoryObj<typeof AntiCheatIndicator>;

export const Clean: Story = {
	args: {
		tabSwitchCount: 0,
		maxTabSwitches: 3,
		plagiarismScore: 0.1,
		isFullscreen: true,
		suspiciousActivity: [],
	},
};

export const SomeWarnings: Story = {
	args: {
		tabSwitchCount: 1,
		maxTabSwitches: 3,
		plagiarismScore: 0.45,
		isFullscreen: true,
		suspiciousActivity: [
			{
				id: "1",
				type: "tab_switch",
				timestamp: new Date("2026-01-15T10:05:23"),
			},
		],
	},
};

export const MultipleViolations: Story = {
	args: {
		tabSwitchCount: 2,
		maxTabSwitches: 3,
		plagiarismScore: 0.85,
		isFullscreen: false,
		suspiciousActivity: [
			{
				id: "1",
				type: "tab_switch",
				timestamp: new Date("2026-01-15T10:05:23"),
			},
			{
				id: "2",
				type: "copy_paste",
				timestamp: new Date("2026-01-15T10:12:45"),
			},
			{
				id: "3",
				type: "tab_switch",
				timestamp: new Date("2026-01-15T10:18:12"),
			},
		],
	},
};
