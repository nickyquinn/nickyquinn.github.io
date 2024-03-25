const pluginRss = require("@11ty/eleventy-plugin-rss")
const pluginDate = require("eleventy-plugin-date")
const markdownIt = require('markdown-it')
const markdownItLinkAttr = require('markdown-it-link-attributes')
const markdownItAnchor = require('markdown-it-anchor')
const sass = require("sass");
const path = require("node:path");
const Image = require('@11ty/eleventy-img');
const outdent = require('outdent');
const { createHash } = require('node:crypto');

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

function getHash(content, length = 8) {
    return createHash('md5')
        .update(content)
        .digest('hex')
        .substr(0, length);
}

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
    // Copy `img/favicon/` to `docs/`
    eleventyConfig.addPassthroughCopy({ "./src/favicon": "/" });
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

    // Process scss files - thanks to https://danburzo.ro/eleventy-sass/
    eleventyConfig.addExtension('scss', {
        // We're feeding the `inputPath` to Sass directly, so we don't need Eleventy to read the content of `.scss` files.
        read: false,

        // Produce the data for each `.scss` file, including its processed CSS content and its MD5 content hash.
        getData: async function (inputPath) {
            // Don't process .scss files that start with an underscore as standalone.
            if (path.basename(inputPath).startsWith('_')) {
                return false;
            }
            const { css } = sass.compile(inputPath);
            return {
                // Exclude .scss files from `collections.all` so they don't show up in sitemaps, RSS feeds, etc.
                eleventyExcludeFromCollections: true,
                _content: css,
                _hash: getHash(css)
            };
        },
        compileOptions: {
            // Disable caching of `.scss` files, for good measure.
            cache: false,
            permalink: function (permalink, inputPath) {
                // Don't output .scss files that start with an underscore, as per Sass conventions…
                if (path.basename(inputPath).startsWith('_')) {
                    return false;
                }

                // …and for other .scss files include the MD5 content hash produced in the `.getData()` method in the output file path.
                return data => `${data.page.filePathStem}.${data._hash}.css`;
            }
        },
        // Read the processed CSS content from the data object produced with `.getData()`.
        compile: () => data => {
            console.log("CSS>DATA", data)
            data._content
        }
    });

    // Create a map of all output files; used as part of the hashed filenames
    // retrieval in CSS.
    const outputMap = {};
    eleventyConfig.addTransform('outputMap', function (content) {
        const filepath = path.relative('src', this.page.inputPath);
        outputMap[filepath] = this.page.url;
        return content;
    });

    // Add a filter to retrieve the hashed filenames in CSS.
    eleventyConfig.addFilter('hashed', function (filepath) {
        if (!outputMap[filepath]) {
            throw new Error(`hashed: ${filepath} not found in map.`);
        }
        return outputMap[filepath];
    });

    eleventyConfig.addShortcode('image', imageShortcode);

    return {
        dir: {
            input: "src",
            output: "docs"
        }
    }
}