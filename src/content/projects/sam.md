---
title: SAM, System Activity Monitor
pitch: A small C tool that watches Linux processes and TCP connections by diffing /proc snapshots, and logs what changed as JSON.
status: running
order: 10
tags: [security, linux, systems]
stack: [C, cJSON, /proc]
context: Personal project and the basis of Aegis's sensing layer
role: Sole author
period: { start: 2026-06 }
metrics:
  - { value: "≈700", label: Lines of C }
links:
  repo: https://github.com/Furqan-2006/SAM
  repoVisibility: public
updated: 2026-11-26
---

## Problem

Before building a monitoring daemon, the question was how much of a system's behaviour can be seen from `/proc` alone, without kernel hooks, and how cheaply.

## Design

SAM works in layers. The first layer scans `/proc/<pid>/status` and `cmdline` for every process and diffs successive snapshots to find processes that started or exited. The second reads `/proc/net/tcp` and keys connections by socket inode so that new and closed connections are detected by diffing, not by counting. The third writes every change as structured JSON through cJSON. The fourth looks for anomalies in `/etc/passwd` by inspecting the `/proc/<pid>/fd` symlinks of running processes.

## Evidence

The tool runs as described, and its structure was reused as the starting point for Aegis's sensing layer, where it was refactored into a daemon with a locked event schema. No benchmarks were recorded for SAM itself.

## Limits and next steps

IPv6 and UDP are not covered, and connections are not matched back to the processes that own them. These were deferred and carried into Aegis as stated limits. SAM is kept as the small, readable version of the idea.
