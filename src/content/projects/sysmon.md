---
title: SysMon API
pitch: A REST API for CPU, memory, disk and process stats on Linux. A C library reads /proc, Flask calls it, and JWT protects the endpoints.
status: running
order: 11
tags: [linux, systems, api]
stack: [C, Python, Flask, ctypes, SQLAlchemy, SQLite, JWT]
context: Personal project
role: Sole author
period: { start: 2026-05, end: 2026-05 }
metrics:
  - { value: "16", label: REST endpoints, note: "4 auth, 8 metrics, 4 config upload" }
  - { value: "≈900", label: Lines of Python and C }
links:
  repo: https://github.com/Furqan-2006/sysmon
  repoVisibility: public
updated: 2026-11-26
---

## Problem

Most monitoring examples run shell commands and parse the text they print. I wanted to see what it takes to serve real kernel statistics over a web API without that step.

## Design

The metrics engine is a small C library built as a shared object. It reads `/proc/stat`, `/proc/meminfo` and `statvfs` directly. Flask loads it with `ctypes`, so a request calls straight into C, with no subprocess and no output parsing. The API is behind JWT authentication. Snapshots are stored in SQLite through SQLAlchemy so history can be queried by time. Users can also upload config files in a few formats, and each user only sees their own.

## Evidence

The README documents the whole API: register, login, logout and profile; live CPU, memory, disk, process count and uptime; a snapshot endpoint that also saves to the database; and history queries with a limit and a start time. The CPU reading uses a 100 ms sample taken in C.

## Limits and next steps

There are no automated tests yet. It only covers Linux on a single host. I committed the built shared object to the repo, which is wrong, and the build should generate it. I also designed the API to be the host-telemetry part of a bigger network monitoring idea.
