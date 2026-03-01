# Testing Guide

## Unit tests

Run all unit tests:

```bash
npm run test:unit
```

Run one test file:

```bash
npm run test:unit -- tests/unit/path/to/test-file.test.ts
```

## E2E tests

Run Playwright E2E suites:

```bash
npm run test:e2e
```

The Playwright config uses the local Chromium binary at `/home/elhigu/.nix-profile/bin/chromium` by default for NixOS compatibility.
