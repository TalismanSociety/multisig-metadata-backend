FROM caddy:2.7.5-builder-alpine AS builder

RUN xcaddy build \
--with github.com/mholt/caddy-ratelimit

FROM caddy:2.7.5-builder-alpine

COPY --from=builder /usr/bin/caddy /usr/bin/caddy

ENTRYPOINT ["/usr/bin/caddy", "run", "--config", "/etc/caddy/Caddyfile"]
