---
title: JusticeFlow
pitch: A police case and evidence system. A C++ daemon sits between the Flask dashboard and PostgreSQL, handles sign-in, runs background jobs and keeps an audit trail.
status: running
featured: false
order: 4
tags: [systems, databases, security, linux]
stack: [C++17, PostgreSQL, Python, Flask, Unix domain sockets, POSIX shared memory, scikit-learn]
context: Multi-course semester project (databases, software design, AI, operating systems), FAST NUCES
role: The scheduler, daemon and control-plane layer (double-fork daemon, job executor, agent process spawner), plus the November end-to-end integration, which I did with Claude as a co-author
team:
  - { name: Abdullah, part: IPC layer }
  - { name: Abu Bakar, part: threading layer }
period: { start: 2026-04 }
metrics:
  - { value: "22", label: End-to-end checks pass, note: "`make smoke`, which I re-ran on a clean machine" }
  - { value: "103", label: C++ unit tests passing, note: "14 skipped without a test database, 3 sign-in tests failing" }
  - { value: "≈1.0k", label: Lines in the scheduler and daemon layer, note: C++, the part this role owns }
  - { value: "4", label: Courses integrated, note: Databases, software design, AI, operating systems }
links:
  repo: https://github.com/Furqan-2006/JusticeFlow
  repoVisibility: public
updated: 2026-11-26
---

## Problem

Police records shouldn't be something you can quietly rewrite: who registered a report, who attached which evidence, who issued a warrant, and when. We built JusticeFlow as one project across four courses (databases, software design, AI and operating systems). The hard part was getting a request to actually pass through every layer, instead of the layers just sitting next to each other on a diagram.

## Design

<figure class="diagram">
<svg viewBox="0 0 760 290" role="img" aria-label="JusticeFlow request path: browser to Flask dashboard to a C++ daemon over a Unix socket, then PostgreSQL; the daemon also spawns Python agents on a timer.">
<defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="var(--color-muted)"/></marker></defs>
<g font-family="var(--font-mono)" font-size="12" fill="var(--color-text)">
<rect x="10" y="95" width="110" height="60" rx="8" fill="var(--color-panel)" stroke="var(--color-line)"/><text x="65" y="130" text-anchor="middle">Browser</text>
<rect x="170" y="95" width="130" height="60" rx="8" fill="var(--color-panel)" stroke="var(--color-line)"/><text x="235" y="122" text-anchor="middle">Flask</text><text x="235" y="140" text-anchor="middle" fill="var(--color-muted)">dashboard</text>
<rect x="350" y="20" width="250" height="250" rx="10" fill="none" stroke="var(--color-accent)" stroke-dasharray="4 4"/><text x="365" y="40" fill="var(--color-accent)">C++ daemon</text>
<rect x="370" y="60" width="210" height="52" rx="8" fill="var(--color-panel)" stroke="var(--color-line)"/><text x="475" y="82" text-anchor="middle">command router</text><text x="475" y="100" text-anchor="middle" fill="var(--color-muted)">token check, then command</text>
<rect x="370" y="130" width="210" height="52" rx="8" fill="var(--color-panel)" stroke="var(--color-line)"/><text x="475" y="152" text-anchor="middle">1 s ticker thread</text><text x="475" y="170" text-anchor="middle" fill="var(--color-muted)">warrant expiry, agent jobs</text>
<rect x="370" y="200" width="210" height="52" rx="8" fill="var(--color-panel)" stroke="var(--color-line)"/><text x="475" y="222" text-anchor="middle">agent spawner</text><text x="475" y="240" text-anchor="middle" fill="var(--color-muted)">posix_spawn, waitpid, timeout</text>
<rect x="650" y="40" width="100" height="80" rx="8" fill="var(--color-panel)" stroke="var(--color-line)"/><text x="700" y="76" text-anchor="middle">PostgreSQL</text><text x="700" y="94" text-anchor="middle" fill="var(--color-muted)">audit triggers</text>
<rect x="650" y="190" width="100" height="70" rx="8" fill="var(--color-panel)" stroke="var(--color-line)"/><text x="700" y="220" text-anchor="middle">3 Python</text><text x="700" y="238" text-anchor="middle" fill="var(--color-muted)">agents</text>
</g>
<g stroke="var(--color-muted)" stroke-width="1.5" fill="none" marker-end="url(#ar)">
<path d="M120 125 H168"/><path d="M300 125 H368"/><path d="M580 86 H648"/><path d="M580 226 H648"/><path d="M700 188 V122"/>
</g>
<g font-family="var(--font-mono)" font-size="10.5" fill="var(--color-muted)"><text x="334" y="116" text-anchor="middle">Unix socket</text><text x="334" y="146" text-anchor="middle">JSON frame</text><text x="615" y="78" text-anchor="middle">as officer</text><text x="712" y="160">own role</text></g>
</svg>
<figcaption>One request path: the dashboard never talks to the database. Agents run as their own database role.</figcaption>
</figure>

