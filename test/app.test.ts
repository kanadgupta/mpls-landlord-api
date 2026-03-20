import nock from "nock";
import { describe, expect, it } from "vitest";

import app from "../src/app.ts";
import { peliasBaseUrl } from "../src/utils.ts";

describe("app tests", () => {
  it("should return 400 if no query param is passed", async () => {
    const res = await app.request("/");
    expect(res.status).toBe(400);
    expect(await res.text()).toBe("missing `address` query param");
  });

  it("should return 400 if no results are found", async () => {
    const address = "123 main st";
    nock(peliasBaseUrl, {
      encodedQueryParams: true,
    })
      .get("/v1/search/structured")
      .query({ address, locality: "Minneapolis", size: "1", sources: "osm" })
      .reply(200, {
        geocoding: {
          version: "0.2",
          attribution: "http://localhost:4000/attribution",
          query: {
            parsed_text: {
              city: "minneapolis",
              street: address,
            },
            size: 1,
            private: false,
            "focus.point.lat": 45.52,
            "focus.point.lon": -122.67,
            lang: {
              name: "English",
              iso6391: "en",
              iso6393: "eng",
              via: "header",
              defaulted: false,
            },
            querySize: 20,
          },
          engine: {
            name: "Pelias",
            author: "Mapzen",
            version: "1.0",
          },
          timestamp: 1773954971249,
        },
        type: "FeatureCollection",
        features: [
          // this is technically a result, but it's a partial match and we expect it to be filtered out
          {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [-93.266563, 44.96313],
            },
            properties: {
              id: "85969169",
              gid: "whosonfirst:locality:85969169",
              layer: "locality",
              source: "whosonfirst",
              source_id: "85969169",
              country_code: "US",
              name: "Minneapolis",
              confidence: 0.6,
              match_type: "fallback",
              distance: 2292.61,
              accuracy: "centroid",
              country: "United States",
              country_gid: "whosonfirst:country:85633793",
              country_a: "USA",
              region: "Minnesota",
              region_gid: "whosonfirst:region:85688727",
              region_a: "MN",
              county: "Hennepin County",
              county_gid: "whosonfirst:county:102087709",
              localadmin: "Minneapolis",
              localadmin_gid: "whosonfirst:localadmin:404511883",
              locality: "Minneapolis",
              locality_gid: "whosonfirst:locality:85969169",
              label: "Minneapolis, MN, USA",
              addendum: {
                concordances: {
                  "dbp:id": "Minneapolis",
                  "fb:id": "en.minneapolis",
                  "fct:id": "08c81220-8f76-11e1-848f-cfd5bf3ef515",
                  "fips:code": "2743000",
                  "gn:id": 5037649,
                  "gp:id": 2452078,
                  "loc:id": "n79003965",
                  "ne:id": 1159151219,
                  "nyt:id": "N28852304183000137271",
                  "qs_pg:id": 273682,
                  "uscensus:geoid": "2743000",
                  "wd:id": "Q36091",
                  "wk:page": "Minneapolis",
                },
              },
              index: 0,
            },
            bbox: [-93.329108, 44.890589, -93.194329, 45.051246],
          },
        ],
        bbox: [-93.329108, 44.890589, -93.194329, 45.051246],
      })
      // second request, this time without the `sources` filter
      .get("/v1/search/structured")
      .query({ address, locality: "Minneapolis", size: "1" })
      .reply(200, {
        geocoding: {
          version: "0.2",
          attribution: "http://localhost:4000/attribution",
          query: {
            parsed_text: {
              city: "minneapolis",
              street: address,
            },
            size: 1,
            private: false,
            "focus.point.lat": 45.52,
            "focus.point.lon": -122.67,
            lang: {
              name: "English",
              iso6391: "en",
              iso6393: "eng",
              via: "header",
              defaulted: false,
            },
            querySize: 20,
          },
          engine: {
            name: "Pelias",
            author: "Mapzen",
            version: "1.0",
          },
          timestamp: 1773954971249,
        },
        type: "FeatureCollection",
        features: [
          // this is technically a result, but it's a partial match and we expect it to be filtered out
          {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [-93.266563, 44.96313],
            },
            properties: {
              id: "85969169",
              gid: "whosonfirst:locality:85969169",
              layer: "locality",
              source: "whosonfirst",
              source_id: "85969169",
              country_code: "US",
              name: "Minneapolis",
              confidence: 0.6,
              match_type: "fallback",
              distance: 2292.61,
              accuracy: "centroid",
              country: "United States",
              country_gid: "whosonfirst:country:85633793",
              country_a: "USA",
              region: "Minnesota",
              region_gid: "whosonfirst:region:85688727",
              region_a: "MN",
              county: "Hennepin County",
              county_gid: "whosonfirst:county:102087709",
              localadmin: "Minneapolis",
              localadmin_gid: "whosonfirst:localadmin:404511883",
              locality: "Minneapolis",
              locality_gid: "whosonfirst:locality:85969169",
              label: "Minneapolis, MN, USA",
              addendum: {
                concordances: {
                  "dbp:id": "Minneapolis",
                  "fb:id": "en.minneapolis",
                  "fct:id": "08c81220-8f76-11e1-848f-cfd5bf3ef515",
                  "fips:code": "2743000",
                  "gn:id": 5037649,
                  "gp:id": 2452078,
                  "loc:id": "n79003965",
                  "ne:id": 1159151219,
                  "nyt:id": "N28852304183000137271",
                  "qs_pg:id": 273682,
                  "uscensus:geoid": "2743000",
                  "wd:id": "Q36091",
                  "wk:page": "Minneapolis",
                },
              },
              index: 0,
            },
            bbox: [-93.329108, 44.890589, -93.194329, 45.051246],
          },
        ],
        bbox: [-93.329108, 44.890589, -93.194329, 45.051246],
      });

    const search = new URLSearchParams({ address }).toString();

    const res = await app.request(`/?${search}`);

    expect(res.status).toBe(400);
    expect(await res.text()).toBe("no actual address found");
  });
});
