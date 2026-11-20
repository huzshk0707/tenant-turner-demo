'use strict';

window.LeasingLessons = [
  {
    id: 'portfolio', name: 'Find and add a rental', icon: 'home', duration: '3 min',
    description: 'Filter the portfolio, find a rental and create a practice listing.',
    steps: [
      ['Find Rosewood House', 'Type “Rosewood” in the rental search. The grid updates as you type.', 'rental-search', 'search-rental', ['rentals']],
      ['Open the rental', 'Open Rosewood House from its card to see its Leads, Owner report, Availability and Settings tabs.', 'rental-r1', 'view-r1', ['rentals']],
      ['Add a practice listing', 'Open Add rental and save a fictional property with a name, address and rent.', 'add-rental', 'add-rental', ['rentals']],
    ],
  },
  {
    id: 'marketing', name: 'Set up a listing', icon: 'edit', duration: '4 min',
    description: 'Update listing details, choose advertising channels and set the application link.',
    steps: [
      ['Save marketing details', 'Change Rosewood House’s listing description, monthly rent or property details, then select Save settings.', 'marketing', 'save-marketing', ['rental', 'r1', 'settings', 'marketing']],
      ['Choose syndication sites', 'Turn a listing site on or off and save. Each rental has its own site selection.', 'syndication', 'save-syndication', ['rental', 'r1', 'settings', 'marketing']],
      ['Set application and fees', 'Update the fictional application link or fee and save the settings.', 'application', 'save-application', ['rental', 'r1', 'settings', 'application']],
    ],
  },
  {
    id: 'qualify', name: 'Prequalify applicants', icon: 'check', duration: '5 min',
    description: 'Set criteria, create a custom question and see how an inquiry is routed.',
    steps: [
      ['Change a qualifying rule', 'Adjust a qualification rule such as the income multiplier or pet limit and save.', 'qualifying', 'save-rules', ['rental', 'r1', 'settings', 'qualifying']],
      ['Add a custom question', 'Add a question, choose which answer should qualify if you want it to screen applicants, then save.', 'add-question', 'save-question', ['rental', 'r1', 'settings', 'qualifying']],
      ['Simulate an inquiry', 'Use New inquiry and enter fictional answers. The sandbox evaluates them against the rental’s rules.', 'add-lead', 'add-lead', ['rental', 'r1', 'leads']],
      ['Review the qualification', 'Open a lead on this rental and look at its Prequalification section.', 'lead-table', 'view-lead', ['rental', 'r1', 'leads']],
    ],
  },
  {
    id: 'showings', name: 'Set up viewing methods', icon: 'calendar', duration: '4 min',
    description: 'Practice wait list controls, self-access and in-person viewing rules.',
    steps: [
      ['Set up the wait list', 'Turn on the wait list or change the message for Rosewood House, then save.', 'waitlist', 'save-waitlist', ['rental', 'r1', 'settings', 'viewing']],
      ['Configure self-access', 'Choose a viewing type, assign a practice device, or change the ID requirement or instructions. Then save the rental settings.', 'self-access', 'save-self-access', ['rental', 'r1', 'settings', 'viewing']],
      ['Configure in-person tours', 'Change the duration, booking notice, tour capacity or trip limit and save.', 'in-person', 'save-in-person', ['rental', 'r1', 'settings', 'viewing']],
    ],
  },
  {
    id: 'availability', name: 'Set showing availability', icon: 'calendar', duration: '4 min',
    description: 'Add team availability and a time block specific to the rental.',
    steps: [
      ['Add team availability', 'In Settings → Availability, choose Add general hours. Pick a team member, day, start and end.', 'add-general-hours', 'add-general-slot', ['rental', 'r1', 'settings', 'availability']],
      ['Add a rental time block', 'Choose Add rental hours to make a block that applies to this rental only.', 'add-rental-hours', 'add-rental-slot', ['rental', 'r1', 'settings', 'availability']],
      ['Edit a time block', 'Open any availability row, change its time and save it.', 'availability-table', 'edit-slot', ['rental', 'r1', 'settings', 'availability']],
    ],
  },
  {
    id: 'leads', name: 'Work a lead and book a tour', icon: 'users', duration: '6 min',
    description: 'Review a lead, add an internal note and take a showing through completion.',
    steps: [
      ['Add an internal note', 'Open Avery Reed’s record and add a note for the leasing team.', 'lead-note', 'add-note', ['lead', 'l1']],
      ['Review the inquiry', 'Choose Mark qualified or Needs review to record the result of your review.', 'lead-review', 'review-lead', ['lead', 'l1']],
      ['Book a tour', 'Choose Schedule showing and enter a sample date, time and viewing method. You can reschedule an existing showing.', 'book-showing', 'book-showing', ['lead', 'l1']],
      ['Finish the tour', 'Record a completed showing with a rating or comment.', 'finish-showing', 'finish-showing', ['lead', 'l1']],
    ],
  },
  {
    id: 'owners', name: 'Prepare an owner report', icon: 'chart', duration: '4 min',
    description: 'Read the funnel, choose the feedback owners see and set a weekly delivery schedule.',
    steps: [
      ['Review the owner report', 'Open the report and review the counts for inquiries, qualification, scheduling and completed tours.', 'owner-metrics', 'view-owner-report', ['rental', 'r1', 'owner']],
      ['Choose visible feedback', 'Open a dated feedback entry, then use Hide from owner report or Show on owner report on the lead’s viewing record.', 'owner-feedback', 'toggle-feedback', ['rental', 'r1', 'owner']],
      ['Save delivery preferences', 'Enable the practice delivery schedule, select a day and time, and save.', 'owner-schedule', 'schedule-owner', ['rental', 'r1', 'owner']],
    ],
  },
  {
    id: 'reports', name: 'Filter and schedule reports', icon: 'chart', duration: '4 min',
    description: 'Explore the report catalog and export data from the fictional portfolio.',
    steps: [
      ['Open the lead source report', 'Select Lead source in the standard report list.', 'report-source', 'view-source', ['reports']],
      ['Filter results', 'Select any rental, source or date range and apply the filters.', 'report-filter', 'filter-report', ['report', 'source']],
      ['Export the report', 'Download the current results as a CSV file.', 'report-export', 'export-report', ['report', 'source']],
      ['Schedule a report', 'Open Scheduled reports and add a schedule with a fictional email.', 'add-schedule', 'add-schedule', ['reports', '', 'scheduled']],
    ],
  },
  {
    id: 'access', name: 'Manage devices and access', icon: 'lock', duration: '5 min',
    description: 'Practice device assignment, one-time access and authorized contacts.',
    steps: [
      ['Assign a device', 'Open Settings on a device and choose a practice rental for it.', 'device-settings', 'assign-device', ['access']],
      ['Generate a practice code', 'Open Get code and generate a code for a sample recipient and date.', 'access-code', 'create-code', ['access']],
      ['Add an authorized contact', 'Switch to Authorized contacts and enter a fictional vendor.', 'add-contact', 'add-contact', ['access', '', 'contacts']],
      ['Review the access log', 'Open Access log to find the code created during practice.', 'access-log', 'view-access-log', ['access', '', 'log']],
    ],
  },
  {
    id: 'help', name: 'Find help and review activity', icon: 'help', duration: '2 min',
    description: 'Use the viewing calendar and find answers for common practice tasks.',
    steps: [
      ['Open the showings calendar', 'Review upcoming, past and recorded showings in one place.', 'showing-list', 'view-showings', ['showings']],
      ['Look up a question', 'Open Help and expand an answer about scheduling, access or reports.', 'help-list', 'open-answer', ['help']],
    ],
  },
];

window.LeasingLessonReferences = {
  portfolio: ['0000-rentals','0125-rental-settings','1125-closing'],
  marketing: ['0142-marketing','0215-syndication','0655-application'],
  qualify: ['0232-qualifying','0253-custom-questions','0712-lead-queue','0712-lead-queue'],
  showings: ['0314-wait-list','0337-self-access','0605-in-person'],
  availability: ['0633-general-availability','0648-rental-availability','0648-rental-availability'],
  leads: ['0712-lead-queue','0712-lead-queue','0605-in-person','0818-owner-metrics'],
  owners: ['0818-owner-metrics','0818-owner-metrics','0745-owner-schedule'],
  reports: ['0836-report-catalog','0926-lead-source','0926-lead-source','0842-scheduled-reports'],
  access: ['0548-device-assignment','0950-send-code','1005-authorized-contacts','0938-access'],
  help: ['0620-showing-limit','1112-support'],
};
