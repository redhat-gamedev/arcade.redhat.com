# Migration runbook: arcade-redhat-com — S2I → Containerfile build

**Status: approved — ready to execute.** All commands assume `oc` is
logged in and this repo is checked out at the commit that contains the
`Containerfile` (pushed to `master`, since the BuildConfig builds the
default branch).

## Preconditions (read-only, verify before starting)

- [x] BuildConfig backed up: `bc-backup-20261120.yaml` (repo root, gitignored)
- [x] Image built and smoke-tested locally (content identical, arbitrary-UID OK)
- [ ] Deployment volume name known (needed in step 2):
      `oc set volumes deploy/arcade-redhat-com -n prod-arcade-rh-com`
- [ ] Service `targetPort` is 8080 and the route terminates TLS:
      `oc get svc arcade-redhat-com -n prod-arcade-rh-com -o yaml`
      `oc get route -n prod-arcade-rh-com`

## Why each step exists

| Step | Reason |
|---|---|
| 1. Push `master` | The BuildConfig builds the default branch — the `Containerfile` must be on `master` before the strategy switch. If a GitHub webhook is wired up, this may fire one last S2I build of the new commit; that is benign (site content is unchanged, plus a few extra repo files in the docroot) and is superseded by step 4. |
| 2. Remove keycloak volume mount | It mounts at `/opt/app-root/src/keycloak.json` (old S2I docroot). That path does not exist in the new `hi/httpd` image; left in place the new pods crash-loop with `CreateContainerConfigError`. SSO is off (`warhw_enabled = false`), nothing reads it. |
| 3. Patch the BuildConfig | Switches `Source`/S2I → `Docker` strategy building from the repo's `Containerfile`; drops the stale ImageChange trigger for `openshift/httpd:2.4-el7`; keeps both webhook triggers (same secret references → existing webhook URLs keep working) and ConfigChange. |
| 4. Build + rollout | ConfigChange auto-starts a build on patch; the Deployment's image trigger rolls it out. |
| 5. Verify | Confirm the site serves the same content from the new image. |

## Steps

```bash
# --- 0. Backups ---------------------------------------------------------
# (BC backup exists: bc-backup-20261120.yaml)
oc get deploy arcade-redhat-com -n prod-arcade-rh-com -o yaml \
  > deploy-backup-$(date +%Y%m%d-%H%M).yaml

# --- 1. Push master ------------------------------------------------------
git push origin master

# --- 2. Remove the stale keycloak.json mount ----------------------------
# Pods restart on the OLD image: no downtime, SSO already disabled.
# Substitute the volume name shown by: oc set volumes deploy/arcade-redhat-com ...
oc set volumes deploy/arcade-redhat-com -n prod-arcade-rh-com \
  --remove --name=<VOLUME-NAME>

# --- 3. Switch the BuildConfig to the Containerfile build ---------------
# ConfigChange auto-starts the next build immediately after this patch.
oc patch bc arcade-redhat-com -n prod-arcade-rh-com \
  --type merge --patch-file openshift/buildconfig-strategy-patch.yaml

# --- 4. Watch the build, then the rollout -------------------------------
oc start-build arcade-redhat-com -n prod-arcade-rh-com --follow  # only if not already running
oc rollout status deploy/arcade-redhat-com -n prod-arcade-rh-com

# --- 5. Verify -----------------------------------------------------------
curl -sI https://arcade.redhat.com/          | head -5   # 200, same content-length as before
curl -s  https://arcade.redhat.com/          | diff - index.html
curl -sI https://arcade.redhat.com/build/arcade.js           # 200
curl -sI https://arcade.redhat.com/.git/config               # 403 (RedirectMatch rule)
curl -sI https://arcade.redhat.com/httpd-cnf/arcade.conf     # 403 (deny rule)
oc get pods -n prod-arcade-rh-com -l app=arcade-redhat-com   # Running, no restarts
```

## Rollback

**Fast path (seconds — old image digest stays in the registry):**

```bash
oc rollout undo deployment/arcade-redhat-com -n prod-arcade-rh-com
oc rollout history deployment/arcade-redhat-com -n prod-arcade-rh-com   # pick --to-revision=N if needed
```

**Full restoration (today's exact cluster state):**

```bash
oc apply -f bc-backup-20261120.yaml     # BuildConfig back to S2I + old triggers
oc apply -f deploy-backup-*.yaml        # keycloak mount back (optional — SSO is off)
oc start-build arcade-redhat-com -n prod-arcade-rh-com --follow
```

**Repo:** `git revert <commit>` (normal history, no force-push).

**What failure looks like (and why it's contained):**

- Build failure (bad Containerfile, etc.) — the running Deployment is
  never touched; old pods keep serving. Fix and rebuild, no rollback.
- New pods crash-loop — rolling updates keep the old pods serving until
  new ones go Ready, so a bad rollout stalls rather than takes the site
  down. `oc rollout undo` finishes in seconds.

## Notes / follow-ups

- The Deployment references the image by digest and has updated on past
  builds, so the image-trigger chain is expected to roll it out
  automatically; step 4's `oc rollout status` confirms. If it ever does
  not: `oc rollout restart deploy/arcade-redhat-com -n prod-arcade-rh-com`.
- Webhook URLs (GitHub + Generic) are unchanged — the patch keeps the
  same `secretReference` names.
- After the migration is stable, consider pinning the base image in the
  `Containerfile` to a digest (see the comment at the top of the
  `Containerfile`) instead of `:latest` for reproducible builds.
- Keep the `bc-backup-*.yaml` / `deploy-backup-*.yaml` files out of git
  (already in `.gitignore`).
