export function isAudioOutputSelectionSupported(): boolean {
	return (
		typeof HTMLMediaElement !== "undefined" &&
		"setSinkId" in HTMLMediaElement.prototype
	);
}

const AUDIO_INPUT_KEY = "invetflow-audio-input-device";
const AUDIO_OUTPUT_KEY = "invetflow-audio-output-device";

export function readStoredInterviewAudioDevices(): {
	audioInputDeviceId?: string;
	audioOutputDeviceId?: string;
} {
	if (typeof sessionStorage === "undefined") {
		return {};
	}
	const input = sessionStorage.getItem(AUDIO_INPUT_KEY);
	const output = sessionStorage.getItem(AUDIO_OUTPUT_KEY);
	return {
		audioInputDeviceId: input ?? undefined,
		audioOutputDeviceId: output ?? undefined,
	};
}

export function storeInterviewAudioDevices(prefs: {
	audioInputDeviceId?: string;
	audioOutputDeviceId?: string;
}): void {
	if (typeof sessionStorage === "undefined") return;
	if (prefs.audioInputDeviceId) {
		sessionStorage.setItem(AUDIO_INPUT_KEY, prefs.audioInputDeviceId);
	} else {
		sessionStorage.removeItem(AUDIO_INPUT_KEY);
	}
	if (prefs.audioOutputDeviceId) {
		sessionStorage.setItem(AUDIO_OUTPUT_KEY, prefs.audioOutputDeviceId);
	} else {
		sessionStorage.removeItem(AUDIO_OUTPUT_KEY);
	}
}
