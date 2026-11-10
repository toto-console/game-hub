# Changelog

## 0.13.0-dev.38 — experimental public pre-release

- Add GitHub release checks, stable/beta channels, platform/Decky matching, changelog and verified staging.
- Preserve per-version plugin/configuration rollback backups outside the plugin directory.
- Disable installation from the updater pending end-to-end recovery validation; use Decky's manual ZIP flow.
- Reject checksum mismatches, redirects outside GitHub hosts, path traversal, Windows reserved paths, duplicate/case-colliding archive entries and privileged package manifests.
- Retain Home, Welcome, Library, Control Center and social/media integration code.
- Carry forward dev.37's ambient-music Library correction and native navigation sound requests for Audio Loader. Audible controller acceptance remains unverified.
- Publish build inputs, dependency notices, package checks and intentional-release GitHub Actions.
