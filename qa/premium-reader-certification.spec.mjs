import { test, expect } from '@playwright/test';
import { registerPremiumReaderCertificationTests } from './premium-reader-certification.cases.mjs';

registerPremiumReaderCertificationTests({ test, expect });
