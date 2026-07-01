---
layout: posts.njk
title: Everyone should use a Pi-hole
tags: dns,home
draft: false
date: 2026-06-30
description: "Why Pi-hole is a must-have when browsing the internet today"
---

# Everyone should use a Pi-hole

A family member showed me a news article on their phone this week from a well-known news site. Watching him load the article left me incensed: first he had to deal with a video popup, then a huge advert took up most of the page on his screen, overlapping the article title, then as he scrolled down the article other adverts appeared; two-thirds of the page was adverts in the end, many looked like news articles, or were clickbait titles.

I'd forgotten that the modern version of the Internet looked like this.

## What is Pi-hole?

Pi-hole is a piece of software which blocks adverts and trackers for every device on your home network, all at once, without having to install things on every device; no browser extensions, no per-device set up, just instant blocking of ads and trackers everywhere in your home as soon as you set it up.

## The difference a Pi-hole makes

I returned to the same article I saw on my family member's device on my home PC with Pi-hole off, then I reloaded the page, skipping the cache, with Pi-hole on. The results were as follows:

|           | Pi-hole off | Pi-hole on |
|-----------|-------------|------------|
| Bandwidth | 9.7 MB      | 4.6 MB     |
| Requests  | 495         | 256        |

## Installing Pi-hole

Installation is easy... as long as you're technically capable and have the hardware. As the name suggests, Pi-hole is designed to run on a Raspberry Pi, and if you've got one already, the [Pi-hole website](https://pi-hole.net/) has step-by-step instructions for installing and configuring it.

But here's where this falls down in my opinion: there's no off-the-shelf appliance that would let anyone set this up: you can buy kits online, like this [Pi-hole kit at the Pi Hut](https://thepihut.com/products/official-pi-hole-raspberry-pi-4-kit), but you still need to follow instructions to get it up and running, and enough understanding of how your home router works to configure it to work... then there's a danger that if it stops working, you might be without internet, and not know how to fix it because ... well you have no internet.

## What if you're not technical?

All is not lost if you haven't got the means or technical ability to get your own Pi-hole though. You don't need a Raspberry Pi or router know-how to get _most_ of the benefit. A few simpler alternatives exist:

- **Install a browser ad blocker** like [uBlock Origin](https://ublockorigin.com/) on each device. Less convenient than a network-wide fix since you have to set it up on each browser and on each device, but it's a simple one-click install and needs no networking knowledge at all.

- **Switch your DNS to a free ad-blocking DNS service**, like [NextDNS](https://nextdns.io/)<sup id="fnref-nextdns"><a href="#fn-nextdns">1</a></sup> or [AdGuard DNS](https://adguard-dns.io/). No hardware required, and no installation: you do need to change a setting on your router (or even just your phone/laptop if you only care about one device) to point at their DNS servers instead of your ISP's, and ads and trackers get blocked network-wide or device-wide. Five minutes, no ongoing maintenance.

- **Buy a router with ad-blocking built in.** Some consumer routers such as Firewalla or Eero (with Eero Plus) come with ad and tracker blocking as a toggle in their app, no separate device or DNS configuration required. There's a cost involved here, but it's the closest thing to a Pi-hole with zero setup.

None of these are quite as powerful or customisable as running your own Pi-hole, but they'll strip out the worst of what my family member saw on his phone, without needing to touch a router config page.

---

<ol class="footnotes">
<li id="fn-nextdns">As of June 2026, the NextDNS free plan is capped at 300,000 queries a month per account; beyond that you'll need to pay for one of their paid tiers. <a href="#fnref-nextdns">↩</a></li>
</ol>
