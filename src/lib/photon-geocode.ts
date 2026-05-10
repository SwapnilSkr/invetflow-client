import type { JobLocation } from "#/integrations/api/client";

/** Public Photon instance (OpenStreetMap). Fair-use; throttle-friendly: debounce client-side. */
const PHOTON_API =
	import.meta.env.VITE_PHOTON_URL ?? "https://photon.komoot.io/api/";

type PhotonProperties = {
	name?: string | null;
	city?: string | null;
	town?: string | null;
	village?: string | null;
	locality?: string | null;
	state?: string | null;
	county?: string | null;
	country?: string | null;
	type?: string | null;
	street?: string | null;
	district?: string | null;
};

type PhotonFeature = {
	properties: PhotonProperties;
};

type PhotonResponse = {
	features?: PhotonFeature[];
};

function buildLabel(p: PhotonProperties): string {
	const name = p.name?.trim();
	if (!name) return "";

	const locality =
		p.city?.trim() ||
		p.town?.trim() ||
		p.village?.trim() ||
		p.locality?.trim() ||
		null;
	const region = p.state?.trim() || p.county?.trim() || null;
	const country = p.country?.trim() || null;

	const t = p.type ?? "";
	if (
		t === "house" ||
		t === "building" ||
		p.street ||
		(name && locality && name !== locality)
	) {
		const bits = [p.street, name, locality, region, country].filter(
			(s): s is string => Boolean(s && String(s).trim()),
		);
		const seen = new Set<string>();
		const out: string[] = [];
		for (const b of bits) {
			const x = b.trim();
			if (!seen.has(x.toLowerCase())) {
				seen.add(x.toLowerCase());
				out.push(x);
			}
		}
		return out.join(", ");
	}

	const core: string[] = [];
	if (name) core.push(name);
	if (region && region !== name) core.push(region);
	if (country && country !== name) core.push(country);
	return core.join(", ");
}

function featureToLocation(f: PhotonFeature): JobLocation | null {
	const p = f.properties;
	const label = buildLabel(p);
	if (!label) return null;

	const cityName =
		p.city?.trim() ||
		p.town?.trim() ||
		p.village?.trim() ||
		(["city", "town", "village"].includes(p.type ?? "")
			? p.name?.trim()
			: null) ||
		null;

	const region = p.state?.trim() || p.county?.trim() || null;
	const country = p.country?.trim() || null;

	return {
		label,
		city: cityName,
		region: region ?? null,
		country: country ?? null,
	};
}

/**
 * Forward geocode search (autocomplete). Uses Photon (OSM); no API key on public endpoint.
 */
export async function searchPhotonPlaces(
	query: string,
): Promise<JobLocation[]> {
	const q = query.trim();
	if (q.length < 2) return [];

	const url = new URL(PHOTON_API);
	url.searchParams.set("q", q);
	url.searchParams.set("limit", "10");
	url.searchParams.set("lang", "en");

	const res = await fetch(url.toString());
	if (!res.ok) {
		throw new Error("Could not search locations. Try again.");
	}

	const data = (await res.json()) as PhotonResponse;
	const features = data.features ?? [];

	const seen = new Set<string>();
	const out: JobLocation[] = [];

	for (const f of features) {
		const loc = featureToLocation(f);
		if (!loc) continue;
		const key = loc.label.toLowerCase();
		if (seen.has(key)) continue;
		seen.add(key);
		out.push(loc);
	}

	return out.slice(0, 8);
}
