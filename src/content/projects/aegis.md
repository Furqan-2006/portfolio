---
title: Aegis
pitch: A lightweight Linux EDR-lite that watches processes, network connections, file integrity and privilege changes, and raises alerts through a rules engine.
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

Host-based detection tools are usually presented as a single black box. Aegis was built as two cooperating programs with a hard interface between them, so each half can be reasoned about and tested on its own: a C daemon that senses what the host is doing, and a Python engine that decides whether it matters.

## Design

The sensing daemon, `aegisd`, runs as a proper daemon: a double fork with `setsid`, a PID file held with `flock()` so a second instance refuses to start, and signal handling through a `volatile sig_atomic_t` flag for clean shutdown. It polls the host every 200 ms and watches four things: process spawn and exit, TCP connections read from `/proc/net/tcp`, changes to a small set of sensitive files (`/etc/passwd`, `/etc/shadow` and the SSH daemon's config) detected with SHA-256 hashes, and UID/EUID transitions.

Events are a tagged union in C and are written as newline-delimited JSON to a log and over a Unix domain socket. The JSON schema is locked and is the only contract between the two halves. The policy engine reads the stream and applies detection rules, starting with stateless ones, such as an alert when a sensitive file changes, and moving to rules that use process lineage. eBPF and kernel modules were ruled out of scope on purpose. `/proc` polling was enough to demonstrate the design and keeps the daemon easy to audit.

## Evidence

The two halves run together end to end: events from the daemon reach the policy engine over the socket and alerts fire in real time, launched by one supervisor script. The interface contract earned its keep during integration. Checking the policy engine's behaviour against the schema turned up three bugs, a missing `bytes_sent` field, inverted logic in a user check, and a misspelled name in the privilege check, all of which were patched. The daemon grew out of an earlier standalone monitor, SAM, listed separately on this site.

## Limits and next steps

Several limits are known and recorded rather than hidden. Process exit codes are always reported as -1, the setuid flag is always false, and the source fields of a file-modified event are zeroed. Network monitoring covers IPv4 TCP only. Because the daemon polls, a process that lives for less than the poll interval can be missed, which is the trade-off of avoiding eBPF. Matching sockets to the processes that own them is deferred.
