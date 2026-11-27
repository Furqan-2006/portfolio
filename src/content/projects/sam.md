---
title: SAM, System Activity Monitor
pitch: A small C tool that diffs /proc snapshots to see which Linux processes and TCP connections appeared or went away, and logs the changes as JSON.
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

Before building a monitoring daemon I wanted to know how much of what a Linux system is doing I could see from `/proc` alone, with no kernel hooks, and how cheaply.

## Design

SAM is built in four layers. The first scans `/proc/<pid>/status` and `cmdline` for every process and diffs each snapshot against the last one, to find processes that started or exited. The second reads `/proc/net/tcp` and keys connections by socket inode, so a new or closed connection shows up in the diff and I don't have to count anything. The third writes every change out as JSON with cJSON. The fourth checks for odd things around `/etc/passwd` by looking at the `/proc/<pid>/fd` symlinks of running processes.

## Evidence

It runs and does what I describe here. I reused its structure as the starting point for the sensing layer in Aegis, where I turned it into a daemon with a fixed event schema. I never recorded benchmarks for SAM.

## Limits and next steps

It doesn't cover IPv6 or UDP, and it can't tell which process owns a connection. I left those out and they carried over into Aegis as known limits. I keep SAM around as the small, readable version of the idea.
