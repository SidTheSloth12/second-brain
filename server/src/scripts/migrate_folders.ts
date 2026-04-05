import { Pool } from 'pg'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

dotenv.config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function run() {
  try {
    const sqlPath = path.join(__dirname, '../../sql/folders.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')
    console.log('Running folders.sql...')
    await pool.query(sql)
    console.log('Successfully updated database with folders table.')
  } catch (err) {
    console.error('Error running migration:', err)
  } finally {
    await pool.end()
  }
}

run()
