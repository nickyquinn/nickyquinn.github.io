const pluginRss = require("@11ty/eleventy-plugin-rss")
const pluginDate = require("eleventy-plugin-date")
const markdownIt = require('markdown-it')
const markdownItLinkAttr = require('markdown-it-link-attributes')
const markdownItAnchor = require('markdown-it-anchor')
const sass = require("sass");
const path = require("node:path");

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

    return {
        dir: {
            input: "src",
            output: "docs"
        }
    }
}