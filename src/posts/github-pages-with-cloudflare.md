---
layout: posts.njk
title: Enforcing HTTPS on GitHub pages with Cloudflare
tags: programming,dns,cloudflare,github
draft: false
---

# Enforcing HTTPS on GitHub pages with Cloudflare

When setting up GitHub pages, you have the option to enforce HTTPS when you're using a custom domain,
which is great, however, when you're using Cloudflare as your DNS provider you might find the option to enable
HTTPS greyed out, and GitHub presents you with this error:

> Unavailable for your site because your domain is not properly configured to support HTTPS

This is usually because Cloudflare proxy is enabled (orange cloud icon), and GitHub
sees that there's already a certificate in place, so it can't issue one itself.

The solution is to disable the proxy for the domain or subdomain in Cloudflare:

![Cloudflare proxy settings in the off state](/assets/images/posts/github-pages-with-cloudflare/cf-proxy-off.png)

Once this is done, return to the GitHub pages settings, and remove and then re-add the custom domain. You should now be able to enable HTTPS:

![GitHub pages HTTPS settings enabled](/assets/images/posts/github-pages-with-cloudflare/enforce-https.png)

Once this is done, you can re-enable the proxy in Cloudflare, and you're good to go.
