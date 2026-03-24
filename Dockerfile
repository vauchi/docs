FROM nginx:alpine

# Patch all OS packages to fix container scan CVEs
RUN apk update && apk upgrade --no-cache && rm -rf /var/cache/apk/*

# Copy mdBook build output
COPY ./book/ /usr/share/nginx/html/

# Use custom nginx config with security headers + compression
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
