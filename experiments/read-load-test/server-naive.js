const fastify = require("fastify")({
  logger: true
})
const pool = require("./../../db/Pool")

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

fastify.listen({ port: 3000, host: '0.0.0.0'}, function (err, address) {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
  fastify.log.info(`server listening on ${address}`);
})