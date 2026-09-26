# Build dist with `trunk build --release --locked` before building this image.
# CI downloads the tested build artifact, so every platform serves the same WASM.
FROM nginx:stable-alpine
LABEL org.opencontainers.image.source="https://github.com/scott-the-programmer/smkiwi"
LABEL org.opencontainers.image.description="Scott OS: Rust and WebAssembly desktop website"
LABEL org.opencontainers.image.licenses="MIT"
COPY dist/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1
CMD ["nginx", "-g", "daemon off;"]
