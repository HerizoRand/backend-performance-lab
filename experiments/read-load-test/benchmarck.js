const autocannon = require("autocannon");
const fs = require("fs");
const path = require("path");

const resultsDir = path.join(__dirname, "results");
if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir);

const runTest = async (name, url) => {
  console.log(`\n Testing ${name} ...`);

  const result = await autocannon({
    url,
    connections: 100,
    duration: 20,
  });

  const fileName = `${name.toLowerCase().replace(/\s/g, "-")}.json`;
  fs.writeFileSync(
    path.join(resultsDir, fileName),
    JSON.stringify(result, null, 2)
  );

  console.log(`✅ Results saved to results/${fileName}`);
  console.log(`${name} result : \n ${result}`)
};

console.log("=== 📊 BACKEND PERFORMANCE LAB ===");

(async () => {
  await runTest("Baseline", "http://localhost:3000/user/1");
  await runTest("Cached", "http://localhost:3000/user/cached/1");
  console.log("\nAll benchmarks completed!");
})();
