---
title: Aegis
pitch: A small Linux EDR. A C daemon watches processes, network connections, key files and privilege changes, and a rules engine raises alerts.
status: running
featured: true
order: 3
tags: [security, linux, systems]
stack: [C, Python, OpenSSL, Unix domain sockets, JSON Schema]
context: University project, two-person team
role: The sensing layer in C (daemon, monitors, event emitter, schema) and a schema compliance review of the policy engine
team:
  - { name: Faizan, part: Python policy engine and detection rules }
period: { start: 2026-08 }
metrics:
  - { value: "4", label: Event sources, note: "process, TCP connection, file integrity, privilege change" }
  - { value: "≈1.5k", label: Lines of C in the sensing layer }
  - { value: "3", label: Bugs found and patched in the policy engine, note: Found by checking its output against the locked schema }
links:
  repo: https://github.com/Furqan-2006/Aegis
  repoVisibility: public
updated: 2026-11-26
---

## Problem

Host-based detection tools usually look like one black box. We built Aegis as two programs with a hard interface between them, so each half can be tested and reasoned about alone. A C daemon senses what the host is doing. A Python engine decides whether it matters.

## Design

The sensing daemon, `aegisd`, runs as a proper daemon. It double-forks and calls `setsid`, holds a PID file with `flock()` so a second copy refuses to start, and shuts down cleanly through a `volatile sig_atomic_t` flag set by the signal handler. It polls every 200 ms and watches four things: processes starting and exiting, TCP connections from `/proc/net/tcp`, changes to a few sensitive files (`/etc/passwd`, `/etc/shadow` and the SSH daemon config) checked with SHA-256 hashes, and UID/EUID changes.

Events are a tagged union in C. They go out as newline-delimited JSON, to a log and over a Unix domain socket. The JSON schema is fixed, and it is the only contract between the two halves. The policy engine reads the stream and applies detection rules. It starts with simple ones, like alerting when a sensitive file changes, and moves on to rules that use process lineage. We left eBPF and kernel modules out on purpose. Polling `/proc` was enough to show the design and keeps the daemon easy to audit.

## Evidence

The two halves run together end to end. Events from the daemon reach the policy engine over the socket, alerts fire in real time, and one supervisor script starts everything. The fixed schema paid off during integration. When I checked the policy engine against it, I found three bugs: a missing `bytes_sent` field, a user check with the logic backwards, and a misspelled name in the privilege check. All three are fixed. The daemon grew out of an earlier standalone monitor, SAM, which is listed separately on this site.

## Limits and next steps

These limits are known and written down. Exit codes are always reported as -1, the setuid flag is always false, and the source fields on a file-modified event are zeroed. Network monitoring only covers IPv4 TCP. Since the daemon polls, a process that lives for less than the poll interval can be missed. That's the price of not using eBPF. Matching sockets to the processes that own them is postponed.
