# Contributing Guide

### How to add a channel to the database or edit its description?

1. Download the repository to your computer. The easiest way to do this is via [GitHub Desktop](https://desktop.github.com/).
2. Open [data/channels.csv](data/channels.csv) file in one of the spreadsheet editors (such as [Google Sheets](https://www.google.com/sheets/about/), [LibreOffice](https://www.libreoffice.org/discover/libreoffice/), ...).
3. Make the necessary changes and save the file.
4. Make a [pull request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests) with all changes. This can also be done via [GitHub Desktop](https://desktop.github.com/).

## Data Scheme

- [channels](#channels)
- [categories](#categories)
- [countries](#countries)
- [languages](#languages)
- [regions](#regions)
- [subdivisions](#subdivisions)
- [blocklist](#blocklist)

### channels

| Field          | Description                                                                                                                                                                                                       | Required | Example                        |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------ |
| id             | Unique channel ID derived from the `name` and `country` separated by dot. May only contain Latin letters, numbers and dot.                                                                                        | Required | `AnhuiTV.cn`                   |
| name           | Official channel name in English or call sign. May include: `a-z`, `0-9`, `space`, `-`, `!`, `:`, `&`, `.`, `+`, `'`, `/`, `»`, `#`, `%`, `°`, `$`, `@`, `?`.                                                     | Required | `Anhui TV`                     |
| alt_names      | List of alternative channel names separated by `;`. May contain any characters except `,` and `"`.                                                                                                                | Optional | `安徽卫视`                     |
| network        | Network of which this channel is a part. May contain any characters except `,` and `"`.                                                                                                                           | Optional | `Anhui`                        |
| owners         | List of channel owners separated by `;`. May contain any characters except `,` and `"`.                                                                                                                           | Optional | `China Central Television`     |
| country        | Country code from which the channel is transmitted. A list of all supported countries and their codes can be found in [data/countries.csv](data/countries.csv)                                                    | Required | `CN`                           |
| subdivision    | Code of the subdivision (e.g., provinces or states) from which the broadcast is transmitted. A list of all supported subdivisions and their codes can be found in [data/subdivisions.csv](data/subdivisions.csv). | Optional | `CN-AH`                        |
| city           | Name of the city from which the channel is transmitted. May only contain `a-z`, `à-ÿ`, `0-9`, `space`, `-`, `'`.                                                                                                  | Optional | `Hefei`                        |
| broadcast_area | List of codes describing the broadcasting area of the channel. Any combination of `r/<region_code>`, `c/<country_code>`, `s/<subdivision_code>`.                                                                  | Required | `s/CN-AH`                      |
| languages      | List of languages in which the channel is broadcast separated by `;`. A list of all supported languages and their codes can be found in [data/languages.csv](data/languages.csv).                                 | Required | `zho`                          |
| categories     | List of categories to which this channel belongs separated by `;`. A list of all supported categories can be found in [data/categories.csv](data/categories.csv).                                                 | Optional | `general`                      |
| is_nsfw        | Indicates whether the channel broadcasts adult content (`TRUE` or `FALSE`).                                                                                                                                       | Required | `FALSE`                        |
| launched       | Launch date of the channel (`YYYY-MM-DD`).                                                                                                                                                                        | Optional | `2016-07-28`                   |
| closed         | Date on which the channel closed (`YYYY-MM-DD`).                                                                                                                                                                  | Optional | `2020-05-31`                   |
| replaced_by    | The ID of the channel that this channel was replaced by.                                                                                                                                                          | Optional | `CCTV1.cn`                     |
| website        | Official website URL.                                                                                                                                                                                             | Optional | `http://www.ahtv.cn/`          |
| logo           | Logo URL. Only URL with HTTPS protocol are allowed. Supported image types: `PNG`, `JPEG`.                                                                                                                         | Required | `https://example.com/logo.png` |

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
