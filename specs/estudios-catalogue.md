# Estudios: courses, certificates and vocational training

Issue: [#56](https://github.com/ana-izaguirre/latino-migra/issues/56)

## Problem

The screen is called **Becas & Estudios** and carries only scholarships. A
visitor who wants to study abroad without funding — a language certificate, a
short course, a vocational qualification (FP / Ausbildung / VET) — finds
nothing. The half of the name that promised them something has never existed.

## Goals

- A studies section reachable from the Becas & Estudios screen.
- Every entry names an official programme and links to its official source.
- An entry whose route also has a scholarship in the catalogue links to it.
- The section is usable on a 375px phone: cards, and the long half of each
  card collapsed behind a disclosure below `lg`.

## Non-goals

- **No Firestore collection.** The scholarship catalogue reads
  `scholarships` from Firestore; the studies catalogue ships bundled with the
  application. A new collection means a new rule in `firestore.rules`, and
  `docs/data.md` puts that behind human approval. Moving this catalogue to
  Firestore is follow-up work, not part of this change.
- **No suggestion form.** "Sugerir Beca Oficial" writes to Firestore. The
  studies equivalent waits for the collection.
- **No search or sort.** The catalogue is twelve entries. A search box over
  twelve rows is furniture, not a feature.
- **No editing of the scholarship catalogue.** Entries link *to* scholarships;
  scholarships do not gain a field pointing back.

## The data model

```ts
type StudyProgrammeKind = "curso" | "certificado" | "fp";

interface StudyProgramme {
  id: string;
  title: string;              // The programme's own name
  kind: StudyProgrammeKind;
  institution: string;        // Who runs it
  officialPortalName: string; // What the reader will see when they arrive
  officialUrl: string;        // https, on the institution's own domain
  country: string;            // Matches Scholarship["country"]
  countryCode: string;
  modality: string;           // "Presencial", "En línea", "Mixta"
  duration: string;
  cost: string;               // Including "Gratuito"; never blank
  description: string;
  outcome: string;            // What the reader holds at the end
  requirements: string[];
  relatedScholarshipIds?: string[];
}
```

`country` and `countryCode` are deliberately the same strings the scholarship
catalogue uses, so a country reads the same on both halves of the screen and
`relatedScholarshipIds` can be checked against the catalogue.

## The official-source rule

The product owner's constraint — *official programmes and official sources
only, each with a link* — is the reason anyone trusts this catalogue, so it is
enforced by code rather than by review habit:

`src/lib/studyProgrammes.ts` exports `validateStudyProgramme`, which rejects an
entry when

- any required field is blank,
- `officialUrl` is not `https:`,
- `officialUrl`'s host is not on `OFFICIAL_STUDY_DOMAINS`, the allowlist of
  institution and government domains this catalogue may cite.

Adding a programme on a new domain is therefore a two-line change: the entry
and the domain it is served from. That is the point — the allowlist is where
someone looks to see which sources the platform vouches for.

**A rejected entry is not dropped silently** (CLAUDE.md constraint 5). The
section renders the valid entries and, above them, a visible warning naming how
many were rejected and why. A catalogue that quietly shrinks is the failure
mode this project already shipped once.

The allowlist cannot check that a URL still resolves. Link rot is real and
this change does not solve it; see *Follow-up*.

## Filters (#83)

Four axes and a name search, all through `FilterChipGroup` with a live count:

| Axis | Options |
| --- | --- |
| Migration route | Abre vía / Requisito de un visado / No abre vía / Sin verificar |
| Country | Every country in the catalogue |
| Kind | Cursos / Certificados / FP |
| Modality | Presencial / En línea / Mixta |

**Migration route comes first.** It is the reason somebody is here rather than
on a course aggregator, and under three other filters it would be buried.

`migrationRoute` is optional on purpose. An entry nobody has checked carries no
value, and "sin verificar" is one of the filter's options rather than a silent
omission — an absent field must not be read as "no route", because not knowing
and knowing there is no route are different facts. `daysLeft` and `isUrgent`
are what this project gets when a filter answers a question it could not
answer. `migrationRouteNote` is required whenever `migrationRoute` is set, and
a unit test fails the build if either appears without the other.

`matchesStudyFilters` is the single definition of the rule. Every chip's count
is that same predicate with one axis relaxed, so the number on a chip is
exactly what selecting it renders.

## Screen behaviour

A fourth tab, **Estudios**, joins Todas las Convocatorias / Mis Becas Favoritas
/ Para mi Perfil. Selecting it:

- replaces the scholarship list with the studies list,
- hides the scholarship-only chrome — the filter sidebar, the mobile quick
  filters, the sort control and the search box — because none of it filters
  what is on screen. Leaving a sort control that sorts nothing is exactly the
  "interface lying about its own behaviour" CLAUDE.md warns about.

Within the section, one filter: kind (Todos / Cursos / Certificados / FP),
rendered with the existing `FilterChipGroup`, which shows a live count per
option.

### Mobile

Each entry is a `Card`. Above `lg` the whole card is open. Below `lg`,
requirements and the "what you end up with" block sit inside the existing
`Disclosure`, whose control is `lg:hidden` and whose panel is `lg:block` — the
same primitive and the same breakpoint the guides (#54) and the scholarship
detail panel (#53) use. The official-source button is never collapsed: it is
the reason the entry exists.

## Acceptance criteria

- [ ] The studies section is reachable from the Becas & Estudios screen
- [ ] Every entry names its official programme and links to its official source
- [ ] An entry with a matching scholarship links to it
- [ ] An entry failing validation is reported on screen, not dropped silently
- [ ] Responsive at 375px and desktop; empty state handled
- [ ] All copy in Spanish, through `t()`

## Edge cases

| Case | Behaviour |
| --- | --- |
| Every entry fails validation | The warning renders and the empty state explains the catalogue could not be read |
| A filter matches nothing | Empty state with a control that clears the filter |
| `relatedScholarshipIds` names an id the loaded catalogue does not have | No link is rendered for it. The catalogue on screen may be the live Firestore one, which can legitimately differ from the bundled ids — inventing a link to a scholarship that is not there is fabricating a record |
| An entry has no related scholarship | No scholarship row. Most entries are in this state; it is normal, not a gap |

## Security

No new network calls, no new Firestore paths, no user input. Every
`officialUrl` opens with `target="_blank"` and `rel="noopener noreferrer"`,
as the scholarship links already do.

## Testing

| Level | What it covers |
| --- | --- |
| Unit (`src/lib/studyProgrammes.test.ts`) | Validation: blank fields, `http:`, an off-allowlist host, a good entry. Plus a data test asserting every shipped entry passes and every `relatedScholarshipIds` names a scholarship that exists |
| Component (`src/components/EstudiosSection.test.tsx`) | Renders through `renderWithProviders`: entries appear, the official link points at the entry's URL, the kind filter narrows the list and its counts, an invalid entry produces the visible warning, the related-scholarship link appears only when the catalogue holds that id |

The data test is the one that matters most: it is what stops entry thirteen
from arriving without a source.

## Follow-up

- Link rot: nothing verifies these URLs still resolve. A scheduled job that
  requests each `officialUrl` and opens an issue on a non-200 would.
- Moving the catalogue to Firestore, with the rule and the seeding path the
  scholarships already have.
