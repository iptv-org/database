# Contributing Guide

- [Data Scheme](#data-scheme)
- [Channel Logo Guidelines](#channel-logo-guidelines)
- [Project Structure](#project-structure)
- [Scripts](#scripts)
- [Workflows](#workflows)

## Data Scheme

### channels

| Field          | Description                                                                                                                                                                                                                                  | Required | Example                        |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------ |
| id             | Unique channel ID derived from the `name` and `country` separated by dot. May only contain Latin letters, numbers and dot.                                                                                                                   | Required | `AnhuiTV.cn`                   |
| name           | Official channel name in English or call sign. May include: `a-z`, `0-9`, `space`, `-`, `!`, `:`, `&`, `.`, `+`, `'`, `/`, `»`, `#`, `%`, `°`, `$`, `@`, `?`, <code>\|</code>, `¡`, `–`.                                                     | Required | `Anhui TV`                     |
| alt_names      | List of alternative channel names separated by `;`. May contain any characters except `,` and `"`.                                                                                                                                           | Optional | `安徽卫视;AHTV`                |
| network        | Network of which this channel is a part. May contain any characters except `,` and `"`.                                                                                                                                                      | Optional | `Anhui`                        |
| owners         | List of channel owners separated by `;`. May contain any characters except `,` and `"`.                                                                                                                                                      | Optional | `China Central Television`     |
| country        | Country code from which the channel is transmitted. A list of all supported countries and their codes can be found in [data/countries.csv](data/countries.csv)                                                                               | Required | `CN`                           |
| subdivision    | Code of the subdivision (e.g., provinces or states) from which the broadcast is transmitted. A list of all supported subdivisions and their codes can be found in [data/subdivisions.csv](data/subdivisions.csv).                            | Optional | `CN-AH`                        |
| city           | The name of the city in English from which the channel is broadcast. May contain any characters except `,` and `"`.                                                                                                                          | Optional | `Hefei`                        |
| broadcast_area | List of codes describing the broadcasting area of the channel separated by `;`. Any combination of `r/<region_code>`, `c/<country_code>`, `s/<subdivision_code>`.                                                                            | Required | `c/CN;r/ASIA`                  |
| languages      | List of languages in which the channel is broadcast separated by `;`. A list of all supported languages and their codes can be found in [data/languages.csv](data/languages.csv).                                                            | Required | `zho;eng`                      |
| categories     | List of categories to which this channel belongs separated by `;`. A list of all supported categories can be found in [data/categories.csv](data/categories.csv).                                                                            | Optional | `animation;kids`               |
| is_nsfw        | Indicates whether the channel broadcasts adult content (`TRUE` or `FALSE`).                                                                                                                                                                  | Required | `FALSE`                        |
| launched       | Launch date of the channel (`YYYY-MM-DD`).                                                                                                                                                                                                   | Optional | `2016-07-28`                   |
| closed         | Date on which the channel closed (`YYYY-MM-DD`).                                                                                                                                                                                             | Optional | `2020-05-31`                   |
| replaced_by    | The ID of the channel that this channel was replaced by.                                                                                                                                                                                     | Optional | `CCTV1.cn`                     |
| website        | Official website URL.                                                                                                                                                                                                                        | Optional | `http://www.ahtv.cn/`          |
| logo           | Logo URL. Only URL with [HTTPS](https://ru.wikipedia.org/wiki/HTTPS) protocol are allowed. Supported image types: `PNG`, `JPEG`. Max size: 512x512 pixels. The link should not be [geo-blocked](https://en.wikipedia.org/wiki/Geo-blocking). | Required | `https://example.com/logo.png` |

### categories

| Field | Description   | Required | Example |
| ----- | ------------- | -------- | ------- |
| id    | Category ID   | Required | `news`  |
| name  | Category name | Required | `News`  |

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

| Field   | Description                                                                    | Required | Example            |
| ------- | ------------------------------------------------------------------------------ | -------- | ------------------ |
| country | Country code of the division                                                   | Required | `CA`               |
| name    | Official subdivision name                                                      | Required | `British Columbia` |
| code    | [ISO 3166-2](https://en.wikipedia.org/wiki/ISO_3166-2) code of the subdivision | Required | `CA-BC`            |

### regions

| Field     | Description                                                                                                            | Required | Example          |
| --------- | ---------------------------------------------------------------------------------------------------------------------- | -------- | ---------------- |
| name      | Official name of the region                                                                                            | Required | `Central Asia`   |
| code      | Abbreviated designation for the region. May only contain Latin letters in upper case. The minimum length is 3 letters. | Required | `CAS`            |
| countries | List of country codes in the region                                                                                    | Required | `KG;KZ;TJ;TM;UZ` |

### blocklist

List of channels blocked at the request of copyright holders.

| Field   | Description                                     | Required | Example                           |
| ------- | ----------------------------------------------- | -------- | --------------------------------- |
| channel | Channel ID                                      | Required | `AnimalPlanetAfrica.us`           |
| ref     | Link to removal request or DMCA takedown notice | Required | `https://example.com/issues/0000` |

## Channel Logo Guidelines

Since finding a suitable logo for the channel is not always possible, this list contains only recommendations and should just help you in choosing a logo from several options.

1. If the channel logo has several versions, it is better to choose a color one.

   That way there is less chance of the logo blending in with the background.

   <img src="https://user-images.githubusercontent.com/7253922/235551685-34cbb982-078f-42b8-9fb3-2800afc80abe.png" width="600"/>

2. If the logo has changed over time, use the latest version.

   <img src="https://user-images.githubusercontent.com/7253922/235551700-e2ee6823-c6bc-4688-ad4c-081911703f42.png" width="600"/>

3. If the channel has several versions of the logo, it is better to use the one used on air.

   <img src="https://user-images.githubusercontent.com/7253922/235551795-4d89c2bc-f9eb-4ac2-88d4-2149a870776f.png" width="600"/>

   <img src="https://user-images.githubusercontent.com/7253922/235551738-3e6680ff-af77-4d22-af6d-cbaab7400b66.png" width="600"/>

4. If there is a transparent background around the logo is better to cut it.

   That way it's much easier to scale the logo later.

   <img src="https://user-images.githubusercontent.com/7253922/235551815-b9925ac5-85ac-458a-bf0b-a9d57eb2547d.png" width="600"/>

## Project Structure

- `.github/`
  - `ISSUE_TEMPLATE/`: issue templates for the repository.
  - `workflows`: contains [GitHub actions](https://docs.github.com/en/actions/quickstart) workflows.
  - `CODE_OF_CONDUCT.md`: rules you shouldn't break if you don't want to get banned.
- `.readme/`
  - `preview.png`: image displayed in the `README.md`.
- `data/`: contains all data.
- `scripts/`: contains all scripts used in the repository.
- `tests/`: contains tests to check the scripts.
- `CONTRIBUTING.md`: file you are currently reading.
- `README.md`: project description displayed on the home page.

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
