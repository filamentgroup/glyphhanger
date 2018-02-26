const parsePath = require("parse-filepath");

class GlyphHangerFontFace {
	constructor() {
		this.cssOutput = false;
	}

	setUnicodeRange(range) {
		this.unicodeRange = range;
	}

	setSubset(glyphhangerSubset) {
		this.subset = glyphhangerSubset;
	}

	setCSSOutput(cssOutput) {
		this.cssOutput = cssOutput;
	}

	setFamilies( families ) {
		if( families && typeof families === "string" ) {
			let split = families.split(",").map(family => family.trim());
			if( split.length ) {
				this.family = split[0];
			}
		}

		this.families = families;
	}

	getSrcDescriptor( ttfPath, dir ) {
		var srcs = this.subset.getSrcsObject(ttfPath, dir);

		var src = [];
		if( srcs.woff2 ) {
			src.push(`url(${srcs.woff2}) format("woff2")`);
		}
		if( srcs.woff ) {
			src.push(`url(${srcs.woff}) format("woff")`);
		}
		if( srcs.truetype ) {
			src.push(`url(${srcs.truetype}) format("truetype")`);
		}

		return src.join(", ");
	}

	toString(ttfPath) {
		let family = this.family;
		let content = [];

		if(family) {
			content.push(`  font-family: ${family};`);
		}
		if(ttfPath && this.subset) {
			content.push(`  src: ${this.getSrcDescriptor(ttfPath, parsePath(ttfPath).dir)};`);
		}

		content.push(`  unicode-range: ${this.unicodeRange};`);

		return `
@font-face {
${content.join("\n")}
}`;
	}

	output() {
		if( !this.cssOutput ) {
			return;
		}

		if( this.subset ) {
			let paths = this.subset.getPaths();
			for( let path of paths ) {
				console.log(this.toString(path));
			}
		} else {
			console.log(this.toString());
		}
	}
}

module.exports = GlyphHangerFontFace;