import { test, expect } from '@playwright/test';
import { registerCommunityRequestTopologyTests } from './community-request-topology.cases.mjs';

registerCommunityRequestTopologyTests({
  test,
  expect,
  projects: ['android-pixel7', 'iphone-safari'],
});
