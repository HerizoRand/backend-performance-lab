const autocannon = require("autocannon");
const fs = require("fs");
const path = require("path");
const pool = require("../../db/Pool");

const resultsDir = path.join(__dirname, "results");
if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir);

const runTest = async (name, baseUrl) => {
  console.log(`\n🚀 Testing ${name} ...`);

  let usersIdMap = [];
  const client = await pool.connect();

  try {
    const usersIdQuery = await client.query("SELECT id FROM users LIMIT 1000");
    usersIdMap = usersIdQuery.rows.map((r) => r.id);
  } catch (err) {
    console.error("Query error: ", err);
    return;
  } finally {
    client.release();
  }

  const result = await autocannon({
    url: "http://localhost:3000", // On met l'URL de base ici
    connections: 100,
    duration: 20,
    requests: [
      {
        method: "GET",
        path: baseUrl,
        setupRequest: (request) => {
          const randomId = usersIdMap[Math.floor(Math.random() * usersIdMap.length)];
          request.path = `${request.path}${randomId}`;
          return request;
        },
      },
    ],
  });

  const fileName = `${name.toLowerCase().replace(/\s/g, "-")}.json`;
  fs.writeFileSync(
    path.join(resultsDir, fileName),
    JSON.stringify(result, null, 2)
  );

  console.log(`✅ Results saved to results/${fileName}`);
  console.log(`📊 Stats for ${name}:`);
  console.log(`   - Avg Req/Sec: ${result.requests.average}`);
  console.log(`   - Avg Latency: ${result.latency.average} ms`);
  console.log(`   - P99 Latency: ${result.latency.p99} ms`);

  return result;
};

console.log("\n \n \n === 📊 BACKEND PERFORMANCE LAB ===");

(async () => {
  try {
    const baseline = await runTest("Baseline", "/user/");
    const cached = await runTest("Cached", "/user/cached/");

    const speedup = ( cached.requests.average / baseline.requests.average ).toFixed(1);
    console.log(`\n Summary: The cached version is ${speedup}x faster!`);
  } catch (err) {
    console.error("Benchmark failed:", err);
  } finally {
    await pool.end();
    console.log("\nAll benchmarks completed! \n \n \n ");
    process.exit(0); // On force la sortie proprement
  }
})();
