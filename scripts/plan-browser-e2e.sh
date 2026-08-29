#!/usr/bin/env bash
set -euo pipefail

base_ref="${1:?base ref required}"
shift
changed_files=("$@")

scope=none
specs=()

rank() {
  case "$1" in
    none) echo 0 ;;
    targeted) echo 1 ;;
    cross-browser) echo 2 ;;
    full) echo 3 ;;
    *) echo 99 ;;
  esac
}

promote() {
  local candidate="$1"
  if [ "$(rank "$candidate")" -gt "$(rank "$scope")" ]; then
    scope="$candidate"
  fi
}

add_spec() {
  local candidate="$1"
  local existing
  for existing in "${specs[@]:-}"; do
    [ "$existing" = "$candidate" ] && return 0
  done
  specs+=("$candidate")
}

if [[ "$base_ref" == integration/* ]]; then
  for file in "${changed_files[@]}"; do
    case "$file" in
      tests/e2e/*.spec.ts)
        promote targeted
        add_spec "$file"
        ;;
    esac
  done
else
  for file in "${changed_files[@]}"; do
    case "$file" in
      .github/workflows/e2e.yml|playwright.config.ts|package.json|package-lock.json|astro.config.mjs)
        promote full
        ;;

      src/middleware.ts|src/pages/login.astro|src/pages/cuenta.astro|src/pages/index.astro|src/pages/api/auth/*|src/platform/auth/*|src/platform/layouts/*|src/platform/styles/global.css|src/pages/bateria/\[unit\]/*|src/courses/bateria/components/CourseArticleLayout.astro|src/courses/bateria/contentRegistry.ts)
        promote cross-browser
        ;;

      tests/e2e/critical-smoke.spec.ts)
        promote cross-browser
        ;;

      tests/e2e/*.spec.ts)
        promote targeted
        add_spec "$file"
        ;;

      src/platform/components/InlineNotationScores.astro|src/platform/components/CourseScoreReferences.astro|src/platform/notation/*|src/courses/bateria/components/NotationStudyModes.astro|src/courses/bateria/components/RudimentNotationAutoEmbed.astro)
        promote targeted
        add_spec tests/e2e/first-sight.spec.ts
        add_spec tests/e2e/musicxml-playback-audit.spec.ts
        ;;

      src/platform/components/Metronome.astro|src/platform/components/MetronomeCompact.astro|src/platform/metronome/*)
        promote targeted
        add_spec tests/e2e/phase2-u10-complete.spec.ts
        ;;

      src/platform/components/PracticeTimer.astro|src/platform/components/PracticeSectionTimers.astro)
        promote targeted
        add_spec tests/e2e/practice-timer.spec.ts
        ;;
    esac
  done
fi

if [ "$scope" = targeted ] && [ "${#specs[@]}" -eq 0 ]; then
  echo 'TARGETED scope requires at least one explicit E2E spec.' >&2
  exit 1
fi

specs_line=''
if [ "${#specs[@]}" -gt 0 ]; then
  printf -v specs_line '%s ' "${specs[@]}"
  specs_line="${specs_line% }"
fi

printf 'scope=%s\n' "$scope"
printf 'specs=%s\n' "$specs_line"
