set -o pipefail

PUBLIC_URL=https://ara-yjx.github.io/stimulize-beta/ BASE_ROUTE=/stimulize-beta npm run build

hash=$(git rev-parse HEAD)
printf '%s\n' "$hash" > build/git-commit.txt

npx gh-pages -d build --repo git@github.com:Ara-yjx/stimulize-beta.git

echo 'DONE'
