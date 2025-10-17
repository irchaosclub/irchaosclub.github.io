---
title: "Memory hints that hide in plain sight"
date: 2025-10-12T09:05:43Z
authors: ["grepStrength"]
tags: ["dfir","memory"]
description: "Subtle memory artifacts that kick off useful DFIR pivots."
# query: 'process.name: "lsass.exe" AND (event.code: 10 OR event.code: 4688)'
# timerange: "2025-10-10..2025-10-12"
---

Quick note‑dump on small memory signals that tend to kick off the right triage: orphaned threads, psxview inconsistencies, and quiet handles that show up in all the wrong places.

## Environment

Volatility 3; Windows 11 dump from a live triage; timestamps are UTC unless you toggle local time.

## Orphaned / weird threads

```bash
vol.py -f mem.vmem windows.threads --pid 500 --dump
vol.py -f mem.vmem windows.pslist --threads --collisions
```
Look for threads that belong to a process with no obvious image on disk, or stacks that don’t line up with loaded modules.

```bash
vol.py -f mem.vmem windows.psxview | grep False
vol.py -f mem.vmem windows.dlllist --pid 500 | grep -i "unknown"
```
If multiple scanners disagree about visibility, take the hint. It’s not a conviction—just a good place to spend five minutes.

Mini timeline
```kusto
let start= datetime(2025-10-10 18:00:00);
let stop = datetime(2025-10-10 19:00:00);
Security
| where TimeGenerated between (start .. stop)
| where EventID in (4688, 10)
| project TimeGenerated, EventID, Account, Process, CommandLine
```
Notes
Tools lie. Your job is to triangulate quickly and move on confidently.