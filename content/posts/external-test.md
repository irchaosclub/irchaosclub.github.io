---
title: "External test"
date: 2025-10-12T09:05:43Z
authors: ["grepStrength"]
tags: ["dfir","memory", "bleh", "bleh2", "bleh3"]
description: "Subtle memory artifacts that kick off useful DFIR pivots."
query: 'process.name: "lsass.exe" AND (event.code: 10 OR event.code: 4688)'
timerange: "2025-10-10..2025-10-12"
external: "https://example.com/blog/shadow-copies-collisions"
---
