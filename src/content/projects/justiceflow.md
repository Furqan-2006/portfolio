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
