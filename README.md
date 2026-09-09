# Ready

Hverdagsoverblik til en teenager: *hvad bør jeg have ordnet, før jeg holder fri?*

Ready er en installérbar web-app (PWA) uden konto, backend eller notifikationer. Alle data
gemmes lokalt i browserens IndexedDB. Appen hostes som statiske filer på GitHub Pages:
<https://casperwollesen.github.io/Conrad/>

Brugerfladen er på dansk; kode, filnavne og typer er på engelsk. Appnavn og alle tekster
ligger samlet i [`src/texts.ts`](src/texts.ts), så de er lette at ændre.

## Funktioner

- **I dag** – dato, et roligt statuskort (“2 ting først” / “Du er klar”), afventende
  før-fritid-opgaver (inkl. tidligere, ikke klarede), andre opgaver i dag, et kig på i morgen
  og en sammenklappelig “Klaret i dag”.
- **Kommende** – dagsgrupperet liste 14 dage frem (kan udvides op til 13 uger), med
  tidligere ikke-klarede øverst og en “+” pr. dag til at oprette en opgave på netop den dato.
- **Rutiner** – ugentlige rutiner på én eller flere ugedage, med valgfri forberedelse et antal
  dage før, pause/genoptag og redigering.
- **Opgaver med forberedelse** – fx “Kage med i skole fredag kl. 08.00” med forberedelsen
  “Bag kage” torsdag. Forberedelse og hovedhandling afkrydses hver for sig.
- **Hurtig afkrydsning med fortryd** – ingen bekræftelsesdialoger ved almindelige handlinger.
- **Spring over denne gang** – for én konkret rutineforekomst, uden at røre resten af rutinen.
- **Backup** – eksport/import af én JSON-fil med validering, forhåndsvisning og atomisk erstatning.
- **Offline** – service worker cacher appen; alt virker uden internet efter første indlæsning.
- **Opdateringer** – “Ny version klar” med en knap; appen genindlæser aldrig af sig selv.

Bevidst udeladt (version 1): notifikationer, forældrekontrol, computerspærring, skærmtid,
sociale funktioner, point/streaks, kalenderintegration, cloud-sync, flere brugere.

## Teknologi

| Del                | Valg                                                   |
| ------------------ | ------------------------------------------------------ |
| UI                 | React 19, TypeScript (strict), almindelig CSS + tokens |
| Build              | Vite 7                                                 |
| Lagring            | IndexedDB via Dexie 4                                  |
| PWA                | vite-plugin-pwa (manifest, service worker, offline)    |
| Ikoner             | lucide-react                                           |
| Test               | Vitest 4 (+ fake-indexeddb til lagringstests)          |
| Hosting            | GitHub Pages via GitHub Actions                        |

Ingen router, ingen global state-bibliotek, ingen eksterne CDN-kald. Skrifttypen er
systemets egen.

## Kom i gang

Kræver Node.js 20.19+ eller 22.12+ og npm.

```bash
npm install
```

```bash
npm run dev
```

Dev-serveren kører på <http://localhost:5173/Conrad/> (appen ligger på samme understi som på
GitHub Pages, så stier kan testes lokalt). Service worker er slået fra i dev.

Eksempeldata: I dev-tilstand findes knappen **Indlæs eksempeldata** under Indstillinger. I
produktion vises den kun, hvis URL'en indeholder `?demo`. Eksempeldata kommer aldrig tilbage af
sig selv efter sletning.

### Scripts

| Kommando            | Gør                                                   |
| ------------------- | ----------------------------------------------------- |
| `npm run dev`       | Udviklingsserver med hot reload                       |
| `npm run typecheck` | `tsc --noEmit`                                        |
| `npm test`          | Kører alle Vitest-tests én gang                       |
| `npm run build`     | Typecheck + produktionsbuild til `dist/`              |
| `npm run preview`   | Serverer `dist/` lokalt (brug denne til offline-test) |
| `npm run icons`     | Regenererer PNG-ikonerne i `public/`                  |

