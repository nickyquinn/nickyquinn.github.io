const pluginRss = require("@11ty/eleventy-plugin-rss")
const pluginDate = require("eleventy-plugin-date")
const markdownIt = require('markdown-it')
const markdownItLinkAttr = require('markdown-it-link-attributes')
const markdownItAnchor = require('markdown-it-anchor')
const sass = require("sass");
const path = require("node:path");
const Image = require('@11ty/eleventy-img');
const outdent = require('outdent');

const imageShortcode = async (
    src,
    alt,
    className = undefined,
    widths = [400, 800, 1280],
    formats = ['webp', 'jpeg'],
    sizes = '100vw'
) => {
    console.log("SRC", src)
    const imageMetadata = await Image(src, {
        widths: [...widths, null],
        formats: [...formats, null],
        outputDir: 'docs/assets/images',
        urlPath: '/assets/images',
    });

    const sourceHtmlString = Object.values(imageMetadata)
        // Map each format to the source HTML markup
        .map((images) => {
            // The first entry is representative of all the others
            // since they each have the same shape
            const { sourceType } = images[0];

            // Use our util from earlier to make our lives easier
            const sourceAttributes = stringifyAttributes({
                type: sourceType,
                // srcset needs to be a comma-separated attribute
                srcset: images.map((image) => image.srcset).join(', '),
                sizes,
            });

            // Return one <source> per format
            return `<source ${sourceAttributes}>`;
        })
        .join('\n');

    const getLargestImage = (format) => {
        const images = imageMetadata[format];
        return images[images.length - 1];
    }

    const largestUnoptimizedImg = getLargestImage(formats[0]);
    const imgAttributes = stringifyAttributes({
        src: largestUnoptimizedImg.url,
        width: largestUnoptimizedImg.width,
        height: largestUnoptimizedImg.height,
        alt,
        loading: 'lazy',
        decoding: 'async',
    });
    const imgHtmlString = `<img ${imgAttributes}>`;

    const pictureAttributes = stringifyAttributes({
        class: className,
    });
    const picture = `<picture ${pictureAttributes}>
      ${sourceHtmlString}
      ${imgHtmlString}
    </picture>`;

    return outdent`${picture}`;
};

/** Maps a config of attribute-value pairs to an HTML string
 * representing those same attribute-value pairs.
 */
const stringifyAttributes = (attributeMap) => {
    return Object.entries(attributeMap)
        .map(([attribute, value]) => {
            if (typeof value === 'undefined') return '';
            return `${attribute}="${value}"`;
        })
        .join(' ');
};

module.exports = function (eleventyConfig) {
    eleventyConfig.addTemplateFormats("scss");
    eleventyConfig.addPassthroughCopy("./src/assets/style/")
    eleventyConfig.addPassthroughCopy("./src/assets/")
    eleventyConfig.addWatchTarget("./src/assets/style/")
    eleventyConfig.addPlugin(pluginRss)
    eleventyConfig.addLiquidFilter("dateToRfc3339", pluginRss.dateToRfc3339)
    eleventyConfig.addLiquidFilter("dateToRfc822", pluginRss.dateToRfc822)
    eleventyConfig.addPlugin(pluginDate, {
        formats: {
            readableNums: { year: "numeric", month: "numeric", day: "numeric" },
            readableDate: { year: "numeric", month: "short", day: "numeric" },
            readableMonth: { year: "numeric", month: "short" }
        }
    })
    // Don't show drafts in post list 
    eleventyConfig.addCollection("posts", collection => {
        return [...collection.getFilteredByGlob("./src/posts/*.md")]
            .filter(p => !p.data.draft).reverse()
    })

    eleventyConfig.addCollection("likedMovies", function (collectionApi) {
        return collectionApi.getFilteredByTags("movie", "film");
    });

    eleventyConfig.addCollection("likedWebsites", function (collectionApi) {
        return collectionApi.getFilteredByTags("website", "blog", "article");
    });

    eleventyConfig.setLibrary(
        'md',
        markdownIt({ html: true })
            // TODO don't use HTML headers, only md
            // https://github.com/valeriangalliat/markdown-it-anchor
            // .use(markdownItAnchor, {
            //   permalink: true
            // })
            .use(markdownItLinkAttr, {
                // Make external links open in a new tab.
                // https://github.com/crookedneighbor/markdown-it-link-attributes  
                // pattern: /^https?:\/\//,
                matcher(href, config) {
                    return href.startsWith("https:");
                },
                attrs: {
                    class: 'external-link',
                    target: '_blank',
                    rel: 'noopener noreferrer',
                },
            })
    )

    // Process scss files
    eleventyConfig.addExtension("scss", {
        outputFileExtension: "css", // optional, default: "html"

        // `compile` is called once per .scss file in the input directory
        compile: async function (inputContent, inputPath) {
            let parsed = path.parse(inputPath);
            if (parsed.name.startsWith("_")) {
                return;
            }

            let result = sass.compileString(inputContent, {
                loadPaths: [
                    parsed.dir || ".",
                    this.config.dir.includes
                ]
            });

            // This is the render function, `data` is the full data cascade
            return async (data) => {
                return result.css;
            };
        }
    });

    eleventyConfig.addShortcode('image', imageShortcode);

    return {
        dir: {
            input: "src",
            output: "docs"
        }
    }
}