# Backend Performance Lab

This repository is a collection of small, focused experiments designed to better understand
how backend systems behave under load.

The goal is not to build a production-ready system, but to **measure**, **analyze**, and
**justify architectural decisions** such as caching, queues, and database optimizations
based on real performance data.

Each experiment follows the same approach:

- start with a simple implementation
- apply load or stress
- observe bottlenecks
- introduce a single improvement
- measure the impact

---

## Objectives

The main questions behind this lab are:

- At what point does a backend start to slow down?
- At what point does it break?
- Why does it break?

By answering these questions through experiments, this project aims to develop
a practical understanding of system design trade-offs.

---

## Experiments Overview

Each folder contains an isolated experiment with its own README and results.
   
```text
├── read-load-test/ # High read traffic on an API endpoint
├── write-load-test/ # High write traffic and database pressure
├── cache-impact/ # Redis cache vs direct database access
├── queue-impact/ # Synchronous writes vs background processing
├── db-index-test/ # Impact of database indexes on query performance
```

## Methodology

All experiments follow the same structure:

1. **Baseline**
   - Simple implementation without optimization
2. **Load / Stress Test**
   - Tools such as Autocannon or k6
   - Defined concurrency and duration
3. **Observation**
   - Latency
   - Throughput
   - Error rates
4. **Single Improvement**
   - Cache, queue, index, or architectural change
5. **Comparison**
   - Before vs after measurements
6. **Limits**
   - What this experiment does not cover

This approach helps avoid premature optimization and keeps the focus on measurable impact.

---

## Tools Used

- Node.js / Fastify
- Autocannon / k6
- Redis
- PostgreSQL
- Docker (when relevant)

The tools themselves are not the focus; the reasoning behind their use is.

---

## What This Project Is Not

- A production-ready architecture
- A performance benchmark for a specific framework
- A tutorial or step-by-step guide

This repository documents **experiments and observations**, not best practices claims.

---

## Key Takeaways

- Measuring before optimizing leads to better decisions
- Most performance problems come from predictable bottlenecks
- Every optimization introduces trade-offs
- Simplicity should be preserved as long as possible

---

## Notes

All tests are executed in a local environment.
Results may vary depending on hardware and configuration,
but the observed patterns remain relevant.

---

## Author

Built as a personal engineering lab to improve system design
and backend performance reasoning.
