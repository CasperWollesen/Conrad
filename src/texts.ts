/**
 * All user-facing strings live here, so wording, app name and status texts can
 * be changed in one place.
 */

export const APP_NAME = 'Ready';

export const WEEKDAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
export const WEEKDAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
export const WEEKDAY_LETTER = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;
export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;
export const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

export const texts = {
  app: {
    name: APP_NAME,
    tagline: 'Your day at a glance',
  },

  tabs: {
    today: 'Today',
    upcoming: 'Upcoming',
    routines: 'Routines',
  },

  /** Status card on the front page. Only speaks about registered actions. */
  status: {
    pendingTitle: (n: number) => (n === 1 ? '1 thing first' : `${n} things first`),
    pendingSubtitle: 'Get these done before free time.',
    readyTitle: "You're ready",
    readyDoneSubtitle: "Today's before-free-time tasks are done.",
    readyNothingSubtitle: 'No before-free-time tasks today.',
    emptyTitle: 'Get your day in view',
    emptySubtitle: 'Add a task or a weekly routine.',
    progress: (done: number, total: number) => `${done} of ${total} done`,
    bedtimeEyebrow: 'Bedtime',
    bedtimeTitle: 'Good night',
    bedtimeSubtitle: (until: string) => `Time to rest. Your overview is back at ${until}.`,
  },

  sections: {
    beforeFreeTime: 'Before free time',
    otherToday: 'Also today',
    earlier: 'Earlier',
    tomorrow: 'Tomorrow',
    doneToday: 'Done today',
    nothingTomorrow: 'Nothing planned for tomorrow.',
  },

  relative: {
    today: 'Today',
    tomorrow: 'Tomorrow',
    yesterday: 'Yesterday',
  },

  action: {
    markDone: 'Mark as done',
    markUndone: 'Undo done',
    done: 'Done',
    skipped: 'Skipped',
    beforeFreeTime: 'Before free time',
    prepFor: (title: string) => `Preparation for ${title}`,
    prepOf: (title: string) => `Preparation: ${title}`,
    routine: 'Routine',
    at: 'at',
    from: (date: string) => `From ${date}`,
    open: 'Show details',
  },

  toast: {
    done: (title: string) => `“${title}” marked as done`,
    undone: (title: string) => `“${title}” is open again`,
    skipped: (title: string) => `“${title}” skipped this time`,
    unskipped: (title: string) => `“${title}” is back on`,
    deleted: (title: string) => `“${title}” deleted`,
    routineDeleted: (title: string) => `Routine “${title}” deleted`,
    undo: 'Undo',
    saveFailed: "Couldn't save. Please try again.",
    imported: 'Backup imported',
    exported: 'Backup ready to save',
    demoLoaded: 'Sample data loaded',
    allDeleted: 'All data deleted',
  },

  taskForm: {
    newTitle: 'New task',
    editTitle: 'Edit task',
    title: 'What needs to happen?',
    titlePlaceholder: 'e.g. Do maths homework',
    date: 'Date',
    time: 'Deadline',
    timeToggle: 'Set a deadline',
    note: 'Note',
    notePlaceholder: 'Optional note',
    beforeFreeTime: 'Must be done before free time',
    beforeFreeTimeHint: 'Counts towards “You’re ready”.',
    hasPrep: 'Needs preparation',
    hasPrepHint: 'e.g. bake the cake the day before.',
    prepTitle: 'What needs preparing?',
    prepTitlePlaceholder: 'e.g. Bake cake',
    prepDate: 'Prepare on',
    prepBeforeFreeTime: 'Preparation must be done before free time',
    prepDateHint: 'Suggested: the day before.',
    save: 'Save',
    create: 'Add',
    cancel: 'Cancel',
    delete: 'Delete task',
    titleRequired: 'Enter a title.',
    dateRequired: 'Pick a valid date.',
    dateInPast: 'Pick today or a later date.',
    timeInPast: 'That time has already passed.',
    prepTitleRequired: 'Enter what needs preparing.',
    prepDateRequired: 'Pick a valid date for the preparation.',
    prepDateInPast: 'The preparation cannot be earlier than today.',
    prepDateAfterMain: 'The preparation must be on or before the task date.',
  },

  routineForm: {
    newTitle: 'New routine',
    editTitle: 'Edit routine',
    title: 'What is the routine?',
    titlePlaceholder: 'e.g. Gymnastics',
    weekdays: 'Weekdays',
    startDate: 'Starts from',
    time: 'Time',
    timeToggle: 'Set a time',
    note: 'Note',
    beforeFreeTime: 'Must be done before free time',
    hasPrep: 'Needs preparation',
    hasPrepHint: 'e.g. pack the bag the day before.',
    prepTitle: 'What needs preparing?',
    prepTitlePlaceholder: 'e.g. Pack gym clothes',
    prepDaysBefore: 'Prepare',
    daysBefore: (n: number) => (n === 0 ? 'same day' : n === 1 ? 'the day before' : `${n} days before`),
    fewerDays: 'Fewer days before',
    moreDays: 'More days before',
    prepBeforeFreeTime: 'Preparation must be done before free time',
    paused: 'Paused',
    pausedHint: 'Paused routines show no tasks.',
    save: 'Save',
    create: 'Add routine',
    cancel: 'Cancel',
    delete: 'Delete routine',
    titleRequired: 'Enter a title.',
    weekdaysRequired: 'Pick at least one weekday.',
    startDateRequired: 'Pick a valid start date.',
    startDateInPast: 'Pick today or a later date.',
    prepTitleRequired: 'Enter what needs preparing.',
  },

  routines: {
    empty: 'No routines yet',
    emptyHint: 'Add things that repeat every week, like gymnastics or training.',
    add: 'New routine',
    active: 'Active',
    paused: 'Paused',
    pause: 'Pause',
    resume: 'Resume',
    edit: 'Edit',
    prepLabel: (title: string, daysBefore: number) =>
      `${title} · ${daysBefore === 0 ? 'same day' : daysBefore === 1 ? 'the day before' : `${daysBefore} days before`}`,
    everyWeek: 'Every week',
  },

  upcoming: {
    empty: 'Nothing coming up',
    emptyHint: 'The next days are free. Add a task if there is something to remember.',
    showMore: (days: number) => `Show ${days} more days`,
    showingDays: (days: number) => `Next ${days} days`,
    addToDay: 'Add a task on this day',
    overdueSection: 'Earlier, not done',
    showRoutines: 'Show routines',
  },

  occurrence: {
    title: 'This time',
    skip: 'Skip this time',
    unskip: 'Undo skip',
    editRoutine: 'Edit the routine',
    hint: 'Changes here only apply to this one time.',
    routineHint: 'Editing the routine applies to every time from now on.',
  },

  actionMenu: {
    title: 'Task',
    edit: 'Edit',
    delete: 'Delete',
  },

  add: {
    task: 'New task',
    routine: 'New routine',
  },

  nav: {
    mainMenu: 'Main menu',
  },

  time: {
    hour: 'Hour',
    minute: 'Minute',
  },

  settings: {
    title: 'Settings',
    open: 'Open settings',
    install: {
      title: 'Use as an app',
      description: 'Add Ready to your home screen to open it like a regular app.',
      button: 'Install',
      installed: 'The app is installed on this device.',
      ios: 'Tap the Share icon in Safari and choose “Add to Home Screen”.',
      android: 'Open the browser menu and choose “Install app” or “Add to Home screen”.',
      desktop: 'Click the install icon in the address bar if your browser shows one.',
    },
    bedtime: {
      title: 'Bedtime',
      description: 'During bedtime the front page says good night instead of listing tasks.',
      enabled: 'Bedtime on',
      weekdayStart: 'School nights (Sunday–Thursday)',
      weekendStart: 'Friday and Saturday nights',
      end: 'Morning, back at',
      invalid: 'The morning time must be earlier than the bedtime.',
    },
    backup: {
      title: 'Backup',
      description:
        'Your data is stored only on this device. Make a backup before switching phones or clearing browser data.',
      export: 'Export backup',
      import: 'Import backup',
      importing: 'Reading file…',
      previewTitle: 'Import backup?',
      previewBody: 'All current data will be replaced by the contents of the file.',
      previewTasks: (n: number) => (n === 1 ? '1 task' : `${n} tasks`),
      previewRoutines: (n: number) => (n === 1 ? '1 routine' : `${n} routines`),
      previewStates: (n: number) => (n === 1 ? '1 check-off' : `${n} check-offs`),
      previewExportedAt: (when: string) => `Exported ${when}`,
      confirm: 'Replace my data',
      cancel: 'Cancel',
      errors: {
        'not-json': 'The file is not valid JSON.',
        'not-backup': "The file doesn't look like a Ready backup.",
        'unsupported-version': 'The backup was made with a version that is not supported.',
        'invalid-data': 'The file contains invalid data and was not imported.',
        'read-failed': 'The file could not be read.',
      } as const,
      storagePersisted: 'The browser has promised to keep your data.',
      storageNotPersisted: 'In rare cases the browser may clear local data. Make a backup now and then.',
    },
    danger: {
      title: 'Delete everything',
      description: 'Removes all tasks, routines and check-offs from this device.',
      button: 'Delete all data',
      confirm: 'Delete all data? This cannot be undone. Make a backup first.',
    },
    demo: {
      title: 'Sample data',
      description: "Loads tasks and routines for testing. They won't come back by themselves if you delete them.",
      button: 'Load sample data',
    },
    about: {
      title: 'About',
      version: (v: string) => `Version ${v}`,
      offline: 'Works without internet once it has been loaded.',
    },
  },

  update: {
    ready: 'New version ready',
    reload: 'Update',
    later: 'Later',
  },

  errors: {
    dbTitle: "Couldn't open local storage",
    dbBody:
      "Ready stores data in the browser's local database, but it could not be opened. This usually happens in private browsing or when storage is blocked.",
    retry: 'Try again',
  },

  common: {
    close: 'Close',
    loading: 'Loading…',
  },
} as const;
