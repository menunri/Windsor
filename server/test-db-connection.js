import pg from 'pg';

const { Pool } = pg;

// Test both direct (5432) and pooler (6543) ports
const host = 'db.khgzhxpyxwetkkhbhhbl.supabase.co';
const user = 'postgres';
const password = '4ODW9fvJ9PB3tqSw';
const database = 'postgres';

async function testConnection(port) {
  console.log(`\n🔄 Testing connection to Supabase (port ${port})...`);
  console.log('   Host:', host);
  console.log('   Port:', port);
  console.log('   User:', user);
  console.log('   Database:', database);

  const pool = new Pool({
    host,
    port,
    user,
    password,
    database,
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 15000,
  });

  try {
    console.log('📡 Attempting to connect...');
    const client = await pool.connect();
    console.log('✅ Connected successfully!');
    
    // Test a simple query
    const result = await client.query('SELECT NOW() as current_time');
    console.log('📋 Query result:', result.rows[0]);
    
    client.release();
    await pool.end();
    console.log('🔌 Connection closed');
    return true;
  } catch (error) {
    console.error('❌ Connection failed!');
    console.error('   Error:', error.message);
    console.error('   Code:', error.code);
    return false;
  }
}

async function main() {
  // Try pooler port first (6543), then direct (5432)
  const poolerSuccess = await testConnection(6543);
  if (poolerSuccess) {
    console.log('\n✅ Pooler connection worked!');
    process.exit(0);
  }
  
  const directSuccess = await testConnection(5432);
  if (directSuccess) {
    console.log('\n✅ Direct connection worked!');
    process.exit(0);
  }
  
  console.log('\n❌ Both connection attempts failed.');
  console.log('\n📝 Note: Supabase Free tier uses IPv6 by default.');
  console.log('   If you\'re on Free tier, you may need to enable the');
  console.log('   IPv4 add-on (paid) or use Supabase Studio to manage the database.');
  process.exit(1);
}

main();