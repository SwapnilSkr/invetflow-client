import type { Meta, StoryObj } from "@storybook/react";
import { TechCheck } from "../src/components/candidate/TechCheck";

const meta: Meta<typeof TechCheck> = {
	title: "Candidate/TechCheck",
	component: TechCheck,
	parameters: {
		layout: "centered",
	},
};

export default meta;
type Story = StoryObj<typeof TechCheck>;

export const Default: Story = {
	args: {
		onComplete: (devices) => console.log("Devices ready:", devices),
		onCancel: () => console.log("Cancelled"),
	},
};

export const WithoutCancel: Story = {
	args: {
		onComplete: (devices) => console.log("Devices ready:", devices),
	},
};
