const pool = require("./../../../db/Pool")
const {faker} = require("@faker-js/faker")

async function seedMessages(count = 5000) {
  console.log(`Seeding ${count} message...`);
  const client = await pool.connect()

  try{
    
    await client.query("BEGIN")

    const res = await client.query("SELECT id FROM users")
    const userIDs = res.rows.map(r => r.id)

    for(let i = 0; i < count; i++) {
      const randomUserID = userIDs[Math.floor(Math.random() * userIDs.length) + 1]
      await client.query("INSERT INTO messages(user_id , content) VALUES($1 , $2)", [randomUserID, faker.lorem.text()])
    }
    await client.query("COMMIT")
    console.log("Seeding messages finished")

  } catch (e) {
    await client.query("ROLLBACK")
    console.error("Seeding messages error: " ,e)
  } finally {
    client.release()
    await pool.end()
  }
}

const count = parseInt(process.argv[2]) || 5000
seedMessages(count)