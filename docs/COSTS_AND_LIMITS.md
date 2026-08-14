# Costs and limits

Status: initial verified cost model
Verified: 2026-08-14 from official provider documentation

## Zero-cost target

The initial personal application is designed for GitHub Free, Vercel Hobby, two Supabase Free projects, the owner’s existing Google Drive storage, and the included GitHub Actions allowance. Runtime AI, paid OCR, SMS/email services, Google Cloud billing, and provider upgrades remain disabled.

Limits change. Re-check the linked provider pages immediately before production setup and at least quarterly.

## Provider baseline

### Supabase Free — $0

- Two active projects, suitable for one development/test project and one production project.
- 500 MB database per project, shared CPU with 500 MB RAM, 50,000 monthly active users, 5 GB egress plus 5 GB cached egress, and 1 GB file storage.
- Free projects may pause after one week of inactivity.
- Automatic backups are not included, which is why the repository will implement encrypted logical backups through GitHub Actions.

When a quota is reached, the project can pause or a resource/function can become unavailable; do not upgrade automatically. First export data, review growth, archive unnecessary non-authoritative files, and ask the owner before Pro. The likely first paid upgrade would be Supabase Pro if production uptime, database size, or managed backups outgrow Free.

Official source: https://supabase.com/pricing

### Vercel Hobby — $0

- Intended for non-commercial personal projects, matching this house build.
- Included usage documented in 2026 includes 100 GB fast data transfer, up to 1,000,000 edge requests, 1,000,000 function invocations, 4 active CPU-hours, 360 GB-hours provisioned memory, 6,000 build-execution minutes, 1,000 image-optimization source images, and 100 deployments per day.
- In most cases Hobby stops or delays the affected feature when its included limit is reached; it has no normal paid billing cycle.

Keep the account on Hobby, avoid starting a Pro trial, do not add a card for this project, and review the Vercel Usage page monthly. Long-running report/backup work belongs outside request-time functions.

Official sources: https://vercel.com/docs/plans/hobby and https://vercel.com/docs/limits

### GitHub Free — $0

- Private repository supported.
- GitHub Actions allowance for a personal Free account: 2,000 hosted-runner minutes per month and 500 MB artifact storage.
- Standard public-repository runners are free, but this repository must remain private because the product is personal and security-sensitive.

Set a GitHub Actions budget with “Stop usage when budget limit is reached,” enable 90%/100% notifications, keep backup artifacts briefly, and store long-retention encrypted archives in Drive. If the allowance is exhausted, scheduled workflows wait until allowance resets unless the owner explicitly enables paid usage.

Official source: https://docs.github.com/en/billing/reference/product-usage-included

### Personal Google storage — existing account allocation

- A personal Google account includes up to 15 GB shared by Drive, Gmail, and Google Photos.
- When full, Drive cannot upload/create files and Gmail/Photos are also affected.

Monitor shared storage, compress reports/photos appropriately, retain database archives according to policy, and maintain an independent local copy of critical documents. Google Drive version history is useful but not an independent backup of the Google account.

Official source: https://support.google.com/drive/answer/6374270

## Features that could eventually require payment

- Supabase Pro for sustained production activity, larger database/storage/egress, unpaused availability, or provider-managed backups.
- Vercel Pro only if the project becomes commercial, needs team features, or consistently exceeds Hobby constraints.
- Google One if the personal 15 GB shared allocation becomes insufficient.
- GitHub paid Actions only if optimized private workflows consistently exceed included minutes.
- OCR/AI only after a provider, per-document cost ceiling, hard budget, and owner approval are documented.

## Hard cost controls

- No code path provisions infrastructure or disables provider spend caps.
- AI feature flag defaults off and providers/keys are unset.
- Backups use public-key encryption and free scheduled workflows; artifact retention is short.
- Generated media is stored in Drive rather than paid application object storage unless limits require a reviewed change.
- Monthly maintenance includes provider usage review; quarterly maintenance re-verifies plan limits.
- Any paid change requires a written decision record with price, trigger, rollback/export plan, and explicit owner approval.
