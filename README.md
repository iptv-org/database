# Database [![check](https://github.com/iptv-org/database/actions/workflows/check.yml/badge.svg)](https://github.com/iptv-org/database/actions/workflows/check.yml)

All data is stored in the [/data](data) folder as [CSV](https://en.wikipedia.org/wiki/Comma-separated_values) (Comma-separated values) files. Any of the files can be edited either with a basic text editor or through any spreadsheet editor (such as [Google Sheets](https://www.google.com/sheets/about/), [LibreOffice](https://www.libreoffice.org/discover/libreoffice/), ...).

## Data Scheme

- [channels](#channels)
- [categories](#categories)
- [countries](#countries)
- [languages](#languages)
- [regions](#regions)
- [subdivisions](#subdivisions)
- [blocklist](#blocklist)

### channels

| Field          | Description                                                                                                                                                                                                      | Required | Example                       |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------------------------- |
| id             | Unique channel ID. Should be derived from the name of the channel and country code separated by dot. May only contain Latin letters, numbers and dot.                                                            | Required | `KSTSDT3.us`                  |
| name           | Official channel name. May include: `a-z`, `à-ÿ`, `0-9`, `space`, `-`, `!`, `:`, `&`, `.`, `+`, `'`, `/`, `»`, `#`, `%`, `°`, `$`, `@`, `?`, `(`, `)`.                                                           | Required | `KSTS-DT3`                    |
| network        | Name of the network operating the channel.                                                                                                                                                                       | Optional | `NBC`                         |
| country        | Country code from which the channel is transmitted. A list of all supported countries and their codes can be found in [data/countries.csv](data/countries.csv)                                                   | Required | `US`                          |
| subdivision    | Code of the subdivision (e.g., provinces or states) from which the broadcast is transmitted. A list of all supported subdivisions and their codes can be found in [data/subdivisions.csv](data/subdivisions.csv) | Optional | `US-CA`                       |
| city           | Name of the city from which the channel is transmitted. May only contain `a-z`, `à-ÿ`, `0-9`, `space`, `-`, `'`.                                                                                                 | Optional | `San Francisco`               |
| broadcast_area | List of codes describing the broadcasting area of the channel. Any combination of `r/<region_code>`, `c/<country_code>`, `s/<subdivision_code>`                                                                  | Required | `s/US-CA`                     |
| languages      | List of languages in which the channel is broadcast separated by `;`. A list of all supported languages and their codes can be found in [data/languages.csv](data/languages.csv)                                 | Required | `eng;spa`                     |
| categories     | List of categories to which this channel belongs separated by `;`. A list of all supported categories can be found in [data/categories.csv](data/categories.csv)                                                 | Optional | `news;weather`                |
| is_nsfw        | Indicates whether the channel broadcasts adult content (`TRUE` or `FALSE`)                                                                                                                                       | Required | `FALSE`                       |
| logo           | Logo URL                                                                                                                                                                                                         | Optional | `https://example.com/nbc.png` |

### categories

| Field | Description                                                    | Required | Example |
| ----- | -------------------------------------------------------------- | -------- | ------- |
| id    | Category ID. Should be the same as the name but in lower case. | Required | `news`  |
| name  | Category name in one word.                                     | Required | `News`  |

### languages

| Field | Description                                                               | Required | Example    |
| ----- | ------------------------------------------------------------------------- | -------- | ---------- |
| name  | Official language name                                                    | Required | `Croatian` |
| code  | [ISO 639-3](https://en.wikipedia.org/wiki/ISO_639-3) code of the language | Required | `hrv`      |

### countries

| Field | Description                                                                                | Required | Example      |
| ----- | ------------------------------------------------------------------------------------------ | -------- | ------------ |
| name  | Official name of the country                                                               | Required | `Martinique` |
| code  | [ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) code of the country | Required | `MQ`         |
| lang  | Official language in the country.                                                          | Required | `fra`        |
| flag  | Country flag emoji                                                                         | Required | `🇲🇶`         |

### subdivisions

| Field   | Description                                                                    | Required | Example            |
| ------- | ------------------------------------------------------------------------------ | -------- | ------------------ |
| country | Country code of the division.                                                  | Required | `CA`               |
| name    | Official subdivision name                                                      | Required | `British Columbia` |
| code    | [ISO 3166-2](https://en.wikipedia.org/wiki/ISO_3166-2) code of the subdivision | Required | `CA-BC`            |

### regions

| Field     | Description                                                                                                            | Required | Example          |
| --------- | ---------------------------------------------------------------------------------------------------------------------- | -------- | ---------------- |
| name      | Official name of the region.                                                                                           | Required | `Central Asia`   |
| code      | Abbreviated designation for the region. May only contain Latin letters in upper case. The minimum length is 3 letters. | Required | `CAS`            |
| countries | List of country codes in the region.                                                                                   | Required | `KG;KZ;TJ;TM;UZ` |

### blocklist

List of channels blocked at the request of copyright holders.

| Field   | Description                                     | Required | Example                           |
| ------- | ----------------------------------------------- | -------- | --------------------------------- |
| channel | Channel ID                                      | Required | `AnimalPlanetAfrica.us`           |
| ref     | Link to removal request or DMCA takedown notice | Required | `https://example.com/issues/0000` |

## Contribution

If you find a bug or want to contribute to the code or documentation, you can help by submitting an [issue](https://github.com/iptv-org/database/issues) or a [pull request](https://github.com/iptv-org/database/pulls).
