/**
 * All user-facing Danish strings live here, so wording, app name and status
 * texts can be changed in one place. Code, file names and types stay English.
 */

export const APP_NAME = 'Ready';

export const WEEKDAY_NAMES = ['mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag', 'søndag'] as const;
export const WEEKDAY_SHORT = ['man', 'tirs', 'ons', 'tors', 'fre', 'lør', 'søn'] as const;
export const WEEKDAY_LETTER = ['M', 'T', 'O', 'T', 'F', 'L', 'S'] as const;
export const MONTH_NAMES = [
  'januar', 'februar', 'marts', 'april', 'maj', 'juni',
  'juli', 'august', 'september', 'oktober', 'november', 'december',
] as const;
export const MONTH_SHORT = ['jan.', 'feb.', 'mar.', 'apr.', 'maj', 'juni', 'juli', 'aug.', 'sep.', 'okt.', 'nov.', 'dec.'] as const;

export const texts = {
  app: {
    name: APP_NAME,
    tagline: 'Overblik over din dag',
  },

  tabs: {
    today: 'I dag',
    upcoming: 'Kommende',
    routines: 'Rutiner',
  },

  /** Status card on the front page. Only speaks about registered actions. */
  status: {
    pendingTitle: (n: number) => (n === 1 ? '1 ting først' : `${n} ting først`),
    pendingSubtitle: 'Få styr på dem, før du holder fri.',
    readyTitle: 'Du er klar',
    readyDoneSubtitle: 'Dagens før-fritid-opgaver er klaret.',
    readyNothingSubtitle: 'Ingen før-fritid-opgaver i dag.',
    emptyTitle: 'Få overblik over din dag',
    emptySubtitle: 'Tilføj en opgave eller en ugentlig rutine.',
    progress: (done: number, total: number) => `${done} af ${total} klaret`,
    countLabel: (n: number) => (n === 1 ? '1 opgave' : `${n} opgaver`),
  },

  sections: {
    beforeFreeTime: 'Før fritid',
    otherToday: 'Andet i dag',
    earlier: 'Tidligere',
    tomorrow: 'I morgen',
    doneToday: 'Klaret i dag',
    nothingTomorrow: 'Ingen opgaver i morgen.',
    nothingElseToday: 'Ikke andet i dag.',
  },

  relative: {
    today: 'I dag',
    tomorrow: 'I morgen',
    yesterday: 'I går',
  },

  action: {
    markDone: 'Markér som udført',
    markUndone: 'Fortryd udført',
    done: 'Udført',
    skipped: 'Sprunget over',
    beforeFreeTime: 'Før fritid',
    prepFor: (title: string) => `Forberedelse til ${title}`,
    prepOf: (title: string) => `Forberedelse: ${title}`,
    routine: 'Rutine',
    at: 'kl.',
    from: (date: string) => `Fra ${date}`,
    overdue: 'Fristen er passeret',
    open: 'Vis detaljer',
  },

  toast: {
    done: (title: string) => `“${title}” er markeret som udført`,
    undone: (title: string) => `“${title}” er åben igen`,
    skipped: (title: string) => `“${title}” er sprunget over denne gang`,
    unskipped: (title: string) => `“${title}” er med igen`,
    deleted: (title: string) => `“${title}” er slettet`,
    routineDeleted: (title: string) => `Rutinen “${title}” er slettet`,
    saved: 'Gemt',
    undo: 'Fortryd',
    saveFailed: 'Kunne ikke gemme. Prøv igen.',
    loadFailed: 'Kunne ikke hente data.',
    imported: 'Backup er indlæst',
    exported: 'Backup er klar til at blive gemt',
    demoLoaded: 'Eksempeldata er indlæst',
    allDeleted: 'Alle data er slettet',
  },

  taskForm: {
    newTitle: 'Ny opgave',
    editTitle: 'Redigér opgave',
    title: 'Hvad skal ske?',
    titlePlaceholder: 'F.eks. Lav matematik',
    date: 'Dato',
    time: 'Senest kl.',
    timeOptional: 'Valgfrit',
    note: 'Note',
    notePlaceholder: 'Valgfri note',
    beforeFreeTime: 'Skal være klaret før fritid',
    beforeFreeTimeHint: 'Tæller med i “Du er klar”.',
    hasPrep: 'Kræver forberedelse',
    hasPrepHint: 'F.eks. bage kagen dagen før.',
    prepTitle: 'Hvad skal forberedes?',
    prepTitlePlaceholder: 'F.eks. Bag kage',
    prepDate: 'Forberedes den',
    prepBeforeFreeTime: 'Forberedelsen skal være klaret før fritid',
    prepDateHint: 'Foreslået: dagen før.',
    moreOptions: 'Flere valg',
    fewerOptions: 'Færre valg',
    save: 'Gem',
    create: 'Tilføj',
    cancel: 'Annullér',
    delete: 'Slet opgave',
    deleteConfirm: 'Slet opgaven? Det kan fortrydes lige efter.',
    titleRequired: 'Skriv en titel.',
    dateRequired: 'Vælg en gyldig dato.',
    prepTitleRequired: 'Skriv hvad der skal forberedes.',
    prepDateRequired: 'Vælg en gyldig dato til forberedelsen.',
  },

  routineForm: {
    newTitle: 'Ny rutine',
    editTitle: 'Redigér rutine',
    title: 'Hvad er rutinen?',
    titlePlaceholder: 'F.eks. Gymnastik',
    weekdays: 'Ugedage',
    startDate: 'Gælder fra',
    time: 'Tidspunkt',
    note: 'Note',
    beforeFreeTime: 'Skal være klaret før fritid',
    hasPrep: 'Kræver forberedelse',
    hasPrepHint: 'F.eks. pakke tasken dagen før.',
    prepTitle: 'Hvad skal forberedes?',
    prepTitlePlaceholder: 'F.eks. Pak gymnastiktøj',
    prepDaysBefore: 'Forberedes',
    daysBefore: (n: number) => (n === 0 ? 'samme dag' : n === 1 ? 'dagen før' : `${n} dage før`),
    prepBeforeFreeTime: 'Forberedelsen skal være klaret før fritid',
    paused: 'Sat på pause',
    pausedHint: 'Pausede rutiner viser ingen opgaver.',
    save: 'Gem',
    create: 'Tilføj rutine',
    cancel: 'Annullér',
    delete: 'Slet rutine',
    titleRequired: 'Skriv en titel.',
    weekdaysRequired: 'Vælg mindst én ugedag.',
    startDateRequired: 'Vælg en gyldig startdato.',
    prepTitleRequired: 'Skriv hvad der skal forberedes.',
  },

  routines: {
    empty: 'Ingen rutiner endnu',
    emptyHint: 'Tilføj ting, der gentager sig hver uge, som gymnastik eller træning.',
    add: 'Ny rutine',
    active: 'Aktiv',
    paused: 'På pause',
    pause: 'Sæt på pause',
    resume: 'Genoptag',
    edit: 'Redigér',
    prepLabel: (title: string, daysBefore: number) =>
      `${title} · ${daysBefore === 0 ? 'samme dag' : daysBefore === 1 ? 'dagen før' : `${daysBefore} dage før`}`,
    everyWeek: 'Hver uge',
  },

  upcoming: {
    empty: 'Ingen kommende opgaver',
    emptyHint: 'De næste dage er fri. Tilføj en opgave, hvis der er noget, du skal huske.',
    showMore: (days: number) => `Vis ${days} dage mere`,
    showingDays: (days: number) => `Viser de næste ${days} dage`,
    addToDay: 'Tilføj opgave denne dag',
    overdueSection: 'Tidligere, ikke klaret',
    nothingThisDay: 'Intet',
  },

  occurrence: {
    title: 'Denne gang',
    skip: 'Spring over denne gang',
    unskip: 'Fortryd spring over',
    editRoutine: 'Redigér rutinen',
    hint: 'Ændringer her gælder kun denne ene gang.',
    routineHint: 'Redigering af rutinen gælder alle gange fremover.',
  },

  actionMenu: {
    title: 'Opgave',
    edit: 'Redigér',
    delete: 'Slet',
    close: 'Luk',
  },

  add: {
    button: 'Tilføj',
    task: 'Ny opgave',
    routine: 'Ny rutine',
    label: 'Tilføj opgave',
  },

  settings: {
    title: 'Indstillinger',
    open: 'Åbn indstillinger',
    close: 'Luk',
    install: {
      title: 'Brug som app',
      description: 'Føj Ready til hjemmeskærmen for at åbne den som en almindelig app.',
      button: 'Installér',
      installed: 'Appen er installeret på denne enhed.',
      ios: 'Tryk på Del-ikonet i Safari og vælg “Føj til hjemmeskærm”.',
      android: 'Åbn browserens menu og vælg “Installér app” eller “Føj til startskærm”.',
      desktop: 'Klik på installationsikonet i adresselinjen, hvis din browser viser det.',
    },
    backup: {
      title: 'Backup',
      description: 'Dine data gemmes kun på denne enhed. Tag en backup før telefonskift eller sletning af browserdata.',
      export: 'Eksportér backup',
      import: 'Importér backup',
      importing: 'Læser fil…',
      previewTitle: 'Importér backup?',
      previewBody: 'Alle nuværende data bliver erstattet af indholdet i filen.',
      previewTasks: (n: number) => (n === 1 ? '1 opgave' : `${n} opgaver`),
      previewRoutines: (n: number) => (n === 1 ? '1 rutine' : `${n} rutiner`),
      previewStates: (n: number) => (n === 1 ? '1 afkrydsning' : `${n} afkrydsninger`),
      previewExportedAt: (when: string) => `Eksporteret ${when}`,
      confirm: 'Erstat mine data',
      cancel: 'Annullér',
      errors: {
        'not-json': 'Filen er ikke gyldig JSON.',
        'not-backup': 'Filen ligner ikke en backup fra Ready.',
        'unsupported-version': 'Backuppen er lavet med en version, der ikke understøttes.',
        'invalid-data': 'Filen indeholder ugyldige data og blev ikke indlæst.',
        'read-failed': 'Filen kunne ikke læses.',
      } as const,
      storagePersisted: 'Browseren har lovet at beholde dine data.',
      storageNotPersisted: 'Browseren kan i sjældne tilfælde rydde lokale data. Tag en backup jævnligt.',
    },
    danger: {
      title: 'Slet alt',
      description: 'Fjerner alle opgaver, rutiner og afkrydsninger fra denne enhed.',
      button: 'Slet alle data',
      confirm: 'Slet alle data? Det kan ikke fortrydes. Tag en backup først.',
    },
    demo: {
      title: 'Eksempeldata',
      description: 'Indlæser opgaver og rutiner til test. De kommer ikke tilbage af sig selv, hvis du sletter dem.',
      button: 'Indlæs eksempeldata',
    },
    about: {
      title: 'Om',
      version: (v: string) => `Version ${v}`,
      offline: 'Virker uden internet, når den først er hentet.',
    },
  },

  update: {
    ready: 'Ny version klar',
    reload: 'Opdatér',
    later: 'Senere',
    offlineReady: 'Klar til brug uden internet',
  },

  errors: {
    dbTitle: 'Kunne ikke åbne lokal lagring',
    dbBody:
      'Ready gemmer data i browserens lokale database, men den kunne ikke åbnes. Det sker typisk i privat browsing eller hvis lagring er blokeret.',
    retry: 'Prøv igen',
  },

  time: {
    hour: 'Time',
    minute: 'Minut',
    none: '–',
  },

  common: {
    close: 'Luk',
    back: 'Tilbage',
    yes: 'Ja',
    no: 'Nej',
    loading: 'Henter…',
    optional: 'valgfrit',
  },
} as const;
