# OpenShift deployment — moving from S2I to a Containerfile build

The `arcade-redhat-com` BuildConfig in namespace `prod-arcade-rh-com`
historically built this repo with the **Source (S2I)** strategy. It now
builds from the `Containerfile` at the repo root using the **Docker**
strategy, based on `registry.access.redhat.com/hi/httpd:latest`.

## What changed in the repo

| File | Purpose |
|---|---|
| `Containerfile` | Image definition: httpd base + static site copy |
| `httpd-cnf/arcade.conf` | httpd conf.d drop-in (replaces the ignored `.htaccess`) |
| `.dockerignore` | Keeps `.git`, `node_modules/`, `ssl/`, plumbing out of the image |
| `openshift/buildconfig-strategy-patch.yaml` | The (reviewed) BuildConfig strategy patch |

## How the image works

- Base: `registry.access.redhat.com/hi/httpd` (Red Hat Project
  Hummingbird, UBI-based Apache httpd 2.4).
- Serves the repo's committed, pre-built static content
  (`index.html`, `build/`, images, `keycloak.js`) from
  `/var/www/html` on port **8080**, as non-root user `apache`
  (also works with OpenShift's arbitrary UIDs).
- In-pod TLS is disabled: the OpenShift route terminates TLS. The base
  image's `ssl.conf` references TLS certs that don't ship in the image,
  so it is overwritten with an empty file (`httpd-cnf/ssl.conf`) to
  guarantee a clean start.
- The base image is **shell-less** (no `/bin/sh`), so the Containerfile
  contains no `RUN` steps at all — only `COPY`. Anything that would
  normally be deleted is instead overwritten or denied via httpd config
  (e.g. `RedirectMatch 403 ^/httpd-cnf`).

## Applying the BuildConfig change

Full step-by-step (including the Deployment volume-mount removal and
rollback): see `openshift/migration-runbook.md`.

## Gotchas

- **`keycloak.json`** (SSO) is **disregarded** — `warhw_enabled = false`
  in `content.toml` disables the whole Keycloak integration, and the
  committed `build/arcade.js` bundle has no keycloak references. No
  runtime secret is needed for the image.
- **Confirmed**: `Deployment/arcade-redhat-com` (a Deployment, not a DC)
  volume-mounts a secret at `/opt/app-root/src/keycloak.json` — the old
  S2I docroot. That path does not exist in the new image, so the mount
  must be removed (SSO is disabled via `warhw_enabled = false`, nothing
  reads it) **before** the new image rolls out, or the pod will
  crash-loop. `oc set volumes deploy/arcade-redhat-com -n
  prod-arcade-rh-com` lists the volume name;
  `oc set volumes deploy/arcade-redhat-com -n prod-arcade-rh-com
  --remove --name=<volume-name>` removes it. Other workloads with mounts
  (stonehold, zorbio, mongodb, postgresql) are separate apps and are not
  affected by this change.
- **Triggers**: the strategy patch rewrites `spec.triggers` to keep the
  two webhook triggers (same secret references, so existing webhook URLs
  stay valid) plus ConfigChange, and drops the stale ImageChange trigger
  for the old `openshift/httpd:2.4-el7` builder.
- **Site content is committed pre-built** — remember `npm run build`
  before committing changes (same workflow as before).
- **Rollback**: re-apply the backed-up BuildConfig YAML
  (`bc-backup-*.yaml`, gitignored) and start a build.
