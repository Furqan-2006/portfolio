---
title: Nexus
pitch: A persistent, round, Earth-like world where human avatars and learning AI agents coexist, and every change must pass a rule-enforcing core.
status: design-complete
featured: true
order: 2
tags: [systems, determinism, security, research]
stack: [C++20, Go, Python, Protobuf, BLAKE3, CMake, vcpkg]
context: Long-term personal research and engineering project
role: Architecture, formal specification and core implementation
period: { start: 2026-11 }
metrics:
  - { value: "25", label: Architecture decision records, note: All accepted for the prototype }
  - { value: "13", label: Formal world properties, note: "P1 to P13 in the specification" }
  - { value: "30", label: Work packages, note: With a dependency graph and critical path }
links:
  repoVisibility: private
updated: 2026-11-26
---

## Problem

A shared world that human players and learning agents both act in has a consistency problem. If anyone can change state directly, the world can be broken by a bug, a cheat or an agent exploiting a loophole, and a run can never be reproduced for research. Nexus starts from a different rule: nobody mutates the world. Every participant submits a proposal, and a Rule-Keeper decides whether the resulting state is valid before it is committed. Two goals follow from that: entertainment, and a replayable environment for training and studying agents.

## Design

The enforcement path is built from separate parts, each with one job: a truth model that defines what a valid state is, watchers that observe, a logic layer that evaluates a proposed transition, a guardian that enforces the result, and a resolver that keeps the world from stalling. Humans are the only non-AI entities; every creature, pet and NPC is an agent with finite memory.

The core is written once, in C++20, with no throwaway prototype. A Go gateway handles the network edge, and a Python SDK is the agent runtime. Protobuf is the wire format, while a separate canonical encoding is used for hashing, so a state hash never depends on serialization details. Validation is sequential in a fixed tick order with no merging, and a tick is durable at its end. Replay re-applies logged deltas as the authority, and re-simulation is a separate audit. Determinism is specified in levels, starting with a prototype level that is weaker and tightening later. The world is addressed on a cubed sphere from the start, and the first prototype is a single 64×64-cell block with a central park and twelve houses.

## Evidence

The design is written down and was reviewed before being committed to code: a formal world specification with 13 properties and 23 explicit assumptions, 25 architecture decision records, a threat model, a core design document, and a development plan of 30 work packages. The specification phase for the core (WP-04) was completed on 25 November 2026.

Implementation has started and is held to the same discipline as the design. The repository has determinism, state, topology and content modules with their tests, generators for test vectors, a linter that checks code for determinism hazards, and a single check script that builds and tests under debug, address, undefined-behaviour and thread sanitizer presets.

## Limits and next steps

Nothing about Nexus is running as a world yet; the next packages are the repository and CI setup and the determinism library. Several areas are deliberately undesigned: the evaluation of what agents learn, the protocol between regions, and the format of the strictest determinism level. Magic, a planned gameplay mechanic, comes only after the prototype's first stages. The source is private for now.
