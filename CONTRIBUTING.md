# Contributing Guide

- [How to?](#how-to)
- [Data Scheme](#data-scheme)
- [Project Structure](#project-structure)
- [Scripts](#scripts)
- [Workflows](#workflows)

## How to?

### How to add a new entry to the database?

The easiest way is to submit a request using one of the available [forms](https://github.com/iptv-org/database/issues/new/choose). Simply enter all the information you know and click "Submit". Once your request is approved, the entry will be automatically added to the database.

If you want to add more than one entry, you can do so directly by editing the file in the [data/](data/) folder using any text editor. After that, just [commit](https://docs.github.com/en/pull-requests/committing-changes-to-your-project/creating-and-editing-commits/about-commits) all changes and send us a [pull request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests).

**IMPORTANT:** Before sending the request, make sure that the number of columns in the file has not changed and that all rows end with [CRLF](https://developer.mozilla.org/en-US/docs/Glossary/CRLF). Otherwise we will not be able to review this request.

### How to edit a database entry?

The first option is to send a request through one of the available [forms](https://github.com/iptv-org/database/issues/new/choose). Simply enter the new data in the form and click "Submit". To delete a value, insert `~` in the desired field. Once your request has been approved, the entry will be automatically updated.

The second option is to edit the file in the [data/](data/) folder using any text editor and then send us a [pull request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests).

**IMPORTANT:** Before sending the request, make sure that the number of columns in the file has not changed and that all rows end with [CRLF](https://developer.mozilla.org/en-US/docs/Glossary/CRLF). Otherwise we will not be able to review this request.

### How to delete an entry from the database?

To do this, you need to fill out one of the [forms](https://github.com/iptv-org/database/issues/new/choose), and once your request has been approved, the entry will be automatically deleted.

**IMPORTANT:** We do not remove channels from the database if they stop broadcasting. In this case, all you need to do is add the approximate closing date using this [form](https://github.com/iptv-org/database/issues/new?template=02_channels_edit.yml).

## Data Scheme

### channels

| Field       | Description                                                                                                                                                                         | Required | Example                    |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------------- |
| id          | Unique channel ID derived from the `name` and `country` separated by dot. May only contain Latin letters, numbers and dot.                                                          | Required | `AnhuiTV.cn`               |
| name        | Official channel name in English or call sign. May include: `a-z`, `0-9`, `space`, `-`, `!`, `:`, `&`, `.`, `+`, `'`, `/`, `»`, `#`, `%`, `°`, `$`, `@`, `?`, <code>\|</code>, `¡`. | Required | `Anhui TV`                 |
| alt_names   | List of alternative channel names separated by `;`. May contain any characters except `,` and `"`.                                                                                  | Optional | `安徽卫视;AHTV`            |
| network     | Network of which this channel is a part. May contain any characters except `,` and `"`.                                                                                             | Optional | `Anhui`                    |
| owners      | List of channel owners separated by `;`. May contain any characters except `,` and `"`.                                                                                             | Optional | `China Central Television` |
| country     | Country code from which the channel is transmitted. A list of all supported countries and their codes can be found in [data/countries.csv](data/countries.csv)                      | Required | `CN`                       |
| categories  | List of categories to which this channel belongs separated by `;`. A list of all supported categories can be found in [data/categories.csv](data/categories.csv).                   | Optional | `animation;kids`           |
| is_nsfw     | Indicates whether the channel broadcasts adult content (`TRUE` or `FALSE`).                                                                                                         | Required | `FALSE`                    |
| launched    | Launch date of the channel (`YYYY-MM-DD`).                                                                                                                                          | Optional | `2016-07-28`               |
| closed      | Date on which the channel closed (`YYYY-MM-DD`).                                                                                                                                    | Optional | `2020-05-31`               |
| replaced_by | The ID of the channel that this channel was replaced by.                                                                                                                            | Optional | `CCTV1.cn`                 |
| website     | Official website URL.                                                                                                                                                               | Optional | `http://www.ahtv.cn/`      |

### feeds

| Field          | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Required | Example                      |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------------------------- |
| channel        | ID of the channel to which this feed belongs.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Required | `France3.fr`                 |
| id             | Unique feed ID derived from the `name`. May only contain Latin letters and numbers.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Required | `Mediterranee`               |
| name           | Name of the feed in English. May include: `a-z`, `0-9`, `space`, `-`, `!`, `:`, `&`, `.`, `+`, `'`, `/`, `»`, `#`, `%`, `°`, `$`, `@`, `?`, <code>\|</code>, `¡`.                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Required | `Mediterranee`               |
| alt_names      | List of alternative feed names separated by `;`. May contain any characters except `,` and `"`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Optional | `Méditerranée;Mediterranean` |
| is_main        | Indicates if this feed is the main for the channel (`TRUE` or `FALSE`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Required | `FALSE`                      |
| broadcast_area | List of codes describing the broadcasting area of the feed separated by `;`. Any combination of `r/<region_code>`, `c/<country_code>`, `s/<subdivision_code>`, `ct/<city_code>` is allowed. A full list of supported codes can be found here: [data/regions.csv](https://github.com/iptv-org/database/blob/master/data/regions.csv), [data/countries.csv](https://github.com/iptv-org/database/blob/master/data/countries.csv), [data/subdivisions.csv](https://github.com/iptv-org/database/blob/master/data/subdivisions.csv), [data/cities.csv](https://github.com/iptv-org/database/blob/master/data/cities.csv). | Required | `s/FR-IDF;s/FR-NOR`          |
| timezones      | List of timezones in which the feed is broadcast separated by `;`. A list of all supported timezones and their codes can be found in [data/timezones.csv](data/timezones.csv).                                                                                                                                                                                                                                                                                                                                                                                                                                        | Required | `Europe/Paris`               |
| languages      | List of languages in which the feed is broadcast separated by `;`. A list of all supported languages and their codes can be found in [data/languages.csv](data/languages.csv).                                                                                                                                                                                                                                                                                                                                                                                                                                        | Required | `fra;eng`                    |
| format         | Video format of the feed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Required | `1080i`                      |

### logos

| Field   | Description                                                                                                                                                                                                                         | Required | Example                        |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------ |
| channel | Channel ID.                                                                                                                                                                                                                         | Required | `France3.fr`                   |
| feed    | Feed ID.                                                                                                                                                                                                                            | Optional | `Alpes`                        |
| tags    | List of keywords describing this version of the logo separated by `;`. May include: `a-z`, `0-9` and `-`.                                                                                                                           | Optional | `horizontal;white`             |
| width   | The width of the image in pixels.                                                                                                                                                                                                   | Required | `1000`                         |
| height  | The height of the image in pixels.                                                                                                                                                                                                  | Required | `468`                          |
| format  | Image format. One of: `PNG`, `JPEG`, `SVG`, `GIF`, `WebP`, `AVIF`, `APNG`.                                                                                                                                                          | Optional | `SVG`                          |
| url     | Logo URL. Only URLs with [HTTPS](https://ru.wikipedia.org/wiki/HTTPS) protocol are supported. Also the link should not be [geo-blocked](https://en.wikipedia.org/wiki/Geo-blocking). May contain any characters except `,` and `"`. | Required | `https://example.com/logo.svg` |

### categories

| Field       | Description                       | Required | Example                      |
| ----------- | --------------------------------- | -------- | ---------------------------- |
| id          | Category ID                       | Required | `news`                       |
| name        | Category name                     | Required | `News`                       |
| description | Short description of the category | Required | `Programming is mostly news` |

### languages

| Field | Description                                                               | Required | Example    |
| ----- | ------------------------------------------------------------------------- | -------- | ---------- |
| name  | Official language name                                                    | Required | `Croatian` |
| code  | [ISO 639-3](https://en.wikipedia.org/wiki/ISO_639-3) code of the language | Required | `hrv`      |

### countries

| Field     | Description                                                                                                                                             | Required | Example   |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------- |
| name      | Official name of the country                                                                                                                            | Required | `Canada`  |
| code      | [ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) code of the country                                                              | Required | `CA`      |
| languages | List of official languages of the country separated by `;`. A list of all supported languages can be found in [data/languages.csv](data/languages.csv). | Required | `eng;fra` |
| flag      | Country flag emoji                                                                                                                                      | Required | `🇨🇦`      |

### subdivisions

| Field   | Description                                                                                | Required | Example     |
| ------- | ------------------------------------------------------------------------------------------ | -------- | ----------- |
| country | [ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) code of the country | Required | `BD`        |
| name    | Official subdivision name                                                                  | Required | `Bandarban` |
| code    | [ISO 3166-2](https://en.wikipedia.org/wiki/ISO_3166-2) code of the subdivision             | Required | `BD-01`     |
| parent  | [ISO 3166-2](https://en.wikipedia.org/wiki/ISO_3166-2) code of the parent subdivision      | Optional | `BD-B`      |

### cities

| Field       | Description                                                                                                          | Required | Example   |
| ----------- | -------------------------------------------------------------------------------------------------------------------- | -------- | --------- |
| country     | [ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) code of the country where the city is located | Required | `CN`      |
| subdivision | [ISO 3166-2](https://en.wikipedia.org/wiki/ISO_3166-2) code of the subdivision where the city is located             | Optional | `CN-SD`   |
| name        | Official city name                                                                                                   | Required | `Yantai`  |
| code        | [UN/LOCODE](https://en.wikipedia.org/wiki/UN/LOCODE) of the city                                                     | Required | `CNYAT`   |
| wikidata_id | ID of this city in [Wikidata](https://www.wikidata.org/wiki/Wikidata:Main_Page)                                      | Required | `Q210493` |

### regions

| Field     | Description                                                                                                            | Required | Example          |
| --------- | ---------------------------------------------------------------------------------------------------------------------- | -------- | ---------------- |
| name      | Official name of the region                                                                                            | Required | `Central Asia`   |
| code      | Abbreviated designation for the region. May only contain Latin letters in upper case. The minimum length is 3 letters. | Required | `CAS`            |
| countries | List of country codes in the region                                                                                    | Required | `KG;KZ;TJ;TM;UZ` |

### timezones

| Field      | Description                                                               | Required | Example               |
| ---------- | ------------------------------------------------------------------------- | -------- | --------------------- |
| id         | Timezone ID from [tz database](https://en.wikipedia.org/wiki/Tz_database) | Required | `Africa/Johannesburg` |
| utc_offset | [UTC offset](https://en.wikipedia.org/wiki/UTC_offset) for this time zone | Required | `+02:00`              |
| countries  | List of countries included in this time zone                              | Required | `ZA;LS;SZ`            |

### blocklist

List of channels blocked at the request of copyright holders.

| Field   | Description                                     | Required | Example                           |
| ------- | ----------------------------------------------- | -------- | --------------------------------- |
| channel | Channel ID                                      | Required | `AnimalPlanetAfrica.us`           |
| reason  | Reason for blocking                             | Required | `dmca`                            |
| ref     | Link to removal request or DMCA takedown notice | Required | `https://example.com/issues/0000` |

## Project Structure

```
database/
├── .github/
|   ├── ISSUE_TEMPLATE      # issue templates for the repository
|   ├── workflows           # contains GitHub actions workflows
|   ├── CODE_OF_CONDUCT.md  # rules you shouldn't break if you don't want to get banned
├── .husky/
|   ├── pre-commit          # commands to run before each commit
├── .readme/
|   ├── preview.png         # image displayed in the README.md
├── data/                   # contains all data
├── scripts/                # contains all scripts used in the repository
├── tests/                  # contains tests to check the scripts
├── .prettierrc.js          # configuration file for Prettier
├── eslint.config.mjs       # configuration file for ESLint
├── package.json            # project manifest file
├── tsconfig.json           # configuration file for TypeScript
├── LICENSE                 # license text
├── CONTRIBUTING.md         # file you are currently reading
├── README.md               # project description displayed on the home page
```

## Scripts

These scripts are created to automate routine processes in the repository and make it a bit easier to maintain.

For scripts to work, you must have [Node.js](https://nodejs.org/en) installed on your computer.

To run scripts use the `npm run <script-name>` command.

- `act:check`: allows to run the [check](https://github.com/iptv-org/iptv/blob/master/.github/workflows/check.yml) workflow locally. Depends on [nektos/act](https://github.com/nektos/act).
- `act:update`: allows to run the [update](https://github.com/iptv-org/iptv/blob/master/.github/workflows/update.yml) workflow locally. Depends on [nektos/act](https://github.com/nektos/act).
- `act:deploy`: allows to run the [deploy](https://github.com/iptv-org/iptv/blob/master/.github/workflows/deploy.yml) workflow locally. Depends on [nektos/act](https://github.com/nektos/act).
- `db:validate`: checks the integrity of data.
- `db:export`: saves all data in JSON format to the `/.api` folder.
- `db:update`: triggers a data update using approved requests from issues.
- `lint`: сhecks the scripts for syntax errors.
- `test`: runs a test of all the scripts described above.

## Workflows

To automate the run of the scripts described above, we use the [GitHub Actions workflows](https://docs.github.com/en/actions/using-workflows).

Each workflow includes its own set of scripts that can be run either manually or in response to an event.

- `check`: runs the `db:validate` script when a new pull request appears, and blocks the merge if it detects an error in it.
- `update`: sequentially runs `db:update` and `db:validate` scripts and commits all the changes if successful.
- `deploy`: after each update of the [master](https://github.com/iptv-org/database/branches) branch runs the script `db:export` and then publishes the resulting files to the [iptv-org/api](https://github.com/iptv-org/api) repository.
