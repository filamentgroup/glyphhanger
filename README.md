# glyphhanger

Utility to automatically subset fonts for serving on the web. Can generates a combined list of every glyph used on a list of sample files or urls.

## Installation

Available on [npm](https://www.npmjs.com/package/glyphhanger).

```
npm install -g glyphhanger
```

## Usage

### Find the glyphs in a local file or url

```
# local file
> glyphhanger ./test.html
> glyphhanger ./test.txt

# output characters instead of Unicode code points
> glyphhanger ./test.html --string

# remote URL
> glyphhanger http://example.com

# multiple URLs, optionally using HTTPS
> glyphhanger https://google.com https://www.filamentgroup.com

# show results for each font-family on the page
> glyphhanger ./test.html --json

# show results only for one or more font-family names
> glyphhanger ./test.html --family='Open Sans, Roboto'

# Show version
> glyphhanger --version

# See more usage
> glyphhanger --help
```

### Debug Mode

Replaces `--verbose` in `v3.0.0`.

```
> DEBUG=glyphhanger* glyphhanger http://example.com
```


### Subset font files automatically

Use `--subset=*.ttf` to select some font files for subsetting. Note that you can also [subset yourself manually with `pyftsubset`](docs/manual-subset.md) (but glyphhanger is easier).

#### Just make optimized TTF/WOFF/WOFF2 files

```
> glyphhanger --subset=*.ttf

Subsetting LatoLatin-Regular.ttf to LatoLatin-Regular-subset.ttf (was 145.06 KB, now 70.25 KB)
Subsetting LatoLatin-Regular.ttf to LatoLatin-Regular-subset.zopfli.woff (was 145.06 KB, now 36.51 KB)
Subsetting LatoLatin-Regular.ttf to LatoLatin-Regular-subset.woff2 (was 145.06 KB, now 28.73 KB)
```

#### Subset to specific characters only (no URLs)

```
> glyphhanger --whitelist=ABCD --subset=*.ttf

Subsetting LatoLatin-Regular.ttf to LatoLatin-Regular-subset.ttf (was 145.06 KB, now 4.42 KB)
Subsetting LatoLatin-Regular.ttf to LatoLatin-Regular-subset.zopfli.woff (was 145.06 KB, now 2.84 KB)
Subsetting LatoLatin-Regular.ttf to LatoLatin-Regular-subset.woff2 (was 145.06 KB, now 2.24 KB)
```

#### Subset to the glyphs at a URL

```
> glyphhanger ./test.html --subset=*.ttf

Subsetting LatoLatin-Regular.ttf to LatoLatin-Regular-subset.ttf (was 145.06 KB, now 24 KB)
Subsetting LatoLatin-Regular.ttf to LatoLatin-Regular-subset.zopfli.woff (was 145.06 KB, now 14.34 KB)
Subsetting LatoLatin-Regular.ttf to LatoLatin-Regular-subset.woff2 (was 145.06 KB, now 11.37 KB)
```

#### Subset to the glyphs at a URL only using content that matches a specific font-family

```
> glyphhanger ./test.html --subset=*.ttf --family='Lato,sans-serif'

Subsetting LatoLatin-Regular.ttf to LatoLatin-Regular-subset.ttf (was 145.06 KB, now 24 KB)
Subsetting LatoLatin-Regular.ttf to LatoLatin-Regular-subset.zopfli.woff (was 145.06 KB, now 14.34 KB)
Subsetting LatoLatin-Regular.ttf to LatoLatin-Regular-subset.woff2 (was 145.06 KB, now 11.37 KB)
```


#### Specify the formats to output

Available formats: `ttf,woff,woff-zopfli,woff2`.

```
> glyphhanger --whitelist=ABCD --formats=woff2,woff --subset=*.ttf

Subsetting LatoLatin-Regular.ttf to LatoLatin-Regular-subset.woff (was 145.06 KB, now 2.88 KB)
Subsetting LatoLatin-Regular.ttf to LatoLatin-Regular-subset.woff2 (was 145.06 KB, now 2.24 KB)
```

#### Output a @font-face block with `--css`

Because we’re not parsing URLs for glyphs, we can optionally use `--family='My Family Name'` to set the name used in the `@font-face` block. Normally `--family` would tell GlyphHanger to only parse text data from nodes using one of the fonts listed in `--family`.

```
> glyphhanger --whitelist=ABCD --formats=woff2,woff --subset=*.ttf --css

Subsetting LatoLatin-Regular.ttf to LatoLatin-Regular-subset.woff (was 145.06 KB, now 2.88 KB)
Subsetting LatoLatin-Regular.ttf to LatoLatin-Regular-subset.woff2 (was 145.06 KB, now 2.24 KB)

@font-face {
  font-family: LatoLatin;
  src: url(sourcesanspro-regular-subset.woff2) format("woff2"), url(sourcesanspro-regular-subset.woff) format("woff");
  unicode-range: U+41-44;
}
```

### Whitelist Characters

```
# Add in a whitelist of specific characters
> glyphhanger https://google.com --whitelist=abcdefgh

# Add in a whitelist as a unicode range
> glyphhanger https://google.com --whitelist=U+26

# shortcut to add in a whitelist of all of US-ASCII (with an optional whitelist)
> glyphhanger https://google.com --US_ASCII --whitelist=™

# shortcut to add in a whitelist of all Latin characters (with an optional whitelist)
> glyphhanger https://google.com --LATIN --whitelist=™
```

#### Manual subsetting
```
> glyphhanger --whitelist=ABCD --subset=*.ttf
```

#### Converting unicode ranges and back again

```
# Convert a string to a unicode-range
> glyphhanger --whitelist=ABCD
> glyphhanger --US_ASCII
> glyphhanger --US_ASCII --whitelist=ABCD

# Convert a unicode-range to a string
> glyphhanger --whitelist=U+41-44 --string
```

### Use the spider to gather URLs from links

Finds all the `<a href>` elements on the page with *local* (not external) links and adds those to the glyphhanger URLs. If you specify `--spider-limit`, `--spider` is assumed.

```
> glyphhanger ./test.html --spider
> glyphhanger ./test.html --spider-limit
> glyphhanger ./test.html --spider-limit=10

# No limit
> glyphhanger ./test.html --spider-limit=0
```

Default `--spider-limit` is 10. Set to `0` for no limit. This will greatly affect how long the task takes.

### Installing `pyftsubset`

See [https://github.com/fonttools/fonttools](https://github.com/fonttools/fonttools).

```
pip install fonttools

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


## Testing

GlyphHanger uses Mocha for testing.

`npm test` will run the tests.

Or, alternatively:

`./node_modules/mocha/bin/mocha` (or just `mocha` if you already have it installed globally with `npm install -g mocha`).

## Limitations

* [Pseudo-element CSS `content` is not parsed.](https://github.com/filamentgroup/glyphhanger/issues/10)

## Example using Unicode code points

```
> glyphhanger https://www.zachleat.com/web/ --spider --spider-limit=5 > glyphhanger_zachleat_output

> cat glyphhanger_zachleat_output
 U+20,U+21,U+23,U+24,U+26,U+28,U+29,U+2B-3A,U+3F-5B,U+5D,U+61-7A,U+BB,U+2013,U+2014,U+2019,U+201C,U+201D,U+2192,U+2600,U+2605,U+27A1,U+FE0F,U+1F525

> pyftsubset sourcesanspro-regular.ttf --unicodes-file=glyphhanger_zachleat_output --flavor=woff
# Reduces the 166KB .ttf font file to an 8KB .woff web font file.
``` 

You can use `--string` to use String values instead, but first _(read [Issue #4](https://github.com/filamentgroup/glyphhanger/issues/4)  on why Unicode code points are better)_
