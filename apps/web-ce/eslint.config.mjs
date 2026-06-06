import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "public/**",
  ]),
  {
    files: [
      "**/src/actions/growth.ts",
      "**/src/app/(dashboard)/clients/page.tsx",
      "**/src/app/(dashboard)/procedures/[id]/page.tsx",
      "**/src/app/(dashboard)/settings/statuses/actions.ts",
      "**/src/app/(dashboard)/templates/[id]/edit/page.tsx",
      "**/src/app/(dashboard)/templates/[id]/page.tsx",
      "**/src/app/(dashboard)/templates/new/actions.ts",
      "**/src/components/procedures/__tests__/procedure-card.test.tsx",
      "**/src/components/procedures/kanban-board.tsx",
      "**/src/components/procedures/procedure-card.tsx",
      "**/src/components/settings/statuses-manager.tsx",
      "**/src/components/templates/template-config-panel.tsx",
      "**/src/components/templates/template-form.tsx",
      "**/src/components/templates/template-step-card.tsx",
      "**/src/components/templates/template-timeline.tsx",
      "**/src/components/templates/templates-table.tsx",
      "**/src/components/templates/templates-view.tsx"
    ],
    rules: {
      "@typescript-eslint/ban-ts-comment": "off",
    },
  },
]);

export default eslintConfig;
