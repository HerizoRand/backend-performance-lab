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

const opts = {
  schema: {
    body: {
      type: "object",
      required: ["name", "email"],
      properties: {
        name: { type: "string" },
        email: { type: "string" },
      },
    },
  },
};

fastify.post("/", opts, async (request, reply) => {
  const response = request.body;
  try {
    // action dans la db
    const res = await pool.query(
      `INSERT INTO users(name, email) VALUES($1, $2) RETURNING * `,
      [response.name, response.email]
    );

    const user = res.rows[0];

    const cacheKey = `user:${user.id}`;
    await client.del(cacheKey);

    return reply.code(201).send(res.rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      return reply.code(409).send({ error: "Email already exists" });
    }

    fastify.log.error(error);
    return reply.code(500).send({ error: "Internal Server Error" });
  }
});

fastify.delete("/:id", async (request, reply) => {
  const { id } = request.params;
  pool.query(`DELETE from users WHERE id= $1`, [id]);

  const cacheKey = `user:${id}`;
  await client.del(cacheKey);
  return reply.code(204).send();
});

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