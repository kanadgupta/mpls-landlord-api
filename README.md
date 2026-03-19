# `mpls-landlord-api`

a tiny rest api for fetching the landlord for a given minneapolis address. powered by [hono](https://hono.dev/), [pelias](https://pelias.io), and [the city of minneapolis's active rental license data](https://opendata.minneapolismn.gov/datasets/cityoflakes::active-rental-licenses/about).

## how it works

- prior to starting the server, a preprocessing script fetches the active rental license data and performs a one-time geocoding of every address using pelias. the dataset is stored as JSON.
- when the server receives a request, it first geocodes the input using pelias and locates the matching rental property in the aforementioned JSON data.

## getting started

first, install [node.js](https://nodejs.org) (v22 or later).

ideally, you should have your own dedicated instance of the [pelias api](https://pelias.io) up and running. the base url for this instance should live in your `.env`:

```sh
echo 'PELIAS_BASE_URL=http://localhost:4000' > .env
```

next, run the script to fetch and process the active rental license data:

```sh
npm run fetch
```

start the server:

```sh
npm ci
npm start
```

finally, make a request:

```sh
curl --get \
  --data-urlencode "address=example address input" \
  "http://localhost:3000"
```

the `address` query param should be a street address (i.e., no city/state/zip info).

## next steps

- [x] unit tests
- [x] general fine tuning of geocoding queries to improve general API accuracy (mostly done, but leaving it here in case we want to improve upon this in the future)
  - [ ] perhaps we leverage the ability to [search within a circular region](https://github.com/pelias/documentation/blob/a4650408d8b98f19a64d8a10f1bcbd541985b153/search.md#search-within-a-circular-region)?
  - [ ] alternatively, maybe [a free form query](https://github.com/pelias/documentation/blob/a4650408d8b98f19a64d8a10f1bcbd541985b153/search-workflows.md) might be more suitable in certain instances?
- [x] rework the fetching in `fetchAndProcessData.ts` to not hammer the geocoding api
  - [ ] smarter retry-based handling
- [ ] git scrape and process the active rental license data
- [ ] better error handling throughout (particularly for addresses in active rental license data that aren't geocodeable for some reason)
- [ ] deploy it somewhere?
- [ ] openapi + docs?

## credits

most of this was put together during a pairing jam at the [recurse center](https://www.recurse.com/) on feb 24, 2026 in collaboration with:

- [@bnb](https://github.com/bnb)
- [@Giesch](https://github.com/Giesch)
- [@margo-K](https://github.com/margo-K)
