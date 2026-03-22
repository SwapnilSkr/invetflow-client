import type { Meta, StoryObj } from "@storybook/react";
import { InterviewList } from "../src/components/recruiter/InterviewList";

const meta: Meta<typeof InterviewList> = {
	title: "Recruiter/InterviewList",
	component: InterviewList,
	parameters: {
		layout: "padded",
	},
};

export default meta;
type Story = StoryObj<typeof InterviewList>;

const mockInterviews = [
	{
		id: "1",
		title: "Senior Frontend Developer - Q1 2026",
		jobTitle: "Senior Frontend Engineer",
		status: "Active" as const,
		candidateName: "Sarah Johnson",
		candidateEmail: "sarah.j@example.com",
		duration: 45,
		scheduledAt: new Date("2026-01-20T14:00:00"),
		score: 8.5,
	},
	{
		id: "2",
		title: "Backend Engineer Interview",
		jobTitle: "Senior Backend Developer",
		status: "Scheduled" as const,
		candidateName: "Michael Chen",
		candidateEmail: "michael.c@example.com",
		duration: 60,
		scheduledAt: new Date("2026-01-22T10:00:00"),
	},
	{
		id: "3",
		title: "DevOps Position - Technical Round",
		jobTitle: "DevOps Engineer",
		status: "Completed" as const,
		candidateName: "Emily Rodriguez",
		candidateEmail: "emily.r@example.com",
		duration: 45,
		scheduledAt: new Date("2026-01-18T15:30:00"),
		completedAt: new Date("2026-01-18T16:15:00"),
		score: 7.2,
	},
	{
		id: "4",
		title: "Batch Interviews - Q1 Engineering",
		jobTitle: "Software Engineer",
		status: "Scheduled" as const,
		duration: 30,
		totalCandidates: 12,
		completedCandidates: 5,
	},
];

export const Default: Story = {
	args: {
		interviews: mockInterviews,
		onSelect: (interview) => console.log("Selected:", interview),
		onDelete: (id) => console.log("Delete:", id),
	},
};

export const WithoutDelete: Story = {
	args: {
		interviews: mockInterviews,
		onSelect: (interview) => console.log("Selected:", interview),
	},
};
