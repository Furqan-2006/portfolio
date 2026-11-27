---
title: Nexus
pitch: A persistent, round, Earth-like world where human avatars and learning AI agents live together, and a rule-enforcing core checks every change.
status: in-progress
featured: true
order: 2
tags: [systems, determinism, security, research]
stack: [C++20, Go, Python]
context: Long-term personal research and engineering project
role: Architecture, specification and core implementation
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

A shared world where players and learning agents both act has a consistency problem. If anyone can change the state directly, a bug, a cheat or an agent exploiting a loophole can break the world, and you can never reproduce a run for research. Nexus starts from a different rule: nobody changes the world directly. Everyone submits a proposal, and a rule-enforcing core decides whether the resulting state is valid before anything is committed. That gives two things I want: a game world, and an environment where runs can be replayed to train and study agents.

## Design

This is only an overview. The architecture, specification and decision records are private, because Nexus is the basis of a product I want to build. I'm happy to walk through them in an interview.

The shape is simple. One deterministic core, written once in C++20 with no throwaway prototype, is the only thing that can change the world. A network gateway and an agent SDK go around it. I'm designing it so any run can be reproduced exactly. That's what lets it work both as a game world and as a controlled place to study agents.

## Evidence

I wrote the design down and reviewed it before writing code: a formal specification, 25 architecture decision records, a threat model and a development plan with 30 work packages. The implementation follows that plan, one work package per pull request, and CI builds and tests each one.

I built the core in release mode on a clean machine and ran the whole suite. All 344 C++ tests pass, including a 100,000-tick run that checks the world's total value only changes through declared flows (68 seconds). In an unoptimised debug build that one test takes over nine minutes, so the debug build is slow for it. Where a component has a byte format or a hash, I cross-check it against a separate Python implementation, so the C++ isn't only tested against itself. A linter rejects code that could break determinism.

There's also a benchmark. It runs 3,000 ticks of a world with 27 agents through the real enforcement pipeline, with the log synced to disk on every tick. It reaches about 800 ticks per second. The 99.9th percentile is about 4.8 ms against a 100 ms deadline, with no overruns. The rules in that benchmark are stand-ins, so treat it as a lower bound on what a real tick will cost, not a prediction.

Most of the code was written with Claude as a co-author. It's in the commit history.

## Limits and next steps

Nexus isn't a running world yet. It has a deterministic core with a tested tick loop. It doesn't have a network gateway, an agent runtime or a viewer yet. Fifteen of the 30 work packages are marked done and the rest are still ahead. I couldn't run the Go tests here because the repo doesn't commit its `go.sum` file. The source is private.
