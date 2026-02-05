set -o pipefail

PUBLIC_URL=https://stimulize.org/ npm run build

hash=$(git rev-parse HEAD)
printf '%s\n' "$hash" > build/git-commit.txt

GIT_SSH_COMMAND='ssh -i ~/.ssh/spbuilder-team' npx gh-pages -d build --repo git@github.com:spbuilder-team/spbuilder-stimulize.git --cname stimulize.org

echo 'DONE'
