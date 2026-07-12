#!/usr/bin/env bash
# Build the app image and push it to Docker Hub, tagged "latest" and with the current git short SHA.
#
# Usage:
#   DOCKERHUB_USERNAME=youruser DOCKERHUB_REPO=marketplace-api ./scripts/docker-push.sh
#
# Optional env vars:
#   DOCKERHUB_TOKEN  - Docker Hub access token/password. If set, the script logs in with it.
#                      If unset, the script assumes you're already logged in (`docker login`).
set -euo pipefail

: "${DOCKERHUB_USERNAME:?Set DOCKERHUB_USERNAME (your Docker Hub username or org)}"
: "${DOCKERHUB_REPO:?Set DOCKERHUB_REPO (the Docker Hub repository name)}"

IMAGE="${DOCKERHUB_USERNAME}/${DOCKERHUB_REPO}"
GIT_SHA="$(git rev-parse --short HEAD)"

echo "Building ${IMAGE}:latest and ${IMAGE}:${GIT_SHA}"
docker build \
  --build-arg GIT_COMMIT_SHA="${GIT_SHA}" \
  -t "${IMAGE}:latest" \
  -t "${IMAGE}:${GIT_SHA}" \
  .

if [[ -n "${DOCKERHUB_TOKEN:-}" ]]; then
  echo "${DOCKERHUB_TOKEN}" | docker login -u "${DOCKERHUB_USERNAME}" --password-stdin
fi

docker push "${IMAGE}:latest"
docker push "${IMAGE}:${GIT_SHA}"

echo "Pushed ${IMAGE}:latest and ${IMAGE}:${GIT_SHA}"
