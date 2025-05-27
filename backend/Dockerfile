FROM node:18-alpine

WORKDIR /app

# package.jsonをコピーして依存関係をインストール
COPY package*.json ./
RUN npm install

# アプリケーションのソースコードをコピー
COPY . .

EXPOSE 3001

# 開発モードで起動
CMD ["npm", "run", "dev"]