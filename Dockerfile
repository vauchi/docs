# Defaults to the canonical Docker Hub path so `docker build .` works
# locally without any build args. CI overrides this to GitLab's
# group-level dependency proxy via
# `--build-arg HUB=${CI_DEPENDENCY_PROXY_GROUP_IMAGE_PREFIX}` so the
# Hub rate limit doesn't take builds down. Mirrors the pattern from
# relay!270 / ohttp-relay.
ARG HUB=docker.io/library

FROM ${HUB}/nginx:alpine

# Patch all OS packages to fix container scan CVEs
RUN apk update && apk upgrade --no-cache && rm -rf /var/cache/apk/*

# Copy mdBook build output
COPY ./book/ /usr/share/nginx/html/

# The book/ artifact arrives from the CI build job owned by the runner user
# (uid 999) with a group-only umask (0770 dirs / 0660 files, no "other"
# bits). nginx workers run as `nginx` (uid 101) — neither owner nor in the
# group — so they land in "other" and get EACCES on every file, serving a
# 403/404 site while /health still passes. Grant world read + directory
# traverse (uid-agnostic; `X` never marks regular files executable) and
# fail the build if the site is empty. See 2026-07-26 docs-404 post-mortem.
RUN chmod -R a+rX /usr/share/nginx/html \
    && test -s /usr/share/nginx/html/index.html

# Use custom nginx config with security headers + compression
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# Service label used by Kamal 2 to verify that the deployed image matches the
# intended service (prevents cross-service image mix-ups).
LABEL service="vauchi-docs"

EXPOSE 80
