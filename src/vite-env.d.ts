/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_API_URL?: string;
	/** Optional Photon API base URL for self-hosted OSM geocoding (default: komoot public). */
	readonly VITE_PHOTON_URL?: string;
}
