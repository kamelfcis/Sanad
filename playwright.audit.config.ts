import base from './playwright.config';

/**
 * Audit-only config: reuses the base config but skips the shared globalSetup
 * (whose inline phone-login is flaky locally and whose saved auth states the
 * default project does not consume — the audit spec logs in fresh).
 */
const auditConfig = {
  ...base,
  globalSetup: undefined,
};

export default auditConfig;
