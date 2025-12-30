# 🚀 Experience: In-Memory Caching Impact (Redis)

## 📌 Scenario
We’re testing a classic high-load scenario: an endpoint performing a heavy SQL Join between `users` and `messages`. 
**The goal:** Evaluate how much overhead we can offload from PostgreSQL by implementing a **Cache-Aside pattern** with Redis.

---

## 🧪 The Experiment Workflow

### 1. The Baseline (Raw SQL)
I started with a basic route hitting PostgreSQL directly. Even with indexed joins, the constant disk I/O and connection overhead quickly choked the database under load.

### 2. The Stress Test
I used **Autocannon** to hammer the server. 
- **Baseline Target:** `GET /user/1`
- **Cache Target:** `GET /user/cached/1`

### 3. The "Fix": Redis Layer
I introduced a **Cache-Aside strategy**.
- **The Logic:** Check Redis first. On a **Cache Miss**, hit the DB and "warm up" the cache for 60 seconds (TTL).
- **The Result:** We moved from a disk-bound process to a memory-bound one. 



### 4. Comparison Analysis
The numbers speak for themselves. The P99 (the experience for the "unlucky" 1% of users) dropped from 103ms to 22ms. This means the system is not just faster, it's significantly more **stable** under load.

---

## ⚠️ Real-World Trade-offs (The "Gotchas")
In a real production environment, you can't just throw a cache at everything. Here’s what I kept in mind:

* **Consistency vs. Performance:** Using a 60s TTL means an "Update" on a user won't show up immediately (Stale Data). For high-integrity apps, I'd implement **Cache Invalidation** (deleting the key on every `UPDATE`).
* **The "Cold Start" Problem:** If the cache is empty and 10k users hit the site, the DB might still crash. I mitigated this here by using a simple logic, but in a larger system, I'd look into **Request Coalescing**.
* **Operational Risk:** If Redis goes down, the app should fall back to the DB gracefully. I've handled this with a `try/cache` block in the code to prevent a total service outage.

---

## 📊 Comparison Summary
*Test conditions: 100 concurrent users, 20s duration, local Docker environment (WSL2).*

| Metric | Baseline (Postgres Only) | Optimized (Redis Cache) | Improvement |
| :--- | :--- | :--- | :--- |
| **Throughput (Avg)** | ~362 req/sec | **~5,985 req/sec** | **~16.5x increase** |
| **Avg Latency** | ~281 ms | **~16 ms** | **94% reduction** |
| **P99 Latency** | ~450 ms | **~44 ms** | **10x stability boost** |
| **Total Requests** | ~7.2k | **~120k** | **Massive scalability gain** |

> [!NOTE]
> **Benchmark Variability:** Results in a local environment can fluctuate between **13x and 23x** speedup depending on CPU background noise. However, the performance gap between the raw DB and the Redis layer remains consistently massive across all test runs.
---

## 🛠 How to run it

1. **Spin up the infra:** `docker-compose up -d`
2. **Seed the DB:** `node seed.js` (to ensure we have enough data to join)
3. **Start the app:** `node server.js`
4. **Fire the benchmark:** `node benchmark.js`

Check the `/results` folder for the raw `.txt` dumps if you want to see the full Autocannon stats.

---

> **Final Note:** Caching is the "cheapest" way to scale. Before buying a bigger database or 10 more servers, a well-placed Redis instance can often handle 10x the traffic for a fraction of the cost.