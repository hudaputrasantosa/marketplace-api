# Build the app image and push it to Docker Hub, tagged "latest" and with the current git short SHA.
#
# Usage:
#   $env:DOCKERHUB_USERNAME = "youruser"
#   $env:DOCKERHUB_REPO = "marketplace-api"
#   .\scripts\docker-push.ps1
#
# Optional env vars:
#   DOCKERHUB_TOKEN - Docker Hub access token/password. If set, the script logs in with it.
#                     If unset, the script assumes you're already logged in (`docker login`).

$ErrorActionPreference = "Stop"

if (-not $env:DOCKERHUB_USERNAME) {
    throw "Set `$env:DOCKERHUB_USERNAME (your Docker Hub username or org)"
}
if (-not $env:DOCKERHUB_REPO) {
    throw "Set `$env:DOCKERHUB_REPO (the Docker Hub repository name)"
}

$Image = "$($env:DOCKERHUB_USERNAME)/$($env:DOCKERHUB_REPO)"
$GitSha = (git rev-parse --short HEAD).Trim()

Write-Host "Building ${Image}:latest and ${Image}:${GitSha}"
docker build --build-arg "GIT_COMMIT_SHA=$GitSha" -t "${Image}:latest" -t "${Image}:${GitSha}" .

if ($env:DOCKERHUB_TOKEN) {
    $env:DOCKERHUB_TOKEN | docker login -u $env:DOCKERHUB_USERNAME --password-stdin
}

docker push "${Image}:latest"
docker push "${Image}:${GitSha}"

Write-Host "Pushed ${Image}:latest and ${Image}:${GitSha}"
