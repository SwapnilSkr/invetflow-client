import type { Meta, StoryObj } from "@storybook/react";
import { InterviewControls } from "../src/components/candidate/InterviewControls";

const meta: Meta<typeof InterviewControls> = {
	title: "Candidate/InterviewControls",
	component: InterviewControls,
	parameters: {
		layout: "centered",
	},
};

export default meta;
type Story = StoryObj<typeof InterviewControls>;

export const AllEnabled: Story = {
	args: {
		audioEnabled: true,
		videoEnabled: true,
		screenSharing: false,
		onToggleAudio: () => console.log("Toggle audio"),
		onToggleVideo: () => console.log("Toggle video"),
		onToggleScreenShare: () => console.log("Toggle screen share"),
		onEndCall: () => console.log("End call"),
	},
};

export const AudioOff: Story = {
	args: {
		audioEnabled: false,
		videoEnabled: true,
		screenSharing: false,
		onToggleAudio: () => console.log("Toggle audio"),
		onToggleVideo: () => console.log("Toggle video"),
		onToggleScreenShare: () => console.log("Toggle screen share"),
		onEndCall: () => console.log("End call"),
	},
};

export const ScreenSharing: Story = {
	args: {
		audioEnabled: true,
		videoEnabled: true,
		screenSharing: true,
		onToggleAudio: () => console.log("Toggle audio"),
		onToggleVideo: () => console.log("Toggle video"),
		onToggleScreenShare: () => console.log("Toggle screen share"),
		onEndCall: () => console.log("End call"),
	},
};
