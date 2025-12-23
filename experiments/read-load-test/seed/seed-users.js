const pool = require("../../../db/Pool")
const {faker} = require("@faker-js/faker")

async function seedUsers(count = 1000) {
  console.log(`Seeding ${count} users...`)
  const client = await pool.connect()

  try{
    await client.query("BEGIN")
    for(let i = 0; i < count ; i++) {
      await client.query("INSERT INTO users(name, email) VALUES($1 , $2)" , [faker.person.fullName() , faker.internet.email()])
    }
    await client.query("COMMIT")
    console.log("Seeding finished!");
  } catch (e) {
    await client.query("ROLLBACK")
    console.error("Seeding error:", e)
  } finally {
    client.release();
    await pool.end()
  }
}

const count = parseInt(process.argv[2]) || 1000
seedUsers(count)