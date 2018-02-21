# Subset yourself manually with `pyftsubset`

As of GlyphHanger 1.0.5, this can be done automatically with the `--subset` option. For posterity, this method will still work. Don’t use DEBUG mode, we want to save the output to a file.

```
> glyphhanger ./test.html > glyphhanger_output
> pyftsubset FONTFILENAME.ttf --unicodes-file=glyphhanger_output --flavor=woff

# install py-zopfli (see below) to use --with-zopfli for additional woff byte savings (ignored for woff2)
> pyftsubset FONTFILENAME.ttf --unicodes-file=glyphhanger_output --flavor=woff --with-zopfli

# or output WOFF2 (see additional installation instructions below)
> pyftsubset FONTFILENAME.ttf --unicodes-file=glyphhanger_output --flavor=woff2

# for old Android compatibility, leave off `--flavor` to output a subset TTF 
> glyphhanger ./test.html > glyphhanger_output
> pyftsubset FONTFILENAME.ttf --unicodes-file=glyphhanger_output

# Remove temporary file
> rm glyphhanger_output
```