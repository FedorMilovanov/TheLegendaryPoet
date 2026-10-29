export {};

const failures: string[] = [];
const expect = (condition: unknown, message: string) => { if (!condition) failures.push(message); };
const events: Event[] = [];

class TestCustomEvent<T = unknown> extends Event {
  readonly detail: T;
  constructor(type: string, init?: CustomEventInit<T>) {
    super(type);
    this.detail = init?.detail as T;
  }
}

Object.defineProperty(globalThis, 'CustomEvent', { configurable: true, value: TestCustomEvent });
Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: {
    get localStorage() {
      throw new Error('storage blocked by privacy policy');
    },
    dispatchEvent(event: Event) {
      events.push(event);
      return true;
    },
  },
});

const analytics = await import('../src/utils/analytics');
expect(analytics.getAnalyticsConsent() === null, 'blocked storage must begin without implicit analytics consent');
analytics.setAnalyticsConsent('granted');
expect(analytics.getAnalyticsConsent() === 'granted', 'granted consent must remain authoritative for the current tab when storage is blocked');
expect(events.length === 1 && (events[0] as CustomEvent).detail === 'granted', 'grant must still publish the current-tab consent event when persistence fails');
analytics.setAnalyticsConsent('denied');
expect(analytics.getAnalyticsConsent() === 'denied', 'denied consent must replace the in-memory current-tab grant immediately');
expect(events.length === 2 && (events[1] as CustomEvent).detail === 'denied', 'denial must publish the same consent-change contract without requiring storage');

for (const failure of failures) console.error(`ERROR analytics-consent: ${failure}`);
console.log(`Analytics consent validation: ${failures.length} error(s), current-tab authority survives blocked persistence without bypassing browser storage restrictions.`);
if (failures.length) process.exit(1);
