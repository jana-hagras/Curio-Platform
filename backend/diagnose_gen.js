import pool from './src/db/connection.js';

async function run() {
  try {
    const [reqs] = await pool.query('SELECT Request_id, Title, FinalGeneration_id, ImageSourceType, UploadedImageUrl FROM Request ORDER BY Request_id DESC LIMIT 5');
    console.log('=== LATEST REQUESTS ===');
    console.table(reqs);

    const [gens] = await pool.query('SELECT Generation_id, Request_id, GenerationStatus, VersionNumber, GeneratedImageUrl, ModelGlbUrl, ErrorMessage FROM RequestAIGeneration ORDER BY Generation_id DESC LIMIT 5');
    console.log('=== LATEST GENERATIONS ===');
    console.table(gens);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
