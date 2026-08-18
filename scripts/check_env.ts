import dotenv from 'dotenv';
dotenv.config();

console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'DEFINED' : 'UNDEFINED');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'DEFINED' : 'UNDEFINED');
console.log('SUPABASE_DB_PASSWORD:', process.env.SUPABASE_DB_PASSWORD ? 'DEFINED' : 'UNDEFINED');
