---
title: Nexus
pitch: A persistent, round, Earth-like world where human avatars and learning AI agents coexist, and every change must pass a rule-enforcing core.
status: in-progress
featured: true
order: 2
tags: [systems, determinism, security, research]
stack: [C++20, Go, Python]
context: Long-term personal research and engineering project
role: Architecture, formal specification and core implementation
period: { start: 2026-11 }
metrics:
  - { value: "344", label: Automated tests passing, note: "Release build, run on a clean machine; C++ only" }
  - { value: "15 / 30", label: Work packages done, note: Of the prototype development plan }
  - { value: "≈20k", label: Lines of C++, note: "About 11k of core and runtime, about 9k of tests" }
  - { value: "25", label: Architecture decision records, note: Design decisions written and reviewed before coding }
links:
  repoVisibility: private
updated: 2026-11-27
---

## Problem

A shared world that human players and learning agents both act in has a consistency problem. If anyone can change state directly, the world can be broken by a bug, a cheat or an agent exploiting a loophole, and a run can never be reproduced for research. Nexus starts from a different rule: nobody mutates the world. Every participant submits a proposal, and a rule-enforcing core decides whether the resulting state is valid before it is committed. Two goals follow from that: entertainment, and a replayable environment for training and studying agents.

## Design

This is an overview. The architecture, specification and decision records are private, because Nexus is the basis of a product I intend to build, and I am glad to walk through them in an interview.

The shape is simple to state. One deterministic core, written once in C++20 with no throwaway prototype, is the only thing that can change the world. A network gateway and an agent SDK sit around it. The system is designed so that any run can be reproduced exactly, which is what makes it usable both as a game world and as a controlled environment for studying agents.

## Evidence

The design was written and reviewed before it was committed to code: a formal specification, 25 architecture decision records, a threat model and a development plan of 30 work packages. The implementation follows that plan one work package per pull request, and CI builds and tests each one.

I built the core in a release configuration on a clean machine and ran the whole suite: 344 C++ tests, all passing, including a 100,000-tick run that checks the world's total value changes only through declared flows (68 seconds). In an unoptimised debug build that one test takes over nine minutes, so the debug configuration is slow for it. Components with a byte format or a hash are cross-checked against an independent Python implementation, so the C++ is not only tested against itself, and a linter rejects code that could break determinism.

A benchmark runs 3,000 ticks of a world with 27 agents through the real enforcement pipeline, with the log synced to disk on every tick. It reaches about 800 ticks per second, with a 99.9th percentile of about 4.8 ms against a 100 ms deadline and no overruns. The rules in that benchmark are stand-ins, so it is a floor for the real cost of a tick, not a forecast.

Most of the implementation was done in pull requests with Claude as a co-author, and the commits say so.

## Limits and next steps

Nexus is not yet a running world. It has a deterministic core with a tested tick loop, but no network gateway, no agent runtime and no viewer yet. Fifteen of the 30 work packages are marked done, and the rest are still ahead. I could not run the Go tests here because the repository does not commit its `go.sum` file. The source is private.
