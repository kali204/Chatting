#!/usr/bin/env bash
# Build frontend
cd frontend
npm install
npm run build

# Move build to backend/dist (where Flask serves files)
cd ..
mkdir -p backend/dist
cp -r frontend/dist/* backend/dist/
