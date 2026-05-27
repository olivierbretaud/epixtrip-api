const BASE_URL = 'https://photon.komoot.io/reverse';

export type GeoPlace = {
	city: string | null;
	region: string | null;
	state: string | null;
	country_code: string | null;
};

type PhotonProperties = {
	name?: string;
	city?: string;
	district?: string;
	county?: string;
	state?: string;
	country?: string;
	countrycode?: string;
	osm_value?: string;
};

type PhotonResult = {
	features: { properties: PhotonProperties }[];
};

export async function reverseGeocode(
	lat: number,
	lng: number,
): Promise<GeoPlace | null> {
	const url = `${BASE_URL}?lat=${lat}&lon=${lng}&lang=fr`;

	const res = await fetch(url);
	if (!res.ok) return null;

	const data = (await res.json()) as PhotonResult;
	const props = data.features[0]?.properties;
	if (!props) return null;
	return {
		city: props.city ?? props.district ?? props.name ?? null,
		region: props.county ?? null,
		state: props.state ?? null,
		country_code: props.countrycode ?? null,
	};
}
