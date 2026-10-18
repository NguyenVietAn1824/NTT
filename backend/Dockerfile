FROM node:20-alpine AS build
WORKDIR /app
RUN apk add --no-cache openssl
COPY package*.json ./
RUN npm ci
COPY . .
# Production dùng PostgreSQL
RUN sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma \
 && npx prisma generate && npm run build

FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV=production
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
# seed.ts dùng lib/media để nạp ảnh mẫu vào storage
COPY --from=build /app/src ./src
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/tsconfig.json ./
EXPOSE 4000
# Đồng bộ schema, seed (bỏ qua nếu đã có dữ liệu), rồi chạy API
# IMPORT_OLD_LIBRARY=true → nạp video + ảnh từ web cũ khi khởi động (an toàn khi chạy lại; dùng cho host không có terminal như Render free)
CMD ["sh", "-c", "npx prisma db push --skip-generate && npx tsx prisma/seed.ts && { [ \"$IMPORT_OLD_LIBRARY\" != true ] || npx tsx scripts/import-old-library.ts || echo '[import] lỗi, bỏ qua'; } && node dist/index.js"]