### Offline-test af et produktionsbuild

```bash
npm run build && npm run preview
```

Åbn <http://localhost:4173/Conrad/>, vent til siden er indlæst (service worker installeres),
slå netværk fra i DevTools (eller sluk wifi) og genindlæs. Appen skal åbne, vise data og kunne
oprette/afkrydse som normalt.

## Deployment til GitHub Pages

Workflowet [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) kører ved push til
`main`: `npm ci` → typecheck → test → build → deploy med `actions/deploy-pages`.

**Manuel engangsopsætning i GitHub:** Repository → *Settings* → *Pages* → *Build and
deployment* → *Source*: vælg **GitHub Actions**. Uden dette trin fejler deploy-jobbet.

Base path: `vite.config.ts` bruger `BASE_PATH` (standard `/Conrad/`). Workflowet sætter den
automatisk til `/<repository-navn>/`, så et omdøbt repository virker uden ændringer. Til hosting på
domænets rod: `BASE_PATH=/ npm run build`.

## Arkitektur

```
src/
  texts.ts              Alle danske tekster og appnavn
  domain/               Ren logik uden React (fuldt testet)
    types.ts            Datamodel
    dates.ts            Lokale kalenderdatoer, ugedage, DST-sikker addDays
    tasks.ts            Task -> Action(s)
    routines.ts         Rutine -> forekomster -> Action(s)
    actions.ts          Klar-status, sortering, dagsgruppering, "i dag"-model
    backup.ts           Backupformat og validering
    ids.ts              Stabile id'er
  storage/
    db.ts               Dexie-skema (versioneret)
    repository.ts       Alle læse/skrive-operationer, transaktioner
    demoData.ts         Eksempeldata (kun via eksplicit knap)
  ui/
    components/         Genbrugelige byggeklodser (Sheet, ActionCard, Toggle …)
    views/              I dag, Kommende, Rutiner, editorer, indstillinger
    hooks/              Ur/dato, live data fra IndexedDB, toast, install-prompt
    useActions.ts       Brugerhandlinger med fejlhåndtering og fortryd
  styles/               tokens.css (design tokens), base, components, views
```

UI'et læser altid fra databasen via Dexies `liveQuery`, så en opgave vises kun som gemt eller
udført, hvis skrivningen faktisk lykkedes. Fejler en skrivning, vises en fejl-toast, og
skærmen forbliver uændret.

## Datamodel

- **Task** – enkeltopgave: `title`, `date` (YYYY-MM-DD), valgfrit `time` (HH:MM), `note`,
  `beforeFreeTime`, `completedAt` og valgfri `prep` `{ title, date, beforeFreeTime, completedAt }`.
  Hovedhandling og forberedelse er to trin (`main`/`prep`) på samme opgave med hver sin
  afkrydsning.
- **Routine** – gentagelsesregel: `weekdays` (1 = mandag … 7 = søndag), `startDate`, valgfrit
  `time`, `note`, `beforeFreeTime`, valgfri `prep` `{ title, daysBefore, beforeFreeTime }`, `paused`.
- **OccurrenceState** – status for ét trin af én konkret forekomst. Id =
  `routineId|eventDate|stepId`, hvor `eventDate` altid er datoen for hovedhandlingen. Forberedelsen
  til fredag identificeres altså som fredagens forekomst, selv om den udføres torsdag. Kun
  `done`/`skipped` gemmes; afventende forekomster har ingen række.
- **Setting** – små nøgle/værdi-indstillinger (fx om install-hintet er lukket).
- **Action** (beregnet, gemmes ikke) – en konkret, afkrydsbar ting på en konkret dato, afledt
  af opgaver og rutiner. Har stabilt id (`task:<id>:<step>` / `routine:<id>:<eventDate>:<step>`).

## Dato- og gentagelsesregler

