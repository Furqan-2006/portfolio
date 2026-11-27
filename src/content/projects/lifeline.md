---
title: Lifeline
pitch: A phone-to-phone emergency network. Phones pass text messages and SOS beacons along to each other, with no tower, SIM or internet.
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
updated: 2026-11-26
---

## Problem

In a disaster, the infrastructure people use to reach each other is usually the first thing to fail. Towers lose power and backhaul gets cut. Lifeline asks what we can still do with only the devices people already carry. Phones in radio range talk directly. Phones out of range reach each other through whoever is in between, who acts as a router. The network carries two kinds of traffic, short text messages and SOS beacons with coordinates, and aims to cover at least a kilometre.

## Design

The forwarding protocol is called Relay, and it is simple on purpose. It floods messages with a TTL, drops duplicates by message ID, rate-limits each neighbour and keeps a replay window per sender. We left adaptive routing out of scope so we could measure how flooding itself behaves.

Delivery is end to end. A per-hop acknowledgement only tells you a frame was sent, so the sender holds on to a text until the recipient's acknowledgement arrives, and offers it again on a timer. Relays don't take custody of messages. When buffers fill up, texts are dropped before SOS messages.

Every message is signed. A node's ID is a 128-bit hash of its Ed25519 public key, and each message carries an Ed25519 signature. Texts are encrypted with a one-shot ECIES-style scheme (ephemeral X25519, HKDF, ChaCha20-Poly1305). A node learns keys either from HELLO beacons, trusting the first one it sees, or from a QR code, which counts as verified.

The code is built around four frozen contracts. A module never reads the wall clock or a global random source. Time, randomness and logging are passed in, and every node writes the same structured event log. That lets us reproduce a run from its seed, test modules against an in-memory network with no sockets, and gives the later emulation one record to analyse.

## Evidence

Before building on the emulator, the team tested the emulator itself. The spike report covers ten areas and all of them pass. These findings shaped the design:

| Question | Result |
| --- | --- |
| Is the loss shim accurate? | 0.00%, 4.92% and 15.20% measured for 0%, 5% and 15% configured |
| Are losses independent between receivers? | Joint-loss ratio 0.96 and 0.99 (1.0 means independent) |
| Where does handheld range end? | A hard step between 100 m and 110 m |
| What is a relay's reach? | r90 = 520 m, symmetric |
| Does it scale? | 5, 15, 20 and 30 stations pass, 6% CPU at 30 |
| Is it reproducible? | Three identical runs differ by 0.000; five start/stop cycles leak nothing |

One result I want to be upfront about. We saw 0.5% frame loss with 16 receivers. My first guess was receive-buffer overflow at startup, so a follow-up test drained the buffers first. It drained zero packets and delivered slightly less, so that guess was wrong. The more likely cause is a race while stations join the network. We treat it as a startup effect and don't count it as range loss.

## Limits and next steps

Everything here is emulated. The emulator's radio model has a hard range cutoff and no gradual fade, so the range results show how the protocol behaves under that model, not on real radios. We cut the hardware prototype from scope. Right now the scenario planner and runner exist with the first scenario, a 5% loss run. The full evaluation from the proposal is still to run: three loss levels with several seeds, against a naive-flooding baseline. I'll update this page when those results are in.

The security scope is narrow too, by design. Lifeline defends against forged, replayed, tampered and flooding traffic. It does not defend against Sybil attackers, key compromise or someone impersonating a node at first contact.
