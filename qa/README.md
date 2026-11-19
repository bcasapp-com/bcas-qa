# QA — E2E

Tests end-to-end con Playwright (Page Object Model) y reportes en Allure.

## Puesta en marcha

1. Copia `.env.example` a `.env` y rellena las credenciales (nunca se comitea).
2. Instala dependencias desde la raíz del repo con `pnpm install` (nunca `npm`).

## Comandos (desde la raíz o desde `qa/`)

```bash
pnpm test:e2e                   # correr todos los tests
pnpm test:e2e --grep @smoke     # correr solo los tests con un tag
pnpm test:e2e:ui                # modo UI interactivo
pnpm allure:generate            # generar el reporte de Allure
pnpm allure:open                # abrir el reporte de Allure
```

## Estructura

- `pages/` — Page Objects (y `components/` para piezas compartidas). Todos extienden `BasePage`.
- `assertions/` — aserciones de dominio reutilizables (`expectLoanDetailShowsStudent`, `expectAmountLimitEnforced`, `expectProfileSaved`…). Cada una es un `test.step` con `box: true`, así un fallo apunta a la línea del test que la llama.
- `tests/` — specs por feature (`setup/` guarda las sesiones del agente de la escuela y del agente interno del dashboard)
- `fixtures/` — fixtures de Playwright y rutas de sesión. Los specs importan siempre de `fixtures/test.ts`, que une las capas:
  - `browser-fixtures.ts` — páginas del navegador (`page`, `agentPage`, `studentPage`), idioma, mock de direcciones, banner de cookies y diagnóstico de red
  - `api-fixtures.ts` — clientes de API, cada uno con su propia sesión
  - `page-fixtures.ts` — Page Objects, sin navegar ni crear datos
  - `test.ts` — fixtures de flujo que preparan datos (`createdLoan`, `signedUpStudent`, `studentInFormalization`)
- `api/` — preparación de datos por API (p. ej. crear una financiación antes de editarla)
- `data/` y `utils/` — datos de prueba, reglas de negocio, rutas, tags y helpers puros

## Page Objects

Todas las páginas siguen el mismo contrato:

- `goto(...)` — solo navega. Para los tests que esperan una redirección.
- `open(...)` — navega y espera a que la página esté lista.
- `waitForLoaded(...)` — espera a que la página esté lista tras una navegación que hace la app.

Los Page Objects exponen localizadores y acciones; las aserciones van en el test o en `assertions/`.

## Reglas básicas

- Selectores, por orden de preferencia: `getByTestId` (los `data-test-id` de la app no dependen del idioma) o `getByRole` con nombre accesible; CSS, ids o clases solo como último recurso y con un comentario que explique por qué. Las páginas de terceros (Stripe) usan `getByRole` con un regex en inglés y español (`data/third-party-labels.ts`).
- Textos de la app: los tests fuerzan el español con la cookie `lang` (`TEST_LOCALE` en `data/app-labels.ts`). Los textos usados como nombre accesible van en `data/app-labels.ts`, los mensajes en `data/error-messages.ts` y `data/success-messages.ts`.
- Tags: nativos de Playwright (`{ tag: TAG.validation }`), definidos en `utils/tags.ts`. Los comunes van en el `describe`. Allure los muestra como tags. Story y severity se ponen con `annotate()`.
- Títulos: no cambies el título de un test, ni su `describe` o su fichero, sin motivo: Allure pierde el historial de ese test.
- Nacionalidades: no hay ninguna fija. Las reglas por tipo de documento están en `documentRules` (`data/identity-documents.ts`), definidas sobre España y la lista oficial de la UE (`data/countries.ts`). El catálogo de países se lee del desplegable del perfil del alumno y el test elige al azar una nacionalidad permitida, que queda registrada en el reporte (`recordTestData`).
- Dirección: el buscador de Google Places se mockea en todos los specs (`fixtures/address-search-mock.ts`) con las direcciones de `data/addresses.ts`. Solo `tests/address-search/` usa Google real, con `test.use({ mockAddressSearch: false })`. Una dirección nueva para los tests se añade en `data/addresses.ts`.
- Banner de cookies: `browser-fixtures.ts` lo rechaza con `page.addLocatorHandler` cada vez que aparece, así que ningún test lo cierra a mano.
- Tablas de escenarios: en el spec si solo la usa ese spec; en `data/` si la comparten varios. Las reglas de negocio (p. ej. `documentRules`) van siempre en `data/`.