A request takes one path. The Flask dashboard never opens a database connection. It sends one length-prefixed JSON frame over a Unix domain socket to a C++ daemon. The daemon checks the session token, runs the command against PostgreSQL and sends back the reply. Sign-in, sign-out and "who am I" go through the daemon's command router too, and every read and write is refused without a valid token.

The writes are the part I like most. A write runs as the signed-in officer inside one locked transaction. It first sets the current officer's ID, then runs a statement with bound parameters. The database's audit triggers read that ID, so the audit log records the real officer and belt number. The app's database role has no `DELETE` and can't `UPDATE` audit rows, so the application can't rewrite history even if it wants to.

My part is the control plane, which turns the daemon into more than a request server. It daemonizes with a double fork and `setsid`, and it shuts down cleanly on `SIGINT` or `SIGTERM` by waiting for the signal with `sigwait()` on the main thread. A one-second ticker thread runs the standing jobs. One expires warrants whose valid-until date has passed. Another starts each of the three AI agents (crime hotspots, case priority, officer workload) with `posix_spawn`, waits for them with `waitpid`, kills them on timeout and records the result in shared memory: 0 for success, the exit code, or 124 for a timeout. The agents get their own database role and a stripped environment, so a compromised agent doesn't inherit the daemon's login.

## Evidence

`make smoke` tests the whole system with 22 checks, going through the same doors a user would. An anonymous request is refused. A wrong password gets a generic rejection. An Inspector signs in. An FIR is registered, and an injection attempt in its address is stored as plain text with the `cases` table intact. Evidence and a warrant are added. The daemon's scheduler expires the warrant once its dates are moved into the past. All three agents report success. The new rows are attributed to the officer. The app role is refused `UPDATE` and `DELETE` on the audit log. The dashboard shows the result. I ran the stack on a clean machine from the repo and all 22 checks passed.

The integration work found real bugs, and they're written up in the repo's end-to-end report:
- The daemon didn't compile, because the Makefile's source glob pulled in a second `main()`.
- A test-only environment variable let anyone sign in without a database check.
- Writes were built by string concatenation, so they were injectable.
- The condition variable in the shared-memory status table was never initialised.
- `SIGTERM` could hang the daemon. On Linux, closing a listening socket doesn't wake a thread blocked in `accept()`, so now the socket is shut down first.
- The original timer used `SIGALRM`, which clashes with shutting down through `sigwait()`, so I replaced it with the ticker thread.
- A hardcoded database password is gone from the tree.

We did the integration phases as pull requests with Claude as a co-author. The report says so.

## Limits and next steps

About 8,000 lines of the original subsystem code are not on the gateway's request path. That's where the course's design patterns live (Strategy, Observer, Repository, Singleton, Template Method). Some of it builds SQL by concatenation or queries tables that don't exist. It needs to be ported to the real schema with parameterised queries, or removed. The thread pool, timer and signal-handler classes aren't started by the daemon either.

The C++ unit tests are the weakest part. When I ran them, `make test` finished with 103 passing, 14 skipped because there's no test database set up, and 3 sign-in tests failing. So trust the smoke test. Sessions and lockouts live in the daemon's memory and disappear on restart. The dashboard runs on Flask's development server, has no CSRF tokens and doesn't mark its cookie `Secure`. The gateway uses one thread per connection and a single serialised database connection. The seeded officers all share one development password. The old hardcoded password is still in the public git history, so treat it as exposed and change it anywhere it was used. The README's course-integration section still describes the old `SIGALRM` scheduler and thread pool, which the running system doesn't use.
