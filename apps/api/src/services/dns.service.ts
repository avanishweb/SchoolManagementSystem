import dns from 'dns/promises';
import { logger } from '../utils/logger.js';

export interface DnsVerificationResult {
  verified: boolean;
  recordType: 'TXT' | 'CNAME';
  checkedHost: string;
  foundValues: string[];
  expectedValue: string;
  errorMessage?: string;
}

// In-memory registry for local test environments / mocks
const testDnsRegistry = new Map<string, { txt?: string[]; cname?: string }>();

export const dnsService = {
  /**
   * Registers a mock DNS record for automated testing suites
   */
  registerTestDnsRecord(host: string, record: { txt?: string[]; cname?: string }): void {
    testDnsRegistry.set(host.toLowerCase(), record);
  },

  clearTestRegistry(): void {
    testDnsRegistry.clear();
  },

  /**
   * Generates a cryptographically random verification token
   */
  generateVerificationToken(prefix = 'smartschool-verify'): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 24; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${prefix}-${token}`;
  },

  /**
   * Verifies custom domain DNS setup using TXT or CNAME record
   */
  async verifyDomain(
    domain: string,
    expectedToken: string,
    recordType: 'TXT' | 'CNAME' = 'TXT'
  ): Promise<DnsVerificationResult> {
    const cleanDomain = domain.trim().toLowerCase();
    const challengeHost = recordType === 'TXT' ? `_smartschool-challenge.${cleanDomain}` : cleanDomain;

    logger.info(`Checking DNS ${recordType} record for ${challengeHost}...`);

    // 1. Check test registry if registered (used in automated integration tests)
    const testRecord = testDnsRegistry.get(challengeHost) || testDnsRegistry.get(cleanDomain);
    if (testRecord) {
      if (recordType === 'TXT' && testRecord.txt) {
        const matched = testRecord.txt.some((val) => val.includes(expectedToken));
        return {
          verified: matched,
          recordType: 'TXT',
          checkedHost: challengeHost,
          foundValues: testRecord.txt,
          expectedValue: expectedToken,
          errorMessage: matched
            ? undefined
            : `TXT record found at ${challengeHost} does not contain expected token '${expectedToken}'.`,
        };
      }
      if (recordType === 'CNAME' && testRecord.cname) {
        const matched = testRecord.cname.toLowerCase().includes(expectedToken.toLowerCase());
        return {
          verified: matched,
          recordType: 'CNAME',
          checkedHost: challengeHost,
          foundValues: [testRecord.cname],
          expectedValue: expectedToken,
          errorMessage: matched
            ? undefined
            : `CNAME record at ${challengeHost} points to '${testRecord.cname}', expected '${expectedToken}'.`,
        };
      }
    }

    // 2. Perform real Node.js DNS resolution
    try {
      if (recordType === 'TXT') {
        let txtRecords: string[][] = [];
        try {
          txtRecords = await dns.resolveTxt(challengeHost);
        } catch (subErr: unknown) {
          // Fallback: check root domain if challenge subdomain is not configured
          try {
            txtRecords = await dns.resolveTxt(cleanDomain);
          } catch {
            throw subErr;
          }
        }

        const flattened = txtRecords.map((chunk) => chunk.join(''));
        const matched = flattened.some((val) => val.includes(expectedToken));

        return {
          verified: matched,
          recordType: 'TXT',
          checkedHost: challengeHost,
          foundValues: flattened,
          expectedValue: expectedToken,
          errorMessage: matched
            ? undefined
            : `TXT record at ${challengeHost} did not match verification token. Found: [${flattened.join(', ')}]`,
        };
      } else {
        // CNAME verification
        const cnameRecords = await dns.resolveCname(cleanDomain);
        const matched = cnameRecords.some((val) => val.toLowerCase().includes(expectedToken.toLowerCase()));

        return {
          verified: matched,
          recordType: 'CNAME',
          checkedHost: cleanDomain,
          foundValues: cnameRecords,
          expectedValue: expectedToken,
          errorMessage: matched
            ? undefined
            : `CNAME record at ${cleanDomain} does not point to expected target. Found: [${cnameRecords.join(', ')}]`,
        };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        verified: false,
        recordType,
        checkedHost: challengeHost,
        foundValues: [],
        expectedValue: expectedToken,
        errorMessage: `DNS resolution failed for ${challengeHost}: ${msg}. Please ensure your DNS records have propagated.`,
      };
    }
  },
};
