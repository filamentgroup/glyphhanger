# glyphhanger

Generates a combined list of every glyph used on a list of sample urls. This information can then be used to subset web fonts appropriately.

## Installation

```
npm install -g glyphhanger
```

## Usage

```
# local file
> glyphhanger ./test.html

# remote URL
> glyphhanger http://example.com

# multiple URLs, optionally using HTTPS
> glyphhanger https://google.com https://www.filamentgroup.com

# verbose mode
> glyphhanger https://google.com --verbose
```

### Whitelist Characters

```
# whitelist specific characters
> glyphhanger https://google.com -w abcdefgh

# shortcut to whitelist all of US-ASCII
> glyphhanger https://google.com --US_ASCII
```

### Use the built-in spider to gather URLs from links

Finds all the `<a href>` elements on the page with *local* (not external) links and adds those to the glyphhanger URLs.

```
> glyphhanger ./test.html --spider --spider-limit=10
```

Default `--spider-limit` is 10. Increasing this will increase the amount of time the task takes.

### Output to a file, use with `pyftsubset`

Don’t use verbose mode here, we want to save the output to a file.

```
> glyphhanger ./test.html > glyphhanger_output
> pyftsubset FONTFILENAME.ttf --text-file=glyphhanger_output --flavor=woff

# or, output WOFF2
> pyftsubset FONTFILENAME.ttf --text-file=glyphhanger_output --flavor=woff2

# Remove temporary file
> rm glyphhanger_output
```