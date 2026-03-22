import type { Meta, StoryObj } from "@storybook/react";
import { InterviewStatusBar } from "#/components/candidate/InterviewStatusBar";

const meta: Meta<typeof InterviewStatusBar> = {
	title: "Candidate/InterviewStatusBar",
	component: InterviewStatusBar,
	parameters: {
		layout: "fullscreen",
	},
};

export default meta;
type Story = StoryObj<typeof InterviewStatusBar>;

export const Connected: Story = {
	args: {
		status: "connected",
		audioEnabled: true,
		videoEnabled: true,
		networkQuality: "good",
		latency: 45,
		duration: 125,
		aiSpeaking: false,
		candidateSpeaking: false,
	},
};

export const AI_Speaking: Story = {
	args: {
		status: "connected",
		audioEnabled: true,
		videoEnabled: true,
		networkQuality: "good",
		latency: 52,
		duration: 245,
		aiSpeaking: true,
		candidateSpeaking: false,
	},
};

export const Candidate_Speaking: Story = {
	args: {
		status: "connected",
		audioEnabled: true,
		videoEnabled: true,
		networkQuality: "fair",
		latency: 120,
		duration: 367,
		aiSpeaking: false,
		candidateSpeaking: true,
	},
};

export const Reconnecting: Story = {
	args: {
		status: "reconnecting",
		audioEnabled: true,
		videoEnabled: true,
		networkQuality: "poor",
		latency: 450,
		duration: 582,
		aiSpeaking: false,
		candidateSpeaking: false,
	},
};

export const Audio_Video_Off: Story = {
	args: {
		status: "connected",
		audioEnabled: false,
		videoEnabled: false,
		networkQuality: "good",
		latency: 38,
		duration: 120,
		aiSpeaking: false,
		candidateSpeaking: false,
	},
};