- Datoer er lokale kalenderdatoer som strenge (`YYYY-MM-DD`); klokkeslæt er separate `HH:MM` i
  lokal tid. “I dag” bestemmes fra den lokale dato, aldrig UTC.
- `addDays` bruger kalenderen (`new Date(y, m, d + n, 12)`), ikke 24-timers-multipla, så
  måneds-, års- og sommertidsskift håndteres korrekt.
- Rutineforekomster beregnes fra `startDate` og frem til dagens dato + 91 dage, hver gang appen
  åbnes, kommer i forgrunden eller passerer midnat, mens den er åben. Ingen baggrundsproces.
- Forberedelser, der ville ligge før `startDate`, genereres ikke – en ny rutine skaber ikke et
  historisk efterslæb.
- Pausede rutiner giver ingen forekomster.
- Ændringer i en rutine gælder fremad. Status gemmes pr. forekomst, så allerede udførte
  forekomster dukker ikke op igen.

### Reglen for “Du er klar”

En handling er *afventende før fritid*, når den (1) er markeret “skal være klaret før fritid”,
(2) har dato i dag eller tidligere og (3) hverken er udført eller sprunget over. Status er klar,
når der ikke er nogen sådanne handlinger. Fremtidige handlinger blokerer aldrig; en forberedelse
kan blokere i dag, selv om hovedhandlingen er i morgen. Et passeret klokkeslæt markerer aldrig
noget som udført, og opgaver uden klokkeslæt vises ikke som forsinkede på selve dagen.

Tidligere, ikke klarede handlinger forsvinder ikke ved midnat. De ligger øverst i “Før fritid”
(hvis de tæller) eller i en sammenklappelig “Tidligere”-sektion, indtil de udføres, får ny dato,
springes over (rutiner) eller slettes.

## Backup

Indstillinger → **Eksportér backup** gemmer én JSON-fil:

```json
{
  "app": "ready",
  "formatVersion": 1,
  "exportedAt": "2026-09-09T18:00:00.000Z",
  "data": { "tasks": [], "routines": [], "occurrenceStates": [], "settings": [] }
}
```

**Importér backup** validerer struktur, felter, datoer og version, viser hvad der importeres
(antal opgaver, rutiner, afkrydsninger og eksporttidspunkt) og kræver bekræftelse. Erstatningen
sker i én IndexedDB-transaktion; fejler noget, ændres intet. Ugyldige eller ikke-understøttede
filer afvises med en forklaring uden at røre eksisterende data.

`navigator.storage.persist()` kaldes første gang, der gemmes noget. Det er ingen garanti – det
står også i indstillingerne, sammen med opfordringen til at tage backup før telefonskift.

## Tests

```bash
npm test
```

Testene ligger ved siden af koden (`src/**/*.test.ts`) og dækker bl.a. de 12 scenarier fra
kravspecifikationen: før-fritid-regel i dag/i morgen, kageeksemplet (bagning 10. sep., medbring
11. sep. kl. 08.00, uafhængig afkrydsning), gymnastik tirsdag/fredag → pakning mandag/torsdag,
afkrydsning pr. forekomst, spring over, uafsluttede handlinger over datoskift, intet historisk
efterslæb, måneds-/års-/sommertidsskift samt eksport/import og afvisning af ugyldig import.

## Kendte begrænsninger

- Ingen sammenfletning ved import; en backup erstatter alt.
- Native datovælger (`<input type="date">`) følger enhedens sprog. Tidspunkter vælges med to
  24-timers-lister (time og minut i 5-minutters trin), så der er aldrig AM/PM.
- iOS Safari viser ikke en automatisk install-prompt; appen viser i stedet en kort vejledning
  (“Del → Føj til hjemmeskærm”).
- Vedvarende lagring afhænger af browseren; backup er den reelle sikkerhed.
- Der er ingen bulk-handling til at rydde mange gamle, ikke-klarede rutineforekomster; de
  håndteres én ad gangen (udfør, spring over) eller ved at sætte rutinen på pause.
