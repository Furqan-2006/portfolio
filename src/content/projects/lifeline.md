---
title: Lifeline
pitch: A peer-to-peer emergency network where phones relay text messages and SOS beacons to each other with no tower, SIM or internet.
status: measured
featured: true
order: 1
tags: [networking, distributed-systems, security]
stack: [Python, Mininet-WiFi, wmediumd, Ed25519, X25519, ChaCha20-Poly1305]
context: Course project, Computer Networks, FAST NUCES
role: Mininet-WiFi emulator characterization, neighbour discovery, the emulation scenario planner and runner, and co-design of the protocol contracts
team:
  - { name: Abdullah, part: ECIES crypto pipeline }
  - { name: Abu Bakar }
period: { start: 2026-11 }
metrics:
  - { value: "100 m", label: Handheld radio range in emulation, note: "99.5% of frames received up to 100 m, 0% from 110 m" }
  - { value: "520 m", label: Relay-node range (r90), note: Symmetric in both directions }
  - { value: "±0.2 pp", label: Loss-injection accuracy, note: "4.92% measured for 5% configured; 15.20% for 15%" }
  - { value: "30", label: Emulated stations pass, note: 6% CPU at 30 stations }
links:
  repo: https://github.com/Furqan-2006/Lifeline
  repoVisibility: public
demo:
  kind: replay
  status: planned
  note: A browser replay of a seeded emulation run, driven by the structured event log each node writes.
updated: 2026-11-26
---

## Problem

In a disaster the first thing to fail is usually the infrastructure people rely on to reach each other: towers lose power and backhaul is cut. Lifeline asks what communication is still possible with nothing but the devices people are already carrying. Users in radio range talk directly. Users out of range reach each other through whoever is in between, which acts as a router. The network carries two kinds of traffic, short text messages and SOS beacons with coordinates, and aims to cover at least a kilometre.

## Design

The forwarding protocol, called Relay, is deliberately simple: epidemic-style flooding with a TTL, duplicate suppression by message ID, per-neighbour rate limits and a per-sender replay window. Adaptive routing schemes were ruled out of scope so that the behaviour of flooding itself can be measured.

Delivery is end to end. A per-hop acknowledgement would only confirm that a frame was transmitted, so the sender keeps a text until the recipient's acknowledgement arrives and re-offers it on a timer. Relays do not take custody of messages, and when buffers fill, texts are dropped before SOS messages.

Every message is signed. A node's ID is a 128-bit hash of its Ed25519 public key, and each message carries an Ed25519 signature. Texts are encrypted with a one-shot ECIES-style scheme (ephemeral X25519, HKDF, ChaCha20-Poly1305). Keys are learned either from HELLO beacons, on a trust-on-first-use basis, or from a QR code, which counts as verified.

The code is built around four frozen contracts and a runtime in which a module never reads the wall clock or a global random source. Time, randomness and logging are injected, and every node writes the same structured event log. That makes a run reproducible from its seed, lets modules be tested against an in-memory network with no sockets, and gives the later emulation a single record to analyse.

## Evidence

Before building on the emulator, the team characterized it. The spike report covers ten areas and all pass. The findings that shaped the design:

| Question | Result |
| --- | --- |
| Is the loss shim accurate? | 0.00%, 4.92% and 15.20% measured for 0%, 5% and 15% configured |
| Are losses independent between receivers? | Joint-loss ratio 0.96 and 0.99 (1.0 means independent) |
| Where does handheld range end? | A hard step between 100 m and 110 m |
| What is a relay's reach? | r90 = 520 m, symmetric |
| Does it scale? | 5, 15, 20 and 30 stations pass, 6% CPU at 30 |
| Is it reproducible? | Three identical runs differ by 0.000; five start/stop cycles leak nothing |

One result is worth stating plainly. A 0.5% frame loss appeared with 16 receivers. The obvious suspect was receive-buffer overflow at startup, so a follow-up test drained the buffers first. It drained zero packets and delivered slightly less, which ruled the suspect out. The cause is more likely a race while stations join the network, so the loss is treated as a startup effect and not counted as range loss.

## Limits and next steps

Everything here is emulated. The emulator's radio model has a hard range cutoff with no gradual fade, so range results show the protocol's behaviour under that model and not on real radios. The hardware prototype was cut from scope. At the time of writing the scenario planner and runner exist with the first scenario, a 5% loss run. The full evaluation from the proposal, three loss levels with several seeds against a naive-flooding baseline, is still to be run, and this page will be updated with those results.

The security scope is also narrow by design. Lifeline defends against forged, replayed, tampered and flooding traffic. It does not defend against Sybil attackers, key compromise or impersonation at first contact.
