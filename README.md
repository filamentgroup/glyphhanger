# glyphhanger

Your web font utility belt. It can subset web fonts. It can show you what unicode-ranges are used on a web site (optionally per font-family). It can also subset web fonts automatically using the unicode-ranges it found. It makes julienne fries.

## Installation

Available on [npm](https://www.npmjs.com/package/glyphhanger).

```sh
npm install -g glyphhanger
```

### Prerequisite: `pyftsubset`

See [https://github.com/fonttools/fonttools](https://github.com/fonttools/fonttools).

```sh
pip install fonttools
```

```sh
# Additional installation for --flavor=woff2
git clone https://github.com/google/brotli
cd brotli
python setup.py install

# Additional installation for --flavor=woff --with-zopfli
git clone https://github.com/anthrotype/py-zopfli
cd py-zopfli
git submodule update --init --recursive
python setup.py install
```

## Usage

### Find the glyphs in a local file or url

```sh
# local file
glyphhanger ./test.html
glyphhanger ./test.txt

# output characters instead of Unicode code points
glyphhanger ./test.html --string

# remote URL
glyphhanger http://example.com

# multiple URLs, optionally using HTTPS
glyphhanger https://google.com https://www.filamentgroup.com

# show results for each font-family on the page
glyphhanger ./test.html --json

# show results only for one or more font-family names
glyphhanger ./test.html --family='Open Sans, Roboto'

# Show version
glyphhanger --version

# See more usage
glyphhanger --help
```

### Debug Mode

Replaces `--verbose` in `v3.0.0`.

```sh
> DEBUG=glyphhanger* glyphhanger http://example.com
```

### Subset font files automatically

Use `--subset=*.ttf` to select some font files for subsetting. Note that you can also [subset yourself manually with `pyftsubset`](docs/manual-subset.md) (but glyphhanger is easier).

_Note that the `DEBUG` output documented above will log the specific `pyftsubset` command that `glyphhanger` used. Read more [about `pyftsubset` defaults](https://github.com/filamentgroup/glyphhanger/issues/49)._

#### Just make optimized TTF/WOFF/WOFF2 files

```sh
> glyphhanger --subset=*.ttf

Subsetting LatoLatin-Regular.ttf to LatoLatin-Regular-subset.ttf (was 145.06 KB, now 70.25 KB)
Subsetting LatoLatin-Regular.ttf to LatoLatin-Regular-subset.zopfli.woff (was 145.06 KB, now 36.51 KB)
Subsetting LatoLatin-Regular.ttf to LatoLatin-Regular-subset.woff2 (was 145.06 KB, now 28.73 KB)
```

#### Subset to specific characters only (no URLs)

```sh
> glyphhanger --whitelist=ABCD --subset=*.ttf

Subsetting LatoLatin-Regular.ttf to LatoLatin-Regular-subset.ttf (was 145.06 KB, now 4.42 KB)
Subsetting LatoLatin-Regular.ttf to LatoLatin-Regular-subset.zopfli.woff (was 145.06 KB, now 2.84 KB)
Subsetting LatoLatin-Regular.ttf to LatoLatin-Regular-subset.woff2 (was 145.06 KB, now 2.24 KB)
```

#### Subset to the glyphs at a URL

```sh
> glyphhanger ./test.html --subset=*.ttf

Subsetting LatoLatin-Regular.ttf to LatoLatin-Regular-subset.ttf (was 145.06 KB, now 24 KB)
Subsetting LatoLatin-Regular.ttf to LatoLatin-Regular-subset.zopfli.woff (was 145.06 KB, now 14.34 KB)
Subsetting LatoLatin-Regular.ttf to LatoLatin-Regular-subset.woff2 (was 145.06 KB, now 11.37 KB)
```

#### Subset to the glyphs at a URL only using content that matches a specific font-family

```sh
> glyphhanger ./test.html --subset=*.ttf --family='Lato,sans-serif'

Subsetting LatoLatin-Regular.ttf to LatoLatin-Regular-subset.ttf (was 145.06 KB, now 24 KB)
Subsetting LatoLatin-Regular.ttf to LatoLatin-Regular-subset.zopfli.woff (was 145.06 KB, now 14.34 KB)
Subsetting LatoLatin-Regular.ttf to LatoLatin-Regular-subset.woff2 (was 145.06 KB, now 11.37 KB)
```

#### Specify the formats to output

Available formats: `ttf,woff,woff-zopfli,woff2`.

```sh
> glyphhanger --whitelist=ABCD --formats=woff2,woff --subset=*.ttf

Subsetting LatoLatin-Regular.ttf to LatoLatin-Regular-subset.woff (was 145.06 KB, now 2.88 KB)
Subsetting LatoLatin-Regular.ttf to LatoLatin-Regular-subset.woff2 (was 145.06 KB, now 2.24 KB)
```

#### Output a @font-face block with `--css`

Because we’re not parsing URLs for glyphs, we can optionally use `--family='My Family Name'` to set the name used in the `@font-face` block. Normally `--family` would tell GlyphHanger to only parse text data from nodes using one of the fonts listed in `--family`. Using `--subset` and `--css` together will write a CSS file, too.

```sh
> glyphhanger --whitelist=ABCD --formats=woff2,woff --subset=*.ttf --css

Subsetting LatoLatin-Regular.ttf to LatoLatin-Regular-subset.woff (was 145.06 KB, now 2.88 KB)
Subsetting LatoLatin-Regular.ttf to LatoLatin-Regular-subset.woff2 (was 145.06 KB, now 2.24 KB)
Writing CSS file: LatoLatin-Regular.css

@font-face {
  font-family: LatoLatin;
  src: url(sourcesanspro-regular-subset.woff2) format("woff2"), url(sourcesanspro-regular-subset.woff) format("woff");
  unicode-range: U+41-44;
}
```

### Whitelist Characters

```sh
# Add in a whitelist of specific characters
glyphhanger https://google.com --whitelist=abcdefgh

# Add in a whitelist as a unicode range
glyphhanger https://google.com --whitelist=U+26

# shortcut to add in a whitelist of all of US-ASCII (with an optional whitelist)
glyphhanger https://google.com --US_ASCII --whitelist=™

# shortcut to add in a whitelist of all Latin characters (with an optional whitelist)
glyphhanger https://google.com --LATIN --whitelist=™
```

#### Manual subsetting
```sh
glyphhanger --whitelist=ABCD --subset=*.ttf
```

#### Converting unicode ranges and back again

```sh
# Convert a string to a unicode-range
glyphhanger --whitelist=ABCD
glyphhanger --US_ASCII
glyphhanger --US_ASCII --whitelist=ABCD

# Convert a unicode-range to a string
glyphhanger --whitelist=U+41-44 --string
```

### Use the spider to gather URLs from links

Finds all the `<a href>` elements on the page with *local* (not external) links and adds those to the glyphhanger URLs. If you specify `--spider-limit`, `--spider` is assumed.

```sh
glyphhanger ./test.html --spider
glyphhanger ./test.html --spider-limit
glyphhanger ./test.html --spider-limit=10

# No limit
glyphhanger ./test.html --spider-limit=0
```

Default `--spider-limit` is 10. Set to `0` for no limit. This will greatly affect how long the task takes.

### Only search your page for visible text

Make your output even smaller by only subsetting characters that are visible on the page.

```sh
glyphhanger ./test.html --onlyVisible
```

### Only search your page for text matching a CSS selector

Limit results to text inside of elements that match a CSS selector

```sh
glyphhanger ./test.html --cssSelector="pre, #header, .popUp". If paired with `--onlyVisible`, it will only return elements that are both visible and match the selector
```


## Troubleshooting

* `glyphhanger` uses Puppeteer, the headless Chrome browser. Check out the [Puppeteer Troubleshooting documentation](https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md#chrome-headless-doesnt-launch).

## Testing

* Build Status: [![Build Status](https://travis-ci.org/filamentgroup/glyphhanger.svg?branch=master)](https://travis-ci.org/filamentgroup/glyphhanger)

`npm test` will run the tests.

Or, alternatively `./node_modules/mocha/bin/mocha` (or just `mocha` if you already have it installed globally with `npm install -g mocha`).

## Enhancement Queue

* [Top Voted Issues 👍](https://github.com/filamentgroup/glyphhanger/issues?q=label%3Aneeds-votes+sort%3Areactions-%2B1-desc)

## Alternatives to GlyphHanger

* [unicode-ranger from Jeremy Wagner](https://github.com/malchata/unicode-ranger)
* [subfont from Peter Müller](https://www.npmjs.com/package/subfont)