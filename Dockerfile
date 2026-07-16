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

# Use custom nginx config with security headers + compression
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# Service label used by Kamal 2 to verify that the deployed image matches the
# intended service (prevents cross-service image mix-ups).
LABEL service="vauchi-docs"

EXPOSE 80
