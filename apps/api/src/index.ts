import { config } from '@/config/env';
import { connectDatabase, disconnectDatabase } from '@/config/database';
import { app } from './app';

async function main(): Promise<void> {
  await connectDatabase();

  const server = app.listen(config.PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║     🎓 Attendify API Server            ║
╠════════════════════════════════════════╣
║  Port:    ${config.PORT}                          ║
║  Mode:    ${config.NODE_ENV.padEnd(28)}║
║  Status:  Running ✅                   ║
╚════════════════════════════════════════╝
    `);
  });

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    console.log(`\n⚡ ${signal} received. Shutting down gracefully...`);

    server.close(async () => {
      console.log('🔌 HTTP server closed');
      await disconnectDatabase();
      console.log('🗄️ Database disconnected');
      process.exit(0);
    });

    // Force exit after 10 seconds
    setTimeout(() => {
      console.error('⏰ Forced shutdown after timeout');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    console.error('🚨 Unhandled Promise Rejection:', reason);
  });

  process.on('uncaughtException', (error) => {
    console.error('🚨 Uncaught Exception:', error);
    process.exit(1);
  });
}

main();
