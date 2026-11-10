# beginner3d-plugins

Pluginy do [scadpada](https://beginner3d.duckdns.org/edytor/) — edytora OpenSCAD
w przeglądarce, który chodzi na stronie Beginner3D.

Edytor jest rdzeniem bez wiedzy o pluginach; ten katalog to ich publiczna baza.
Plugin to jeden plik, który eksportuje `setup(ctx)` i dostaje wąski, udokumentowany
kontrakt: przyciski w pasku, sekcje w panelu, dostęp do kodu modelu, geometrii
i paska statusu.

```js
// plugins/moj-plugin/index.js
export default {
  id: 'moj-plugin',
  setup(ctx) {
    const remove = ctx.ui.addToolbarButton({
      label: 'Zrób coś',
      onClick() {
        const stats = ctx.model.getStats();
        ctx.ui.setStatus(`Wymiary: ${stats.size.join(' × ')} mm`, 'ok');
      },
    });
    return remove;
  },
};
```

## Co jest w środku

```
plugins/
  index.json            ← lista pluginów (id, nazwa, wersja, ścieżka)
  kopiuj-wymiary/       ← wzory do skopiowania
  eksport-obj/
scripts/validate.mjs    ← sprawdza każdy plugin: import + kontrakt + zgodność id
```

Pełne API `ctx` (i zasady bezpieczeństwa) opisuje dokumentacja w repo strony:
`scadpad/docs/PLUGINS.md`.

## Jak dodać plugin

1. Skopiuj `plugins/kopiuj-wymiary/` pod nową nazwą.
2. Zmień `id`, kod i `version`.
3. Dopisz wpis w `plugins/index.json`:

   ```json
   { "id": "moj-plugin", "name": "Mój plugin", "version": "1.0.0", "path": "moj-plugin", "api": 1 }
   ```

4. Uruchom walidację:

   ```bash
   node scripts/validate.mjs
   ```

5. Wyślij pull request. CI sprawdzi import, kontrakt `setup()` i zgodność `id`.

## Jak plugin trafia na stronę

Plugin jest kodem wykonywanym na stronie Beginner3D, więc **nie jest ładowany
z GitHuba**: CSP strony (`script-src 'self'`) nie wpuszcza skryptów z obcych
domen. Włączenie pluginu to krok wdrożenia: katalog trafia do
`scadpad/public/plugins/` w repo strony i jest publikowany razem z edytorem.

Po scaleniu PR-a właściciel strony synchronizuje katalog:

```bash
cd /opt/beginner3d/scadpad
./scripts/sync-plugins.sh /opt/beginner3d-plugins
npm run build && ./integration/beginner3d/install.sh
```

Dlatego PR jest jednocześnie propozycją kodu i decyzją o zaufaniu: plugin może
czytać DOM strony i `localStorage`. Nie umieszczaj tu sekretów ani kodu, którego
nie chcesz widzieć na stronie.

## Zasady dla pluginów

- Tylko pola z `ctx` — bez sięgania do `window.scadpad` i do DOM edytora.
- Brak zewnętrznych zależności: jeden plik ES module, bez importów z sieci.
- Brak `fetch` do obcych serwisów.
- Każda akcja użytkownika kończy się komunikatem w `ctx.ui.setStatus`.
- Sprzątaj po sobie: zwróć funkcję usuwającą to, co dodałeś.

## Licencja

MIT — patrz [LICENSE](LICENSE).
