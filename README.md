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

# or output WOFF2 (see additional installation instructions below)
> pyftsubset FONTFILENAME.ttf --text-file=glyphhanger_output --flavor=woff2

# Remove temporary file
> rm glyphhanger_output
```

### Installing `pyftsubset`

```
pip install fonttools

# Additional information for --flavor=woff2
git clone https://github.com/google/brotli
cd brotli
python setup.py install
```

## Testing

GlyphHanger uses Mocha for testing.

`npm test` will run the tests.

Or, alternatively:

`./node_modules/mocha/bin/mocha` (or just `mocha` if you already have it installed globally with `npm install -g mocha`).

## Limitations

* Pseudo-element CSS `content` is not parsed.

## Example

```
> glyphhanger https://www.zachleat.com/web/ --spider --spider-limit=5 > glyphhanger_zachleat_output

> glyphhanger_zachleat_output
 !$&()+,-./0123456789:?@ABCDEFGHIJLMNOPQRSTUVWXYZ[]abcdefghijklmnopqrstuvwxyz»é–—’“”→★

> pyftsubset sourcesanspro-regular.ttf --text-file=glyphhanger_zachleat_output --flavor=woff
# Reduced the 166KB .ttf font file to an 8KB .woff webfont file.
``` 
