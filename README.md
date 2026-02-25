# `mpls-landlord-api`

a tiny rest api for fetching the landlord for a given minneapolis address. powered by [hono](https://hono.dev/), [nominatim](https://nominatim.org/), and [the city of minneapolis's active rental license data](https://opendata.minneapolismn.gov/datasets/cityoflakes::active-rental-licenses/about).

## how it works

- prior to starting the server, a preprocessing script fetches the active rental license data and performs a one-time geocoding of every address using nominatim. the dataset is stored as JSON.
- when the server receives a request, it first geocodes the input using nominatim and locates the matching rental property in the aforementioned JSON data.

## getting started

first, install [node.js](https://nodejs.org) (v22 or later).

ideally, you should have your own dedicated instance of the [nominatim api](https://nominatim.org/) up and running. the base url for this instance should live in your `.env`:

```sh
echo 'NOMINATIM_BASE_URL=https://nominatim.example.com' > .env
```

next, run the script to fetch and process the active rental license data:

```sh
npm run write
```

start the server:

```sh
npm ci
npm start
```

finally, make a request:

```sh
curl --get \
  --data-urlencode "q=example address input" \
  "http://localhost:3000"
```

the query parameters follow the same patterns as [the nominatim search endpoint's free form query](https://nominatim.org/release-docs/latest/api/Search/#free-form-query). only the `q` param is used.

## next steps

- [ ] unit tests
- [ ] rework the fetching in `fetchAndProcessData.ts` to not hammer the nominatim api
- [ ] git scrape and process the active rental license data
- [ ] better error handling throughout (particularly for addresses in active rental license data that aren't geocodeable for some reason)
- [ ] deploy it somewhere?
- [ ] openapi + docs?

## credits

most of this was put together during a pairing jam at the [recurse center](https://www.recurse.com/) on feb 24, 2026 in collaboration with:

- @bnb
- @margo-K
- @Giesch
