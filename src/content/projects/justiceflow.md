---
title: JusticeFlow
pitch: A police case and evidence system. A C++ daemon between a Flask dashboard and PostgreSQL enforces sign-in, runs background jobs and keeps an audit trail.
status: running
featured: false
order: 4
tags: [systems, databases, security, linux]
stack: [C++17, PostgreSQL, Python, Flask, Unix domain sockets, POSIX shared memory, scikit-learn]
context: Multi-course semester project (databases, software design, AI, operating systems), FAST NUCES
role: The scheduler, daemon and control-plane layer (double-fork daemon, job executor, agent process spawner), and the 2026-11 end-to-end integration, done with Claude as a co-author
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

Police casework needs records that cannot be quietly rewritten: who registered a report, who attached which evidence, who issued a warrant, and when. JusticeFlow was built as a single project across four courses, so the design question was how to join a database layer, an application architecture, machine-learning agents and an operating-systems layer so that a request really passes through all of them, not just sits next to them on a diagram.

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

A request has one path. The Flask dashboard never opens a database connection. It sends one length-prefixed JSON frame over a Unix domain socket to a C++ daemon, which checks the session token, runs the command against PostgreSQL and replies. Sign-in, sign-out and "who am I" are handled by the daemon's command router, and every data read and every write is refused without a valid token.

Writes are where the design earns its keep. A write runs as the signed-in officer in a single locked transaction that first sets the current officer's ID, then runs a statement with bound parameters. The database's audit triggers read that ID, so the audit log names the real officer and belt number. The application's database role has no `DELETE` and cannot `UPDATE` audit rows, so the application itself cannot rewrite history.

The control plane, this role's part, makes the daemon more than a request server. It daemonizes with a double fork and `setsid`, and it shuts down cleanly on `SIGINT` or `SIGTERM` by waiting for the signal with `sigwait()` on the main thread. A one-second ticker thread runs the standing jobs. One expires warrants whose valid-until date has passed. Another starts each of three AI agents (crime hotspots, case priority, officer workload) with `posix_spawn`, reaps them with `waitpid`, kills them on timeout, and records the outcome in shared memory: 0 for success, the exit code, or 124 for a timeout. Agents get their own database role and a stripped environment, so a compromised agent does not inherit the daemon's login.

## Evidence

The system is checked end to end by `make smoke`, which makes 22 checks through the same doors a user would use: an anonymous request is refused; a wrong password is rejected with a generic message; an Inspector signs in; an FIR is registered, and an injection attempt in its address is stored as plain text with the `cases` table intact; evidence and a warrant are added; the daemon's scheduler expires the warrant once its dates are moved into the past; all three agents report success; the new rows are attributed to the officer; the application role is refused `UPDATE` and `DELETE` on the audit log; and the dashboard shows the result. I ran the stack on a clean machine from the repository and all 22 checks passed. The seeded database holds 22,405 rows, including 150 officers.

The integration work found real faults, and they are written up in the repository's end-to-end report. The daemon did not compile because a second `main()` was pulled in by the Makefile's source glob. A test-only environment variable let anyone sign in without a database check. Writes were built by string concatenation, so they were injectable. The shared-memory status table's condition variable was never initialised. `SIGTERM` could hang the daemon, because on Linux closing a listening socket does not wake a thread blocked in `accept()`, so the socket is now shut down first. The original timer design used `SIGALRM`, which conflicts with `sigwait()`-based shutdown, so it was replaced by the ticker thread. A hardcoded database password was removed from the tree.

The integration phases were done as pull requests with Claude as a co-author, and the report says so.

## Limits and next steps

The three original subsystem layers, about 8,000 lines that carry the course's design patterns (Strategy, Observer, Repository, Singleton, Template Method), are not on the gateway's request path. Some of that code builds SQL by concatenation or queries tables that don't exist. They need porting to the real schema with parameterised queries, or retiring. The thread pool, timer and signal-handler classes are also not started by the daemon.

The C++ unit test suite is the weakest part. When I ran it, `make test` ended with 103 passing, 14 skipped for lack of a configured test database, and 3 sign-in tests failing, so the smoke test is the check to trust. Sessions and lockouts live in daemon memory and vanish on restart. The dashboard runs on Flask's development server, has no CSRF tokens and does not mark its cookie `Secure`, and the gateway uses one thread per connection and one serialised database connection. Seeded officers all share one development password. The old hardcoded password remains in the public git history, so it should be treated as exposed and changed wherever it was used. The README's course-integration section still describes the original `SIGALRM` scheduler and thread pool, which the running system no longer uses.
