import type { Meta, StoryObj } from "@storybook/react";
import { AIInterviewTranscript } from "#/components/candidate/AIInterviewTranscript";

const meta: Meta<typeof AIInterviewTranscript> = {
	title: "Candidate/AIInterviewTranscript",
	component: AIInterviewTranscript,
	parameters: {
		layout: "centered",
	},
};

export default meta;
type Story = StoryObj<typeof AIInterviewTranscript>;

const mockMessages = [
	{
		id: "1",
		type: "ai" as const,
		content:
			"Hello! Welcome to your technical interview. I'm an AI interviewer and I'll be conducting this session. Are you ready to begin?",
		timestamp: new Date("2026-01-15T10:00:00"),
	},
	{
		id: "2",
		type: "candidate" as const,
		content: "Yes, I'm ready. Thank you for having me.",
		timestamp: new Date("2026-01-15T10:00:15"),
	},
	{
		id: "3",
		type: "ai" as const,
		content:
			"Great! Let's start with your experience. Can you tell me about a challenging project you have worked on recently?",
		timestamp: new Date("2026-01-15T10:00:20"),
		metadata: { confidence: 0.95, followUp: false },
	},
	{
		id: "4",
		type: "candidate" as const,
		content:
			"I recently worked on a microservices architecture migration. It was challenging because we had to maintain 99.9% uptime during the transition.",
		timestamp: new Date("2026-01-15T10:00:45"),
	},
	{
		id: "5",
		type: "ai" as const,
		content:
			"That is impressive. What specific strategies did you use to ensure zero downtime during the migration?",
		timestamp: new Date("2026-01-15T10:01:00"),
		metadata: { confidence: 0.88, followUp: true },
	},
	{
		id: "6",
		type: "system" as const,
		content: "Candidate paused for 5 seconds",
		timestamp: new Date("2026-01-15T10:01:10"),
	},
];

export const Empty: Story = {
	args: {
		messages: [],
	},
};

export const WithMessages: Story = {
	args: {
		messages: mockMessages,
	},
};
