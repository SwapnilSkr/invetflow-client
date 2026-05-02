import type { Meta, StoryObj } from "@storybook/react";
import { TechCheck } from "#/components/candidate/TechCheck";

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
		onComplete: (devices: {
			audio: boolean;
			video: boolean;
			screen: boolean;
		}) => console.log("Devices ready:", devices),
		onCancel: () => console.log("Cancelled"),
	},
};

export const WithoutCancel: Story = {
	args: {
		onComplete: (devices: {
			audio: boolean;
			video: boolean;
			screen: boolean;
		}) => console.log("Devices ready:", devices),
	},
};
