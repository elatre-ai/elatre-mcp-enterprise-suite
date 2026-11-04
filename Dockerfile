FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json tsconfig.json ./
COPY src ./src
COPY research/json/contact-information.json \
  research/json/services.json \
  research/json/integrations.json \
  research/json/website-metadata.json \
  research/json/extraction-report.json \
  ./research/json/
COPY research/markdown/company-profile.md ./research/markdown/company-profile.md

RUN npm ci \
  && npm run build \
  && npm prune --omit=dev \
  && chown -R node:node /app

USER node

ENV NODE_ENV=production \
    MCP_TRANSPORT=http \
    MCP_HOST=0.0.0.0 \
    PORT=7860 \
    LOG_LEVEL=info

EXPOSE 7860

HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||7860)+'/health').then((response)=>process.exit(response.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/index.js"]
