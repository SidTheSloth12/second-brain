import { Pool } from 'pg'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(__dirname, '../../.env') })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function run() {
  try {
    const res = await pool.query('SELECT * FROM users LIMIT 1')
    console.log('SUCCESS: Users table exists.')
  } catch (err) {
    console.error('ERROR connecting to DB or missing tables:', err)
  } finally {
    await pool.end()
  }
}

run()
