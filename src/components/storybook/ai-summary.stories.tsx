import type { Meta, StoryObj } from "@storybook/react";
import { AISummary } from "../src/components/recruiter/AISummary";

const meta: Meta<typeof AISummary> = {
	title: "Recruiter/AISummary",
	component: AISummary,
	parameters: {
		layout: "padded",
	},
};

export default meta;
type Story = StoryObj<typeof AISummary>;

const baseArgs = {
	overallScore: 8.2,
	summary:
		"Sarah demonstrated excellent technical knowledge and strong problem-solving abilities. She communicated clearly and showed enthusiasm for the role. Her experience with microservices architecture aligns well with our needs.",
	strengths: [
		"Deep understanding of React and modern frontend patterns",
		"Strong experience with microservices architecture",
		"Excellent communication skills",
		"Proven track record of delivering complex projects",
	],
	weaknesses: [
		"Limited experience with TypeScript strict mode",
		"Could benefit from more leadership experience",
	],
	redFlags: [],
	skillScores: {
		technical: 8.5,
		communication: 9.0,
		problemSolving: 8.0,
		culturalFit: 8.5,
	},
	reasoning:
		"Score: 8.2/10 because the candidate demonstrated deep knowledge of modern frontend development, particularly in React and state management. She provided detailed examples of past projects and showed strong problem-solving skills. Minor deduction for limited TypeScript experience, but overall a very strong candidate who would be a great fit for the team.",
	recommendation: "strong_hire" as const,
};

export const StrongHire: Story = {
	args: baseArgs,
};

export const Hire: Story = {
	args: {
		...baseArgs,
		overallScore: 7.2,
		recommendation: "hire" as const,
		reasoning:
			"Score: 7.2/10 - Good candidate with solid technical skills. Would benefit from mentorship in some areas but shows strong potential.",
	},
};

export const Neutral: Story = {
	args: {
		...baseArgs,
		overallScore: 5.5,
		recommendation: "neutral" as const,
		strengths: [
			"Basic technical competency",
			"Good attitude and willingness to learn",
		],
		weaknesses: [
			"Limited practical experience",
			"Struggled with advanced concepts",
			"Communication could be clearer",
		],
		reasoning:
			"Score: 5.5/10 - Candidate shows potential but needs more experience. Consider for junior position with strong mentorship.",
	},
};

export const Reject: Story = {
	args: {
		...baseArgs,
		overallScore: 3.8,
		recommendation: "reject" as const,
		strengths: ["Enthusiasm for the role"],
		weaknesses: [
			"Lacks required technical skills",
			"Poor communication",
			"Unable to explain basic concepts",
		],
		redFlags: [
			"Multiple instances of reading from external sources",
			"Tab switching during technical questions",
		],
		skillScores: {
			technical: 3.0,
			communication: 4.0,
			problemSolving: 4.0,
			culturalFit: 5.0,
		},
		reasoning:
			"Score: 3.8/10 - Candidate does not meet the minimum requirements for this role. Significant gaps in technical knowledge and concerning behavior during interview.",
	},
};
