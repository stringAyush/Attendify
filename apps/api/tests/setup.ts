// Set test environment variables BEFORE dotenv loads
// This prevents the dev .env from overwriting the test-specific values below.
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test_access_secret_min_32_chars_here_test_only';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_min_32_chars_here_test_only';
process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://postgres:password@localhost:5432/attendify_test?schema=public';
process.env.BCRYPT_SALT_ROUNDS = '4'; // Lower for faster tests
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.RATE_LIMIT_WINDOW_MS = '900000';
process.env.RATE_LIMIT_MAX = '100';

