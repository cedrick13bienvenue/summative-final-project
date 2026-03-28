import { AuthService } from '../services/authService';

/**
 * Cleanup script to remove expired tokens from the blacklist
 * This should be run periodically (e.g., via cron job) to prevent
 * the token_blacklist table from growing indefinitely
 */
export class TokenCleanup {
  /**
   * Clean up expired tokens from the blacklist
   */
  static async cleanupExpiredTokens(): Promise<void> {
    try {
      console.log('Starting token cleanup...');
      await AuthService.cleanupExpiredTokens();
      console.log('Token cleanup completed successfully');
    } catch (error) {
      console.error('Error during token cleanup:', error);
      throw error;
    }
  }

  /**
   * Run cleanup with error handling
   */
  static async run(): Promise<void> {
    try {
      await this.cleanupExpiredTokens();
      process.exit(0);
    } catch (error) {
      console.error('Token cleanup failed:', error);
      process.exit(1);
    }
  }
}

// If this file is run directly, execute cleanup
if (require.main === module) {
  TokenCleanup.run();
}
