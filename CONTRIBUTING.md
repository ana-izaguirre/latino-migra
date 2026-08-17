# Contribuir a LatinoMigra

## Comandos

```bash
npm run dev            # servidor de desarrollo
npm run lint           # ESLint + TypeScript
npm run lint:fix       # corrige lo autocorregible
npm run format         # aplica Prettier
npm run format:check   # verifica formato (lo que corre CI)
npm run test:coverage  # unit tests + cobertura con umbrales
npm run test:e2e       # Playwright (escritorio + móvil)
```

## Reglas para fusionar en `main`

CI bloquea el merge si falla cualquiera de estas comprobaciones:

| Comprobación | Qué verifica |
|---|---|
| `format:check` | Prettier |
| `lint` | ESLint (0 errores) + `tsc --noEmit` |
| `test:coverage` | Tests y umbrales de cobertura |
| `e2e-tests` | Playwright en escritorio y móvil |

### Configuración en GitHub (una sola vez)

**Settings → Branches → Add branch ruleset** sobre `main`:

- ☑️ Require a pull request before merging
- ☑️ Require status checks to pass → seleccionar `Fast Unit Tests & Typecheck` y `End-to-End Tests`
- ☑️ Require branches to be up to date before merging
- ☑️ Block force pushes

Como el proyecto lo mantiene una sola persona, **no** actives "Require approvals": te bloquearías a ti misma. La protección útil aquí es que los tests pasen, no que alguien apruebe.

## Sobre el umbral de cobertura

Los umbrales viven en `vitest.config.ts` y funcionan como **trinquete**: están justo por debajo de la cobertura actual, así que nunca puede bajar, y se suben conforme entran tests.

Un umbral global del 95% no es realista hoy y sería contraproducente. El proyecto tiene ~11.900 líneas de componentes frente a ~1.550 de lógica pura. Llegar al 95% global obligaría a escribir miles de líneas de tests que sobre todo comprueban que el JSX se renderiza, lo cual da una falsa sensación de seguridad y frena cada cambio.

La estrategia que sí funciona:

1. **Cobertura alta donde importa**: `src/lib` es lógica pura y verificable. `PreferencesContext` ya está al 100% y tiene un umbral propio del 95%.
2. **Trinquete global**: no puede bajar, y sube con cada PR que añada tests.
3. **Cobertura del cambio**: lo nuevo llega cubierto. Con Codecov se puede exigir por PR sin necesidad de arreglar todo el pasado.

Meta razonable a medio plazo: 70% global con `src/lib` por encima del 90%.

## Estilo

- Los componentes usan `const X: React.FC<Props> = ({...}) =>`.
- Todo texto visible pasa por `t()` de `src/lib/i18n.tsx`, no por ternarios `language === "en" ? ...`.
- Nada se guarda en `localStorage` ni `sessionStorage`; hay un test que lo verifica.
