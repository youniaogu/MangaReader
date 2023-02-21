#!/usr/bin/env node
const path = require('path');
const fs = require('fs');

const DEFAULT_BUNDLE_IDENTIFIER = 'personal.bundle.identifier.MangaReader';
const PATTERN_PRODUCT_BUNDLE_IDENTIFIER = /PRODUCT_BUNDLE_IDENTIFIER = (.+);/g;

const revision = require('child_process')
  .execSync('git diff --cached --name-only --diff-filter=ACM')
  .toString()
  .trim();

if (revision.includes('ios/MangaReader.xcodeproj/project.pbxproj')) {
  const fileContent = fs
    .readFileSync(path.resolve('ios/MangaReader.xcodeproj/project.pbxproj'))
    .toString();

  [...fileContent.matchAll(PATTERN_PRODUCT_BUNDLE_IDENTIFIER)].forEach((item) => {
    const [, bundleIdentifier] = item || [];

    if (bundleIdentifier !== DEFAULT_BUNDLE_IDENTIFIER) {
      throw new Error('开源项目请不要上传私人bundle identifier');
    }
  });
}
