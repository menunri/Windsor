import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Admin client with service role key for privileged operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Regular client with anon key for public operations (uses service key for server-side)
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('🔄 Supabase client initialized');
console.log('   URL:', supabaseUrl);

// Query helper for compatibility with existing code that uses query(table, options) format
export const query = async (table, options = {}) => {
  const {
    select = '*',
    filters = [],
    order,
    limit,
    offset,
    count = false,
    single = false
  } = options;
  
  let queryBuilder = supabase.from(table).select(select, { count });
  
  // Apply filters
  if (filters.length > 0) {
    for (const filter of filters) {
      queryBuilder = queryBuilder.filter(filter.column, filter.operator, filter.value);
    }
  }
  
  // Apply ordering
  if (order) {
    queryBuilder = queryBuilder.order(order.column, { ascending: order.ascending ?? true });
  }
  
  // Apply pagination
  if (limit) {
    queryBuilder = queryBuilder.limit(limit);
  }
  if (offset) {
    queryBuilder = queryBuilder.offset(offset);
  }
  
  // Get single result
  if (single) {
    const { data, error, count: countVal } = await queryBuilder.single();
    return { rows: data ? [data] : [], rowCount: data ? 1 : 0, error, count: countVal };
  }
  
  const { data, error, count: countVal } = await queryBuilder;
  return { rows: data || [], rowCount: Array.isArray(data) ? data.length : 0, error, count: countVal };
};

export default supabase;