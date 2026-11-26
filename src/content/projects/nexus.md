---
title: Nexus
pitch: A persistent, round, Earth-like world where human avatars and learning AI agents coexist, and every change must pass a rule-enforcing core.
status: in-progress
featured: true
order: 2
tags: [systems, determinism, security, research]
stack: [C++20, Go, Python, Protobuf, BLAKE3, CMake, vcpkg]
context: Long-term personal research and engineering project
role: Architecture, formal specification and core implementation
period: { start: 2026-11 }
metrics:
  - { value: "344", label: Automated tests passing, note: "Release build, run on a clean machine; C++ only" }
  - { value: "15 / 30", label: Work packages done, note: "State, event log, scheduler, truth engine, ecology merged" }
  - { value: "≈20k", label: Lines of C++, note: "About 11k of core and runtime, about 9k of tests" }
  - { value: "25", label: Architecture decision records, note: All accepted for the prototype }
links:
  repoVisibility: private
updated: 2026-11-27
---

## Problem

A shared world that human players and learning agents both act in has a consistency problem. If anyone can change state directly, the world can be broken by a bug, a cheat or an agent exploiting a loophole, and a run can never be reproduced for research. Nexus starts from a different rule: nobody mutates the world. Every participant submits a proposal, and a Rule-Keeper decides whether the resulting state is valid before it is committed. Two goals follow from that: entertainment, and a replayable environment for training and studying agents.

## Design

The enforcement path is built from separate parts, each with one job: a truth model that defines what a valid state is, watchers that observe, a logic layer that evaluates a proposed transition, a guardian that enforces the result, and a resolver that keeps the world from stalling. Humans are the only non-AI entities; every creature, pet and NPC is an agent with finite memory.

The core is written once, in C++20, with no throwaway prototype. A Go gateway handles the network edge, and a Python SDK is the agent runtime. Protobuf is the wire format, while a separate canonical encoding is used for hashing, so a state hash never depends on serialization details. Validation is sequential in a fixed tick order with no merging, and a tick is durable at its end. Replay re-applies logged deltas as the authority, and re-simulation is a separate audit. Determinism is specified in levels, starting with a prototype level that is weaker and tightening later. The world is addressed on a cubed sphere from the start, and the first prototype is a single 64×64-cell block with a central park and twelve houses.

## Evidence

The design was written down and reviewed before it was committed to code: a formal world specification with 13 properties and 23 explicit assumptions, 25 architecture decision records, a threat model, a core design document and a development plan of 30 work packages.

The implementation follows that plan one work package per pull request, and CI builds and tests each one. As of 26 November 2026 the core has the cubed-sphere topology, a strict content format with an immutable hashed registry, world state with all-or-nothing apply, a sparse Merkle state root, a hash-chained event log with recovery, a tick scheduler, the Truth Model engine with its Logos, Guardian and Resolver stages, watchers and views, rule-driven physics and clocks, actions and capabilities, and a first ecology. Where a component has a byte format or a hash, it is cross-checked against an independent Python implementation, so the C++ is not only tested against itself. A linter rejects code that could break determinism.

I built the core in a release configuration on a clean machine and ran the whole suite: 344 C++ tests, all passing, including a 100,000-tick run that checks the world's total value changes only through declared flows (68 s). The same run in an unoptimised debug build takes over nine minutes, so the debug preset is slow for that test. The tick benchmark ran 3,000 ticks of a Block-01-sized world (27 agents) through the real enforcement pipeline with the log synced to disk on every tick: about 800 ticks per second, a 99.9th percentile of about 4.8 ms against the 100 ms deadline, and no overruns. The rules in that benchmark are stand-ins, so it is a floor for the real cost of a tick, not a forecast. The repository's performance baseline records the method.

Most of the implementation was done in pull requests with Claude as a co-author, and the commits say so.

## Limits and next steps

Nexus is not yet a running world. There is a deterministic core with a tested tick loop, but no network gateway, no agent runtime and no viewer: the Go gateway is a stub and the Python side is a skeleton. Fifteen of the 30 work packages are marked done, with ecology merged since; the rest, including the daemon, replay tooling, the SDK and the graphics, are still ahead. Several areas are deliberately undesigned: how agent learning is evaluated, the protocol between regions, and the format of the strictest determinism level. Magic, a planned gameplay mechanic, comes only after the prototype's first stages. I could not run the Go tests here because the repository does not commit its `go.sum` file. The source is private for now.
