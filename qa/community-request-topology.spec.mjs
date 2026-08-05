import { test, expect } from '@playwright/test';
import { registerCommunityRequestTopologyTests } from './community-request-topology.cases.mjs';
import { registerCommunityPoetDetailTopologyTests } from './community-poet-detail-topology.cases.mjs';
import { registerPremiumReaderCertificationTests } from './premium-reader-certification.cases.mjs';

registerCommunityRequestTopologyTests({
  test,
  expect,
  projects: ['android-pixel7', 'iphone-safari'],
});
registerCommunityPoetDetailTopologyTests({ test, expect });
registerPremiumReaderCertificationTests({ test, expect });
