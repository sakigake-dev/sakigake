/**
 * dependency-cruiser config - DDD レイヤー違反の自動検知
 *
 * このファイルが Sakigake の architecture の番人。
 * pnpm depcruise で `Domain が Infrastructure を直接 import している` 等の
 * アンチパターンを CI レベルでブロックする。
 */
module.exports = {
  forbidden: [
    {
      name: 'no-domain-to-application',
      severity: 'error',
      comment:
        'Domain 層は Application 層に依存してはならない (依存方向: Application → Domain ← Infrastructure)',
      from: { path: '^src/contexts/[^/]+/domain' },
      to: { path: '^src/contexts/[^/]+/application' },
    },
    {
      name: 'no-domain-to-infrastructure',
      severity: 'error',
      comment: 'Domain 層は Infrastructure 層に依存してはならない',
      from: { path: '^src/contexts/[^/]+/domain' },
      to: { path: '^src/contexts/[^/]+/infrastructure' },
    },
    {
      name: 'no-domain-to-presentation',
      severity: 'error',
      comment: 'Domain 層は Presentation 層に依存してはならない',
      from: { path: '^src/contexts/[^/]+/domain' },
      to: { path: '^src/contexts/[^/]+/presentation' },
    },
    {
      name: 'no-domain-to-framework',
      severity: 'error',
      comment:
        'Domain 層は framework / 外部 SaaS に依存してはならない (Next.js / Supabase / Stripe / Clerk / Inngest / React)',
      from: { path: '^src/contexts/[^/]+/domain' },
      to: {
        path: 'node_modules/(next|@supabase|@clerk|stripe|@stripe|inngest|svix|react|react-dom)',
      },
    },
    {
      name: 'no-application-to-infrastructure',
      severity: 'error',
      comment: 'Application 層は Infrastructure 層を直接 import してはならない (interface 経由のみ)',
      from: { path: '^src/contexts/[^/]+/application' },
      to: { path: '^src/contexts/[^/]+/infrastructure' },
    },
    {
      name: 'no-application-to-presentation',
      severity: 'error',
      from: { path: '^src/contexts/[^/]+/application' },
      to: { path: '^src/contexts/[^/]+/presentation' },
    },
    {
      name: 'no-cross-context-direct',
      severity: 'error',
      comment:
        'Bounded Context 間は直接 import 禁止 (hooks/interfaces 経由のみ、または shared kernel を使う)',
      from: { path: '^src/contexts/([^/]+)/' },
      to: {
        path: '^src/contexts/',
        pathNot: '^src/contexts/$1/',
      },
    },
    {
      name: 'no-circular',
      severity: 'error',
      comment: '循環依存禁止',
      from: {},
      to: { circular: true },
    },
    {
      name: 'no-orphans',
      severity: 'warn',
      comment: 'どこからも import されていないファイル (削除候補)',
      from: {
        orphan: true,
        pathNot: [
          '\\.(test|spec)\\.[jt]sx?$',
          '\\.d\\.ts$',
          'src/app/',
          'src/middleware',
          'src/instrumentation',
          'next\\.config',
          'tailwind\\.config',
          'postcss\\.config',
          'vitest\\.config',
          'eslint\\.config',
          '\\.dependency-cruiser',
          'src/contexts/[^/]+/(infrastructure/external|application/hooks|application/events|domain/events/DomainEvent)',
          'src/contexts/[^/]+/domain/repositories/',
        ],
      },
      to: {},
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    includeOnly: '^src',
    tsConfig: {
      fileName: 'tsconfig.json',
    },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
      mainFields: ['module', 'main', 'types', 'typings'],
    },
    reporterOptions: {
      dot: {
        collapsePattern: 'node_modules/(?:@[^/]+/)?[^/]+',
      },
      archi: {
        collapsePattern:
          '^(packages|src|lib|app|test|spec)/[^/]+|^node_modules/(?:@[^/]+/)?[^/]+',
      },
    },
  },
};
