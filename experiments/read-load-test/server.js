const fastify = require("fastify")({
  logger: true
})
const pool = require("./../../db/Pool")
const { createClient } = require("redis");
const client = createClient()

client.on('error', err => console.log('Redis Client Error', err))
client.connect()

fastify.get('/', function (request , reply) {
  reply.send({ hello: 'world'})
})

fastify.get('/user/:id', async (request, reply) => {
  const { id } = request.params
  
  const result = await pool.query(
    `SELECT users.*, messages.content
    FROM users LEFT JOIN messages
    ON users.id = messages.user_id
    WHERE users.id = $1
    ` , [id]
  )
  console.log(result.rows)
  return result.rows
})

fastify.get('/user/cached/:id', async (request, reply) => {
  const {id} = request.params
  const cacheKey = `user:${id}`
  let cachedData = null

  try {
    cachedData = await client.get(cacheKey);
  } catch (err) {
    request.log.error({ err }, "Redis unreachable, falling back to PostgreSQL");
  }

  if(cachedData) {
    reply.header('X-Cache', 'HIT')
    return JSON.parse(cachedData)
  }

  const result = await pool.query(
    `SELECT users.*, messages.content
    FROM users LEFT JOIN messages ON users.id = messages.user_id
    WHERE users.id = $1`,[id]
  );

  try {
    await client.set(cacheKey, JSON.stringify(result.rows), { EX: 60 });
  } catch (err) {
    request.log.error({ err }, "Failed to update cache");
  }

  reply.header("X-Cache", "MISS");
  return result.rows
})

fastify.addHook("onClose", async (instance) => {
  console.log("Shutting down connections...");
  await client.quit();
  await pool.end();
});

fastify.listen({ port: 3000, host: '0.0.0.0'}, function (err, address) {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
  fastify.log.info(`server listening on ${address}`);
})