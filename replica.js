(function () {
      const STORAGE_KEY = "tt-practice-v3";
      const COMPANY_NAME = "Brookfield Practice Management";
      const dateOffset = window.ReplicaBooking.dateOffset;
      const uid = (kind) => `${kind}-${crypto.randomUUID()}`;
      const byId = (id) => document.getElementById(id);
      const practiceLink = (...segments) => `${location.href.split(/[?#]/,1)[0]}#${segments.map(encodeURIComponent).join('/')}`;
      const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      const reportFilterDefaults = () => ({property:'all',agent:'all',from:'',through:'',active:false,search:''});
      const TIME_OPTIONS = Array.from({length:53},(_,index)=>{
        const hour=7+Math.floor(index/4);
        return `${hour%12 || 12}:${['00','15','30','45'][index%4]} ${hour<12?'AM':'PM'}`;
      });
      const IN_PERSON_LIMITS = [
        ['none','Do not limit'],
        ['showing','Limit showings to once per day'],
        ['trip','Limit trips to rental to once per day'],
      ];

      const PHOTOS = {
        grand: "assets/rosewood.jpg",
        fifteenth: "assets/waterline.jpg",
        maplewood: "assets/birch.jpg",
        cedar: "assets/juniper.jpg"
      };

      const NAV_ITEMS = [
        { id: "rentals", label: "Rentals", icon: '<path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5z"/>' },
        { id: "messages", label: "Messages", icon: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>' },
        { id: "viewings", label: "Viewings", icon: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>' },
        { id: "access", label: "Access", icon: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>' },
        { id: "reports", label: "Reports", icon: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>' },
        { id: "users", label: "Users", icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>' },
        { id: "account", label: "Account", icon: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="9.5" r="3"/><path d="M6.8 18.2a6 6 0 0 1 10.4 0"/>' },
        { id: "help", label: "Help", icon: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>' },
        { id: "rewards", label: "Rewards", icon: '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>' },
        { id: "signout", label: "Sign Out", icon: '<path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/>' }
      ];

      const SYNDICATION_SITES = [
        "ApartmentAdvisor", "Apartment List", "Apartments.com",
        "Homes.com", "Realtor.com", "Rentals.com",
        "RentalSource", "Zillow, Trulia, & HotPads", "Zumper"
      ];

      function defaultWeeklyHours(start = "9:00 AM", end = "5:00 PM", includeWeekends = false) {
        const obj = {};
        DAYS.forEach((d, idx) => {
          const on = includeWeekends ? true : idx < 5;
          obj[d] = { enabled: on, blocks: [{ start, end }] };
        });
        return obj;
      }

      function defaultShowingLimits() {
        return {
          limitUpcoming: true,
          maxUpcoming: 5,
          limitPerDay: false,
          maxPerDay: 3,
          inPersonVisitLimit: "none",
          minDaysBetweenEnabled: false,
          minDaysBetween: 1,
          preventDuplicates: true,
          selfAccessAdvanceNotice: "1 hour",
          maxDaysAdvance: 7,
          accessWindowText: "15 minutes before to 60 minutes after appointment"
        };
      }

      function defaultInPerson(assignee) {
        return {
          enabled: false,
          showingAgent: assignee || "Jamie Taylor",
          durationMinutes: 30,
          bufferMinutes: 30,
          maxLeadsPerSlot: 1,
          requireConfirmation: true,
          advanceNoticeHours: 2,
          instructions: "Meet the leasing agent at the front entrance 5 minutes prior to your appointment."
        };
      }

      function defaultRentalAvailability() {
        return {
          mode: "general", // Custom hours can be used alongside general availability.
          generalEnabled: true,
          customHours: defaultWeeklyHours("8:00 AM", "7:00 PM", true),
          oneTimeHours: [],
          overrides: [
            { id: "ov1", date: "2026-11-26", type: "block", label: "Thanksgiving Day — No Showings", start: "8:00 AM", end: "8:00 PM" }
          ]
        };
      }

      const SEED = {
        section: "rentals",
        selectedRentalId: null,
        detailTab: "settings",
        activeSubnav: "status",
        accessTab: "devices",
        viewingsTab: "general",
        selectedAvailUser: "Jamie Taylor",
        calendarWeekOffset: 0,
        filters: {
          user: "anyone",
          showInactives: false,
          search: ""
        },
        accessFilters: {
          search: "",
          type: "all",
          status: "all"
        },
        viewingsFilter: {
          property: "all",
          type: "all"
        },
        leadsFilter: { search: "" },
        messagesFilter: {
          search: "",
          tab: "all"
        },
        selectedThreadId: "msg1",
        activeReport: null,
        reportFilters: {
          range: "30d",
          property: "all",
          agent: "all"
        },
        messages: [
          {
            id: "msg1",
            rentalId: "r1",
            leadName: "Jordan Ellis",
            phone: "(303) 555-0148",
            email: "jordan.ellis@example.com",
            channel: "SMS",
            unread: true,
            needsReply: true,
            aiHandled: false,
            score: 9,
            updatedAt: "Today, 9:42 AM",
            thread: [
              { sender: "auto", label: "Practice automation", time: "Yesterday, 6:12 PM", text: "Thanks for your interest in 24 Wren Lane! You pre-qualified (Score 9/10). Your self-access showing is confirmed for Nov 21 at 10:00 AM." },
              { sender: "inbound", label: "Jordan Ellis", time: "Today, 9:42 AM", text: "Hi! Quick question — is there visitor parking in the driveway for the 10:00 AM self-access tour today?" }
            ]
          },
          {
            id: "msg2",
            rentalId: "r1",
            leadName: "Priya Nair",
            phone: "(303) 555-0192",
            email: "priya.nair@example.com",
            channel: "SMS",
            unread: false,
            needsReply: false,
            aiHandled: true,
            score: 8,
            updatedAt: "Today, 8:15 AM",
            thread: [
              { sender: "inbound", label: "Priya Nair", time: "Yesterday, 8:50 PM", text: "Does 24 Wren Lane accept one small 20 lb dog?" },
              { sender: "auto", label: "Practice automation", time: "Yesterday, 8:50 PM", text: "Yes! Up to 2 pets (cats and small dogs) are allowed at 24 Wren Lane. Would you like to book an in-person tour with Jamie Taylor?" },
              { sender: "inbound", label: "Priya Nair", time: "Yesterday, 8:54 PM", text: "Yes please, 2:30 PM tomorrow works great." },
              { sender: "auto", label: "Practice automation", time: "Yesterday, 8:55 PM", text: "All set! Your in-person showing is confirmed for Nov 21 at 2:30 PM." }
            ]
          },
          {
            id: "msg3",
            rentalId: "r2",
            leadName: "Marcus Chen",
            phone: "(303) 555-0117",
            email: "marcus.chen@example.com",
            channel: "Email",
            unread: true,
            needsReply: true,
            aiHandled: false,
            score: 7,
            updatedAt: "Yesterday, 4:05 PM",
            thread: [
              { sender: "auto", label: "Practice automation", time: "Nov 19, 1:15 PM", text: "You've been added to the Wait List for 16 Juniper Way, Unit 220. We'll notify you as soon as showings open." },
              { sender: "inbound", label: "Marcus Chen", time: "Yesterday, 4:05 PM", text: "Hello, do you have an estimate on when Unit 220 will be ready for tours? Hoping to move by Dec 15." }
            ]
          },
          {
            id: "msg4",
            rentalId: "r3",
            leadName: "Elena Morales",
            phone: "(303) 555-0183",
            email: "elena.morales@example.com",
            channel: "SMS",
            unread: false,
            needsReply: false,
            aiHandled: true,
            score: 10,
            updatedAt: "Nov 19, 5:20 PM",
            thread: [
              { sender: "auto", label: "Practice automation", time: "Nov 19, 4:30 PM", text: "Thanks for touring 81 Alder Court! How did the home look? Reply with feedback or apply here." },
              { sender: "inbound", label: "Elena Morales", time: "Nov 19, 5:20 PM", text: "Loved the front porch and updated kitchen! Sending my application tonight." }
            ]
          },
          {
            id: "msg5",
            rentalId: "r4",
            leadName: "Devon Brooks",
            phone: "(303) 555-0164",
            email: "devon.brooks@example.com",
            channel: "Call Center",
            unread: false,
            needsReply: false,
            aiHandled: false,
            score: 9,
            updatedAt: "Nov 18, 2:10 PM",
            thread: [
              { sender: "auto", label: "24/7 Call Center", time: "Nov 18, 1:55 PM", text: "Inbound call captured for 39 Cedar Walk. Pre-qualification completed over phone (Score 9/10)." },
              { sender: "outbound", label: "Casey Nguyen", time: "Nov 18, 2:10 PM", text: "Thanks for applying, Devon! Our leasing team is reviewing your application now." }
            ]
          }
        ],
        devices: [
          { id: "d1", type: "CodeBox", serial: "LAB-CB-482910", rentalId: "r1", battery: "94% (9V Lithium)", adminCode: "SIM-849201", vendorCode: "SIM-41289", shackleCode: "SIM-73915", lastSync: "Today, 8:15 AM" },
          { id: "d2", type: "SentriLock", serial: "LAB-SL-993014", rentalId: "r2", battery: "88%", adminCode: "SIM-602914", vendorCode: "SIM-58102", shackleCode: "SIM-29401", lastSync: "Today, 7:40 AM" },
          { id: "d3", type: "Lockbox", serial: "LAB-LB-204118", rentalId: "r3", battery: "Mechanical", adminCode: "N/A", vendorCode: "SIM-3394", shackleCode: "SIM-8812", lastSync: "Manual Combo" },
          { id: "d4", type: "CodeBox", serial: "LAB-CB-773205", rentalId: "r4", battery: "91% (9V Lithium)", adminCode: "SIM-518290", vendorCode: "SIM-62014", shackleCode: "SIM-19482", lastSync: "Yesterday, 6:10 PM" },
          { id: "d5", type: "SentriLock", serial: "LAB-SL-112904", rentalId: "r5", battery: "76%", adminCode: "SIM-391044", vendorCode: "SIM-77410", shackleCode: "SIM-50291", lastSync: "Nov 18, 2:05 PM" },
          { id: "d6", type: "CodeBox", serial: "LAB-CB-551902", rentalId: "", battery: "100% (New)", adminCode: "SIM-910283", vendorCode: "SIM-24819", shackleCode: "SIM-66301", lastSync: "In Office Inventory" },
          { id: "d7", type: "SentriLock", serial: "LAB-SL-884210", rentalId: "", battery: "82%", adminCode: "SIM-741852", vendorCode: "SIM-19304", shackleCode: "SIM-48219", lastSync: "In Office Inventory" }
        ],
        generalAvailability: {
          "Jamie Taylor": {
            timezone: "Mountain Time (US & Canada)",
            weekly: defaultWeeklyHours("9:00 AM", "5:00 PM", false),
            selfAccessStart: "8:00 AM",
            selfAccessEnd: "8:00 PM",
            daylightOnly: true,
            blockedDates: [
              { id: "bd1", date: "2026-11-26", allDay: true, start: "8:00 AM", end: "8:00 PM", reason: "Thanksgiving Holiday" },
              { id: "bd2", date: "2026-11-27", allDay: false, start: "12:00 PM", end: "5:00 PM", reason: "Office Half-Day" }
            ]
          },
          "Casey Nguyen": {
            timezone: "Mountain Time (US & Canada)",
            weekly: defaultWeeklyHours("10:00 AM", "6:00 PM", true),
            selfAccessStart: "7:30 AM",
            selfAccessEnd: "7:30 PM",
            daylightOnly: true,
            blockedDates: [
              { id: "bd3", date: "2026-11-26", allDay: true, start: "8:00 AM", end: "8:00 PM", reason: "Thanksgiving Holiday" }
            ]
          }
        },
        calendarSync: {
          googleConnected: true,
          googleEmail: "jamie.taylor@example.com",
          office365Connected: false,
          checkConflicts: true,
          writeShowingsToCalendar: true
        },
        viewingsList: [
          { id: "v1", practiceCode: "SIM-V1", rentalId: "r1", leadName: "Jordan Ellis", leadPhone: "(303) 555-0148", date: "2026-11-21", time: "10:00 AM", type: "Self-Access (CodeBox)", status: "Confirmed" },
          { id: "v2", rentalId: "r1", leadName: "Priya Nair", leadPhone: "(303) 555-0192", date: "2026-11-21", time: "2:30 PM", type: "In-Person (Jamie Taylor)", status: "Confirmed" },
          { id: "v3", rentalId: "r3", leadName: "Elena Morales", leadPhone: "(303) 555-0183", date: "2026-11-22", time: "11:00 AM", type: "Self-Access (Lockbox)", status: "Pending Confirmation" },
          { id: "v4", rentalId: "r4", leadName: "Devon Brooks", leadPhone: "(303) 555-0164", date: "2026-11-23", time: "4:00 PM", type: "Self-Access (CodeBox)", status: "Confirmed" }
        ],
        rentals: [
          {
            id: "r1",
            address: "24 Wren Lane",
            photo: PHOTOS.grand,
            active: true,
            assignee: "Jamie Taylor",
            waitlist: false,
            waitlistMessage: "Coming soon!",
            device: "CodeBox",
            serialNumber: "LAB-CB-482910",
            alerts: 0,
            leaseTerm: "One Year",
            rent: 2795,
            deposit: 2795,
            dateAvailable: "2026-12-01",
            propertyType: "Single Family House",
            bedrooms: 4,
            bathrooms: "3.0",
            sqft: 2876,
            customTitle: "Spacious 4 Bed Home with Two-Car Garage",
            description: "Bright two-story home with open kitchen, landscaped yard, and easy access to parks and schools.",
            syndication: {
              "ApartmentAdvisor": true, "Apartment List": true, "Apartments.com": true,
              "Homes.com": true, "Realtor.com": true, "Rentals.com": false,
              "RentalSource": true, "Zillow, Trulia, & HotPads": true, "Zumper": true
            },
            qualifying: {
              reqMoveIn: true, moveInDays: 90,
              reqIncome: true, incomeRatio: 3,
              allowCosigner: true,
              allowVouchers: true,
              allowPets: true, maxPets: 2, allowCats: true, allowSmallDogs: true, allowLargeDogs: false,
              rejectBankruptcy: true, rejectEviction: true, rejectFelony: false,
              qCredit700: true, qNoSmoking: false
            },
            viewing: {
              selfAccess: true,
              viewingType: "CodeBox",
              viewingApproval: "Set Appointments",
              instructions: "Sample instructions: arrive at the front entrance.",
              requireId: true,
              inPerson: Object.assign(defaultInPerson("Jamie Taylor"), { enabled: true }),
              limits: defaultShowingLimits()
            },
            availability: defaultRentalAvailability(),
            leads: [
              { name: "Jordan Ellis", status: "Scheduled", phone: "(303) 555-0148", source: "Zillow" },
              { name: "Priya Nair", status: "Prequalified", phone: "(303) 555-0192", source: "Apartments.com" }
            ]
          },
          {
            id: "r2",
            address: "16 Juniper Way, Unit 220",
            photo: PHOTOS.fifteenth,
            active: true,
            assignee: "Casey Nguyen",
            waitlist: true,
            waitlistMessage: "Coming soon! Join the wait list to be notified first.",
            device: "SentriLock",
            serialNumber: "LAB-SL-993014",
            alerts: 2,
            leaseTerm: "One Year",
            rent: 2150,
            deposit: 2150,
            dateAvailable: "2026-12-15",
            propertyType: "Apartment / Condo",
            bedrooms: 2,
            bathrooms: "2.0",
            sqft: 1140,
            customTitle: "Downtown Brick Loft with Private Balcony",
            description: "Corner 2-bedroom unit with hardwood floors, stainless appliances, and walkable transit access.",
            syndication: {
              "ApartmentAdvisor": true, "Apartment List": true, "Apartments.com": true,
              "Homes.com": false, "Realtor.com": true, "Rentals.com": true,
              "RentalSource": false, "Zillow, Trulia, & HotPads": true, "Zumper": true
            },
            qualifying: {
              reqMoveIn: true, moveInDays: 60,
              reqIncome: true, incomeRatio: 3,
              allowCosigner: true,
              allowVouchers: false,
              allowPets: true, maxPets: 1, allowCats: true, allowSmallDogs: true, allowLargeDogs: false,
              rejectBankruptcy: true, rejectEviction: true, rejectFelony: true,
              qCredit700: true, qNoSmoking: true
            },
            viewing: {
              selfAccess: true,
              viewingType: "SentriLock",
              viewingApproval: "Set Appointments",
              instructions: "Sample instructions: meet at the lobby for the second-floor tour.",
              requireId: true,
              inPerson: defaultInPerson("Casey Nguyen"),
              limits: defaultShowingLimits()
            },
            availability: defaultRentalAvailability(),
            leads: [
              { name: "Marcus Chen", status: "Wait List", phone: "(303) 555-0117", source: "Zumper" }
            ]
          },
          {
            id: "r3",
            address: "81 Alder Court",
            photo: PHOTOS.maplewood,
            active: true,
            assignee: "Jamie Taylor",
            waitlist: false,
            waitlistMessage: "Coming soon!",
            device: "Lockbox",
            serialNumber: "LAB-LB-204118",
            alerts: 1,
            leaseTerm: "One Year",
            rent: 2350,
            deposit: 2350,
            dateAvailable: "2026-11-28",
            propertyType: "Single Family House",
            bedrooms: 3,
            bathrooms: "2.0",
            sqft: 1840,
            customTitle: "Craftsman Ranch with Detached Garage",
            description: "Single-level craftsman home with covered front porch, mature shade trees, and updated kitchen.",
            syndication: {
              "ApartmentAdvisor": false, "Apartment List": true, "Apartments.com": true,
              "Homes.com": true, "Realtor.com": true, "Rentals.com": false,
              "RentalSource": true, "Zillow, Trulia, & HotPads": true, "Zumper": false
            },
            qualifying: {
              reqMoveIn: true, moveInDays: 90,
              reqIncome: true, incomeRatio: 2.5,
              allowCosigner: false,
              allowVouchers: true,
              allowPets: false, maxPets: 0, allowCats: false, allowSmallDogs: false, allowLargeDogs: false,
              rejectBankruptcy: false, rejectEviction: true, rejectFelony: false,
              qCredit700: false, qNoSmoking: true
            },
            viewing: {
              selfAccess: true,
              viewingType: "Lockbox",
              viewingApproval: "Set Appointments",
              instructions: "Lockbox is hanging on the front door handle.",
              requireId: true,
              inPerson: defaultInPerson("Jamie Taylor"),
              limits: defaultShowingLimits()
            },
            availability: defaultRentalAvailability(),
            leads: [
              { name: "Elena Morales", status: "Toured", phone: "(303) 555-0183", source: "Realtor.com" }
            ]
          },
          {
            id: "r4",
            address: "39 Cedar Walk",
            photo: PHOTOS.cedar,
            active: true,
            assignee: "Casey Nguyen",
            waitlist: false,
            waitlistMessage: "Coming soon!",
            device: "CodeBox",
            serialNumber: "LAB-CB-773205",
            alerts: 0,
            leaseTerm: "One Year",
            rent: 2495,
            deposit: 2495,
            dateAvailable: "2026-12-05",
            propertyType: "Townhouse",
            bedrooms: 3,
            bathrooms: "2.5",
            sqft: 1960,
            customTitle: "Modern End-Unit Townhome",
            description: "Contemporary 3-bedroom townhome with stone facade, attached garage, and quartz countertops.",
            syndication: {
              "ApartmentAdvisor": true, "Apartment List": true, "Apartments.com": true,
              "Homes.com": true, "Realtor.com": true, "Rentals.com": true,
              "RentalSource": true, "Zillow, Trulia, & HotPads": true, "Zumper": true
            },
            qualifying: {
              reqMoveIn: true, moveInDays: 45,
              reqIncome: true, incomeRatio: 3,
              allowCosigner: true,
              allowVouchers: true,
              allowPets: true, maxPets: 2, allowCats: true, allowSmallDogs: true, allowLargeDogs: true,
              rejectBankruptcy: true, rejectEviction: true, rejectFelony: false,
              qCredit700: true, qNoSmoking: false
            },
            viewing: {
              selfAccess: true,
              viewingType: "CodeBox",
              viewingApproval: "Set Appointments",
              instructions: "Use visitor parking along Cedar Ridge Ln. CodeBox is on the left porch column.",
              requireId: true,
              inPerson: Object.assign(defaultInPerson("Casey Nguyen"), { enabled: true, maxLeadsPerSlot: 4 }),
              limits: defaultShowingLimits()
            },
            availability: Object.assign(defaultRentalAvailability(), { mode: "custom" }),
            leads: [
              { name: "Devon Brooks", status: "Applied", phone: "(303) 555-0164", source: "Zillow" }
            ]
          },
          {
            id: "r5",
            address: "62 Sparrow Drive",
            photo: PHOTOS.maplewood,
            active: false,
            assignee: "Jamie Taylor",
            waitlist: false,
            waitlistMessage: "Coming soon!",
            device: "SentriLock",
            serialNumber: "LAB-SL-112904",
            alerts: 0,
            leaseTerm: "One Year",
            rent: 2200,
            deposit: 2200,
            dateAvailable: "2027-01-01",
            propertyType: "Single Family House",
            bedrooms: 3,
            bathrooms: "2.0",
            sqft: 1650,
            customTitle: "Westhaven 3 Bed Cottage (Inactive)",
            description: "Currently leased; toggle Rental is active to re-list for upcoming availability.",
            syndication: {
              "ApartmentAdvisor": false, "Apartment List": false, "Apartments.com": false,
              "Homes.com": false, "Realtor.com": false, "Rentals.com": false,
              "RentalSource": false, "Zillow, Trulia, & HotPads": false, "Zumper": false
            },
            qualifying: {
              reqMoveIn: true, moveInDays: 90,
              reqIncome: true, incomeRatio: 3,
              allowCosigner: true,
              allowVouchers: false,
              allowPets: false, maxPets: 0, allowCats: false, allowSmallDogs: false, allowLargeDogs: false,
              rejectBankruptcy: true, rejectEviction: true, rejectFelony: false,
              qCredit700: false, qNoSmoking: false
            },
            viewing: {
              selfAccess: false,
              viewingType: "SentriLock",
              viewingApproval: "Set Appointments",
              instructions: "",
              requireId: true,
              inPerson: defaultInPerson("Jamie Taylor"),
              limits: defaultShowingLimits()
            },
            availability: defaultRentalAvailability(),
            leads: []
          }
        ]
      };

      function defaultOwnerReport(r) {
        const slug = (r.address || "property").toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "");
        return {
          autoSend: true,
          emails: `owner.${slug.slice(0, 18)}@example.com, ${(r.assignee || "jamie.taylor").toLowerCase().replace(/\s+/g, ".")}@example.com`,
          includeFeedback: true,
          onMarketDate: "2026-11-05",
          feedback: [
            {
              id: "fb_" + r.id + "_1",
              date: "Nov 19, 2026",
              lead: "J.E.",
              rating: 5,
              interest: "Very Interested",
              comment: "Clean interior, bright natural light, and great neighborhood feel. Planning to apply this weekend.",
              visible: true
            },
            {
              id: "fb_" + r.id + "_2",
              date: "Nov 17, 2026",
              lead: "R.K.",
              rating: 3,
              interest: "Somewhat Interested",
              comment: "Liked the layout overall, though yard maintenance was still wrapping up during the tour.",
              visible: true
            }
          ]
        };
      }

      function enrichLeadObject(l, idx, r) {
        const scoreMap = {
          "Scheduled": 9,
          "Prequalified": 8,
          "Pre-Qualified": 8,
          "Toured": 10,
          "Viewed": 10,
          "Viewing Completed": 10,
          "Applied": 9,
          "Wait List": 7,
          "Disqualified": 2,
          "Unscored": null
        };
        const emailSlug = (l.name || "lead").toLowerCase().replace(/[^a-z0-9]+/g, ".");
        if (!l.id) l.id = `lead_${r.id}_${idx + 1}`;
        if (!l.email) l.email = `${emailSlug}@example.com`;
        if (!l.leadType) l.leadType = "Tenant lead";
        if (l.score === undefined) l.score = (l.status in scoreMap) ? scoreMap[l.status] : 8;
        if (l.status === "Prequalified") l.status = "Pre-Qualified";
        if (l.status === "Toured" || l.status === "Viewed") l.status = "Viewing Completed";
        if (!l.moveInDate) l.moveInDate = r.dateAvailable || "2026-12-01";
        if (l.monthlyIncome == null) l.monthlyIncome = Math.round((r.rent || 2200) * 3.2);
        if (!l.pets) l.pets = r.qualifying && r.qualifying.allowPets ? "1 small dog (20 lbs)" : "None";
        if (l.manualOverride === undefined) l.manualOverride = false;
        if (!l.createdAt) l.createdAt = "Nov 19, 2026";
        if (!Array.isArray(l.notes)) {
          l.notes = [
            { time: l.createdAt, text: `Lead captured from ${l.source || "Online Listing"}.` },
            ...(l.score !== null ? [{ time: "Nov 20, 2026", text: `Completed pre-qualification questionnaire (Score ${l.score}/10).` }] : [])
          ];
        }
        return l;
      }

      function ensureStep4RentalFields(r) {
        const rules=r.qualifying;
        rules.questions=(rules.questions || []).map(question=>({
          label:question.label,
          options:window.ReplicaBooking.questionChoices(question),
        }));
        if (location.origin==='null' && r.applicationLink===`null${location.pathname}#apply/${encodeURIComponent(r.id)}`) {
          r.applicationLink=practiceLink('apply',r.id);
        }
        if (!r.ownerReport) r.ownerReport = defaultOwnerReport(r);
        if (!Array.isArray(r.leads)) r.leads = [];
        // Add an extra realistic unscored/disqualified lead on r1 if only the initial 2 exist
        if (r.id === "r1" && r.leads.length === 2 && !r._step4Seeded) {
          r.leads.push(
            { id: "lead_r1_3", name: "Tanya Vance", email: "tanya.vance@example.com", phone: "(303) 555-0133", source: "Call Center", leadType: "Tenant lead", status: "Unscored", score: null, moveInDate: "2026-12-10", monthlyIncome: 0, pets: "Not provided", manualOverride: false, createdAt: "Today, 9:10 AM", notes: [{ time: "Today, 9:10 AM", text: "Inbound call captured; pre-qualifying SMS sent automatically." }] },
            { id: "lead_r1_4", name: "Derek Holloway", email: "derek.holloway@example.com", phone: "(303) 555-0177", source: "Zillow", leadType: "Tenant lead", status: "Disqualified", score: 2, moveInDate: "2027-03-01", monthlyIncome: 5200, pets: "2 large dogs", manualOverride: false, createdAt: "Nov 18, 2026", notes: [{ time: "Nov 18, 2026", text: "Blocked from scheduling: income below 3x rent & large dogs not permitted." }] }
          );
          r._step4Seeded = true;
        }
        r.leads = r.leads.map((l, idx) => enrichLeadObject(l, idx, r));
      }

      function workspaceDefaults() {
        return {...window.FullPracticeWorkspace.defaults(),accessTab:'CodeBox',accessFilters:{search:'',user:'',unassigned:true},reportTab:'standard',
          reportFilters:reportFilterDefaults(),
          ownerDelivery:{day:'Tuesday',time:'9:00 AM'}, standardDelivery:{}, accessEvents:[], notices:[], signedOut:false,
          guide:window.ReplicaTutorial.initialize(),
          support:[],
          contacts:[{id:'c1',name:'Morgan Ellis',company:'Practice Maintenance',phone:'(303) 555-0169',email:'morgan@example.com',access:'Recurring'}]};
      }
      function seedProfileExamples(s) {
        if(s.prospectExamplesAdded) return s;
        const r=s.rentals.find(r=>r.id==='r1');
        const visit=s.viewingsList.find(v=>v.id==='v1' && v.rentalId==='r1' && v.status==='Viewed' && v.type==='Self-Access (CodeBox)');
        if(visit) {
          visit.practiceCode ??= 'SIM-V1';
          visit.acceptedOn ??= visit.date;
        }
        const sample=r?.leads.find(l=>l.id==='lead_r1_2');
        if(sample && !sample.archived && !sample.answers && !s.viewingsList.some(v=>v.id==='sample-prior-self-tour')) {
          sample.idMetadataWarning=true;
          sample.idReviewed=false;
          sample.incomeSource='Income from employment';
          sample.financialHistory='No issues to report.';
          sample.notes.unshift({time:sample.createdAt,text:'Prospect asked about the fenced yard for a small dog.',internal:true});
          sample.qualifiedOn=sample.createdDate;
          s.viewingsList.push({id:'sample-prior-self-tour',rentalId:r.id,leadId:sample.id,leadName:sample.name,leadPhone:sample.phone,
            date:dateOffset(-3),acceptedOn:dateOffset(-4),time:'5:00 PM',type:'Self-Access (CodeBox)',status:'No-show',practiceCode:'SIM-PAST'});
        }
        s.prospectExamplesAdded=true;
        return s;
      }
      function cloneSeed() {
        const s = Object.assign(JSON.parse(JSON.stringify(SEED)),workspaceDefaults());
        s.viewingsFilter.status='upcoming';
        s.viewingsTab='upcoming';
        s.calendarSync.googleConnected=false;
        s.calendarSync.googleEmail='calendar@example.com';
        s.devices.push({id:'d8',type:'PointCentral',serial:'LAB-PC-516',rentalId:'',battery:'Practice device',lastSync:'Not connected'});
        const extras=[['r6','38 Grove Place','westhaven',''],['r7','72 Marina View, Unit 6','waterline','SentriLock'],['r8','95 Willow Grove','alder','Lockbox']];
        for(const [id,address,photo,device] of extras) {
          const row=structuredClone(s.rentals[4]);
          s.rentals.push({...row,id,address,customTitle:address,active:true,device,serialNumber:'',photo:`assets/${photo}.jpg`,leads:[]});
        }
        s.rentals.forEach((r,i)=>{
          ensureStep4RentalFields(r);
          r.imported=true;r.dateAvailable=dateOffset(5+i);r.listed=dateOffset(-18-i*4);
          r.applicationFee=s.account.defaultApplicationFee;r.adminFee=0;r.applicationLink=practiceLink('apply',r.id);
          r.availability.overrides=[];r.ownerReport.onMarketDate=r.listed;
          delete r.qualifying.qNoSmoking;
          if (r.id==='r1') r.qualifying.historyPolicies={bankruptcy:'older',judgment:'reject',eviction:'reject',felony:'reject'};
          for(const l of r.leads){l.createdDate=dateOffset(-2);l.archived=l.status==='Disqualified';l.idReviewed=l.score>=6;}
        });
        for(const a of Object.values(s.generalAvailability)) a.blockedDates=[];
        s.viewingsList.forEach((v,i)=>{v.date=dateOffset(i===0 ? -1 : i+1);if(i===0){v.status='Viewed';s.rentals[0].leads[0].status='Viewing Completed';}});
        s.rentals[0].ownerReport.feedback[0].leadId=s.rentals[0].leads[0].id;
        s.rentals[0].ownerReport.feedback[0].date=dateOffset(-1);
        const example=s.rentals[0];
        example.turnStartDate=dateOffset(-25);
        example.turnEndDate=example.listed;
        s.notices.push(
          {id:'sample-owner-notice',rentalId:example.id,type:'Owner',recipient:example.ownerReport.emails,date:dateOffset(-7),channel:'Email',message:'Sample weekly owner report delivery.'},
          {id:'sample-occupant-notice',rentalId:example.id,type:'Occupant',recipient:'Current occupants',date:dateOffset(-2),channel:'Email',message:'Sample notice of an upcoming visit.'},
        );
        return seedProfileExamples(s);
      }
      function newRental(address,rent,available,imported) {
        const r=structuredClone(cloneSeed().rentals[0]);
        const id=uid('rental');
        const assignee=state.users.find(u=>u.active)?.name || state.users[0].name;
        Object.assign(r,{id,address,rent,deposit:rent,dateAvailable:available,listed:dateOffset(),active:true,assignee,
          waitlist:false,alerts:0,serialNumber:'',device:'',imported,leads:[],customTitle:address,
          applicationFee:state.account.defaultApplicationFee,applicationLink:practiceLink('apply',id)});
        r.viewing.inPerson.showingAgent=assignee;
        r.viewing.inPerson.durationMinutes=state.account.defaultShowingDuration;
        r.viewing.limits.maxUpcoming=state.account.defaultMaxUpcomingShowings;
        r.viewing.requireId=state.account.requireIdBeforeSelfAccess;
        r.syndication=Object.fromEntries(SYNDICATION_SITES.map(site=>[site,state.account.defaultSyndication.includes(site)]));
        r.qualifying.incomeRatio=state.account.defaultMinIncomeRatio;
        r.qualifying.moveInDays=state.account.defaultMaxMoveInDays;
        r.qualifying.minCredit=state.account.defaultMinCredit;
        const petPolicy=state.account.defaultPetsPolicy;
        if(petPolicy!=='Case-by-case') {
          const allowPets=petPolicy!=='No Pets';
          Object.assign(r.qualifying,{allowPets,allowCats:allowPets,allowSmallDogs:allowPets,allowLargeDogs:petPolicy==='Pets Allowed',maxPets:allowPets ? 2 : 0});
        }
        r.ownerReport=defaultOwnerReport(r);r.ownerReport.feedback=[];r.ownerReport.base7d={};r.ownerReport.baseTotal={};
        return r;
      }

      function copyToClipboardSafe(text, successMsg) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(() => showToast(successMsg)).catch(() => fallbackCopy(text, successMsg));
        } else {
          fallbackCopy(text, successMsg);
        }
      }
      function fallbackCopy(text, successMsg) {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); showToast(successMsg); } catch (e) { showToast("Link ready: " + text); }
        document.body.removeChild(ta);
      }

      let savedWorkspace;
      function loadState() {
        try {
          const raw = savedWorkspace = localStorage.getItem(STORAGE_KEY);
          if (!raw) return cloneSeed();
          const parsed = JSON.parse(raw);
          const seed=cloneSeed();
          const merged={...seed,...parsed,prospectExamplesAdded:parsed.prospectExamplesAdded};
          if(merged.section==='signout') merged.section='rentals';
          const legacyAccount=parsed.profile ? {companyName:parsed.profile.name,email:parsed.profile.email,defaultApplicationFee:parsed.profile.fee}:{};
          merged.account={...seed.account,...legacyAccount,...parsed.account};
          merged.usersFilter={...seed.usersFilter,...parsed.usersFilter};
          merged.reportFilters={...seed.reportFilters,...parsed.reportFilters};
          merged.ownerDelivery={...seed.ownerDelivery,...parsed.ownerDelivery};
          merged.helpFilter={...seed.helpFilter,...parsed.helpFilter};
          merged.rewards={...seed.rewards,...parsed.rewards};
          if (!parsed.rewards && parsed.referrals?.length) merged.rewards.referrals=parsed.referrals.map((ref,i)=>({id:`legacy-ref-${i}`,name:ref.name,email:ref.email,company:'Practice referral',sentDate:'Previous practice',status:'Invited',credit:0}));
          merged.guide=window.ReplicaTutorial.initialize(parsed.guide);
          const roles={'Manager':'Account Owner','Leasing agent':'Leasing Agent'};
          merged.users=(Array.isArray(parsed.users)&&parsed.users.length ? parsed.users : seed.users).map(user=>{
            const fallback=seed.users.find(row=>row.id===user.id);
            return {phone:'(303) 555-0199',canShow:true,calendarSynced:false,smsAlerts:true,emailAlerts:true,lastLogin:'Practice session',...fallback,...user,
              role:roles[user.role] || user.role,
              permissions:{rentals:true,lockboxes:true,reports:true,billing:false,...fallback?.permissions,...user.permissions}};
          });
          delete merged.profile;
          delete merged.referrals;
          if (Array.isArray(merged.rentals)) {
            merged.rentals = merged.rentals.map(r => {
              if (!r.viewing.inPerson) r.viewing.inPerson = defaultInPerson(r.assignee);
              if (!r.viewing.limits) r.viewing.limits = defaultShowingLimits();
              if (!r.availability) r.availability = defaultRentalAvailability();
              const {inPerson,limits}=r.viewing;
              if (!limits.inPersonVisitLimit) {
                const dailyCap=limits.limitPerDay ? Number(limits.maxPerDay) : 0;
                limits.inPersonVisitLimit=dailyCap===1 ? 'showing' : inPerson.clusterShowings ? 'trip' : 'none';
                limits.legacyInPersonCap=dailyCap>0;
              }
              if (inPerson.allowGroupShowings===false) inPerson.maxLeadsPerSlot=1;
              delete inPerson.clusterShowings;
              delete inPerson.allowGroupShowings;
              r.availability.generalEnabled ??= r.availability.mode!=='custom';
              r.availability.oneTimeHours ??= [];
              r.availability.overrides ??= [];
              ensureStep4RentalFields(r);
              return r;
            });
          }
          return seedProfileExamples(merged);
        } catch (e) {
          return cloneSeed();
        }
      }

      function saveState() {
        try {
          const serialized = JSON.stringify(state);
          localStorage.setItem(STORAGE_KEY, serialized);
          savedWorkspace=serialized;
        } catch (e) {
          // ignore storage errors
        }
      }

      let state = loadState();
      let toastTimer = null;
      let settingsDraft = null;
      const generalAvailabilityDrafts = new Map();
      let modalFocus = null;
      let detailPage = null;
      let reportView = {page:0, size:10, column:null, descending:false};

      function showToast(msg) {
        const t = document.getElementById("toast");
        t.textContent = msg;
        t.classList.add("show");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => t.classList.remove("show"), 2500);
      }

      function esc(str) {
        return String(str ?? "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;");
      }

      function openModal(title, bodyHtml, footHtml) {
        document.getElementById("ttModalTitle").textContent = title;
        document.getElementById("ttModalBody").innerHTML = bodyHtml;
        document.getElementById("ttModalFoot").innerHTML = footHtml;
        const m = byId('ttModal');
        if (!m.classList.contains('open')) modalFocus=document.activeElement;
        m.classList.add('open');
        document.querySelector('.app-shell').inert=true;
        requestAnimationFrame(()=>{
          if (m.classList.contains('open')) byId('ttModalClose').focus({preventScroll:true});
        });
        m.setAttribute("aria-hidden", "false");
      }

      function closeModal() {
        const m = document.getElementById("ttModal");
        m.classList.remove("open");
        m.setAttribute("aria-hidden", "true");
        byId('ttModalBody').replaceChildren();
        byId('ttModalFoot').replaceChildren();
        document.querySelector('.app-shell').inert=state.signedOut;
        if(modalFocus?.isConnected) modalFocus.focus({preventScroll:true});
        modalFocus=null;
      }

      function openDetailPage(title, backLabel, draw, opener) {
        const previous=detailPage;
        detailPage={title,backLabel,draw,scroll:previous?.scroll ?? window.scrollY,opener:previous?.opener ?? opener};
        render();
        window.scrollTo(0,0);
        byId('detailBackBtn').focus({preventScroll:true});
      }

      function backFromDetail() {
        const {scroll,opener}=detailPage;
        detailPage=null;
        render();
        window.scrollTo(0,scroll);
        if(opener) byId('canvas').querySelector(`[data-lead-view="${CSS.escape(opener)}"]`)?.focus({preventScroll:true});
      }

      function plusButton(id,label) {
        return `<button id="${id}" class="sync-fab" type="button" title="${label}" aria-label="${label}"><span aria-hidden="true">+</span></button>`;
      }

      function assignDeviceToRental(deviceId, newRentalId, persist = true) {
        const dev = state.devices.find(d => d.id === deviceId);
        if (!dev) return;

        // If another device was assigned to newRentalId, unassign it
        if (newRentalId) {
          state.devices.forEach(d => {
            if (d.id !== dev.id && d.rentalId === newRentalId) {
              d.rentalId = "";
            }
          });
        }

        // Clear old rental if dev moved away
        if (dev.rentalId && dev.rentalId !== newRentalId) {
          const oldRental = state.rentals.find(r => r.id === dev.rentalId);
          if (oldRental && oldRental.serialNumber === dev.serial) {
            oldRental.serialNumber = "";
          }
        }

        dev.rentalId = newRentalId || "";
        if (newRentalId) {
          const targetRental = state.rentals.find(r => r.id === newRentalId);
          if (targetRental) {
            targetRental.device = dev.type;
            targetRental.viewing.viewingType = dev.type;
            targetRental.serialNumber = dev.serial;
          }
        }
        if(persist) saveState();
      }

      function closeMobileSidebar() {
        document.getElementById("sidebar").classList.remove("open");
        document.getElementById("sidebarBackdrop").classList.remove("open");
      }

      function renderSidebar() {
        const nav = document.getElementById("navStack");
        nav.innerHTML = NAV_ITEMS.map(item => `
          <button class="nav-item ${state.section === item.id ? "active" : ""}" data-nav="${item.id}" type="button">
            <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">${item.icon}</svg>
            <span>${item.label}</span>
          </button>
        `).join("");

        nav.querySelectorAll("[data-nav]").forEach(btn => {
          btn.addEventListener("click", () => {
            const target = btn.dataset.nav;
            closeMobileSidebar();
            if (state.signedOut) return;
            if (target==='signout') {full.openSignOut();return;}
            detailPage=null;
            settingsDraft=null;
            state.section = target;
            if(target==='reports') state.activeReport=null;
            state.selectedRentalId = null;
            saveState();
            render();
            window.scrollTo(0,0);
          });
        });
      }

      function renderHeader() {
        const header = document.getElementById("topHeader");
        const backIcon='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M19 12H5m7 7-7-7 7-7"/></svg>';
        const rental = state.selectedRentalId
          ? state.rentals.find(r => r.id === state.selectedRentalId)
          : null;

        const activeReport=state.section==='reports' && state.reportTab==='standard' && state.activeReport;
        header.classList.toggle('rental-header',Boolean(rental));
        if (detailPage || activeReport) {
          const title=detailPage ? detailPage.title : `${reportName(activeReport)} Report`;
          const backLabel=detailPage?.backLabel || 'Back to Reports';
          header.innerHTML=`<div class="top-header-inner">
            <button id="mobileMenuBtn" class="mobile-menu-btn" type="button" aria-label="Menu">☰</button>
            <button id="detailBackBtn" class="back-arrow-btn" type="button" aria-label="${esc(backLabel)}">${backIcon}</button>
            <div><div class="company-name">${esc(state.account.companyName)}</div><h1 class="page-title">${esc(title)}</h1></div>
          </div>`;
          byId('detailBackBtn').onclick=detailPage ? backFromDetail : ()=>goto('reports');
        } else if (state.section === "rentals" && rental) {
          const tabNames = {
            leads: "Leads",
            owner: "Owner Report",
            availability: "Availability",
            settings: "Settings"
          };
          header.innerHTML = `
            <div class="top-header-inner">
              <button id="mobileMenuBtn" class="mobile-menu-btn" type="button" aria-label="Menu">☰</button>
              <button id="backRentalsBtn" class="back-arrow-btn" type="button" aria-label="Back to Rentals">
                ${backIcon}
              </button>
              <div>
                <div class="company-name">${esc(state.account.companyName)}</div>
                <h1 class="page-title">${esc(rental.address)} - ${tabNames[state.detailTab] || "Settings"}</h1>
              </div>
            </div>
            <div class="header-tabs">
              <button class="header-tab ${state.detailTab === "leads" ? "active" : ""}" data-tab="leads" type="button">LEADS</button>
              <button class="header-tab ${state.detailTab === "owner" ? "active" : ""}" data-tab="owner" type="button">OWNER REPORT</button>
              <button class="header-tab ${state.detailTab === "availability" ? "active" : ""}" data-tab="availability" type="button">AVAILABILITY</button>
              <button class="header-tab ${state.detailTab === "settings" ? "active" : ""}" data-tab="settings" type="button">SETTINGS</button>
            </div>
            ${state.detailTab==='leads' ? plusButton('addLeadBtn','Add lead') : ''}
          `;

          document.getElementById("backRentalsBtn").addEventListener("click", () => {
            state.selectedRentalId = null;
            saveState();
            render();
            window.scrollTo(0,0);
          });

          header.querySelectorAll("[data-tab]").forEach(btn => {
            btn.addEventListener("click", () => {
              state.detailTab = btn.dataset.tab;
              saveState();
              render();
              window.scrollTo(0,0);
            });
          });
        } else if (state.section === "viewings") {
          header.innerHTML = `
            <div class="top-header-inner">
              <button id="mobileMenuBtn" class="mobile-menu-btn" type="button" aria-label="Menu">☰</button>
              <div>
                <div class="company-name">${esc(state.account.companyName)}</div>
                <h1 class="page-title">Viewings</h1>
              </div>
            </div>
            <div class="header-tabs">
              <button class="header-tab ${state.viewingsTab === "upcoming" ? "active" : ""}" data-vtab="upcoming" type="button">UPCOMING VIEWINGS</button>
              <button class="header-tab ${state.viewingsTab === "general" ? "active" : ""}" data-vtab="general" type="button">GENERAL AVAILABILITY</button>
              <button class="header-tab ${state.viewingsTab === "calsync" ? "active" : ""}" data-vtab="calsync" type="button">CALENDAR SYNC</button>
            </div>
          `;
          header.querySelectorAll("[data-vtab]").forEach(btn => {
            btn.addEventListener("click", () => {
              state.viewingsTab = btn.dataset.vtab;
              saveState();
              render();
            });
          });
        } else if (state.section === "access") {
          header.innerHTML = `
            <div class="top-header-inner">
              <button id="mobileMenuBtn" class="mobile-menu-btn" type="button" aria-label="Menu">☰</button>
              <div>
                <div class="company-name">${esc(state.account.companyName)}</div>
                <h1 class="page-title">Access</h1>
              </div>
            </div>
            <div class="header-tabs">
              ${[['CodeBox','CODEBOX'],['SentriLock','SENTRILOCK'],['PointCentral','POINTCENTRAL'],['contacts','AUTHORIZED CONTACTS']].map(([id,label])=>`<button class="header-tab ${state.accessTab===id?'active':''}" data-atab="${id}" type="button">${label}</button>`).join('')}
            </div>
            ${state.accessTab==='contacts' ? plusButton('add-contact','Add contact') : plusButton('practice-add-device','Add device')}
          `;
          header.querySelectorAll("[data-atab]").forEach(btn => {
            btn.addEventListener("click", () => {
              state.accessTab = btn.dataset.atab;
              saveState();
              render();
            });
          });
        } else {
          const navObj = NAV_ITEMS.find(n => n.id === state.section);
          const title = navObj ? navObj.label : "Rentals";
          header.innerHTML = `
            <div class="top-header-inner">
              <button id="mobileMenuBtn" class="mobile-menu-btn" type="button" aria-label="Menu">☰</button>
              <div>
                <div class="company-name">${esc(state.account.companyName)}</div>
                <h1 class="page-title">${title}</h1>
              </div>
            </div>
            ${state.section === 'reports' ? `<div class="header-tabs"><button class="header-tab ${state.reportTab==='standard'?'active':''}" data-report-tab="standard" type="button">STANDARD</button><button class="header-tab ${state.reportTab==='scheduled'?'active':''}" data-report-tab="scheduled" type="button">SCHEDULED</button></div>` : ''}
            ${state.section === "rentals" ? `
              <button id="syncFab" class="sync-fab" type="button" title="Sync rentals from property management software" aria-label="Sync rentals">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="23 4 23 10 17 10"></polyline>
                  <polyline points="1 20 1 14 7 14"></polyline>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                </svg>
              </button>
            ` : ""}
          `;

          byId('syncFab')?.addEventListener('click',wf.importRental);
          header.querySelectorAll('[data-report-tab]').forEach(btn=>btn.onclick=()=>{state.reportTab=btn.dataset.reportTab;state.activeReport=null;saveState();render();tutorial.record('report-tab',{tab:state.reportTab});});
        }

        tutorial.mount();
        if(rental) header.parentElement.style.setProperty('--rental-header-height',`${header.offsetHeight}px`);
        const mobBtn = document.getElementById("mobileMenuBtn");
        if (mobBtn) {
          mobBtn.addEventListener("click", () => {
            document.getElementById("sidebar").classList.toggle("open");
            document.getElementById("sidebarBackdrop").classList.toggle("open");
          });
        }
      }

      function renderRentalsList() {
        const canvas = document.getElementById("canvas");
        const q = state.filters.search.trim().toLowerCase();
        const users = Array.from(new Set(state.rentals.map(r => r.assignee)));

        const visible = state.rentals.filter(r => {
          if (!state.filters.showInactives && !r.active) return false;
          if (state.filters.user !== "anyone" && r.assignee !== state.filters.user) return false;
          if (q && !(r.address.toLowerCase().includes(q) || r.device.toLowerCase().includes(q) || r.assignee.toLowerCase().includes(q))) {
            return false;
          }
          return true;
        });

        canvas.innerHTML = `
          <div class="filter-bar">
            <div class="filter-left">
              <div class="mat-field">
                <label class="mat-label" for="userFilter">User</label>
                <select id="userFilter" class="mat-select">
                  <option value="anyone" ${state.filters.user === "anyone" ? "selected" : ""}>anyone</option>
                  ${users.map(u => `<option value="${esc(u)}" ${state.filters.user === u ? "selected" : ""}>${esc(u)}</option>`).join("")}
                </select>
              </div>

              <label class="mat-switch" style="padding-bottom:6px;">
                <input id="showInactivesInput" type="checkbox" ${state.filters.showInactives ? "checked" : ""} />
                <span class="switch-track"></span>
                <span>Show inactives</span>
              </label>
            </div>

            <div class="search-box">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#757575" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input id="searchInput" type="search" placeholder="Search" value="${esc(state.filters.search)}" />
            </div>
          </div>

          ${visible.length === 0 ? `
            <div class="mat-card" style="text-align:center; padding:32px;">
              <div style="font-size:16px; margin-bottom:8px;">No rentals match your current filters.</div>
              <button id="clearFiltersBtn" class="btn-blue" type="button">Reset Filters</button>
            </div>
          ` : `
            <div class="rentals-grid">
              ${visible.map(r => {
                const alerts=(r.alerts || 0)+r.leads.filter(l=>!l.archived && (l.idMetadataWarning || l.idRequested)).length;
                return `
                <article class="prop-card ${r.active ? "" : "inactive-card"}">
                  <div class="prop-photo-wrap" data-open-settings="${r.id}">
                    <img src="${esc(r.photo)}" alt="${esc(r.address)}" />
                    <div class="prop-badges">
                      ${r.waitlist ? `
                        <span class="tt-badge badge-waitlist">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="10" y1="15" x2="10" y2="9"></line>
                            <line x1="14" y1="15" x2="14" y2="9"></line>
                          </svg>
                          Wait List
                        </span>
                      ` : ""}
                      ${r.device ? `<span class="tt-badge badge-device">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                          <rect x="5" y="11" width="14" height="10" rx="2"></rect>
                          <path d="M8 11V7a4 4 0 0 1 8 0v4"></path>
                        </svg>
                        ${esc(r.device)}
                      </span>` : ''}
                      ${alerts > 0 ? `
                        <span class="tt-badge badge-alert">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                          </svg>
                          ${alerts} ${alerts === 1 ? "Alert" : "Alerts"}
                        </span>
                      ` : ""}
                    </div>
                    <div class="prop-scrim">${esc(r.address)}</div>
                  </div>
                  <div class="prop-footer">
                    <span class="status-dot ${r.active ? "" : "off"}" title="${r.active ? "Active" : "Inactive"}"></span>
                    <button class="card-link-btn" data-open-leads="${r.id}" type="button">LEADS</button>
                    <button class="card-link-btn" data-open-settings="${r.id}" type="button">SETTINGS</button>
                  </div>
                </article>
              `;}).join("")}
            </div>
          `}
        `;

        document.getElementById("userFilter").addEventListener("change", e => {
          state.filters.user = e.target.value;
          saveState();
          renderRentalsList();
        });

        document.getElementById("showInactivesInput").addEventListener("change", e => {
          state.filters.showInactives = e.target.checked;
          saveState();
          renderRentalsList();
        });

        const searchEl = document.getElementById("searchInput");
        searchEl.addEventListener("input", e => {
          state.filters.search = e.target.value;
          saveState();
          renderRentalsList();
          tutorial.record('rental-search',{query:e.target.value});
          const re = document.getElementById("searchInput");
          if (re) {
            re.focus();
            re.setSelectionRange(re.value.length, re.value.length);
          }
        });

        const clearBtn = document.getElementById("clearFiltersBtn");
        if (clearBtn) {
          clearBtn.addEventListener("click", () => {
            state.filters = { user: "anyone", showInactives: false, search: "" };
            saveState();
            renderRentalsList();
          });
        }

        canvas.querySelectorAll("[data-open-settings]").forEach(el => {
          el.addEventListener("click", () => {
            state.selectedRentalId = el.dataset.openSettings;
            state.detailTab = "settings";
            state.activeSubnav = "status";
            saveState();
            render();
            tutorial.record('rental-settings',{rentalId:state.selectedRentalId});
            window.scrollTo({ top: 0, behavior: "smooth" });
          });
        });

        canvas.querySelectorAll("[data-open-leads]").forEach(el => {
          el.addEventListener("click", () => {
            state.selectedRentalId = el.dataset.openLeads;
            state.detailTab = "leads";
            saveState();
            render();
            window.scrollTo({ top: 0, behavior: "smooth" });
          });
        });


      }

      function agentOptions(selected) {
        return state.users.filter(u=>u.active || u.name===selected).map(u=>`<option value="${esc(u.name)}" ${u.name===selected?'selected':''}>${esc(u.name)}</option>`).join('');
      }
      function listingPhotos(r) {
        return [
          [r.photo, 'Listing exterior'], ['assets/living-sample.jpg','Sample living room'],
          ['assets/kitchen-sample.jpg','Sample kitchen'], ['assets/dining-sample.jpg','Sample dining area'],
          ['assets/bedroom-sample.jpg','Sample bedroom'], ['assets/bath-sample.jpg','Sample bathroom'],
          ['assets/kitchen-counter.jpg','Kitchen counter'],
          ['assets/kitchen-island.jpg','Kitchen island'],
          ['assets/lounge.jpg','Main lounge'],
          ['assets/lounge-windows.jpg','Lounge windows'],
          ['assets/sitting-room.jpg','Sitting room'],
          ['assets/family-room.jpg','Family room'],
          ['assets/window-seat.jpg','Window seating'],
          ['assets/bedroom-window.jpg','Bedroom window'],
          ['assets/guest-bedroom.jpg','Guest bedroom'],
          ['assets/bath-vanity.jpg','Bathroom vanity'],
          ['assets/walk-in-bath.jpg','Walk-in bath'],
          ['assets/open-plan.jpg','Open-plan living area'],
          ['assets/lounge-terrace.jpg','Terrace lounge'],
          ['assets/entry-exterior.jpg','Entry exterior'],
          ['assets/courtyard.jpg','Courtyard'],
          ['assets/terrace.jpg','Terrace'],
          ['assets/evening-garden.jpg','Garden at dusk'],
          ['assets/garden.jpg','Garden view'],
          ['assets/pool.jpg','Pool'],
        ];
      }
      function viewListingPhoto(photos,index) {
        const [src,label]=photos[index];
        openModal('Listing photos',`<figure class="listing-photo-preview">
          <img src="${esc(src)}" alt="${esc(label)}"><figcaption>${esc(label)} · ${index+1} of ${photos.length}</figcaption></figure>`,
          '<button id="listing-photo-prev" class="btn-outline" type="button">Previous photo</button><button id="listing-photo-next" class="btn-blue" type="button">Next photo</button>');
        byId('listing-photo-prev').onclick=()=>viewListingPhoto(photos,(index+photos.length-1)%photos.length);
        byId('listing-photo-next').onclick=()=>viewListingPhoto(photos,(index+1)%photos.length);
      }
      function qualifyingQuestionEditor(question,index) {
        return `<fieldset class="qualifying-question">
          <legend>Question ${index+1}</legend>
          <label class="mat-field"><span class="mat-label">Question</span><input class="mat-input" data-question-label="${index}" value="${esc(question.label)}"></label>
          <div class="qualifying-choices">${question.options.map((option,i)=>`<div class="qualifying-choice">
            <label class="mat-field"><span class="mat-label">Answer ${i+1}</span><input class="mat-input" data-option-label="${index}:${i}" value="${esc(option.label)}"></label>
            <label><input type="checkbox" data-option-knockout="${index}:${i}" ${option.knockout?'checked':''}> Knockout</label>
            <button class="btn-flat" type="button" data-option-remove="${index}:${i}" aria-label="Remove answer ${i+1}" ${question.options.length<=2?'disabled':''}>Remove</button>
          </div>`).join('')}</div>
          <div class="practice-actions">
            <button class="btn-outline" type="button" data-option-add="${index}">Add answer</button>
            <button class="btn-flat" type="button" data-question-remove="${index}">Remove question</button>
          </div>
        </fieldset>`;
      }
      function renderRentalSettings(original) {
        if (!settingsDraft || settingsDraft.id!==original.id) {
          settingsDraft=structuredClone(original);
          generalAvailabilityDrafts.clear();
        }
        const r=settingsDraft;
        const canvas = document.getElementById("canvas");
        const maxInstr = 200;
        const remaining = Math.max(0, maxInstr - (r.viewing.instructions || "").length);
        const ip = r.viewing.inPerson || defaultInPerson(r.assignee);
        const lim = r.viewing.limits || defaultShowingLimits();
        const selfAccessHours=state.generalAvailability[r.assignee];
        const ipRemaining = Math.max(0, maxInstr - (ip.instructions || "").length);
        const photos=listingPhotos(r);
        const assignedDev = state.devices.find(d => d.serial === r.serialNumber && d.type === r.viewing.viewingType);
        const selectableDevices=state.devices.filter(d=>d.type===r.viewing.viewingType &&
          (!d.rentalId || d.rentalId===r.id || state.rentals.some(item=>item.id===d.rentalId && !item.active)));
        const deviceGroups=[
          ['Current assignment',selectableDevices.filter(d=>d.rentalId===r.id)],
          ['Available inventory',selectableDevices.filter(d=>!d.rentalId)],
          ['Assigned to inactive rentals',selectableDevices.filter(d=>d.rentalId && d.rentalId!==r.id)],
        ];

        const viewingTypes=[['CodeBox','CodeBox'],['Instructions only','Instructions only'],['Lockbox','Combo lock box'],['Prempoint','Prempoint'],['SentriLock','SentriLock']];
        if(!viewingTypes.some(([type])=>type===r.viewing.viewingType)) viewingTypes.push([r.viewing.viewingType,r.viewing.viewingType]);

        canvas.innerHTML = `
          <div class="settings-layout">
            <!-- Left Sticky Sub-Navigation -->
            <nav class="subnav-sticky" aria-label="Settings sections">
              <button class="subnav-link ${state.activeSubnav === "status" ? "active" : ""}" data-jump="status" type="button">Status</button>
              <button class="subnav-link ${state.activeSubnav === "marketing" ? "active" : ""}" data-jump="marketing" type="button">Marketing</button>
              <button class="subnav-link ${state.activeSubnav === "qualifying" ? "active" : ""}" data-jump="qualifying" type="button">Qualifying</button>
              <button class="subnav-link ${state.activeSubnav === "viewing" ? "active" : ""}" data-jump="viewing" type="button">Viewing</button>
              <button id="jumpToRentalAvailBtn" class="subnav-link" type="button">Availability hours</button>
              <button class="subnav-link ${state.activeSubnav === "fees" ? "active" : ""}" data-jump="fees" type="button">Application &amp; Fees</button>
            </nav>

            <!-- Right Main Column Cards -->
            <div class="settings-stack">
              <!-- 1. STATUS CARD (0125-rental-settings.jpg) -->
              <section id="sec-status" class="mat-card">
                <h2 class="mat-card-title">Status</h2>
                <div class="grid-2" style="align-items:center;">
                  <div class="row-inline">
                    <label class="status-control">
                      <input id="stActive" type="checkbox" ${r.active ? "checked" : ""} />
                      <span class="status-dot ${r.active ? "" : "off"}" aria-hidden="true"></span>
                      <span>${r.active ? "Rental is active" : "Rental is inactive"}</span>
                    </label>
                  </div>
                  <div class="mat-field">
                    <div class="row-inline" style="justify-content:space-between;">
                      <label class="mat-label" for="stAssignee">This rental is assigned to</label>
                      <span class="help-q" title="Leads and notifications for this property route to the assigned user.">?</span>
                    </div>
                    <select id="stAssignee" class="mat-select">
                      ${agentOptions(r.assignee)}
                    </select>
                  </div>
                </div>
              </section>

              <!-- 2. MARKETING CARD (0125, 0142, 0200, 0215) -->
              <section id="sec-marketing" class="mat-card">
                <h2 class="mat-card-title">Marketing</h2>
                ${r.imported ? '<p class="muted">Lease and property details come from the source listing.</p>' : ''}

                <div class="sub-heading first">Lease Details</div>
                <div class="rental-lease-fields">
                  <div class="mat-field">
                    <label class="mat-label" for="mkTerm">Lease Term</label>
                    <select id="mkTerm" class="mat-select" ${r.imported ? 'disabled' : ''}>
                      <option value="One Year" ${r.leaseTerm === "One Year" ? "selected" : ""}>One Year</option>
                      <option value="6 Months" ${r.leaseTerm === "6 Months" ? "selected" : ""}>6 Months</option>
                      <option value="Month-to-Month" ${r.leaseTerm === "Month-to-Month" ? "selected" : ""}>Month-to-Month</option>
                    </select>
                  </div>
                  <div class="imported-box">
                    <div class="imported-head"><span>Rent</span></div>
                    <div class="imported-val">${r.imported ? `$ ${r.rent}` : `<input class="mat-input" aria-label="Rent" id="field-rent" type="number" value="${esc(r.rent)}" min="0" step="any">`}</div>
                  </div>
                  <div class="imported-box">
                    <div class="imported-head"><span>Deposit</span></div>
                    <div class="imported-val">${r.imported ? `$ ${r.deposit}` : `<input class="mat-input" aria-label="Deposit" id="field-deposit" type="number" value="${esc(r.deposit)}" min="0" step="any">`}</div>
                  </div>
                  <div class="imported-box">
                    <div class="imported-head"><span>Date Available for Move-in</span></div>
                    <div class="imported-val">${r.imported ? `${esc(r.dateAvailable)}` : `<input class="mat-input" aria-label="Date Available for Move-in" id="field-dateAvailable" type="date" value="${esc(r.dateAvailable)}">`}</div>
                  </div>
                </div>

                <div class="sub-heading">Property Details</div>
                <div class="grid-2" style="margin-bottom:14px;">
                  <div class="mat-field">
                    <label class="mat-label" for="mkType">Property Type</label>
                    <select id="mkType" class="mat-select" ${r.imported ? 'disabled' : ''}>
                      <option value="Single Family House" ${r.propertyType === "Single Family House" ? "selected" : ""}>Single Family House</option>
                      <option value="Townhouse" ${r.propertyType === "Townhouse" ? "selected" : ""}>Townhouse</option>
                      <option value="Apartment / Condo" ${r.propertyType === "Apartment / Condo" ? "selected" : ""}>Apartment / Condo</option>
                    </select>
                  </div>
                  <div class="grid-3" style="gap:8px;">
                    <div class="imported-box">
                      <div class="imported-head"><span>Bedrooms</span></div>
                      <div class="imported-val">${r.imported ? `${r.bedrooms}` : `<input class="mat-input" aria-label="Bedrooms" id="field-bedrooms" type="number" value="${esc(r.bedrooms)}" min="0" step="any">`}</div>
                    </div>
                    <div class="imported-box">
                      <div class="imported-head"><span>Bathrooms</span></div>
                      <div class="imported-val">${r.imported ? `${esc(r.bathrooms)}` : `<input class="mat-input" aria-label="Bathrooms" id="field-bathrooms" type="number" value="${esc(r.bathrooms)}" min="0" step="any">`}</div>
                    </div>
                    <div class="imported-box">
                      <div class="imported-head"><span>Square Feet</span></div>
                      <div class="imported-val">${r.imported ? `${r.sqft}` : `<input class="mat-input" aria-label="Square Feet" id="field-sqft" type="number" value="${esc(r.sqft)}" min="0" step="any">`}</div>
                    </div>
                  </div>
                </div>

                <div class="grid-2" style="margin-bottom:14px;">
                  <label class="mat-field"><span class="mat-label">Descriptive Title</span><input class="mat-input" type="text" value="${esc(r.descriptiveTitle || `${r.bedrooms}-bedroom ${r.propertyType} at ${r.address}`)}" readonly></label>
                  <label class="mat-field"><span class="mat-label">Custom Title</span><input id="mkTitle" class="mat-input" type="text" value="${esc(r.customTitle)}" /></label>
                </div>
                <div class="mat-field" style="margin-bottom:16px;">
                  <label class="mat-label" for="mkDesc">Description</label>
                  <textarea id="mkDesc" class="mat-textarea" ${r.imported ? 'readonly' : ''}>${esc(r.description)}</textarea>
                </div>

                <details class="listing-visuals">
                  <summary>Visuals</summary>
                  <label class="mat-field"><span class="mat-label">Virtual Tour</span>
                    <input id="listing-virtual-tour" class="mat-input" type="url" value="${esc(r.virtualTour || '')}" ${r.imported?'readonly':''}>
                  </label>
                <div class="listing-gallery">
                  ${photos.map(([src,label], index)=>`<button class="photo-thumb-item" type="button" data-listing-photo="${index}" aria-label="View ${esc(label)}"><img src="${esc(src)}" alt="" loading="lazy"></button>`).join('')}
                </div>
                </details>

                <div class="accordion-row">
                  <button class="accordion-btn" type="button"><span aria-hidden="true">▸</span><span>Amenities</span></button>
                  <div class="accordion-body">Central A/C, Dishwasher, Washer/Dryer Hookups, Attached Garage, Fenced Yard</div>
                </div>
                <div class="accordion-row">
                  <button class="accordion-btn" type="button"><span aria-hidden="true">▸</span><span>Utilities Included</span></button>
                  <div class="accordion-body">Trash &amp; HOA exterior maintenance included; tenant pays water, gas, and electric.</div>
                </div>
                <div class="accordion-row">
                  <button class="accordion-btn" type="button"><span aria-hidden="true">▸</span><span>Address</span></button>
                  <div class="accordion-body">${esc(r.address)}</div>
                </div>

                <div class="sub-heading">Syndication</div>
                <div class="grid-3">
                  ${SYNDICATION_SITES.map(site => `
                    <div class="row-inline" style="justify-content:space-between;">
                      <label class="mat-switch">
                        <input class="syn-toggle" data-site="${esc(site)}" type="checkbox" ${r.syndication[site] ? "checked" : ""} />
                        <span class="switch-track"></span>
                        <span style="font-size:13px;">${esc(site)}</span>
                      </label>
                      <span class="help-q" title="Syndicate this listing to ${esc(site)}">?</span>
                    </div>
                  `).join("")}
                </div>
              </section>

              <!-- 3. QUALIFYING CARD (0232-qualifying.jpg, 0253-custom-questions.jpg) -->
              <section id="sec-qualifying" class="mat-card">
                <h2 class="mat-card-title">Qualifying</h2>

                <div class="sub-heading first">Restrictions</div>
                <div class="toggle-list">
                  <div class="row-inline">
                    <label class="mat-switch">
                      <input id="qReqMoveIn" type="checkbox" ${r.qualifying.reqMoveIn ? "checked" : ""} />
                      <span class="switch-track"></span>
                      <span>Require move-in within</span>
                    </label>
                    <input id="qMoveInDays" class="inline-num" type="number" min="7" max="180" value="${r.qualifying.moveInDays}" />
                    <span>days of date available</span>
                  </div>

                  <div class="row-inline">
                    <label class="mat-switch">
                      <input id="qReqIncome" type="checkbox" ${r.qualifying.reqIncome ? "checked" : ""} />
                      <span class="switch-track"></span>
                      <span>Require an income to rent ratio of at least</span>
                    </label>
                    <input id="qIncomeRatio" class="inline-num" type="number" min="1" max="5" step="0.5" value="${r.qualifying.incomeRatio}" />
                    <span>times rent</span>
                  </div>

                  <label class="mat-switch">
                    <input id="qCosigner" type="checkbox" ${r.qualifying.allowCosigner ? "checked" : ""} />
                    <span class="switch-track"></span>
                    <span>Allow leads with a co-signer</span>
                  </label>

                  <label class="mat-switch">
                    <input id="qVouchers" type="checkbox" ${r.qualifying.allowVouchers ? "checked" : ""} />
                    <span class="switch-track"></span>
                    <span>Allow leads with government housing vouchers</span>
                  </label>

                  <div>
                    <label class="mat-switch">
                      <input id="qPets" type="checkbox" ${r.qualifying.allowPets ? "checked" : ""} />
                      <span class="switch-track"></span>
                      <span>Allow leads with pets</span>
                    </label>
                    ${r.qualifying.allowPets ? `
                      <div class="blue-subpanel">
                        <div class="mat-field" style="max-width:200px;">
                          <label class="mat-label" for="qMaxPets">Maximum Number of Pets</label>
                          <input id="qMaxPets" class="mat-input" type="number" min="1" max="6" value="${r.qualifying.maxPets || 2}" />
                        </div>
                        <label class="mat-switch">
                          <input id="qCats" type="checkbox" ${r.qualifying.allowCats ? "checked" : ""} />
                          <span class="switch-track"></span>
                          <span>Allow cats</span>
                        </label>
                        <label class="mat-switch">
                          <input id="qSmallDogs" type="checkbox" ${r.qualifying.allowSmallDogs ? "checked" : ""} />
                          <span class="switch-track"></span>
                          <span>Allow small dogs (under 20 lbs)</span>
                        </label>
                        <label class="mat-switch">
                          <input id="qLargeDogs" type="checkbox" ${r.qualifying.allowLargeDogs ? "checked" : ""} />
                          <span class="switch-track"></span>
                          <span>Allow large dogs</span>
                        </label>
                      </div>
                    ` : ""}
                  </div>

                  <div class="grid-2 practice-grid-gap">
                    ${window.ReplicaBooking.historyRestrictions.map(({key,id,label,years})=>{
                      const policy=window.ReplicaBooking.historyPolicy(r.qualifying,key);
                      return `<label class="mat-field"><span class="mat-label">${label}</span><select id="${id}" class="mat-select" data-history-policy="${key}">
                        <option value="reject" ${policy==='reject'?'selected':''}>Reject any record</option>
                        <option value="older" ${policy==='older'?'selected':''}>Allow only if more than ${years} years old</option>
                        <option value="allow" ${policy==='allow'?'selected':''}>Allow records of any age</option>
                      </select></label>`;
                    }).join('')}
                  </div>
                </div>

                <div class="sub-heading">Custom Questions</div>
                <div class="toggle-list">
                  ${window.ReplicaBooking.builtInQuestions.filter(question=>!question.legacy || r.qualifying[question.key]).map(question=>`<div>
                    <label class="mat-switch">
                      <input id="${question.settingId}" type="checkbox" ${r.qualifying[question.key] ? 'checked' : ''}>
                      <span class="switch-track"></span>
                      <span>${esc(question.label)}</span>
                    </label>
                    ${r.qualifying[question.key] ? `<div class="practice-note">${question.numeric
                      ? 'Records the number of occupants for review.'
                      : `Knockout answer: ${question.options.find(option=>option.knockout).label}`}</div>
                    ` : ""}
                  </div>`).join('')}
                </div>
                ${r.qualifying.questions.map(qualifyingQuestionEditor).join('')}
                <div class="practice-actions"><button type="button" class="btn-outline" id="add-custom-question">+ Add question</button></div>
              </section>

              <!-- 4. VIEWING CARD (0314-wait-list.jpg, 0548-device-assignment.jpg, 0605-in-person.jpg, 0620-showing-limit.jpg) -->
              <section id="sec-viewing" class="mat-card">
                <div class="row-inline" style="justify-content:space-between; margin-bottom:10px;">
                  <h2 class="mat-card-title" style="margin:0;">Viewing</h2>
                </div>

                <div class="sub-heading first">Viewing Methods</div>
                <div class="toggle-list">
                  <!-- Wait List -->
                  <div>
                    <label class="mat-switch">
                      <input id="vwWaitlist" type="checkbox" ${r.waitlist ? "checked" : ""} />
                      <span class="switch-track"></span>
                      <span>Wait List (don't allow viewings yet)</span>
                    </label>
                    ${r.waitlist ? `
                      <div class="blue-subpanel">
                        <div class="mat-field">
                          <div class="row-inline" style="justify-content:space-between;">
                            <label class="mat-label" for="vwWaitMsg">Message to prospective tenants (optional)</label>
                            <span class="help-q" title="Displayed to leads when they join the wait list.">?</span>
                          </div>
                          <input id="vwWaitMsg" class="mat-input" type="text" value="${esc(r.waitlistMessage)}" />
                        </div>
                      </div>
                    ` : ""}
                  </div>

                  <!-- Self-Access Viewings & Device Assignment (0548-device-assignment.jpg) -->
                  <div>
                    <label class="mat-switch">
                      <input id="vwSelfAccess" type="checkbox" ${r.viewing.selfAccess ? "checked" : ""} />
                      <span class="switch-track"></span>
                      <span>Self-Access Viewings</span>
                    </label>
                    ${r.viewing.selfAccess ? `
                      <div class="blue-subpanel">
                        <p class="availability-note"><strong>Self-showing safety.</strong> Display the management office’s contact details at the property so visitors can verify a listing or payment request.</p>
                        <div class="grid-2">
                          <div class="mat-field">
                            <label class="mat-label" for="vwType">Viewing Type</label>
                            <select id="vwType" class="mat-select">
                              ${viewingTypes.map(([type,label])=>`<option value="${esc(type)}" ${r.viewing.viewingType===type?'selected':''}>${esc(label)}</option>`).join('')}
                            </select>
                          </div>
                          <div class="mat-field">
                            <label class="mat-label" for="vwApproval">Viewing Approval</label>
                            <select id="vwApproval" class="mat-select">
                              <option value="Set Appointments" ${r.viewing.viewingApproval === "Set Appointments" ? "selected" : ""}>Set Appointments</option>
                              <option value="Require Manual Approval" ${r.viewing.viewingApproval === "Require Manual Approval" ? "selected" : ""}>Require Manual Approval</option>
                            </select>
                          </div>
                        </div>

                        ${r.viewing.viewingType!=='Instructions only' ? `
                          <div class="mat-field">
                            <div class="row-inline" style="justify-content:space-between;">
                              <label class="mat-label" for="vwAssignedDevice">Self-Access ${esc(r.viewing.viewingType)} Serial Number</label>
                              <span class="help-q" title="Select a device from Access inventory. Saving can transfer a device from an inactive rental.">?</span>
                            </div>
                            <select id="vwAssignedDevice" class="mat-select">
                              <option value="">Unassigned</option>
                              ${r.serialNumber && !selectableDevices.includes(assignedDev) ? `<option value="legacy" selected>${esc(r.serialNumber)} · Current record</option>` : ''}
                              ${deviceGroups.filter(([,devices])=>devices.length).map(([label,devices])=>`<optgroup label="${label}">
                                ${devices.map(d=>`<option value="${esc(d.id)}" ${assignedDev?.id===d.id?'selected':''}>
                                  ${esc(d.serial)}${d.rentalId && d.rentalId!==r.id ? ` · ${esc(state.rentals.find(item=>item.id===d.rentalId)?.address)}` : ''}
                                </option>`).join('')}</optgroup>`).join('')}
                            </select>
                          </div>
                        ` : ''}

                        <div class="mat-field">
                          <label class="mat-label" for="vwInstr">Self-Access Viewing Instructions (optional)</label>
                          <textarea id="vwInstr" class="mat-textarea" rows="4" maxlength="${maxInstr}" aria-describedby="vwCounter">${esc(r.viewing.instructions)}</textarea>
                          <div id="vwCounter" class="char-counter">${remaining} remaining</div>
                        </div>

                        <label class="mat-switch">
                          <input id="vwReqId" type="checkbox" ${r.viewing.requireId ? "checked" : ""} />
                          <span class="switch-track"></span>
                          <span>Require government ID to be uploaded?</span>
                        </label>
                      </div>
                    ` : ""}
                  </div>

                  <!-- In-Person Viewings (0605-in-person.jpg) -->
                  <div>
                    <label class="mat-switch">
                      <input id="vwInPerson" type="checkbox" ${ip.enabled ? "checked" : ""} />
                      <span class="switch-track"></span>
                      <span>In-Person Viewings</span>
                    </label>
                    ${ip.enabled ? `
                      <div class="blue-subpanel">
                        <div class="grid-3">
                          <label class="mat-field">
                            <span class="mat-label">Max Showings per Time</span>
                            <input id="ipMaxLeads" class="mat-input" type="number" min="1" max="15" value="${esc(ip.maxLeadsPerSlot)}" required>
                          </label>
                          <div class="mat-field">
                            <label class="mat-label" for="ipDuration">Showing Duration</label>
                            <select id="ipDuration" class="mat-select">
                              <option value="15" ${ip.durationMinutes === 15 ? "selected" : ""}>15 minutes</option>
                              <option value="30" ${ip.durationMinutes === 30 ? "selected" : ""}>30 minutes</option>
                              <option value="45" ${ip.durationMinutes === 45 ? "selected" : ""}>45 minutes</option>
                              <option value="60" ${ip.durationMinutes === 60 ? "selected" : ""}>60 minutes</option>
                            </select>
                          </div>
                          <div class="mat-field">
                            <label class="mat-label" for="ipNotice">Scheduling Notice</label>
                            <select id="ipNotice" class="mat-select">
                              <option value="1" ${ip.advanceNoticeHours === 1 ? "selected" : ""}>1 hour</option>
                              <option value="2" ${ip.advanceNoticeHours === 2 ? "selected" : ""}>2 hours</option>
                              <option value="4" ${ip.advanceNoticeHours === 4 ? "selected" : ""}>4 hours</option>
                              <option value="12" ${ip.advanceNoticeHours === 12 ? "selected" : ""}>12 hours</option>
                              <option value="24" ${ip.advanceNoticeHours === 24 ? "selected" : ""}>24 hours</option>
                            </select>
                          </div>
                        </div>

                        <div class="grid-2">
                          <label class="mat-field">
                            <span class="mat-label">Buffer Before Trip to Rental</span>
                            <select id="ipBuffer" class="mat-select">
                              ${[0,15,30,45,60].map(value=>`<option value="${value}" ${ip.bufferMinutes===value?'selected':''}>${value ? `${value} minutes` : 'None'}</option>`).join('')}
                            </select>
                          </label>
                          <label class="mat-field">
                            <span class="mat-label">Limit Showings</span>
                            <select id="ipVisitLimit" class="mat-select">
                              ${IN_PERSON_LIMITS.map(([value,label])=>`<option value="${value}" ${lim.inPersonVisitLimit===value?'selected':''}>${label}</option>`).join('')}
                            </select>
                          </label>
                        </div>
                        ${lim.legacyInPersonCap ? `<p class="availability-note">This rental also has a saved cap of ${esc(lim.maxPerDay)} showings per day. Choose a different Limit Showings option to replace the saved cap.</p>` : ''}
                        <details class="showing-details">
                          <summary>Optional showing details</summary>
                          <label class="mat-field">
                            <span class="mat-label">Default showing agent</span>
                            <select id="ipAgent" class="mat-select">
                              ${agentOptions(ip.showingAgent)}
                              <option value="Any Available Agent" ${ip.showingAgent === "Any Available Agent" ? "selected" : ""}>Any Available Agent</option>
                            </select>
                          </label>
                          <label class="mat-switch">
                            <input id="ipConfirm" type="checkbox" ${ip.requireConfirmation ? "checked" : ""} />
                            <span class="switch-track"></span>
                            <span>Require leads to confirm 2 hours before appointment</span>
                          </label>
                          <label class="mat-switch"><input id="ipNotify" type="checkbox" ${ip.notifyOccupants?'checked':''}><span class="switch-track"></span><span>Record practice notice for current occupants</span></label>
                          <div class="mat-field">
                            <label class="mat-label" for="ipInstr">In-Person Viewing Instructions</label>
                            <textarea id="ipInstr" class="mat-textarea" maxlength="${maxInstr}">${esc(ip.instructions)}</textarea>
                            <div id="ipCounter" class="char-counter">${ipRemaining} remaining</div>
                          </div>
                        </details>
                      </div>
                    ` : ""}
                  </div>
                </div>

                <!-- Showing Limits (0620-showing-limit.jpg) -->
                <details class="showing-details">
                <summary>Advanced scheduling options</summary>
                <div class="toggle-list">
                  <div class="row-inline">
                    <label class="mat-switch">
                      <input id="limUpcoming" type="checkbox" ${lim.limitUpcoming ? "checked" : ""} />
                      <span class="switch-track"></span>
                      <span>Limit total upcoming showings to</span>
                    </label>
                    <input id="limMaxUpcoming" class="inline-num" type="number" min="1" max="50" value="${lim.maxUpcoming}" />
                    <span>active appointments</span>
                    <span class="help-q" title="Automatically pauses new bookings once this number of upcoming showings is reached.">?</span>
                  </div>

                  <div class="row-inline">
                    <label class="mat-switch">
                      <input id="limMinDays" type="checkbox" ${lim.minDaysBetweenEnabled ? "checked" : ""} />
                      <span class="switch-track"></span>
                      <span>Require at least</span>
                    </label>
                    <input id="limMinDaysVal" class="inline-num" type="number" min="1" max="14" value="${lim.minDaysBetween}" />
                    <span>day(s) between showings</span>
                  </div>

                  <label class="mat-switch">
                    <input id="limNoDupes" type="checkbox" ${lim.preventDuplicates ? "checked" : ""} />
                    <span class="switch-track"></span>
                    <span>Prevent duplicate active showings from the same lead</span>
                  </label>

                  <div class="grid-2" style="margin-top:4px;">
                    <div class="mat-field">
                      <label class="mat-label" for="limSelfNotice">Minimum Advance Notice (Self-Access)</label>
                      <select id="limSelfNotice" class="mat-select">
                        ${["None (Immediate)", "30 minutes", "1 hour", "2 hours", "4 hours", "24 hours"].map(opt => `
                          <option value="${opt}" ${lim.selfAccessAdvanceNotice === opt ? "selected" : ""}>${opt}</option>
                        `).join("")}
                      </select>
                    </div>
                    <div class="mat-field">
                      <label class="mat-label" for="limMaxAdv">How Far in Advance Leads Can Schedule (Days)</label>
                      <input id="limMaxAdv" class="mat-input" type="number" min="1" max="30" value="${lim.maxDaysAdvance}" />
                    </div>
                  </div>
                </div>
                </details>
                <div id="viewing-availability">
                  <h3 class="sub-heading">Availability</h3>
                  ${r.viewing.selfAccess && selfAccessHours ? `<p class="availability-agents-caption">Self-access hours are ${esc(selfAccessHours.selfAccessStart)} to ${esc(selfAccessHours.selfAccessEnd)} daily.</p>` : ''}
                  <p class="availability-agents-caption">Choose availability sources for in-person showings.</p>
                  <label class="mat-switch"><input id="inline-general-enabled" type="checkbox" ${r.availability.generalEnabled?'checked':''}><span class="switch-track"></span><span>General Availability</span></label>
                  <div id="inline-general-hours" ${r.availability.generalEnabled?'':'hidden'}></div>
                  <div class="row-inline">
                    <label class="mat-switch"><input id="inline-custom-enabled" type="checkbox" ${r.availability.mode==='custom' ? 'checked' : ''}><span class="switch-track"></span><span>Rental-Specific Availability</span></label>
                    <button id="viewAvailabilityReport" class="btn-flat btn-sm" type="button">View Availability Report</button>
                  </div>
                  <div id="inline-custom-hours" ${r.availability.mode!=='custom' ? 'hidden' : ''}></div>
                </div>
              </section>

              <!-- 5. APPLICATION & FEES CARD -->
              <section id="sec-fees" class="mat-card">
                <h2 class="mat-card-title">Application &amp; Fees</h2>
                <div class="grid-3">
                  <label class="mat-field"><span class="mat-label">Application Link</span><input id="appLink" class="mat-input" type="url" value="${esc(r.applicationLink)}"></label>
                  <label class="mat-field"><span class="mat-label">Application Fee</span><span class="currency-input"><span aria-hidden="true">$</span><input id="appFee" class="mat-input" type="number" min="0" step="0.01" value="${r.applicationFee ?? state.account.defaultApplicationFee}"></span></label>
                  <label class="mat-field"><span class="mat-label">Lease Admin Fee</span><span class="currency-input"><span aria-hidden="true">$</span><input id="adminFee" class="mat-input" type="number" min="0" step="0.01" value="${r.adminFee || 0}"></span></label>
                </div>
              </section>
              <div class="practice-actions"><button id="saveSettingsBtn" class="btn-orange" type="button">Save Rental Settings</button><button id="cancelSettingsBtn" class="btn-ghost" type="button">Cancel</button><span id="setting-error" class="practice-error" role="alert"></span></div>

            </div>
          </div>
        `;

        // Left sub-nav anchor jumps
        canvas.querySelectorAll("[data-jump]").forEach(btn => {
          btn.addEventListener("click", () => {
            state.activeSubnav = btn.dataset.jump;
            canvas.querySelectorAll("[data-jump]").forEach(b => b.classList.toggle("active", b === btn));
            const target = document.getElementById("sec-" + btn.dataset.jump);
            if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
          });
        });

        // Accordions
        canvas.querySelectorAll(".accordion-btn").forEach(btn => {
          btn.setAttribute('aria-expanded','false');
          btn.addEventListener("click", () => {
            const open=btn.parentElement.classList.toggle("open");
            btn.setAttribute('aria-expanded',String(open));
            if(btn.textContent.includes('Amenities') && open) tutorial.record('amenities',{rentalId:r.id});
          });
        });

        // Live bindings
        const bindCheck = (id, fn, rerender = false) => {
          const el = document.getElementById(id);
          if (!el) return;
          el.addEventListener("change", () => {
            fn(el.checked);
            if (rerender) renderRentalSettings(r);
          });
        };

        const bindVal = (id, fn, rerender = false) => {
          const el = document.getElementById(id);
          if (!el) return;
          el.addEventListener("change", () => {
            fn(el.value);
            if (rerender) renderRentalSettings(r);
          });
        };

        bindCheck("stActive", v => { r.active = v; }, true);
        bindVal("stAssignee", v => { r.assignee = v; });
        bindVal("mkTerm", v => { r.leaseTerm = v; });
        bindVal("mkType", v => { r.propertyType = v; });
        bindVal("mkTitle", v => { r.customTitle = v; });
        if(!r.imported) {
          bindVal("mkDesc", v => { r.description = v; });
          bindVal("listing-virtual-tour", v => { r.virtualTour = v.trim(); });
        }
        canvas.querySelectorAll('[data-listing-photo]').forEach(button=>{
          button.onclick=()=>viewListingPhoto(photos,Number(button.dataset.listingPhoto));
        });

        canvas.querySelectorAll(".syn-toggle").forEach(cb => {
          cb.addEventListener("change", () => {
            r.syndication[cb.dataset.site] = cb.checked;
          });
        });

        bindCheck("qReqMoveIn", v => { r.qualifying.reqMoveIn = v; });
        bindVal("qMoveInDays", v => { r.qualifying.moveInDays = Number(v) || 90; });
        bindCheck("qReqIncome", v => { r.qualifying.reqIncome = v; });
        bindVal("qIncomeRatio", v => { r.qualifying.incomeRatio = Number(v) || 3; });
        bindCheck("qCosigner", v => { r.qualifying.allowCosigner = v; });
        bindCheck("qVouchers", v => { r.qualifying.allowVouchers = v; });
        bindCheck("qPets", v => { r.qualifying.allowPets = v; }, true);
        bindVal("qMaxPets", v => { r.qualifying.maxPets = Number(v) || 1; });
        bindCheck("qCats", v => { r.qualifying.allowCats = v; });
        bindCheck("qSmallDogs", v => { r.qualifying.allowSmallDogs = v; });
        bindCheck("qLargeDogs", v => { r.qualifying.allowLargeDogs = v; });
        for (const {id,key} of window.ReplicaBooking.historyRestrictions) bindVal(id,v=>{
          r.qualifying.historyPolicies ??= {};
          r.qualifying.historyPolicies[key]=v;
        });
        for (const {settingId,key} of window.ReplicaBooking.builtInQuestions) bindCheck(settingId,v=>{r.qualifying[key]=v;},true);

        // Viewing: Wait List & Self-Access & Device Assignment
        bindCheck("vwWaitlist", v => { r.waitlist = v; }, true);
        bindVal("vwWaitMsg", v => { r.waitlistMessage = v; });
        bindCheck("vwSelfAccess", v => { r.viewing.selfAccess = v; }, true);
        bindVal("vwType", v => { r.viewing.viewingType = v; r.device = v==='Instructions only'?'':v; r.serialNumber=''; }, true);
        bindVal("vwApproval", v => { r.viewing.viewingApproval = v; });
        bindCheck("vwReqId", v => { r.viewing.requireId = v; });

        const devSel=byId('vwAssignedDevice');
        devSel?.addEventListener('change',()=>{
          if(devSel.value==='legacy') return;
          const device=state.devices.find(d=>d.id===devSel.value);
          r.serialNumber=device?.serial || '';
          if(device){r.device=device.type;r.viewing.viewingType=device.type;}
        });

        byId('jumpToRentalAvailBtn').onclick=()=>byId('viewing-availability').scrollIntoView({block:'start'});
        byId('inline-general-enabled').onchange=e=>{
          r.availability.generalEnabled=e.target.checked;
          renderInlineGeneral(r);
        };
        byId('inline-custom-enabled').onchange=e=>{
          r.availability.mode=e.target.checked ? 'custom' : 'general';
          renderInlineRentalHours(r);
          tutorial.draw();
        };
        byId('viewAvailabilityReport').onclick=()=>goto({section:'report',id:'viewing_availability',filterRentalId:r.id});
        renderInlineGeneral(r);
        renderInlineRentalHours(r);

        const instrEl = document.getElementById("vwInstr");
        if (instrEl) {
          instrEl.addEventListener("input", () => {
            r.viewing.instructions = instrEl.value;
            const rem = Math.max(0, maxInstr - instrEl.value.length);
            const counter = document.getElementById("vwCounter");
            if (counter) counter.textContent = `${rem} remaining`;
          });
        }

        // Viewing: In-Person Showings (0605-in-person.jpg)
        bindCheck("vwInPerson", v => { ip.enabled = v; r.viewing.inPerson = ip; }, true);
        bindVal("ipAgent", v => {
          ip.showingAgent=v;
          renderInlineGeneral(r);
        });
        bindVal("ipDuration", v => { ip.durationMinutes = Number(v) || 30; });
        bindVal("ipBuffer", v => { ip.bufferMinutes = Number(v) || 0; });
        bindVal("ipNotice", v => { ip.advanceNoticeHours = Number(v) || 2; });
        bindVal("ipMaxLeads", v => { ip.maxLeadsPerSlot = Number(v) || 1; });
        bindVal('ipVisitLimit',v=>{lim.inPersonVisitLimit=v;lim.legacyInPersonCap=false;});
        bindCheck("ipConfirm", v => { ip.requireConfirmation = v; });
        bindCheck('ipNotify',v=>{ip.notifyOccupants=v;});

        const ipInstrEl = document.getElementById("ipInstr");
        if (ipInstrEl) {
          ipInstrEl.addEventListener("input", () => {
            ip.instructions = ipInstrEl.value;
            const rem = Math.max(0, maxInstr - ipInstrEl.value.length);
            const counter = document.getElementById("ipCounter");
            if (counter) counter.textContent = `${rem} remaining`;
          });
        }

        // Viewing: Showing Limits (0620-showing-limit.jpg)
        bindCheck("limUpcoming", v => { lim.limitUpcoming = v; });
        bindVal("limMaxUpcoming", v => { lim.maxUpcoming = Number(v) || 5; });
        bindCheck("limMinDays", v => { lim.minDaysBetweenEnabled = v; });
        bindVal("limMinDaysVal", v => { lim.minDaysBetween = Number(v) || 1; });
        bindCheck("limNoDupes", v => { lim.preventDuplicates = v; });
        bindVal("limSelfNotice", v => { lim.selfAccessAdvanceNotice = v; });
        bindVal("limMaxAdv", v => { lim.maxDaysAdvance = Number(v) || 7; });

        for (const key of ['rent','deposit','dateAvailable','bedrooms','bathrooms','sqft']) bindVal('field-'+key,v=>{r[key]=key==='dateAvailable'?v:Number(v);});
        bindVal('appLink',v=>{r.applicationLink=v.trim();});
        bindVal('appFee',v=>{r.applicationFee=Number(v);});
        bindVal('adminFee',v=>{r.adminFee=Number(v);});
        byId('add-custom-question')?.addEventListener('click',()=>{
          r.qualifying.questions.push({label:'',options:window.ReplicaBooking.questionChoices({answer:'Yes'})});renderRentalSettings(r);
          canvas.querySelector(`[data-question-label="${r.qualifying.questions.length-1}"]`)?.focus();
        });
        canvas.querySelectorAll('[data-question-label]').forEach(n=>n.oninput=()=>{r.qualifying.questions[Number(n.dataset.questionLabel)].label=n.value;});
        canvas.querySelectorAll('[data-question-remove]').forEach(n=>n.onclick=()=>{r.qualifying.questions.splice(Number(n.dataset.questionRemove),1);renderRentalSettings(r);});
        for (const [action,listener] of Object.entries({
          label:(answers,i,input)=>{answers[i].label=input.value;},
          knockout:(answers,i,input)=>{answers[i].knockout=input.checked;},
          remove:(answers,i)=>{answers.splice(i,1);renderRentalSettings(r);},
          add:answers=>{answers.push({label:'',knockout:false});renderRentalSettings(r);},
        })) canvas.querySelectorAll(`[data-option-${action}]`).forEach(control=>{
          const event=action==='label'?'input':action==='knockout'?'change':'click';
          control.addEventListener(event,()=>{
            const [index,option]=control.getAttribute(`data-option-${action}`).split(':').map(Number);
            listener(r.qualifying.questions[index].options,option,control);
          });
        });
        byId('saveSettingsBtn').onclick=()=>{
          const current=state.rentals.find(item=>item.id===r.id);
          const different=(keys,a,b)=>keys.some(key=>JSON.stringify(a[key])!==JSON.stringify(b[key]));
          const availabilityChanged=different(['mode','customHours','oneTimeHours'],r.availability,current.availability);
          const generalChanged=different(['generalEnabled','generalAgents'],r.availability,current.availability);
          const applicationUrl=byId('appLink').value.trim();
          if (applicationUrl && applicationUrl!==practiceLink('apply',r.id) && !window.ReplicaBooking.webUrl(applicationUrl)) {
            byId('setting-error').textContent='Enter an HTTP or HTTPS application link.';return;
          }
          if ([...canvas.querySelectorAll('input[type=number],input[type=date]')].some(input=>!input.checkValidity()) || !r.dateAvailable) {
            byId('setting-error').textContent='Check the dates, amounts and application URL.';return;
          }
          const questions=r.qualifying.questions.filter(q=>q.label.trim()).map(q=>({
            label:q.label.trim(),
            options:q.options.map(option=>({...option,label:option.label.trim()})),
          }));
          if (questions.some(({options})=>options.some(option=>!option.label) || new Set(options.map(option=>option.label.toLowerCase())).size!==options.length)) {
            byId('setting-error').textContent='Enter a different label for each answer choice.';return;
          }
          r.applicationLink=applicationUrl;
          if (ip.enabled && !r.availability.generalEnabled && r.availability.mode!=='custom') {
            byId('setting-error').textContent='Enable at least one availability source for in-person showings.';return;
          }
          const orderedHours=weekly=>Object.values(weekly).every(day=>!day.enabled || day.blocks.every(block=>
            window.ReplicaBooking.toTime(block.start)<window.ReplicaBooking.toTime(block.end)));
          const invalidOneTime=r.availability.oneTimeHours.some(block=>window.ReplicaBooking.toTime(block.start)>=window.ReplicaBooking.toTime(block.end));
          if((availabilityChanged && r.availability.mode==='custom' && (!orderedHours(r.availability.customHours) || invalidOneTime)) || [...generalAvailabilityDrafts.values()].some(weekly=>!orderedHours(weekly))) {
            byId('setting-error').textContent='End times must be later than start times.';return;
          }
          const oldWaitlist=current.waitlist;
          const changed=['active','assignee','syndication','waitlist','waitlistMessage'].filter(key=>JSON.stringify(r[key])!==JSON.stringify(current[key]));
          if (different(['applicationLink','applicationFee','adminFee'],r,current)) changed.push('fees');
          if (different(['selfAccess','viewingType','viewingApproval','requireId','instructions'],r.viewing,current.viewing)) changed.push('self-access');
          if (different(['serialNumber'],r,current)) changed.push('device');
          if (different(['inPerson'],r.viewing,current.viewing)) changed.push('in-person');
          if (different(['limits'],r.viewing,current.viewing)) changed.push('limits');
          if (different(Object.keys(r.qualifying).filter(key=>key!=='questions'),r.qualifying,current.qualifying)) changed.push('qualifying');
          const selected=state.devices.find(d=>d.serial===r.serialNumber && d.type===r.viewing.viewingType);
          if(selected?.rentalId && selected.rentalId!==r.id && state.rentals.find(item=>item.id===selected.rentalId)?.active) {
            byId('setting-error').textContent='That device is assigned to an active rental.';return;
          }
          for (const d of state.devices.filter(d=>d.rentalId===r.id && d.id!==selected?.id)) assignDeviceToRental(d.id,'',false);
          r.qualifying.questions=questions;
          if (different(['questions'],r.qualifying,current.qualifying)) changed.push('questions');
          if (availabilityChanged) changed.push('rental-availability');
          if (generalChanged) changed.push('general-availability');
          for(const [name,weekly] of generalAvailabilityDrafts) {
            const availability=state.generalAvailability[name];
            if(availability && JSON.stringify(weekly)!==JSON.stringify(availability.weekly)) {
              availability.weekly=weekly;
              if(!changed.includes('general-availability')) changed.push('general-availability');
            }
          }
          // Date overrides and lead updates remain independent of the weekly settings draft.
          const {overrides}=current.availability;
          const {leads,ownerReport}=current;
          Object.assign(current,r,{availability:{...r.availability,overrides},leads,ownerReport});
          if (selected && selected.rentalId!==current.id) assignDeviceToRental(selected.id,current.id,false);
          if(oldWaitlist && !r.waitlist) current.leads.filter(l=>l.status==='Wait List').forEach(l=>{
            wf.startFollowUps(current,l);
            wf.message(current,l,'The practice wait list has opened. You can now schedule a viewing.');
          });
          settingsDraft=null;saveState();render();tutorial.record('settings',{rentalId:r.id,waitlist:r.waitlist,changed});
          showToast(`Saved rental settings for ${r.address}`);
        };
        byId('cancelSettingsBtn').onclick=()=>{settingsDraft=null;render();showToast('Unsaved rental changes discarded.');};
      }

      const availabilityIcons={
        add:'<path d="M12 5v14M5 12h14"/>',
        remove:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 10v6m4-6v6"/>',
      };
      function availabilityButton(action,attrs,label) {
        return `<button class="availability-icon" type="button" ${attrs} aria-label="${esc(label)}" title="${esc(label)}"><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">${availabilityIcons[action]}</svg></button>`;
      }

      function renderInlineGeneral(r) {
        const target=byId('inline-general-hours');
        const openNames=new Set([...target.querySelectorAll('details[open]')].map(card=>card.dataset.generalName));
        target.hidden=!r.availability.generalEnabled;
        if(target.hidden){target.replaceChildren();return;}
        const names=r.availability.generalAgents || window.ReplicaBooking.generalAgents(state,r);
        const unassigned=state.users.filter(user=>user.active && user.canShow!==false && state.generalAvailability[user.name] && !names.includes(user.name));
        target.innerHTML=`<div class="availability-agent-list">${names.map((name,index)=>`
          <article class="availability-agent">
            <header><strong>${esc(name)}</strong>${names.length>1 ? availabilityButton('remove',`data-general-remove="${index}"`,`Remove ${name} from general availability`) : ''}</header>
            <details data-general-name="${esc(name)}" ${openNames.has(name)?'open':''}>
              <summary ${index===0 ? 'id="inline-general-edit"' : ''}>Edit Availability</summary>
              <div data-general-editor></div>
            </details>
          </article>`).join('')}</div>
          ${unassigned.length ? `<div class="row-inline availability-add-agent">
            <label class="mat-field"><span class="mat-label">Add a showing agent</span><select id="inline-general-agent" class="mat-select">${unassigned.map(user=>`<option>${esc(user.name)}</option>`).join('')}</select></label>
            ${availabilityButton('add','id="inline-general-add"','Add agent to general availability')}
          </div>` : ''}`;
        target.querySelectorAll('details').forEach((card,index)=>{
          const name=card.dataset.generalName;
          const availability=state.generalAvailability[name];
          const editor=card.querySelector('[data-general-editor]');
          if (!availability) {editor.textContent='This team member has no saved schedule.';return;}
          const weekly=generalAvailabilityDrafts.get(name) || structuredClone(availability.weekly);
          const draw=()=>{
            const prefix=index===0 ? 'inline-ga' : `inline-ga-${index}`;
            editor.innerHTML=renderWeeklyScheduleEditor(weekly,prefix);
            bindWeeklyScheduleEditor(editor,weekly,prefix,draw,()=>generalAvailabilityDrafts.set(name,weekly));
          };
          if(card.open) draw();
          card.ontoggle=()=>{if(card.open && !editor.childElementCount) draw();};
        });
        byId('inline-general-add')?.addEventListener('click',()=>{
          const name=byId('inline-general-agent').value;
          r.availability.generalAgents=[...names,name];
          renderInlineGeneral(r);
          const card=[...target.querySelectorAll('details')].find(row=>row.dataset.generalName===name);
          card.open=true;
          card.querySelector('summary').focus();
        });
        target.querySelectorAll('[data-general-remove]').forEach(button=>button.onclick=()=>{
          r.availability.generalAgents=names.filter((_,i)=>i!==Number(button.dataset.generalRemove));
          renderInlineGeneral(r);
          byId('inline-general-edit')?.focus();
        });
      }

      function renderInlineRentalHours(r) {
        const target=byId('inline-custom-hours');
        target.hidden=r.availability.mode!=='custom';
        if(target.hidden){target.replaceChildren();return;}
        const {customHours:weekly,oneTimeHours:oneTime}=r.availability;
        const timeOptions=time=>TIME_OPTIONS.map(value=>`<option ${value===time ? 'selected' : ''}>${value}</option>`).join('');
        const rows=[
          ...DAYS.flatMap(day=>weekly[day].enabled ? weekly[day].blocks.map((block,index)=>({block,day,index})) : []),
          ...oneTime.map((block,index)=>({block,day:'',index})),
        ];
        target.innerHTML=`<p class="availability-note">Rental hours take priority during an overlap. Blackout dates and the showing agent’s calendar still apply.</p>
          ${rows.map(({block,day,index},i)=>`<fieldset class="inline-hours-card" data-inline-day="${day}" data-index="${index}" data-hour-row="${i}">
            <legend>${day ? `${day} hours` : 'One-time hours'}</legend>
            <label class="mat-switch"><input type="checkbox" data-hour-field="repeat" ${day ? 'checked' : ''}><span class="switch-track"></span><span>Repeats weekly</span></label>
            ${day ? `<label class="mat-field"><span class="mat-label">Day of week</span><select class="mat-select" data-hour-field="day">${DAYS.map(value=>`<option ${value===day?'selected':''}>${value}</option>`).join('')}</select></label>`
              : `<label class="mat-field"><span class="mat-label">Date</span><input class="mat-input" type="date" data-hour-field="date" value="${esc(block.date)}" required></label>`}
            <label class="mat-field"><span class="mat-label">Property manager</span><select class="mat-select" data-hour-field="agent"><option value="">Rental showing agent</option>${agentOptions(block.agent)}</select></label>
            <label class="mat-field"><span class="mat-label">From</span><select class="mat-select" data-hour-field="start">${timeOptions(block.start)}</select></label>
            <label class="mat-field"><span class="mat-label">To</span><select class="mat-select" data-hour-field="end">${timeOptions(block.end)}</select></label>
            <label class="mat-field"><span class="mat-label">Viewing approval</span><select class="mat-select" data-hour-field="approval"><option value="">Rental default</option>${['Take Requests','Set Appointments'].map(value=>`<option ${block.approval===value ? 'selected' : ''}>${value}</option>`).join('')}</select></label>
            <label class="mat-field"><span class="mat-label">Max showings per time</span><input class="mat-input" type="number" min="1" max="15" data-hour-field="capacity" value="${esc(block.capacity ?? '')}"></label>
            ${availabilityButton('remove','data-inline-remove',`Remove ${day || 'one-time'} block ${index+1}`)}
          </fieldset>`).join('')}
          ${availabilityButton('add','id="inline-custom-add"','Add rental-specific hours')}`;
        const addRecurring=(day,block)=>{
          const hours=weekly[day];
          if(!hours.enabled) hours.blocks=[];
          hours.enabled=true;
          return hours.blocks.push(block)-1;
        };
        const focusChanged=(day,index,field)=>{
          renderInlineRentalHours(r);
          target.querySelector(`[data-inline-day="${day}"][data-index="${index}"] [data-hour-field="${field}"]`)?.focus({preventScroll:true});
        };
        const weekday=date=>DAYS[(new Date(`${date}T12:00:00Z`).getUTCDay()+6)%7];
        target.querySelectorAll('[data-hour-row]').forEach(row=>{
          const {block,day,index}=rows[Number(row.dataset.hourRow)];
          const remove=()=>{
            if(day){
              weekly[day].blocks.splice(index,1);
              if(!weekly[day].blocks.length) weekly[day].enabled=false;
            } else oneTime.splice(index,1);
          };
          row.onchange=e=>{
            const {value,dataset:{hourField}}=e.target;
            if(hourField==='day') {
              remove();
              focusChanged(value,addRecurring(value,block),'day');
            } else if(hourField==='repeat'){
              remove();
              if(day){
                const {shiftDate}=window.LeasingSchedule;
                const today=dateOffset();
                const offset=(DAYS.indexOf(day)-DAYS.indexOf(weekday(today))+7)%7;
                oneTime.push({...block,date:shiftDate(today,offset),id:uid('hours')});
                focusChanged('',oneTime.length-1,'date');
              } else {
                const {date,id,...hours}=block;
                const nextDay=weekday(date) || weekday(dateOffset());
                focusChanged(nextDay,addRecurring(nextDay,hours),'day');
              }
            } else if(hourField) block[hourField]=hourField==='capacity' ? (value ? Number(value) : null) : value;
          };
          row.querySelector('[data-inline-remove]').onclick=()=>{
            remove();renderInlineRentalHours(r);byId('inline-custom-add').focus({preventScroll:true});
          };
        });
        byId('inline-custom-add').onclick=()=>{
          const day=DAYS.find(name=>!weekly[name].enabled) || DAYS[0];
          const index=addRecurring(day,{start:'9:00 AM',end:'5:00 PM',approval:'',capacity:null,agent:''});
          focusChanged(day,index,'day');
        };
      }

      function renderWeeklyScheduleEditor(weeklyObj, prefix) {
        return DAYS.map(day => {
          const d = weeklyObj[day] || { enabled: false, blocks: [{ start: "9:00 AM", end: "5:00 PM" }] };
          return `
            <div class="sched-day-row">
              <label class="mat-switch" style="padding-top:4px;">
                <input type="checkbox" class="${prefix}-day-toggle" data-day="${day}" ${d.enabled ? "checked" : ""} />
                <span class="switch-track"></span>
                <span style="font-weight:500;">${day}</span>
              </label>
              <div>
                ${!d.enabled ? `<div style="color:#9E9E9E; font-size:13px; padding-top:4px;">Unavailable</div>` : `
                  <div class="sched-blocks">
                    ${d.blocks.map((blk, idx) => `
                      <div class="sched-block-line">
                        <select class="time-select ${prefix}-start" data-day="${day}" data-idx="${idx}">
                          ${TIME_OPTIONS.map(t => `<option value="${t}" ${blk.start === t ? "selected" : ""}>${t}</option>`).join("")}
                        </select>
                        <span style="color:var(--subtle); font-size:13px;">to</span>
                        <select class="time-select ${prefix}-end" data-day="${day}" data-idx="${idx}">
                          ${TIME_OPTIONS.map(t => `<option value="${t}" ${blk.end === t ? "selected" : ""}>${t}</option>`).join("")}
                        </select>
                        ${d.blocks.length > 1 ? `<button type="button" class="icon-x-btn ${prefix}-rm" data-day="${day}" data-idx="${idx}" title="Remove time block">×</button>` : ""}
                        ${idx === d.blocks.length - 1 ? `<button type="button" class="btn-flat btn-sm ${prefix}-add" data-day="${day}">+ Add hours</button>` : ""}
                      </div>
                    `).join("")}
                  </div>
                `}
              </div>
            </div>
          `;
        }).join("");
      }

      function bindWeeklyScheduleEditor(container, weeklyObj, prefix, onRerender, commit=saveState) {
        container.querySelectorAll(`.${prefix}-day-toggle`).forEach(cb => {
          cb.addEventListener("change", () => {
            const day = cb.dataset.day;
            weeklyObj[day].enabled = cb.checked;
            if (cb.checked && (!weeklyObj[day].blocks || weeklyObj[day].blocks.length === 0)) {
              weeklyObj[day].blocks = [{ start: "9:00 AM", end: "5:00 PM" }];
            }
            commit();
            onRerender();
          });
        });

        container.querySelectorAll(`.${prefix}-start`).forEach(sel => {
          sel.addEventListener("change", () => {
            weeklyObj[sel.dataset.day].blocks[Number(sel.dataset.idx)].start = sel.value;
            commit();
            onRerender();
          });
        });

        container.querySelectorAll(`.${prefix}-end`).forEach(sel => {
          sel.addEventListener("change", () => {
            weeklyObj[sel.dataset.day].blocks[Number(sel.dataset.idx)].end = sel.value;
            commit();
            onRerender();
          });
        });

        container.querySelectorAll(`.${prefix}-add`).forEach(btn => {
          btn.addEventListener("click", () => {
            weeklyObj[btn.dataset.day].blocks.push({ start: "1:00 PM", end: "5:00 PM" });
            commit();
            onRerender();
          });
        });

        container.querySelectorAll(`.${prefix}-rm`).forEach(btn => {
          btn.addEventListener("click", () => {
            weeklyObj[btn.dataset.day].blocks.splice(Number(btn.dataset.idx), 1);
            commit();
            onRerender();
          });
        });
      }

      function getWeekDates(offsetWeeks) {
        const today=dateOffset();
        const monday=window.LeasingSchedule.shiftDate(today,offsetWeeks*7-((new Date(`${today}T12:00:00Z`).getUTCDay()+6)%7));
        return DAYS.map((dayName,i)=>{
          const iso=window.LeasingSchedule.shiftDate(monday,i);
          const label=new Date(`${iso}T12:00:00`).toLocaleDateString('en-US',{month:'short',day:'numeric'});
          return {iso,label,dayName,shortDow:dayName.slice(0,3),isToday:iso===today};
        });
      }

      // Per-Rental Availability Tab (0648-rental-availability.jpg)
      function renderRentalAvailability(r) {
        const canvas = document.getElementById("canvas");
        const avail = r.availability || defaultRentalAvailability();
        r.availability = avail;
        const ip = r.viewing.inPerson || defaultInPerson(r.assignee);
        const planner=window.ReplicaBooking;
        const generalNames=planner.generalAgents(state,r);
        const timeLabel=time=>{
          const [hour,minute]=time.split(':').map(Number);
          return `${hour%12 || 12}:${String(minute).padStart(2,'0')} ${hour<12?'AM':'PM'}`;
        };
        const slotLabel=(rows,type,label)=>rows.map(row=>`<div class="cal-slot cal-slot-${type}"><strong>${label}</strong><br>${esc(timeLabel(row.start))} – ${esc(timeLabel(row.end))}<br>${esc(type==='self' ? row.source : row.agent)}</div>`).join('');
        const weekDates = getWeekDates(state.calendarWeekOffset);
        const weekRangeLabel = `${weekDates[0].label} – ${weekDates[6].label}, ${weekDates[6].iso.slice(0,4)}`;

        canvas.innerHTML = `
          <div style="max-width:1080px; display:flex; flex-direction:column; gap:20px;">
            <!-- Mode & Active Methods Card -->
            <section class="mat-card">
              <div class="row-inline" style="justify-content:space-between; margin-bottom:10px;">
                <h2 class="mat-card-title" style="margin:0;">Availability Schedule — ${esc(r.address)}</h2>
                <button id="availEditMethodsBtn" class="btn-flat btn-sm" type="button">Edit Viewing Methods →</button>
              </div>
              <div class="row-inline" style="margin-bottom:12px;">
                <span style="font-size:13px; color:var(--muted);">Active methods:</span>
                ${r.waitlist ? `<span class="pill pill-red">Wait List Active (Showings Paused)</span>` : ""}
                ${r.viewing.selfAccess ? `<span class="pill pill-green">Self-Access (${esc(r.viewing.viewingType)})</span>` : `<span class="pill pill-gray">Self-Access Off</span>`}
                ${ip.enabled ? `<span class="pill pill-blue">In-Person (${esc(ip.showingAgent)})</span>` : `<span class="pill pill-gray">In-Person Off</span>`}
              </div>

              <div class="row-inline">
                <span class="pill ${avail.generalEnabled ? 'pill-blue' : 'pill-gray'}">General Availability ${avail.generalEnabled ? 'On' : 'Off'}</span>
                <span class="pill ${avail.mode==='custom' ? 'pill-blue' : 'pill-gray'}">Rental-Specific Availability ${avail.mode==='custom' ? 'On' : 'Off'}</span>
                <button id="availEditHoursBtn" class="btn-flat btn-sm" type="button">Edit Showing Hours</button>
                <button id="availOpenReportBtn" class="btn-flat btn-sm" type="button">View Availability Report</button>
              </div>
              ${avail.generalEnabled && generalNames.length ? `<p class="availability-agents-caption">General availability team · ${esc(generalNames.join(', '))}</p>` : ''}
            </section>

            <!-- Weekly Calendar Preview (0648-rental-availability.jpg) -->
            <section class="mat-card">
              <div class="cal-toolbar">
                <div class="row-inline">
                  <h2 class="mat-card-title" style="margin:0;">Showing Calendar</h2>
                  <span class="pill pill-gray">${weekRangeLabel}</span>
                </div>
                <div class="row-inline">
                  <button id="calPrevWeek" class="btn-outline btn-sm" type="button">‹ Prev</button>
                  <button id="calTodayWeek" class="btn-outline btn-sm" type="button">Today</button>
                  <button id="calNextWeek" class="btn-outline btn-sm" type="button">Next ›</button>
                  <button id="addOverrideModalBtn" class="btn-blue btn-sm" type="button">+ Date Override</button>
                </div>
              </div>

              <div class="cal-legend" style="margin-bottom:12px;">
                <span><span class="cal-legend-dot" style="background:var(--green);"></span>Self-Access Window</span>
                <span><span class="cal-legend-dot" style="background:var(--blue-accent);"></span>In-Person Window</span>
                <span><span class="cal-legend-dot" style="background:var(--orange);"></span>Scheduled Showing</span>
                <span><span class="cal-legend-dot" style="background:var(--alert-red);"></span>Blocked Date</span>
              </div>

              <div class="week-grid">
                ${weekDates.map(wd => {
                  const blackout = avail.overrides.find(o => o.date === wd.iso && o.type === 'block');
                  const dayBookings = state.viewingsList.filter(v => v.rentalId === r.id && v.date === wd.iso && !['Canceled','No-show'].includes(v.status));

                  let slotsHtml = "";
                  if (r.waitlist) {
                    slotsHtml += `<div class="cal-slot cal-slot-blocked"><strong>Wait List</strong><br/>Showings paused</div>`;
                  } else {
                    if (blackout) slotsHtml += `<div class="cal-slot cal-slot-blocked"><strong>Blocked hours</strong><br>${esc(blackout.label)}</div>`;
                    if (r.viewing.selfAccess) slotsHtml += slotLabel(planner.windows(state,r,wd.iso,'self'),'self','Self-Access');
                    if (ip.enabled) slotsHtml += slotLabel(planner.windows(state,r,wd.iso,'person'),'inperson','In-Person');
                  }

                  dayBookings.forEach(bk => {
                    slotsHtml += `<div class="cal-slot cal-slot-booked" data-booking="${bk.id}"><strong>${esc(bk.time)}</strong> · ${esc(bk.leadName)}<br/>${esc(bk.type)}</div>`;
                  });

                  if (!slotsHtml) {
                    slotsHtml = `<div class="cal-slot-empty">No showings</div>`;
                  }

                  return `
                    <div class="week-col">
                      <div class="week-col-head ${wd.isToday ? "is-today" : ""}">
                        <div class="week-col-dow">${wd.shortDow}</div>
                        <div class="week-col-date">${wd.label}</div>
                      </div>
                      <div class="week-col-body">${slotsHtml}</div>
                    </div>
                  `;
                }).join("")}
              </div>
            </section>

            <!-- Date-Specific Overrides & Blackouts -->
            <section class="mat-card">
              <div class="row-inline" style="justify-content:space-between; margin-bottom:12px;">
                <h2 class="mat-card-title" style="margin:0;">Date-Specific Overrides &amp; Blackout Dates</h2>
                <button id="saveRentalAvailBtn" class="btn-blue btn-sm" type="button">Save Availability</button>
              </div>
              ${(avail.overrides || []).length === 0 ? `
                <p style="color:var(--muted); margin:0;">No date-specific overrides set for this rental. Click <strong>+ Date Override</strong> above to block a date or add a special open house window.</p>
              ` : `
                <table class="tt-table">
                  <thead><tr><th>Date</th><th>Rule</th><th>Hours / Note</th><th></th></tr></thead>
                  <tbody>
                    ${avail.overrides.map(o => `
                      <tr>
                        <td><strong>${esc(o.date)}</strong></td>
                        <td><span class="pill ${o.type === "block" ? "pill-red" : "pill-blue"}">${o.type === "block" ? "Blocked" : "Special Open"}</span></td>
                        <td>${o.type === "block" ? esc(o.label) : `${esc(o.start)} – ${esc(o.end)} (${esc(o.label)})`}</td>
                        <td style="text-align:right;"><button type="button" class="btn-danger-flat rm-override-btn" data-oid="${o.id}">Remove</button></td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table>
              `}
            </section>
          </div>
        `;

        const editSettings=id=>{
          goto({section:'settings',rentalId:r.id,jump:'viewing'});
          byId(id)?.scrollIntoView({block:'start'});
        };
        byId('availEditMethodsBtn').onclick=()=>editSettings('sec-viewing');
        byId('availEditHoursBtn').onclick=()=>editSettings('viewing-availability');
        byId('availOpenReportBtn').onclick=()=>goto({section:'report',id:'viewing_availability',filterRentalId:r.id});

        document.getElementById("calPrevWeek").addEventListener("click", () => {
          state.calendarWeekOffset -= 1;
          renderRentalAvailability(r);
        });
        document.getElementById("calTodayWeek").addEventListener("click", () => {
          state.calendarWeekOffset = 0;
          renderRentalAvailability(r);
        });
        document.getElementById("calNextWeek").addEventListener("click", () => {
          state.calendarWeekOffset += 1;
          renderRentalAvailability(r);
        });

        document.getElementById("addOverrideModalBtn").addEventListener("click", () => {
          openModal(
            "Add Date Override",
            `
              <div class="mat-field">
                <label class="mat-label" for="ovDate">Date</label>
                <input id="ovDate" class="mat-input" type="date" value="${dateOffset(3)}" />
              </div>
              <div class="mat-field">
                <label class="mat-label" for="ovType">Override Type</label>
                <select id="ovType" class="mat-select">
                  <option value="block">Block Date (No Showings)</option>
                  <option value="open">Special Open Window (e.g., Open House)</option>
                </select>
              </div>
              <div id="ovTimeRow" class="grid-2" style="display:none;">
                <div class="mat-field">
                  <label class="mat-label" for="ovStart">Start Time</label>
                  <select id="ovStart" class="mat-select">${TIME_OPTIONS.map(t => `<option value="${t}" ${t === "10:00 AM" ? "selected" : ""}>${t}</option>`).join("")}</select>
                </div>
                <div class="mat-field">
                  <label class="mat-label" for="ovEnd">End Time</label>
                  <select id="ovEnd" class="mat-select">${TIME_OPTIONS.map(t => `<option value="${t}" ${t === "2:00 PM" ? "selected" : ""}>${t}</option>`).join("")}</select>
                </div>
              </div>
              <div class="mat-field">
                <label class="mat-label" for="ovLabel">Label / Reason</label>
                <input id="ovLabel" class="mat-input" type="text" placeholder="e.g., Maintenance crew or Saturday Open House" value="Maintenance / Make-Ready" />
              </div>
            `,
            `
              <button type="button" class="btn-flat" id="ovCancelBtn">Cancel</button>
              <button type="button" class="btn-blue" id="ovSaveBtn">Add Override</button>
            `
          );

          const typeSel = document.getElementById("ovType");
          const timeRow = document.getElementById("ovTimeRow");
          typeSel.addEventListener("change", () => {
            timeRow.style.display = typeSel.value === "open" ? "grid" : "none";
          });

          document.getElementById("ovCancelBtn").addEventListener("click", closeModal);
          document.getElementById("ovSaveBtn").addEventListener("click", () => {
            const dateVal = document.getElementById("ovDate").value;
            if (!dateVal) {showToast('Choose a date.');return;}
            if (avail.overrides.some(o=>o.date===dateVal)) {showToast('Remove the existing override before adding a different one for that date.');return;}
            const start=byId('ovStart').value,end=byId('ovEnd').value;
            if(typeSel.value==='open' && window.ReplicaBooking.toTime(start)>=window.ReplicaBooking.toTime(end)){showToast('End time must follow start time.');return;}
            avail.overrides.push({
              id: "ov" + Date.now(),
              date: dateVal,
              type: typeSel.value,
              start: typeSel.value==='open'?start:'',
              end: typeSel.value==='open'?end:'',
              label: document.getElementById("ovLabel").value.trim() || (typeSel.value === "block" ? "Blocked" : "Special Window")
            });
            saveState();
            closeModal();
            renderRentalAvailability(r);
            showToast("Added date override for " + dateVal);
          });
        });

        canvas.querySelectorAll(".rm-override-btn").forEach(btn => {
          btn.addEventListener("click", () => {
            avail.overrides = avail.overrides.filter(o => o.id !== btn.dataset.oid);
            saveState();
            renderRentalAvailability(r);
            showToast("Removed date override");
          });
        });

        canvas.querySelectorAll("[data-booking]").forEach(el => {
          el.addEventListener("click", () => {
            const bk = state.viewingsList.find(v => v.id === el.dataset.booking);
            if (!bk) return;
            openModal(
              "Scheduled Showing Details",
              `
                <div><strong>Property:</strong> ${esc(r.address)}</div>
                <div><strong>Lead:</strong> ${esc(bk.leadName)} (${esc(bk.leadPhone)})</div>
                <div><strong>When:</strong> ${esc(bk.date)} at ${esc(bk.time)}</div>
                <div><strong>Method:</strong> ${esc(bk.type)}</div>
                <div><strong>Status:</strong> <span class="pill pill-green">${esc(bk.status)}</span></div>
              `,
              `<button type="button" class="btn-blue" id="bkCloseBtn">Close</button>`
            );
            document.getElementById("bkCloseBtn").addEventListener("click", closeModal);
          });
        });

        document.getElementById("saveRentalAvailBtn").addEventListener("click", () => {
          saveState();
          showToast("Saved availability for " + r.address);wf.done("availability");
        });
      }

      function scoreBadgeHtml(score) {
        if (score === null || score === undefined || score === "") {
          return `<span class="score-pill score-none">Unscored</span>`;
        }
        const n = Number(score);
        const cls = n >= 6 ? "score-high" : "score-low";
        return `<span class="score-pill ${cls}">${n} / 10</span>`;
      }

      function leadStatusClass(status) {
        const k = String(status || "").toLowerCase().replace(/[^a-z]/g, "");
        if (k === "scheduled") return "st-scheduled";
        if (k === "prequalified") return "st-prequalified";
        if (k === "viewed" || k === "toured" || k === "viewingcompleted") return "st-viewed";
        if (k === "applied") return "st-applied";
        if (k === "waitlist" || k === "waitingonlead") return "st-waitlist";
        if (k === "disqualified" || k === "archived") return "st-disqualified";
        return "st-unscored";
      }

      function openAddLeadModal(r) {
        const tenantLink = `${practiceLink("qualify", r.id)}`;
        const agentLink = `${tenantLink}/agent`;
        openModal(
          `Add Lead — ${r.address}`,
          `
            <p style="font-size:12.5px;color:var(--muted);margin:0 0 12px;">Log direct phone, walk-in, or Craigslist inquiries so all communication and Owner Reports stay accurate.</p>
            <div class="grid-2" style="margin-bottom:10px;">
              <div>
                <label class="field-label" for="alFirst">First Name *</label>
                <input id="alFirst" class="mat-input" type="text" placeholder="e.g., Morgan" />
              </div>
              <div>
                <label class="field-label" for="alLast">Last Name *</label>
                <input id="alLast" class="mat-input" type="text" placeholder="e.g., Alvarez" />
              </div>
            </div>
            <div class="grid-2" style="margin-bottom:10px;">
              <div>
                <label class="field-label" for="alEmail">Email Address</label>
                <input id="alEmail" class="mat-input" type="email" placeholder="morgan.alvarez@example.com" />
              </div>
              <div>
                <label class="field-label" for="alPhone">Phone</label>
                <input id="alPhone" class="mat-input" type="tel" placeholder="(303) 555-0199" />
              </div>
            </div>
            <div class="grid-2" style="margin-bottom:10px;">
              <div>
                <label class="field-label" for="alType">Lead type *</label>
                <select id="alType" class="mat-select">
                  <option value="Tenant lead">Tenant lead</option>
                  <option value="Agent lead">Agent lead</option>
                </select>
              </div>
              <div>
                <label class="field-label" for="alSource">Lead Source</label>
                <select id="alSource" class="mat-select">
                  <option value="Phone / Walk-in">Phone / Walk-in</option>
                  <option value="Call Center">Call Center</option>
                  <option value="Craigslist">Craigslist</option>
                  <option value="Zillow">Zillow</option>
                  <option value="Apartments.com">Apartments.com</option>
                  <option value="Website">Website</option>
                  <option value="Referral">Referral</option>
                </select>
              </div>
            </div>
            <div class="grid-2" style="margin-bottom:10px;">
              <label class="mat-field">Acquisition channel
                <select id="alChannel" class="mat-select">
                  <option value="">From source</option>
                  <option>Phone</option><option>Web</option><option>Walk-in</option><option>Email</option><option>SMS</option><option>Other</option>
                </select>
              </label>
              <label class="mat-field">Source partner
                <input id="alPartner" class="mat-input" type="text" maxlength="80" />
              </label>
            </div>
            <div style="margin-bottom:12px;">
              <label class="field-label" for="alAction">Action *</label>
              <select id="alAction" class="mat-select">
                <option value="invite">Invite lead to pre-qualify and schedule</option>
                <option value="self_qualify">Pre-qualify and schedule lead myself</option>
                <option value="skip_schedule">Skip pre-qualification and just schedule</option>
              </select>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;padding-top:10px;border-top:1px solid #ECEFF1;">
              <button id="copyTenantLinkModalBtn" class="btn-outline" type="button">COPY TENANT LEAD LINK</button>
              <button id="copyAgentLinkModalBtn" class="btn-outline" type="button">COPY AGENT LEAD LINK</button>
            </div>
          `,
          `
            <button id="alCancelBtn" class="btn-ghost" type="button">Cancel</button>
            <button id="alSaveBtn" class="btn-blue" type="button">SAVE</button>
          `
        );

        const actionSel = document.getElementById("alAction");
        document.getElementById("copyTenantLinkModalBtn").addEventListener("click", () => {
          copyToClipboardSafe(tenantLink, "Copied Tenant Lead Link to clipboard");
        });
        document.getElementById("copyAgentLinkModalBtn").addEventListener("click", () => {
          copyToClipboardSafe(agentLink, "Copied Agent Lead Link to clipboard");
        });
        document.getElementById("alCancelBtn").addEventListener("click", closeModal);
        document.getElementById("alSaveBtn").addEventListener("click", () => {
          const first = document.getElementById("alFirst").value.trim();
          const last = document.getElementById("alLast").value.trim();
          if (!first || !last) {
            showToast("Please enter both First Name and Last Name");
            return;
          }
          const fullName = `${first} ${last}`;
          const email = document.getElementById("alEmail").value.trim() || `${first.toLowerCase()}.${last.toLowerCase()}@example.com`;
          const phone = document.getElementById("alPhone").value.trim() || "(303) 555-0199";
          const leadType = document.getElementById("alType").value;
          const source = document.getElementById("alSource").value;
          const action = actionSel.value;

          if (byId('alEmail').value && !byId('alEmail').checkValidity()) {showToast('Enter a valid practice email.');return;}
          const lead=wf.blankLead(r,{name:fullName,email,phone,source,leadType,channel:byId('alChannel').value,partner:byId('alPartner').value.trim(),manualOverride:action==='skip_schedule'});
          if(action==='invite') wf.invite(r,lead);
          else if(action==='self_qualify') wf.qualify(r,lead,{thenBook:true});
          else wf.book(r,lead);
        });
      }

      const LEAD_STAGES = ["Unscored","Pre-Qualified","Waiting on Lead","Scheduled","Showing requested","Viewing Completed","Applied","Wait List","Disqualified","Archived"];

      function openLeadMessages(r, lead) {
        const thread=wf.threadFor(r,lead);
        state.messagesFilter={search:'',tab:'all'};
        state.selectedThreadId=thread.id;
        goto('messages');
      }

      const leadTitle=(r,lead)=>`${lead.name} - Lead for ${r.address}`;
      const belongsToLead=(row,lead)=>row.leadId ? row.leadId===lead.id : (row.leadName || row.lead)===lead.name;

      function openLeadProfile(r,lead,feedbackId) {
        if(!lead) return;
        const fromReport=state.detailTab==='owner';
        openDetailPage(leadTitle(r,lead),fromReport?'Back to Owner Report':'Back to Leads',
          ()=>renderLeadProfile(r,lead,feedbackId),fromReport ? undefined : lead.id);
        tutorial.record('open-lead',{rentalId:r.id});
      }

      function editLead(r,lead) {
        openModal('Edit Lead',`<form id="edit-lead">
          <label class="mat-field">Name<input class="mat-input" name="name" value="${esc(lead.name)}" required></label>
          <label class="mat-field">Email<input class="mat-input" type="email" name="email" value="${esc(lead.email)}"></label>
          <label class="mat-field">Mobile phone<input class="mat-input" type="tel" name="phone" value="${esc(lead.phone)}"></label>
          <label class="mat-field">Lead status<select name="status" class="mat-select">${[...new Set([...LEAD_STAGES,lead.status])].map(s=>`<option ${s===lead.status?'selected':''}>${esc(s)}</option>`).join('')}</select></label>
          <label><input type="checkbox" name="override" ${lead.manualOverride?'checked':''}> Manual scheduling override</label>
          <div class="practice-actions"><button id="ldInviteBtn" type="button" class="btn-flat">Send Pre-Qual Invite</button>
          <button id="ldQualifyBtn" type="button" class="btn-flat">Review Pre-Qualification</button></div>
          </form>`, '<button id="edit-cancel" class="btn-flat">Cancel</button><button class="btn-blue" form="edit-lead">Save</button>');
        byId('edit-cancel').onclick=closeModal;
        byId('ldInviteBtn').onclick=()=>wf.invite(r,lead);
        byId('ldQualifyBtn').onclick=()=>wf.qualify(r,lead);
        byId('edit-lead').onsubmit=e=>{
          e.preventDefault();
          const fields=new FormData(e.target);
          const name=fields.get('name').trim(),phone=fields.get('phone').trim(),email=fields.get('email').trim();
          if(!name) return;
          for(const row of [...state.messages,...state.viewingsList].filter(row=>row.rentalId===r.id && belongsToLead(row,lead))) {
            row.leadId=lead.id;row.leadName=name;
            if(row.thread) {
              row.phone=phone;row.email=email;
            } else row.leadPhone=phone;
          }
          for(const f of r.ownerReport.feedback.filter(row=>belongsToLead(row,lead))) {f.leadId=lead.id;f.lead=name;}
          if(lead.status!==fields.get('status')) lead.archived=['Disqualified','Archived'].includes(fields.get('status'));
          Object.assign(lead,{name,phone,email,status:fields.get('status'),manualOverride:fields.has('override')});
          if(lead.archived) cancelLeadViewings(r,lead);
          wf.note(lead,'Lead details updated.');detailPage.title=leadTitle(r,lead);
          saveState();closeModal();render();
        };
      }

      function cancelLeadViewings(r,lead) {
        for(const v of state.viewingsList.filter(v=>v.rentalId===r.id && belongsToLead(v,lead))) {
          if(['Requested','Pending Confirmation','Confirmed'].includes(v.status)) {
            v.status='Canceled';v.confirmBy=null;
          }
        }
      }

      function renderLeadProfile(r,lead,feedbackId) {
        const tours=state.viewingsList.filter(v=>v.rentalId===r.id && belongsToLead(v,lead)).sort((a,b)=>b.date.localeCompare(a.date));
        const feedback=r.ownerReport.feedback.filter(f=>belongsToLead(f,lead));
        if(feedbackId) feedback.sort((a,b)=>Number(b.id===feedbackId)-Number(a.id===feedbackId));
        const hold=window.ReplicaBooking.identityHold(lead);
        const qualified=!lead.archived && (lead.score>=6 || lead.manualOverride);
        const canSchedule=qualified && !hold;
        const answers=lead.answers;
        const risks=answers && ['bankruptcy','judgment','eviction','felony'].filter(key=>answers[key]);
        const action=(id,label,disabled=false)=>`<button id="${id}" class="btn-flat" type="button" ${disabled?'disabled':''}>${esc(label)}</button>`;
        const fact=(label,value)=>`<dt>${esc(label)}</dt><dd>${esc(value ?? 'Not provided')}</dd>`;
        const displayDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(value)
          ? new Intl.DateTimeFormat('en-US',{dateStyle:'medium',timeZone:'UTC'}).format(new Date(`${value}T12:00:00Z`))
          : value;
        const displayTime=value=>/^\d{2}:\d{2}$/.test(value)
          ? new Intl.DateTimeFormat('en-US',{timeStyle:'short',timeZone:'UTC'}).format(new Date(`2000-01-01T${value}:00Z`))
          : value;
        const reviewLabel=lead.idRequested?'Review replacement ID':lead.idMetadataWarning?'Review identity flag':'Mark ID reviewed';
        const followUpDue=lead.status==='Waiting on Lead' && !lead.archived && Number.isFinite(lead.followUp?.dueAt)
          ? new Intl.DateTimeFormat('en-US',{dateStyle:'medium',timeStyle:'short'}).format(lead.followUp.dueAt)
          : '';
        byId('canvas').innerHTML=`<div class="lead-profile">
          <section class="mat-card prospect-summary">
            <h2><span aria-label="${qualified?'Qualified':'Unqualified or unscored'}" role="img" class="lead-qual-dot ${qualified?'qualified':''}"></span> ${esc(lead.name)}</h2>
            <div class="prospect-contact">${esc(lead.email)}<br>${esc(lead.phone)}</div>
            ${hold ? '<p class="practice-error" role="status">Staff review required. Scheduling is on hold.</p>' : ''}
            ${followUpDue ? `<p>Waiting on Lead · Follow-up due ${esc(followUpDue)} (local time)</p>` : ''}
            ${action('ldApplyBtn','Send Application Link')}
            <div class="prospect-actions">${action('ldArchive',lead.archived?'Unarchive':'Archive')}${action('ldDecline','Decline',lead.archived)}${action('ldEdit','Edit')}${action('ldMsgBtn','Send Message')}</div>
          </section>
          <section class="mat-card prospect-viewing"><h2>Viewing</h2>
            <div class="prospect-feedback"><h3>Feedback</h3>
              ${feedback.map(f=>`<div><p><b>Rating:</b> ${esc(f.rating != null ? f.rating+'/5' : f.interest)}</p><p><b>Comments:</b> ${esc(f.comment)}</p>
              <button class="btn-flat" data-profile-feedback="${esc(f.id)}" type="button">${f.visible?'Hide on Owner Report':'Show on Owner Report'}</button></div>`).join('')}
              ${feedback.length?'':`<form id="ldFeedback"><label class="mat-field">Rating<input class="mat-input" type="number" name="rating" min="0" max="5" step="1" required></label><small>0 = Don't rate it · 1 = Poor · 5 = Great</small>
              <label class="mat-field">Comments<textarea class="mat-textarea" name="comment" rows="2"></textarea></label>
              <button class="btn-flat">Submit Feedback</button></form>`}
            </div>
            <h3>Identity review</h3>
            <p>${lead.idRequested?'New ID requested. All scheduling is on hold pending review.':lead.idMetadataWarning?'The sample ID has missing or suspicious metadata. Review the flag, request a new ID, or archive this lead.':lead.idReviewed?'The fictional identification has been reviewed.':'No practice identification has been reviewed.'}</p>
            <p><small>Identity review in Leasing Lab records a practice decision in this browser. Use fictional information for the exercise.</small></p>
            <div class="prospect-actions">${action('ldReviewId',reviewLabel,lead.archived || (lead.idReviewed && !hold))}${action('ldRequestId','Request New ID',Boolean(lead.archived || lead.idRequested))}</div>
            ${tours.map(v=>`<div class="prospect-visit"><strong>${esc(displayDate(v.date))} at ${esc(displayTime(v.time))}</strong> <span class="status-chip">${esc(v.status==='Viewed'?'Viewing Completed':v.status)}</span>
              <p>${esc(v.type)}</p>${v.practiceCode?`<p>The practice code recorded for this viewing is ${esc(v.practiceCode)}.</p>`:''}${v.acceptedOn?`<p>Automatically accepted on ${esc(displayDate(v.acceptedOn))}.</p>`:''}
              ${!hold && v.status==='Confirmed' && v.type==='Self-Access (CodeBox)' ? `<a class="btn-flat" data-visit-link href="${esc(wf.appointmentUrl(r,v))}">Open prospect appointment</a>` : ''}</div>`).join('') || '<p>No viewings scheduled.</p>'}
            <div class="prospect-actions">${action('ldScheduleBtn',wf.scheduledFor(r,lead)?'Reschedule':'Schedule',!canSchedule)}</div>
          </section>
          <section class="mat-card prospect-notes"><h2>Notes</h2>
            <form id="lead-note-form"><textarea id="ldNoteInput" aria-label="Internal note" class="mat-textarea" placeholder="Compose internal note here..." required></textarea><button id="ldAddNoteBtn" class="btn-flat">Add</button></form>
            ${lead.notes.filter(n=>n.internal || !('internal' in n)).map(n=>`<div class="prospect-note">${esc(n.text)}<small>${esc(n.time)}</small></div>`).join('')}
          </section>
          <section class="mat-card prospect-qual"><h2>Pre-Qualification</h2><div class="prospect-facts">
            <article><h3>Lease Preference</h3><dl>${fact('Move In',displayDate(lead.moveInDate))}</dl></article>
            <article><h3>Financial &amp; Legal History</h3><p>${!risks?esc(lead.financialHistory || 'No answers on file.'):risks.length?esc(risks.join(', ')):'No issues to report.'}</p></article>
            <article><h3>Source of Rent</h3><dl>${fact('Source of Rent',answers?.voucher?'Voucher':lead.incomeSource)}${fact('Annual Income',lead.monthlyIncome ? '$'+Number(lead.monthlyIncome*12).toLocaleString('en-US')+(r.rent>0?` (~${(lead.monthlyIncome/r.rent).toFixed(1)}× rent)`:''):null)}</dl></article>
            <article><h3>Lead Source</h3><dl>${fact('Qualified on',lead.qualifiedOn)}${fact('Lead Source Channel',lead.source)}</dl></article>
            ${answers?`<article><h3>Additional Answers</h3><dl>${fact('Co-signer',answers.cosigner?'Yes':'No')}${fact('Pets',lead.pets)}${answers.creditScore ? fact('Sample credit score',answers.creditScore) : ''}${typeof answers.smoking==='boolean' ? fact('Smoking',answers.smoking?'Yes':'No') : ''}${(lead.customResponses || []).map(q=>fact(q.label,q.answer)).join('')}</dl></article>`:''}
          </div></section></div>`;
        const refresh=(focus)=>{saveState();render();byId(focus)?.focus({preventScroll:true});};
        byId('ldEdit').onclick=()=>editLead(r,lead);
        byId('ldMsgBtn').onclick=()=>openLeadMessages(r,lead);
        byId('ldApplyBtn').onclick=()=>{
          wf.message(r,lead,`Practice application: ${wf.applicationUrl(r,lead)}`);
          wf.note(lead,'Practice application link sent.');refresh('ldApplyBtn');showToast('Application link saved in Messages.');
        };
        byId('ldScheduleBtn').onclick=()=>wf.book(r,lead,wf.scheduledFor(r,lead));
        byId('ldReviewId').onclick=()=>{
          openModal(reviewLabel,`<p>Review the fictional identity for ${esc(lead.name)} and record your judgment before permitting access.</p>
            <label><input type="checkbox" id="ld-id-ack"> I reviewed the fictional identification and resolved any identity issue.</label>`,
            '<button class="btn-flat" id="ld-id-cancel">Cancel</button><button class="btn-blue" id="ld-id-resolve" disabled>Save ID review</button>');
          byId('ld-id-cancel').onclick=closeModal;
          byId('ld-id-ack').onchange=e=>{byId('ld-id-resolve').disabled=!e.target.checked;};
          byId('ld-id-resolve').onclick=()=>{
            if(!byId('ld-id-ack').checked) return;
            lead.idReviewed=true;lead.idRequested=false;lead.idMetadataWarning=false;
            wf.note(lead,'Staff reviewed the practice identity and cleared it for scheduling.');
            closeModal();refresh('ldScheduleBtn');showToast('Practice ID review saved.');
          };
        };
        byId('ldRequestId').onclick=()=>{
          lead.idReviewed=false;lead.idRequested=true;
          wf.message(r,lead,'Please provide a new practice ID for review.');wf.note(lead,'Requested a new practice ID.');
          refresh('ldReviewId');showToast('New ID request saved in Messages.');
        };
        byId('ldArchive').onclick=()=>{
          lead.archived=!lead.archived;
          if(lead.archived) cancelLeadViewings(r,lead);
          if(!lead.archived && lead.status==='Archived') lead.status=lead.score>=6?'Pre-Qualified':'Unscored';
          wf.note(lead,lead.archived?'Lead archived.':'Lead restored to the queue.');refresh('ldArchive');
        };
        byId('ldDecline').onclick=()=>{
          openModal('Decline Lead',`<p>Decline ${esc(lead.name)} and cancel their pending practice appointments?</p>`,
            '<button class="btn-flat" id="decline-cancel">Cancel</button><button class="btn-blue" id="decline-confirm">Decline</button>');
          byId('decline-cancel').onclick=closeModal;
          byId('decline-confirm').onclick=()=>{
            lead.status='Disqualified';lead.archived=true;lead.score=2;lead.manualOverride=false;
            cancelLeadViewings(r,lead);wf.note(lead,'Lead declined.');closeModal();refresh('ldArchive');
          };
        };
        byId('lead-note-form').onsubmit=e=>{
          e.preventDefault();const text=byId('ldNoteInput').value.trim();if(!text) return;
          wf.note(lead,text);lead.notes[0].internal=true;refresh('ldNoteInput');
        };
        const form=byId('ldFeedback');
        if(form) form.onsubmit=e=>{
          e.preventDefault();const data=new FormData(form);addFeedback(r,lead,Number(data.get('rating')),data.get('comment').trim());
          refresh();showToast('Feedback saved to the owner report.');
        };
        document.querySelectorAll('[data-profile-feedback]').forEach(button=>button.onclick=()=>{
          const f=feedback.find(row=>row.id===button.dataset.profileFeedback);f.visible=!f.visible;
          saveState();render();wf.done('owner');
          byId('canvas').querySelector(`[data-profile-feedback="${CSS.escape(f.id)}"]`).focus({preventScroll:true});
        });
      }

      function renderRentalLeads(r) {
        const canvas=byId('canvas');
        const f=state.leadsFilter;
        const query=f.search.trim().toLowerCase();
        const filtered=r.leads.filter(lead=>{
          if(lead.archived && !f.archived) return false;
          return `${lead.name} ${lead.email} ${lead.phone} ${lead.source} ${lead.status}`.toLowerCase().includes(query);
        });
        const sort=f.sort || 'new';
        if(f.sort==='name') filtered.sort((a,b)=>a.name.localeCompare(b.name));
        if(sort==='new') filtered.sort((a,b)=>(b.createdDate || '').localeCompare(a.createdDate || ''));
        if(sort==='recent') filtered.sort((a,b)=>(b.notes[0]?.at || Date.parse(b.createdDate) || 0)-(a.notes[0]?.at || Date.parse(a.createdDate) || 0));
        const listed=Date.parse(r.listed);
        const marketDays=Math.max(0,Math.floor((Date.parse(dateOffset())-listed)/86_400_000));
        const marketSummary=Number.isFinite(marketDays)
          ? `Listed ${new Date(listed).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'})} · ${marketDays} days on market` : 'Leads';
        const options=(rows,selected)=>rows.map(([value,label])=>`<option value="${esc(value)}" ${value===selected ? 'selected' : ''}>${esc(label)}</option>`).join('');

        canvas.innerHTML=`
          <div class="leads-toolbar">
            <label class="mat-field"><span class="mat-label">Sort by</span><select id="leadSort" class="mat-select">${options([['new','Newest'],['recent','Recent activity'],['name','Lead name']],sort)}</select></label>
            <label class="mat-switch"><input id="show-archived-leads" type="checkbox" ${f.archived ? 'checked' : ''}><span class="switch-track"></span><span>Show archived</span></label>
            <label class="search-box lead-search"><span class="sr-only">Search leads</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m16 16 4 4"/></svg><input id="leadSearchInput" type="search" placeholder="Search" value="${esc(f.search)}"></label>
          </div>
          <section class="mat-card lead-queue">
            <div class="row-inline practice-between lead-queue-heading">
              <h2 class="mat-card-title">${esc(marketSummary)}</h2>
            </div>
            ${filtered.length ? `<div class="table-scroll"><table class="tt-table">
              <thead><tr><th scope="col">Qualified</th><th scope="col">Lead</th><th scope="col">Stage</th><th scope="col">Activity</th><th scope="col">Action</th></tr></thead>
              <tbody>${filtered.map(lead=>{
                const qualified=lead.score>=6 && !lead.archived;
                const latest=lead.notes[0];
                const qualification=qualified ? 'Qualified' : lead.score===null ? 'Unscored' : 'Disqualified';
                return `<tr class="lead-row-clickable" data-lead-row="${esc(lead.id)}">
                  <td><span class="lead-qual-dot ${qualified ? 'qualified' : ''}" role="img" aria-label="${qualification}" title="${qualification}"></span></td>
                  <td><button class="lead-name-link" type="button" data-lead-view="${esc(lead.id)}">${esc(lead.name)}</button>
                    <small>${esc(lead.leadType)} · ${esc(lead.source)}</small>
                    ${lead.idMetadataWarning || lead.idRequested ? '<span class="lead-identity-alert">Identity review needed</span>' : ''}</td>
                  <td><span class="status-chip ${leadStatusClass(lead.status)}">${esc(lead.status)}</span></td>
                  <td>${esc(latest?.text || 'Lead added.')}<small>${esc(latest?.time || lead.createdAt)}</small></td>
                  <td><button class="lead-menu-btn" type="button" data-lead-menu="${esc(lead.id)}" aria-label="Actions for ${esc(lead.name)}" aria-expanded="false">⋮</button></td>
                </tr>`;
              }).join('')}</tbody></table></div>`
              : '<p class="lead-queue-heading">No leads match these filters.</p>'}
          </section>
          <div id="lead-actions" class="lead-action-popover" hidden></div>`;

        const update=()=>{
          saveState();
          renderRentalLeads(r);
          tutorial.draw();
        };
        byId('leadSearchInput').oninput=e=>{
          f.search=e.target.value;
          const position=e.target.selectionStart;
          update();
          byId('leadSearchInput').focus({preventScroll:true});
          byId('leadSearchInput').setSelectionRange(position,position);
        };
        byId('leadSort').onchange=e=>{
          f.sort=e.target.value;
          update();
          byId('leadSort').focus({preventScroll:true});
        };
        byId('show-archived-leads').onchange=e=>{
          f.archived=e.target.checked;
          update();
          byId('show-archived-leads').focus({preventScroll:true});
          tutorial.record('show-archived',{enabled:f.archived});
        };
        byId('addLeadBtn').onclick=()=>openAddLeadModal(r);
        const menu=byId('lead-actions');
        const hideMenu=()=>{
          menu.hidden=true;
          canvas.querySelector('[data-lead-menu][aria-expanded="true"]')?.setAttribute('aria-expanded','false');
        };
        canvas.querySelectorAll('[data-lead-row]').forEach(row=>{
          const lead=filtered.find(l=>l.id===row.dataset.leadRow);
          const toggle=row.querySelector('[data-lead-menu]');
          row.onclick=e=>{
            if(!e.target.closest('[data-lead-menu]')) openLeadProfile(r,lead);
          };
          toggle.onclick=()=>{
            const wasOpen=toggle.getAttribute('aria-expanded')==='true';
            hideMenu();
            if(wasOpen) return;
            toggle.setAttribute('aria-expanded','true');
            menu.innerHTML='<button type="button" class="btn-flat">Open profile</button><button type="button" class="btn-flat">Message</button>';
            menu.hidden=false;
            const rect=toggle.getBoundingClientRect();
            menu.style.left=`${Math.max(8,rect.right-menu.offsetWidth)}px`;
            menu.style.top=`${Math.min(rect.bottom,innerHeight-menu.offsetHeight-8)}px`;
            menu.firstElementChild.onclick=()=>openLeadProfile(r,lead);
            menu.lastElementChild.onclick=()=>openLeadMessages(r,lead);
            menu.firstElementChild.focus();
          };
        });
        menu.onfocusout=e=>{if(!menu.contains(e.relatedTarget) && !e.relatedTarget?.matches('[data-lead-menu][aria-expanded="true"]')) hideMenu();};
        menu.onkeydown=e=>{
          if(e.key==='Escape'){
            const toggle=canvas.querySelector('[data-lead-menu][aria-expanded="true"]');
            hideMenu();
            toggle?.focus();
          }
        };
      }

      const reportingZone=()=>state.account.timezone?.split(' ')[0] || 'Mountain';
      const reportDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(value)
        ? new Date(`${value}T12:00:00Z`).toLocaleDateString('en-US',{timeZone:'UTC',month:'short',day:'numeric',year:'numeric'})
        : value;
      const reportTime=value=>{
        const clock=window.ReplicaBooking.toTime(value);
        if (!clock) return value;
        const [hour,minute]=clock.split(':');
        return `${Number(hour)%12 || 12}:${minute} ${Number(hour)<12?'AM':'PM'}`;
      };
      const reportTimestamp=(instant,zone)=>{
        if (!Number.isFinite(instant)) return '—';
        const {date,time}=window.LeasingSchedule.localParts(instant,zone);
        return `${reportDate(date)} ${reportTime(time)} ${zone}`;
      };
      const recipientList=value=>String(value || '').split(',').map(email=>email.trim()).filter(Boolean);
      function recordNotice(r,{type,recipient,message,date=dateOffset(0,reportingZone()),channel='Email'}) {
        state.notices.unshift({id:uid('notice'),rentalId:r.id,type,recipient,message,date,channel});
      }
      function recordDueOwnerReports() {
        const delivery=state.ownerDelivery;
        const now=Date.now();
        if (!Number.isFinite(delivery.startedAt)) {delivery.startedAt=now;saveState();return;}
        const zone=reportingZone();
        const schedule=window.LeasingSchedule;
        const today=schedule.localParts(now,zone).date;
        const weekday=(new Date(`${today}T12:00:00Z`).getUTCDay()+6)%7;
        let week=schedule.shiftDate(today,-weekday);
        let date=schedule.shiftDate(week,DAYS.indexOf(delivery.day));
        let when=schedule.epoch(date,window.ReplicaBooking.toTime(delivery.time),zone);
        if (!Number.isFinite(when) || when>now) {
          week=schedule.shiftDate(week,-7);
          date=schedule.shiftDate(date,-7);
          when=schedule.epoch(date,window.ReplicaBooking.toTime(delivery.time),zone);
        }
        if (!Number.isFinite(when) || when<delivery.startedAt) return;
        let changed=false;
        for (const r of state.rentals) {
          const or=r.ownerReport;
          if (!or?.autoSend || or.lastDeliveryWeek===week || when<(or.deliveryStartedAt || 0)) continue;
          const recipients=recipientList(or.emails);
          if (!recipients.length || recipients.some(email=>!/^\S+@\S+\.\S+$/.test(email))) continue;
          or.lastDeliveryWeek=week;
          or.lastSent=reportTimestamp(when,zone);
          recordNotice(r,{type:'Owner',recipient:recipients.join(', '),message:'Weekly owner report delivery recorded in practice.',date});
          changed=true;
        }
        if (changed) saveState();
      }

      function renderRentalOwnerReport(r) {
        const canvas=byId('canvas');
        const or=r.ownerReport;
        const delivery=state.ownerDelivery;
        const today=dateOffset(0,reportingZone());
        const since=window.LeasingSchedule.shiftDate(today,-6);
        const tours=state.viewingsList.filter(v=>v.rentalId===r.id && v.status!=='Requested');
        const scheduledLeads=visits=>new Set(visits.map(v=>v.leadId || r.leads.find(l=>l.name===v.leadName)?.id || v.leadName)).size;
        const viewed=visits=>visits.filter(v=>v.date<=today && !['Canceled','No-show'].includes(v.status)).length;
        const recentTours=tours.filter(v=>v.date>=since && v.date<=today);
        const qualifiedDate=lead=>lead.qualifiedOn || (Number(lead.score)>=6 ? lead.createdDate : '');
        const metrics=[
          ['Leads','People who shared their name and contact information.',r.leads.filter(l=>l.createdDate>=since && l.createdDate<=today).length,r.leads.length],
          ['Leads Pre-Qualified','Leads who met the rental’s practice criteria.',r.leads.filter(l=>qualifiedDate(l)>=since && qualifiedDate(l)<=today).length,r.leads.filter(qualifiedDate).length],
          ['Leads Scheduled','Leads with a booked viewing, including those awaiting confirmation.',scheduledLeads(recentTours),scheduledLeads(tours)],
          ['Viewings','Scheduled visits through the report date, omitting cancellations and no-shows.',viewed(recentTours),viewed(tours)],
        ];
        const feedback=or.feedback.slice().sort((a,b)=>Date.parse(b.date)-Date.parse(a.date));

        canvas.innerHTML=`
          <div class="owner-report-grid">
            <section class="mat-card owner-report-settings">
              <h2 class="mat-card-title">Owner Report Delivery</h2>
              <label class="mat-switch">
                <input id="orAutoSend" type="checkbox" ${or.autoSend?'checked':''} />
                <span class="switch-track"></span><span>Send owner report automatically</span>
              </label>
              <p class="owner-schedule-summary">${or.autoSend
                ? `The report is scheduled every ${esc(delivery.day)} at ${esc(reportTime(delivery.time))} (${esc(reportingZone())} time).`
                : 'Automatic delivery is paused for this rental.'}
                <button id="owner-schedule-link" class="btn-flat" type="button">Manage shared schedule</button>
              </p>
              <label class="mat-field">
                <span class="mat-label">Email addresses (comma-separated)</span>
                <textarea id="orEmails" class="mat-textarea" rows="2" placeholder="owner@example.com">${esc(or.emails)}</textarea>
              </label>
              <label class="mat-switch">
                <input id="orIncludeFb" type="checkbox" ${or.includeFeedback?'checked':''} />
                <span class="switch-track"></span><span>Include showing feedback</span>
              </label>
              ${or.lastSent?`<p class="practice-note">Last recorded delivery · ${esc(or.lastSent)}</p>`:''}
            </section>
            <article class="or-preview-card">
              <header class="owner-report-hero">
                <img src="${esc(r.photo)}" alt="${esc(r.address)}" />
                <div><h2>Owner Report for ${esc(r.address)}</h2><p>${esc(reportDate(today))} · On market since ${esc(reportDate(or.onMarketDate))}</p></div>
                <button id="orPrintBtn" class="btn-orange" type="button" aria-label="Print owner report" title="Print owner report">
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 8V3h12v5M6 17H3V8h18v9h-3M6 14h12v7H6zM16 11h2"/></svg>
                </button>
              </header>
              <div class="or-preview-body">
                <h3>Leasing metrics</h3>
                <table class="or-metrics-table">
                  <thead><tr><th scope="col">Metric</th><th scope="col" class="num">Last 7 Days</th><th scope="col" class="num">Total</th></tr></thead>
                  <tbody>${metrics.map(([metric,definition,recent,total])=>`<tr><th scope="row">${metric}<small>${definition}</small></th><td class="num">${recent}</td><td class="num">${total}</td></tr>`).join('')}</tbody>
                </table>
                ${or.includeFeedback?`<h3>Feedback</h3>
                  ${feedback.length?`<div class="table-scroll"><table class="or-metrics-table or-feedback-table">
                    <thead><tr><th scope="col">Date</th><th scope="col">Rating (1–5)</th><th scope="col">Comments</th></tr></thead>
                    <tbody>${feedback.map(fb=>`<tr class="${fb.visible?'':'suppressed'}">
                      <td><button class="report-record-link" type="button" data-feedback-detail="${esc(fb.id)}">${esc(reportDate(fb.date))}</button></td>
                      <td>${fb.rating>=1 && fb.rating<=5 ? esc(fb.rating) : '—'}</td>
                      <td>${esc(fb.comment)}${fb.visible?'':'<small>Hidden from owner report</small>'}</td>
                    </tr>`).join('')}</tbody>
                  </table></div>`:'<p>No showing feedback yet.</p>'}`:'<p class="report-private-note">Showing feedback is turned off for this rental.</p>'}
                <footer class="owner-report-brand"><img src="assets/lab.svg" width="32" height="32" alt=""><span>${esc(state.account.companyName || COMPANY_NAME)}</span></footer>
              </div>
            </article>
          </div>`;

        byId('orPrintBtn').onclick=()=>window.print();
        byId('owner-schedule-link').onclick=()=>goto('scheduled');
        byId('orAutoSend').onchange=event=>{
          or.autoSend=event.target.checked;
          if (or.autoSend) or.deliveryStartedAt=Date.now();
          saveState();
          renderRentalOwnerReport(r);
          byId('orAutoSend').focus({preventScroll:true});
        };
        byId('orEmails').oninput=event=>{or.emails=event.target.value;saveState();};
        byId('orEmails').onchange=()=>{
          const recipients=recipientList(or.emails);
          if (or.autoSend && recipients.length && recipients.every(email=>/^\S+@example\.com$/i.test(email))) tutorial.record('owner-recipient');
        };
        byId('orIncludeFb').onchange=event=>{
          or.includeFeedback=event.target.checked;
          saveState();
          renderRentalOwnerReport(r);
          byId('orIncludeFb').focus({preventScroll:true});
        };
        canvas.querySelectorAll('[data-feedback-detail]').forEach(button=>button.onclick=()=>{
          const item=or.feedback.find(f=>f.id===button.dataset.feedbackDetail);
          const lead=r.leads.find(l=>belongsToLead(item,l));
          if (lead) {openLeadProfile(r,lead,item.id);return;}
          openModal('Viewing feedback',`<p>${esc(reportDate(item.date))}</p><p>${esc(item.comment)}</p>`,
            `<button class="btn-ghost" id="feedback-done" type="button">Back to report</button><button class="btn-blue" id="feedback-visibility" type="button">${item.visible?'Hide from owner report':'Show on owner report'}</button>`);
          byId('feedback-done').onclick=closeModal;
          byId('feedback-visibility').onclick=()=>{
            item.visible=!item.visible;
            saveState();
            closeModal();
            renderRentalOwnerReport(r);
            wf.done('owner');
          };
        });
      }

      function renderRentalSubTab(r) {
        if (state.detailTab === "availability") {
          renderRentalAvailability(r);
          return;
        }
        if (state.detailTab === "leads") {
          renderRentalLeads(r);
          return;
        }
        if (state.detailTab === "owner") {
          renderRentalOwnerReport(r);
        }
      }

      // Access Section: Device Assignment (0548-device-assignment.jpg)
      function renderViewingsSection() {
        const canvas = document.getElementById("canvas");

        if (state.viewingsTab === "general") {
          const user = state.selectedAvailUser;
          const ga = state.generalAvailability[user] || Object.values(state.generalAvailability)[0];

          canvas.innerHTML = `
            <div style="max-width:980px; display:flex; flex-direction:column; gap:20px;">
              <!-- Top User & Timezone Card -->
              <section class="mat-card">
                <h2 class="mat-card-title">General Availability</h2>
                <p style="color:var(--muted); margin:0 0 16px; font-size:13.5px;">
                  Set your default weekly showing hours. Rentals set to <strong>Use General Availability</strong> automatically inherit these windows.
                </p>
                <div class="grid-2">
                  <div class="mat-field">
                    <label class="mat-label" for="gaUserSel">Availability for User</label>
                    <select id="gaUserSel" class="mat-select">
                      ${Object.keys(state.generalAvailability).map(u => `<option value="${esc(u)}" ${u === user ? "selected" : ""}>${esc(u)}</option>`).join("")}
                    </select>
                  </div>
                  <div class="mat-field">
                    <label class="mat-label" for="gaTzSel">Time Zone</label>
                    <select id="gaTzSel" class="mat-select">
                      ${["Eastern Time (US & Canada)", "Central Time (US & Canada)", "Mountain Time (US & Canada)", "Pacific Time (US & Canada)"].map(tz => `
                        <option value="${tz}" ${ga.timezone === tz ? "selected" : ""}>${tz}</option>
                      `).join("")}
                    </select>
                  </div>
                </div>
              </section>

              <!-- Recurring Weekly Schedule Card (0633-general-availability.jpg) -->
              <section class="mat-card" id="gaWeeklyCard">
                <div class="row-inline" style="justify-content:space-between; margin-bottom:10px;">
                  <h2 class="mat-card-title" style="margin:0;">In-Person Weekly Hours (${esc(user)})</h2>
                  <div class="preset-bar" style="margin:0;">
                    <button id="presetMF" class="btn-outline btn-sm" type="button">Mon–Fri 9am–5pm</button>
                    <button id="presetAll" class="btn-outline btn-sm" type="button">Every Day 8am–8pm</button>
                    <button id="presetCopyMon" class="btn-outline btn-sm" type="button">Copy Monday to Weekdays</button>
                  </div>
                </div>
                ${renderWeeklyScheduleEditor(ga.weekly, "ga")}
              </section>

              <!-- Default Self-Access Hours Card -->
              <section class="mat-card">
                <h2 class="mat-card-title">Default Self-Access Hours</h2>
                <div class="grid-2" style="margin-bottom:14px;">
                  <div class="mat-field">
                    <label class="mat-label" for="gaSaStart">Earliest Self-Access Showing</label>
                    <select id="gaSaStart" class="mat-select">
                      ${TIME_OPTIONS.map(t => `<option value="${t}" ${ga.selfAccessStart === t ? "selected" : ""}>${t}</option>`).join("")}
                    </select>
                  </div>
                  <div class="mat-field">
                    <label class="mat-label" for="gaSaEnd">Latest Self-Access Showing</label>
                    <select id="gaSaEnd" class="mat-select">
                      ${TIME_OPTIONS.map(t => `<option value="${t}" ${ga.selfAccessEnd === t ? "selected" : ""}>${t}</option>`).join("")}
                    </select>
                  </div>
                </div>
                <label class="mat-switch">
                  <input id="gaDaylight" type="checkbox" ${ga.daylightOnly ? "checked" : ""} />
                  <span class="switch-track"></span>
                  <span>Restrict self-access showings to daylight hours (auto-adjusts for sunset)</span>
                </label>
              </section>

              <!-- Blocked Dates / Time Off Card -->
              <section class="mat-card">
                <div class="row-inline" style="justify-content:space-between; margin-bottom:12px;">
                  <h2 class="mat-card-title" style="margin:0;">Blocked Dates &amp; Time Off</h2>
                  <button id="addBlockedDateBtn" class="btn-outline btn-sm" type="button">+ Block Date</button>
                </div>
                ${ga.blockedDates.length === 0 ? `<p style="color:var(--muted); margin:0;">No blocked dates scheduled.</p>` : `
                  <table class="tt-table">
                    <thead><tr><th>Date</th><th>Window</th><th>Reason</th><th></th></tr></thead>
                    <tbody>
                      ${ga.blockedDates.map(b => `
                        <tr>
                          <td><strong>${esc(b.date)}</strong></td>
                          <td>${b.allDay ? '<span class="pill pill-red">All Day</span>' : `${esc(b.start)} – ${esc(b.end)}`}</td>
                          <td>${esc(b.reason)}</td>
                          <td style="text-align:right;"><button type="button" class="btn-danger-flat rm-bd-btn" data-bdid="${b.id}">Remove</button></td>
                        </tr>
                      `).join("")}
                    </tbody>
                  </table>
                `}
                <div style="margin-top:18px; display:flex; justify-content:flex-end;">
                  <button id="saveGaBtn" class="btn-blue" type="button">Save General Availability</button>
                </div>
              </section>
            </div>
          `;

          document.getElementById("gaUserSel").addEventListener("change", e => {
            state.selectedAvailUser = e.target.value;
            saveState();
            renderViewingsSection();
          });
          document.getElementById("gaTzSel").addEventListener("change", e => {
            ga.timezone = e.target.value;
            saveState();
          });
          document.getElementById("gaSaStart").addEventListener("change", e => {
            ga.selfAccessStart = e.target.value;
            saveState();
          });
          document.getElementById("gaSaEnd").addEventListener("change", e => {
            ga.selfAccessEnd = e.target.value;
            saveState();
          });
          document.getElementById("gaDaylight").addEventListener("change", e => {
            ga.daylightOnly = e.target.checked;
            saveState();
          });

          bindWeeklyScheduleEditor(document.getElementById("gaWeeklyCard"), ga.weekly, "ga", renderViewingsSection);

          document.getElementById("presetMF").addEventListener("click", () => {
            ga.weekly = defaultWeeklyHours("9:00 AM", "5:00 PM", false);
            saveState();
            renderViewingsSection();
            showToast("Applied Mon–Fri 9:00 AM – 5:00 PM preset");
          });
          document.getElementById("presetAll").addEventListener("click", () => {
            ga.weekly = defaultWeeklyHours("8:00 AM", "8:00 PM", true);
            saveState();
            renderViewingsSection();
            showToast("Applied Every Day 8:00 AM – 8:00 PM preset");
          });
          document.getElementById("presetCopyMon").addEventListener("click", () => {
            const monCopy = JSON.stringify(ga.weekly["Monday"]);
            ["Tuesday", "Wednesday", "Thursday", "Friday"].forEach(d => {
              ga.weekly[d] = JSON.parse(monCopy);
            });
            saveState();
            renderViewingsSection();
            showToast("Copied Monday hours to Tuesday–Friday");
          });

          document.getElementById("addBlockedDateBtn").addEventListener("click", () => {
            openModal(
              "Block Date / Time Off",
              `
                <div class="mat-field">
                  <label class="mat-label" for="bdDate">Date</label>
                  <input id="bdDate" class="mat-input" type="date" value="${dateOffset(3)}" />
                </div>
                <label class="mat-switch">
                  <input id="bdAllDay" type="checkbox" checked />
                  <span class="switch-track"></span>
                  <span>Block all day</span>
                </label>
                <div id="bdTimeRow" class="grid-2" style="display:none;">
                  <div class="mat-field">
                    <label class="mat-label" for="bdStart">From</label>
                    <select id="bdStart" class="mat-select">${TIME_OPTIONS.map(t => `<option value="${t}" ${t === "12:00 PM" ? "selected" : ""}>${t}</option>`).join("")}</select>
                  </div>
                  <div class="mat-field">
                    <label class="mat-label" for="bdEnd">To</label>
                    <select id="bdEnd" class="mat-select">${TIME_OPTIONS.map(t => `<option value="${t}" ${t === "5:00 PM" ? "selected" : ""}>${t}</option>`).join("")}</select>
                  </div>
                </div>
                <div class="mat-field">
                  <label class="mat-label" for="bdReason">Reason</label>
                  <input id="bdReason" class="mat-input" type="text" placeholder="e.g., Holiday or Out of Office" value="Holiday / Out of Office" />
                </div>
              `,
              `
                <button type="button" class="btn-flat" id="bdCancel">Cancel</button>
                <button type="button" class="btn-blue" id="bdSave">Block Date</button>
              `
            );
            const allDayCb = document.getElementById("bdAllDay");
            const timeRow = document.getElementById("bdTimeRow");
            allDayCb.addEventListener("change", () => {
              timeRow.style.display = allDayCb.checked ? "none" : "grid";
            });
            document.getElementById("bdCancel").addEventListener("click", closeModal);
            document.getElementById("bdSave").addEventListener("click", () => {
              const dt = document.getElementById("bdDate").value;
              if (!dt) return;
              ga.blockedDates.push({
                id: "bd" + Date.now(),
                date: dt,
                allDay: allDayCb.checked,
                start: document.getElementById("bdStart").value,
                end: document.getElementById("bdEnd").value,
                reason: document.getElementById("bdReason").value.trim() || "Blocked"
              });
              saveState();
              closeModal();
              renderViewingsSection();
              showToast("Blocked " + dt);
            });
          });

          canvas.querySelectorAll(".rm-bd-btn").forEach(btn => {
            btn.addEventListener("click", () => {
              ga.blockedDates = ga.blockedDates.filter(b => b.id !== btn.dataset.bdid);
              saveState();
              renderViewingsSection();
              showToast("Removed blocked date");
            });
          });

          document.getElementById("saveGaBtn").addEventListener("click", () => {
            saveState();tutorial.record("general-availability");
            showToast(`Saved General Availability for ${user}`);
          });
          return;
        }

        if (state.viewingsTab === "calsync") {
          const cs = state.calendarSync;
          canvas.innerHTML = `
            <div class="mat-card" style="max-width:820px;">
              <h2 class="mat-card-title">External Calendar Sync · practice</h2>
              <p style="color:var(--muted); margin-top:0;">Tenant Turner checks your connected calendar for busy events before offering in-person showing times.</p>
              <div class="toggle-list">
                <div class="row-inline" style="justify-content:space-between; padding:10px 0; border-bottom:1px solid #EEEEEE;">
                  <div>
                    <div style="font-weight:500;">Google Calendar</div>
                    <div style="font-size:12.5px; color:var(--muted);">${cs.googleConnected ? `Connected as ${esc(cs.googleEmail)}` : "Not connected"}</div>
                  </div>
                  <button id="toggleGoogleCal" class="${cs.googleConnected ? "btn-outline" : "btn-blue"} btn-sm" type="button">${cs.googleConnected ? "Disconnect" : "Connect Google"}</button>
                </div>
                <div class="row-inline" style="justify-content:space-between; padding:10px 0; border-bottom:1px solid #EEEEEE;">
                  <div>
                    <div style="font-weight:500;">Microsoft Office 365 / Outlook</div>
                    <div style="font-size:12.5px; color:var(--muted);">${cs.office365Connected ? "Connected" : "Not connected"}</div>
                  </div>
                  <button id="toggleO365Cal" class="${cs.office365Connected ? "btn-outline" : "btn-blue"} btn-sm" type="button">${cs.office365Connected ? "Disconnect" : "Connect Office 365"}</button>
                </div>
                <label class="mat-switch">
                  <input id="csConflicts" type="checkbox" ${cs.checkConflicts ? "checked" : ""} />
                  <span class="switch-track"></span>
                  <span>Automatically block in-person slots that conflict with busy calendar events</span>
                </label>
                <label class="mat-switch">
                  <input id="csWrite" type="checkbox" ${cs.writeShowingsToCalendar ? "checked" : ""} />
                  <span class="switch-track"></span>
                  <span>Add confirmed Tenant Turner showings to my connected calendar</span>
                </label>
              </div>
            </div>
          `;
          document.getElementById("toggleGoogleCal").addEventListener("click", () => {
            cs.googleConnected = !cs.googleConnected;
            saveState();
            renderViewingsSection();
            showToast(cs.googleConnected ? "Practice Google calendar enabled" : "Practice Google calendar disabled");
          });
          document.getElementById("toggleO365Cal").addEventListener("click", () => {
            cs.office365Connected = !cs.office365Connected;
            saveState();
            renderViewingsSection();
            showToast(cs.office365Connected ? "Practice Outlook calendar enabled" : "Practice Outlook calendar disabled");
          });
          document.getElementById("csConflicts").addEventListener("change", e => { cs.checkConflicts = e.target.checked; saveState(); });
          document.getElementById("csWrite").addEventListener("change", e => { cs.writeShowingsToCalendar = e.target.checked; saveState(); });
          return;
        }

        wf.renderShowings();
      }

      function messageBody(body) {
        return String(body).split(/((?:https?|file):\/\/[^\s]+)/i).map(piece=>{
          const practiceRoute=['qualify','apply','visit'].some(route=>piece.startsWith(`${practiceLink(route)}/`));
          if (!practiceRoute && !window.ReplicaBooking.webUrl(piece)) return esc(piece);
          return `<a href="${esc(piece)}"${practiceRoute ? '' : ' target="_blank" rel="noopener noreferrer"'}>${esc(piece)}</a>`;
        }).join('');
      }

      function renderMessagesSection() {
        const canvas = document.getElementById("canvas");
        const mf = state.messagesFilter || { search: "", tab: "all" };
        const q = (mf.search || "").trim().toLowerCase();

        const filtered = (state.messages || []).filter(m => {
          if (mf.tab === "unread" && !m.unread) return false;
          if (mf.tab === "needsReply" && !m.needsReply) return false;
          if (mf.tab === "ai" && !m.aiHandled) return false;
          if (q) {
            const prop = state.rentals.find(r => r.id === m.rentalId);
            const hay = `${m.leadName} ${m.phone} ${m.email} ${prop ? prop.address : ""} ${m.thread.map(t => t.text).join(" ")}`.toLowerCase();
            if (!hay.includes(q)) return false;
          }
          return true;
        });

        let activeThread = filtered.find(m => m.id === state.selectedThreadId) || filtered[0] || null;
        if (activeThread) state.selectedThreadId = activeThread.id;
        const activeRental = activeThread ? state.rentals.find(r => r.id === activeThread.rentalId) : null;
        const activeLead=activeRental?.leads.find(lead=>activeThread.leadId ? lead.id===activeThread.leadId : lead.name===activeThread.leadName);
        const unreadCount = state.messages.filter(m => m.unread).length;

        canvas.innerHTML = `
          <div class="messages-shell">
            <div class="msg-list-pane">
              <div class="msg-list-top">
                <input id="msgSearchInput" class="mat-input" type="search" placeholder="Search lead or property..." value="${esc(mf.search)}" />
                <div class="msg-filter-pills">
                  <button class="pill-btn ${mf.tab === "all" ? "active" : ""}" data-mtab="all" type="button">All (${state.messages.length})</button>
                  <button class="pill-btn ${mf.tab === "unread" ? "active" : ""}" data-mtab="unread" type="button">Unread (${unreadCount})</button>
                  <button class="pill-btn ${mf.tab === "needsReply" ? "active" : ""}" data-mtab="needsReply" type="button">Needs Reply</button>
                  <button class="pill-btn ${mf.tab === "ai" ? "active" : ""}" data-mtab="ai" type="button">AI Handled</button>
                </div>
              </div>
              <div class="msg-thread-list">
                ${filtered.length === 0 ? `
                  <div style="padding:24px 16px;text-align:center;color:var(--muted);font-size:13px;">No conversations match this filter.</div>
                ` : filtered.map(m => {
                  const prop = state.rentals.find(r => r.id === m.rentalId);
                  const last = m.thread[m.thread.length - 1];
                  return `
                    <button class="msg-thread-item ${activeThread && activeThread.id === m.id ? "active" : ""}" data-thread-id="${esc(m.id)}" type="button">
                      <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;">
                        <span style="font-weight:${m.unread ? "700" : "600"};font-size:13.5px;color:#263238;">
                          ${m.unread ? '<span class="msg-unread-dot"></span>' : ""}${esc(m.leadName)}
                        </span>
                        <span style="font-size:11px;color:var(--muted);">${esc(m.updatedAt)}</span>
                      </div>
                      <div style="font-size:11.5px;color:#0277BD;margin-top:2px;">${prop ? esc(prop.address) : "General Inquiry"} • ${esc(m.channel)}</div>
                      <div style="font-size:12px;color:#607D8B;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${last ? esc(last.text) : ""}</div>
                    </button>
                  `;
                }).join("")}
              </div>
            </div>

            <div class="msg-conv-pane">
              ${!activeThread ? `
                <div style="padding:48px 24px;text-align:center;color:var(--muted);">Select a conversation to view messages.</div>
              ` : `
                <div class="msg-conv-header">
                  <div>
                    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                      <strong style="font-size:15px;">${esc(activeThread.leadName)}</strong>
                      ${scoreBadgeHtml(activeThread.score)}
                      <span class="type-badge">${esc(activeThread.channel)}</span>
                    </div>
                    <div style="font-size:12.5px;color:var(--muted);margin-top:2px;">
                      ${esc(activeThread.phone)} • ${esc(activeThread.email)}
                    </div>
                  </div>
                  <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
                    ${activeRental ? `<button id="msgOpenRentalBtn" class="btn-outline" type="button">View ${esc(activeRental.address)} Leads</button>` : ""}
                    <button id="msgToggleUnreadBtn" class="btn-ghost" type="button">${activeThread.unread ? "Mark Read" : "Mark Unread"}</button>
                  </div>
                </div>

                <div class="msg-conv-body" id="msgConvBody">
                  ${activeThread.thread.map(item => `
                    <div class="msg-bubble ${esc(item.sender)}">
                      <div>${messageBody(item.text)}</div>
                      <div class="msg-meta">${esc(item.label)} • ${esc(item.time)}</div>
                    </div>
                  `).join("")}
                </div>

                <div class="msg-composer">
                  <div class="msg-templates">
                    <button class="msg-tpl-chip" type="button" data-tpl="Driveway parking is available right in front of the house. Enjoy your tour!">Parking Info</button>
                    <button class="msg-tpl-chip" type="button" data-tpl="Your showing is confirmed! Please reply YES to confirm 2 hours prior.">Confirm Showing</button>
                    ${activeRental ? `<button class="msg-tpl-chip" type="button" data-tpl="Thanks for touring! Here is your application link: ${esc(wf.applicationUrl(activeRental,activeLead))}">Send Application</button>` : ''}
                    <button class="msg-tpl-chip" type="button" data-tpl="Showings are now open for this property—use your link to pick a time!">Wait List Open</button>
                  </div>
                  <div class="msg-input-row">
                    <select id="msgChannelSel" class="mat-select" style="width:96px;flex-shrink:0;">
                      <option value="SMS" ${activeThread.channel === "SMS" ? "selected" : ""}>SMS</option>
                      <option value="Email" ${activeThread.channel === "Email" ? "selected" : ""}>Email</option>
                    </select>
                    <input id="msgReplyInput" class="mat-input" type="text" placeholder="Type a reply to ${esc(activeThread.leadName)}..." style="flex:1;" />
                    <button id="msgSendBtn" class="btn-blue" type="button">Send</button>
                  </div>
                </div>
              `}
            </div>
          </div>
        `;

        document.getElementById("msgSearchInput").addEventListener("input", e => {
          state.messagesFilter.search = e.target.value;
          saveState();
          renderMessagesSection();
          const el = document.getElementById("msgSearchInput");
          if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
        });

        canvas.querySelectorAll("[data-mtab]").forEach(btn => {
          btn.addEventListener("click", () => {
            state.messagesFilter.tab = btn.dataset.mtab;
            saveState();
            renderMessagesSection();
          });
        });

        canvas.querySelectorAll("[data-thread-id]").forEach(btn => {
          btn.addEventListener("click", () => {
            state.selectedThreadId = btn.dataset.threadId;
            const th = state.messages.find(m => m.id === state.selectedThreadId);
            if (th) th.unread = false;
            saveState();
            renderMessagesSection();
          });
        });

        if (activeThread) {
          const openRentalBtn = document.getElementById("msgOpenRentalBtn");
          if (openRentalBtn && activeRental) {
            openRentalBtn.addEventListener("click", () => {
              state.section = "rentals";
              state.selectedRentalId = activeRental.id;
              state.detailTab = "leads";
              saveState();
              render();
            });
          }

          document.getElementById("msgToggleUnreadBtn").addEventListener("click", () => {
            activeThread.unread = !activeThread.unread;
            saveState();
            renderMessagesSection();
          });

          canvas.querySelectorAll("[data-tpl]").forEach(btn => {
            btn.addEventListener("click", () => {
              const inp = document.getElementById("msgReplyInput");
              inp.value = btn.dataset.tpl;
              inp.focus();
            });
          });

          const sendReply = () => {
            const inp = document.getElementById("msgReplyInput");
            const txt = inp.value.trim();
            if (!txt) return;
            const ch = document.getElementById("msgChannelSel").value;
            activeThread.channel = ch;
            activeThread.unread = false;
            activeThread.needsReply = false;
            activeThread.aiHandled = false;
            activeThread.updatedAt = "Just now";
            activeThread.thread.push({
              sender: "outbound",
              label: `${state.users[0].name} (${ch})`,date:dateOffset(),
              time: "Just now",
              text: txt
            });
            saveState();
            renderMessagesSection();
            showToast(`Practice ${ch} reply saved for ${activeThread.leadName}`);wf.done('reply',{threadId:activeThread.id});
          };

          document.getElementById("msgSendBtn").addEventListener("click", sendReply);
          document.getElementById("msgReplyInput").addEventListener("keydown", e => {
            if (e.key === "Enter") { e.preventDefault(); sendReply(); }
          });

          const bodyEl = document.getElementById("msgConvBody");
          if (bodyEl) bodyEl.scrollTop = bodyEl.scrollHeight;
        }
      }

      const REPORT_CATALOG = [
        {icon:'<path d="m2 11 10-9 10 9h-4v10h-5v-6h-2v6H6V11z" fill="currentColor"/>',items:[
          ['rental_activity','RENTAL ACTIVITY','Active status and counts for inquiries, scheduled leads, qualifications, and viewings.'],
          ['days','DAYS ON MARKET','Listing and turn dates, leads, viewings, and days on market.'],
          ['lead_activity','LEAD ACTIVITY','Lead creation, qualification, status, notes, ratings, and feedback.'],
          ['lead_source','LEAD SOURCE','Lead contact details and acquisition channel, source, and partner.'],
          ['syndication','ZILLOW SYNDICATION','Zillow listing settings and other distribution destinations.'],
        ]},
        {icon:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 2v6m8-6v6m-6 6h5v4h-5z"/>',items:[
          ['viewing_activity','VIEWING ACTIVITY','Scheduled viewing types and totals, with the instructions and feedback for each visit.'],
          ['viewing_availability','VIEWING AVAILABILITY','Weekly hours and date-specific changes by rental, agent, and viewing type.'],
          ['notifications','NOTIFICATIONS','Practice delivery notices for owners and current occupants.'],
        ]},
        {icon:'<rect x="5" y="10" width="14" height="11" rx="1"/><path d="M8 11V6a4 4 0 0 1 8 0v4"/>',items:[
          ['codebox_access','LOCKBOX ACCESS','Check-ins by person and device, including actual arrival, scheduled arrival, and the practice code issued.'],
          ['inventory','LOCKBOX INVENTORY','Devices, assigned locations, and reported status.'],
        ]},
        {icon:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="9" r="2.5"/><path d="M6 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>',items:[
          ['user_activity','USER ACTIVITY','Active rental counts, sign-in details, and the latest rental opened by each user.'],
          ['company_overview','ACCOUNT OVERVIEW','Rental, lead, upcoming viewing, and average days-on-market figures by user.'],
        ]},
      ].map(cat=>({...cat,items:cat.items.map(([id,name,desc])=>({id,name,desc}))}));

      function reportName(id) {
        const name=REPORT_CATALOG.flatMap(c=>c.items).find(item=>item.id===id)?.name || 'Practice';
        return name.toLowerCase().replace(/\b\w/g,letter=>letter.toUpperCase()).replace(' On ',' on ');
      }

      const acquisitionChannel=lead=>{
        if (lead.channel && lead.channel!=='Call Center') return lead.channel;
        if (['Call Center','Phone / Walk-in','Phone','For Rent Sign'].includes(lead.source) || lead.channel==='Call Center') return 'Phone';
        return ['Walk-in','Email','SMS'].includes(lead.source) ? lead.source : 'Web';
      };
      const daysOnMarket=(r,today)=>{
        const elapsed=Date.parse(today)-Date.parse(r.listed);
        return Number.isFinite(elapsed) ? Math.max(0,Math.floor(elapsed/86_400_000)) : '—';
      };

      function availabilityReportRows(rentals,inRange) {
        const groups=[];
        const slots=(r,method,agent,scope,day,blocks)=>{
          for (const block of blocks || []) {
            groups.push([r.address,agent,method,scope,day,reportTime(block.start),reportTime(block.end),block.approval || '—',block.capacity ?? '—']);
          }
        };
        for (const r of rentals) {
          const availability=r.availability;
          const agent=r.viewing.inPerson.showingAgent || r.assignee;
          const methods=[...(r.viewing.selfAccess?['Self-Access']:[]),...(r.viewing.inPerson.enabled?['In-Person']:[])];
          if (r.viewing.selfAccess) {
            const access=state.generalAvailability[r.assignee];
            if (access?.selfAccessStart && access?.selfAccessEnd) {
              slots(r,'Self-Access',r.assignee,'Self-access hours','Daily',[{start:access.selfAccessStart,end:access.selfAccessEnd}]);
            }
          }
          if (r.viewing.inPerson.enabled && (availability.generalEnabled ?? availability.mode!=='custom')) {
            for (const name of window.ReplicaBooking.generalAgents(state,r)) {
              const general=state.generalAvailability[name];
              for (const [day,entry] of Object.entries(general.weekly || {})) {
                if (entry.enabled) slots(r,'In-Person',name,'General',day,entry.blocks);
              }
            }
          }
          if (r.viewing.inPerson.enabled && availability.mode==='custom') {
            for (const [day,entry] of Object.entries(availability.customHours || {})) {
              if (!entry.enabled) continue;
              for (const block of entry.blocks) slots(r,'In-Person',block.agent || agent,'Rental-specific',day,[block]);
            }
            for (const block of availability.oneTimeHours || []) if (inRange(block.date)) {
              slots(r,'In-Person',block.agent || agent,'Rental-specific',block.date,[block]);
            }
          }
          for (const block of availability.overrides || []) if (inRange(block.date)) {
            for (const method of methods) slots(r,method,method==='Self-Access' ? r.assignee : block.agent || agent,block.type==='block'?'Blocked':'One-time opening',block.date,[block]);
          }
        }
        return groups;
      }

      function buildReportData(id) {
        const f=state.reportFilters;
        const today=dateOffset(0,reportingZone());
        const rentals=state.rentals.filter(r=>(f.property==='all'||r.id===f.property)
          && (id==='viewing_availability'||f.agent==='all'||r.assignee===f.agent) && (!f.active || r.active));
        const byRental=new Map(rentals.map(r=>[r.id,r]));
        const inRange=d=>(!f.from||d>=f.from)&&(!f.through||d<=f.through);
        const leads=rentals.flatMap(r=>r.leads.filter(l=>inRange(l.createdDate || dateOffset(-2))).map(l=>({...l,r})));
        const viewings=state.viewingsList.filter(v=>byRental.has(v.rentalId)&&inRange(v.date));
        const byProperty=r=>viewings.filter(v=>v.rentalId===r.id);
        const visits=rows=>rows.filter(v=>v.date<=today && !['Requested','Canceled','No-show'].includes(v.status));
        const scheduled=rows=>rows.filter(v=>v.status!=='Requested');
        const distinctLeads=rows=>new Set(rows.map(v=>v.leadId || `${v.rentalId}:${v.leadName}`)).size;
        const feedbackFor=(r,lead)=>r.ownerReport.feedback.filter(item=>belongsToLead(item,lead));
        const linkedProfile=(r,v)=>r.leads.find(lead=>belongsToLead(v,lead));
        const joined=items=>items.filter(value=>value!==undefined && value!==null && value!=='').join(' · ') || '—';
        const result=(headers,rows)=>({title:`${reportName(id)} Report`,headers,
          rows:rows.filter(row=>!f.search || row.some(c=>String(c).toLowerCase().includes(f.search.toLowerCase())))});
        const users=state.users.filter(u=>f.agent==='all'||u.name===f.agent);
        const includeDevice=row=>byRental.has(row.rentalId) || (!row.rentalId&&f.property==='all'&&f.agent==='all'&&!f.active);

        switch(id) {
          case 'rental_activity':
            return result(['User','Rental','Active','Leads','Leads Scheduled','Leads Pre-Qualified','Viewings'],rentals.map(r=>{
              const propertyLeads=leads.filter(l=>l.r.id===r.id);
              const propertyViewings=byProperty(r);
              return [r.assignee,r.address,r.active?'Yes':'No',propertyLeads.length,distinctLeads(scheduled(propertyViewings)),
                propertyLeads.filter(l=>l.qualifiedOn || Number(l.score)>=6).length,visits(propertyViewings).length];
            }));
          case 'days':
            return result(['Rental','Listed','Turn Start','Turn End','Leads','Viewings','Days on Market'],rentals.map(r=>[
              r.address,r.listed,r.turnStartDate || '—',r.turnEndDate || '—',leads.filter(l=>l.r.id===r.id).length,visits(byProperty(r)).length,daysOnMarket(r,today),
            ]));
          case 'lead_activity':
            return result(['Lead','Rental','Created','Qualified','Status','Rating (1–5)','Feedback','Notes'],leads.map(l=>{
              const feedback=feedbackFor(l.r,l);
              return [l.name,l.r.address,l.createdDate || l.createdAt,l.qualifiedOn || '—',l.status,joined(feedback.map(fb=>fb.rating)),
                joined(feedback.map(fb=>fb.comment)),joined(l.notes.map(note=>note.text))];
            }));
          case 'lead_source':
            return result(['User','Rental','Lead','Phone','Email','Created','Status','Channel','Source','Partner'],leads.map(l=>[
              l.r.assignee,l.r.address,l.name,l.phone,l.email,l.createdDate || l.createdAt,
              (l.archived ?? ['Archived','Disqualified'].includes(l.status))?'Archived':'Active',acquisitionChannel(l),l.source || '—',l.partner || l.sourcePartner || '—',
            ]));
          case 'syndication':
            return result(['Rental','Zillow, Trulia, & HotPads','Other sources'],rentals.map(r=>[r.address,r.syndication['Zillow, Trulia, & HotPads']?'On':'Off',Object.keys(r.syndication).filter(k=>k!=='Zillow, Trulia, & HotPads'&&r.syndication[k]).join(', ')]));
          case 'viewing_activity': {
            const totals=new Map();
            const key=v=>`${v.rentalId}|${v.type.split(' (')[0]}`;
            for (const v of viewings) totals.set(key(v),(totals.get(key(v)) || 0)+1);
            return result(['Date','Time','Rental','Lead','Viewing type','Count of type','Status','Instructions','Rating (1–5)','Feedback'],viewings.map(v=>{
              const r=byRental.get(v.rentalId);
              const lead=linkedProfile(r,v);
              const feedback=r.ownerReport.feedback.find(fb=>fb.viewingId===v.id)
                || (lead && feedbackFor(r,lead).find(fb=>fb.date===v.date));
              const instructions=v.instructions || (v.type.startsWith('In-Person') ? r.viewing.inPerson.instructions : r.viewing.instructions);
              return [v.date,v.time,r.address,v.leadName,v.type,totals.get(key(v)),v.status,instructions || '—',feedback?.rating ?? '—',feedback?.comment || '—'];
            }));
          }
          case 'viewing_availability':
            return result(['Rental','User','Viewing type','Availability','Day or date','From','To','Approval','Capacity'],
              availabilityReportRows(rentals,inRange).filter(row=>f.agent==='all' || row[1]===f.agent));
          case 'notifications':
            return result(['Date','Rental','Recipient type','Recipient','Channel','Notice'],state.notices.filter(e=>byRental.has(e.rentalId)&&inRange(e.date)).map(e=>[
              e.date,byRental.get(e.rentalId).address,e.type,e.recipient,e.channel,e.message,
            ]));
          case 'codebox_access':
            return result(['Actual Arrival','Scheduled Arrival','Person','Rental','Device','Practice Code'],state.accessEvents.filter(e=>e.action==='Arrival' && includeDevice(e) && inRange(e.date)).map(e=>[
              reportTimestamp(e.actualArrival,e.zone || reportingZone()),reportTimestamp(e.scheduledArrival,e.zone || reportingZone()),e.recipient,
              byRental.get(e.rentalId)?.address || 'Unassigned',e.device,e.code,
            ]));
          case 'inventory':
            return result(['Device','Type','Last known location','Status','Last sync'],state.devices.filter(includeDevice).map(d=>[
              d.serial,d.type,byRental.get(d.rentalId)?.address || 'Unassigned',d.battery || '—',d.lastSync || '—',
            ]));
          case 'user_activity':
            return result(['User','Active Rentals','Last sign-in','Last rental viewed','Last viewed at'],users.map(u=>[
              u.name,rentals.filter(r=>r.assignee===u.name&&r.active).length,u.lastLogin || '—',
              state.rentals.find(r=>r.id===u.lastViewedRentalId)?.address || '—',reportTimestamp(u.lastViewedAt,reportingZone()),
            ]));
          case 'company_overview':
            return result(['User','Rentals','Leads','Upcoming Viewings','Average Days on Market'],users.map(u=>{
              const owned=rentals.filter(r=>r.assignee===u.name);
              const counts=owned.map(r=>daysOnMarket(r,today)).filter(Number.isFinite);
              const upcoming=viewings.filter(v=>byRental.get(v.rentalId)?.assignee===u.name && v.date>=today && ['Pending Confirmation','Requested','Confirmed'].includes(v.status));
              return [u.name,owned.length,leads.filter(l=>l.r.assignee===u.name).length,upcoming.length,
                counts.length ? Math.round(counts.reduce((sum,count)=>sum+count,0)/counts.length) : '—'];
            }));
          default:return result(['Rental'],[]);
        }
      }
      function renderReportsSection() {
        const canvas=byId('canvas');
        if(state.reportTab==='scheduled'){wf.scheduledReports(REPORT_CATALOG);return;}
        if(!state.activeReport){
          canvas.innerHTML=`<div class="reports-cat-grid practice-reports">${REPORT_CATALOG.map(cat=>`<section class="report-cat-card"><div class="practice-report-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${cat.icon}</svg></div><div class="report-btn-list">${cat.items.map(item=>`<button class="report-link-btn" type="button" data-report-id="${item.id}"><span><strong class="report-link-name">${item.name} REPORT</strong><span class="report-link-desc">${item.desc}</span></span></button>`).join('')}</div></section>`).join('')}</div>`;
          canvas.querySelectorAll('[data-report-id]').forEach(btn=>btn.onclick=()=>{
            goto({section:'report',id:btn.dataset.reportId});
            byId('detailBackBtn').focus({preventScroll:true});
            tutorial.record('open-report',{id:state.activeReport});
          });
          return;
        }
        const f=state.reportFilters;
        canvas.innerHTML=`<div class="report-page">
          <form id="practice-report-filters" class="filter-bar"><div class="filter-left">
            <label class="mat-field"><span class="mat-label">Rental</span><select id="repPropSel" class="mat-select"><option value="all">All rentals</option>${state.rentals.map(r=>`<option value="${esc(r.id)}" ${f.property===r.id?'selected':''}>${esc(r.address)}</option>`).join('')}</select></label>
            <label class="mat-field"><span class="mat-label">User</span><select id="repAgentSel" class="mat-select"><option value="all">All users</option>${agentOptions(f.agent)}</select></label>
            <label class="mat-field"><span class="mat-label">Start Date</span><input id="repFrom" type="date" class="mat-input" value="${esc(f.from)}"></label>
            <label class="mat-field"><span class="mat-label">End Date</span><input id="repThrough" type="date" class="mat-input" value="${esc(f.through)}"></label>
            <label class="mat-switch"><input type="checkbox" id="repActive" ${f.active?'checked':''}><span class="switch-track"></span><span>Show only active rentals</span></label>
          </div><button class="btn-blue" type="submit">Filter</button></form>
          <div class="mat-card practice-report-results"><div class="practice-between row-inline"><span id="report-range" role="status"></span>
            <label class="report-search"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="10" cy="10" r="6"/><path d="m14.5 14.5 5 5"/></svg>
              <input id="repSearch" type="search" class="mat-input" aria-label="Search results" placeholder="Search" value="${esc(f.search)}"></label>
          </div>
            <div class="practice-actions" id="report-export-tools"></div><div id="report-results-table"></div>
          </div></div>`;
        const apply=()=>{reportView.page=0;saveState();drawReportResults();tutorial.draw();};
        byId('practice-report-filters').onsubmit=e=>{e.preventDefault();const from=byId('repFrom').value,through=byId('repThrough').value;if(from&&through&&from>through){showToast('End date must be on or after the start date.');return;}Object.assign(f,{from,through,property:byId('repPropSel').value,agent:byId('repAgentSel').value,active:byId('repActive').checked});apply();tutorial.record('filter-report',{id:state.activeReport});};
        byId('repSearch').oninput=e=>{f.search=e.target.value.trim();apply();};
        drawReportResults();
      }

      function reportCell(data,row,index) {
        const field=data.headers[index];
        const value=row[index];
        const rental=state.rentals.find(r=>r.address===row[data.headers.indexOf('Rental')]);
        if (field==='Rental' && rental) {
          return `<button class="report-record-link" type="button" data-report-rental="${esc(rental.id)}">${esc(value)}</button>`;
        }
        if (field==='User') {
          const user=state.users.find(u=>u.name===value);
          if (user) return `<button class="report-record-link" type="button" data-report-user="${esc(user.id)}">${esc(value)}</button>`;
        }
        if (field==='Lead' && rental) {
          const email=data.headers.includes('Email') ? row[data.headers.indexOf('Email')] : '';
          const lead=rental.leads.find(l=>l.name===value && (!email || l.email===email));
          if (lead) return `<button class="report-record-link" type="button" data-report-rental="${esc(rental.id)}" data-report-lead="${esc(lead.id)}">${esc(value)}</button>`;
        }
        return esc(value);
      }

      function drawReportResults() {
        const data=buildReportData(state.activeReport);
        const view=reportView;
        if(view.column!==null && view.column<data.headers.length) {
          const direction=view.descending ? -1 : 1;
          data.rows.sort((a,b)=>direction*String(a[view.column] ?? '').localeCompare(String(b[view.column] ?? ''),undefined,{numeric:true}));
        }
        const count=data.rows.length;
        const pages=Math.max(1,Math.ceil(count/view.size));
        view.page=Math.min(view.page,pages-1);
        const start=view.page*view.size;
        const end=Math.min(start+view.size,count);
        byId('report-range').textContent=count ? `Showing ${start+1} to ${end} of ${count} results` : '0 results';
        const target=byId('report-results-table');
        target.innerHTML=`<div class="table-scroll"><table class="tt-table">
          <thead><tr>${data.headers.map((name,i)=>`<th scope="col" ${view.column===i ? `aria-sort="${view.descending ? 'descending' : 'ascending'}"` : ''}><button class="report-sort" type="button" data-sort-report="${i}">${esc(name)}${view.column===i ? (view.descending ? ' ↓' : ' ↑') : ''}</button></th>`).join('')}</tr></thead>
          <tbody>${count ? data.rows.map((row,i)=>`<tr ${i<start || i>=end ? 'class="report-offpage"' : ''}>${row.map((_,index)=>`<td>${reportCell(data,row,index)}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${data.headers.length}">${state.activeReport==='codebox_access' ? 'No practice Lockbox arrivals match these filters.' : 'No matching results.'}</td></tr>`}</tbody>
        </table></div>
        <div class="report-page-controls row-inline practice-between">
          <label>Show <select id="report-page-size" aria-label="Results per page">${[5,10,25,50].map(size=>`<option ${size===view.size ? 'selected' : ''}>${size}</option>`).join('')}</select> per page</label>
          <div class="row-inline"><button id="report-prev" class="btn-flat" type="button" ${view.page===0?'disabled':''}>Previous</button>
          <span class="report-page-number" aria-label="Page ${view.page+1} of ${pages}">${view.page+1}</span><button id="report-next" class="btn-flat" type="button" ${view.page>=pages-1?'disabled':''}>Next</button></div>
        </div>`;
        target.querySelectorAll('[data-report-rental]').forEach(button=>button.onclick=()=>{
          const rental=state.rentals.find(r=>r.id===button.dataset.reportRental);
          if (!rental) return;
          const lead=rental.leads.find(l=>l.id===button.dataset.reportLead);
          goto({section:lead?'leads':'settings',rentalId:rental.id});
          if (lead) openLeadProfile(rental,lead);
        });
        target.querySelectorAll('[data-report-user]').forEach(button=>button.onclick=()=>{
          const user=state.users.find(u=>u.id===button.dataset.reportUser);
          if (!user) return;
          state.usersFilter={search:user.name,role:'all',showInactives:!user.active};
          goto('users');
          byId('canvas').querySelector('[data-edit-user]')?.focus();
        });
        target.querySelectorAll('[data-sort-report]').forEach(btn=>btn.onclick=()=>{
          const column=Number(btn.dataset.sortReport);
          view.descending=view.column===column && !view.descending;
          view.column=column;view.page=0;drawReportResults();
          target.querySelector(`[data-sort-report="${column}"]`).focus({preventScroll:true});
        });
        byId('report-page-size').onchange=e=>{view.size=Number(e.target.value);view.page=0;drawReportResults();byId('report-page-size').focus({preventScroll:true});};
        for(const [id,delta] of [['report-prev',-1],['report-next',1]]) {
          byId(id).onclick=()=>{view.page+=delta;drawReportResults();(byId(id).disabled ? byId(delta<0?'report-next':'report-prev') : byId(id)).focus({preventScroll:true});};
        }
        wf.reportExports(data,state.activeReport);
      }

      function addFeedback(r,lead,rating,comment,viewing) {
        const date=viewing?.date || dateOffset();
        r.ownerReport.feedback.unshift({id:uid('feedback'),date,leadId:lead.id,lead:lead.name,viewingId:viewing?.id,rating,comment,visible:true});
      }
      function goto(request) {
        if(state.signedOut) return;
        const {section,rentalId,jump,id,filterRentalId}=typeof request==='string'?{section:request}:request;
        if(section==='signout') {full.openSignOut();return;}
        if(section==='practice-prospect' || section==='practice-conversation') {
          const r=state.rentals.find(r=>r.id==='r1');
          const lead=r?.leads.find(l=>l.id===(id || 'lead_r1_1'));
          if(lead) {
            goto({section:'leads',rentalId:r.id});
            if(section==='practice-conversation') openLeadMessages(r,lead);
            else openLeadProfile(r,lead);
          }
          return;
        }
        detailPage=null;
        reportView={...reportView,page:0,column:null,descending:false};
        const selected=rentalId || 'r1';
        const sameDraft=section==='settings' && state.section==='rentals' && state.detailTab==='settings' && state.selectedRentalId===selected;
        if(!sameDraft) settingsDraft=null;
        state.selectedRentalId=null;
        if(['settings','leads','owner','availability'].includes(section)) {state.section='rentals';state.selectedRentalId=selected;state.detailTab=section;}
        else if(section==='upcoming'||section==='general'){state.section='viewings';state.viewingsTab=section;}
        else if(section==='contacts'||section==='access'){state.section='access';state.accessTab=section==='contacts'?'contacts':'CodeBox';}
        else if(['scheduled','reports','report'].includes(section)){
          state.section='reports';state.reportTab=section==='scheduled'?'scheduled':'standard';state.activeReport=section==='report'?id:null;
          if (section==='report' && filterRentalId) state.reportFilters={...reportFilterDefaults(),property:filterRentalId};
        }
        else state.section=section;
        if(jump && section==='settings') state.activeSubnav=jump;
        if(jump && section==='account') state.accountSubnav=jump;
        saveState();render();
        if(!sameDraft) window.scrollTo(0,0);
      }
      function resetPractice() {
        byId('chatPopover').classList.remove('open');
        byId('chatFab').setAttribute('aria-expanded','false');
        openModal('Reset practice data?','<p>Restore fictional records and clear tutorial progress in this browser.</p>','<button id="reset-cancel" class="btn-ghost">Cancel</button><button id="reset-confirm" class="btn-orange">Reset practice data</button>');
        byId('reset-cancel').onclick=closeModal;
        byId('reset-confirm').onclick=()=>{state=cloneSeed();settingsDraft=null;detailPage=null;saveState();closeModal();render();showToast('Practice data reset.');};
      }
      let lastViewedRentalId;
      function render() {
        const overlay=byId('signoutOverlay');
        overlay.classList.toggle('open',state.signedOut);
        overlay.setAttribute('aria-hidden',String(!state.signedOut));
        document.querySelector('.app-shell').inert=state.signedOut || byId('ttModal').classList.contains('open');
        byId('chatFab').hidden=state.signedOut;
        if(state.signedOut){byId('chatPopover').classList.remove('open');byId('chatFab').setAttribute('aria-expanded','false');byId('signBackInBtn').focus();tutorial.draw();return;}
        recordDueOwnerReports();
        wf.reminders();renderSidebar();renderHeader();
        const rental=state.section==='rentals' && state.rentals.find(r=>r.id===state.selectedRentalId);
        if (rental && rental.id!==lastViewedRentalId) {
          const user=state.users.find(u=>u.active);
          if (user) {
            user.lastViewedRentalId=rental.id;
            user.lastViewedAt=Date.now();
            saveState();
          }
        }
        lastViewedRentalId=rental?.id;
        if (!rental || state.detailTab!=='settings') settingsDraft=null;
        if(detailPage) detailPage.draw();
        else if(rental){if(state.detailTab==='settings') renderRentalSettings(rental);else renderRentalSubTab(rental);}
        else if(state.section==='rentals') renderRentalsList();
        else if(state.section==='access') wf.renderAccess();
        else if(state.section==='viewings') renderViewingsSection();
        else if(state.section==='messages') renderMessagesSection();
        else if(state.section==='reports') renderReportsSection();
        else full.render(state.section);
        tutorial.draw();
      }
      const wf=window.createReplicaWorkflows({get:()=>state,el:byId,esc,save:saveState,render,toast:showToast,
        modal:openModal,close:closeModal,uid,date:dateOffset,link:practiceLink,copy:copyToClipboardSafe,weekly:defaultWeeklyHours,
        defaultRental:newRental,addFeedback,recordNotice,times:TIME_OPTIONS,days:DAYS,assign:assignDeviceToRental,
        openDetail:openDetailPage,backFromDetail,
        onAction:(key,detail)=>tutorial.record(key,detail)});
      function renameAssignee(oldName,newName) {
        if(Object.hasOwn(state.generalAvailability,oldName)) {
          state.generalAvailability[newName]=state.generalAvailability[oldName];delete state.generalAvailability[oldName];
        }
        for(const r of state.rentals) {
          if(r.assignee===oldName) r.assignee=newName;
          if(r.viewing.inPerson.showingAgent===oldName) r.viewing.inPerson.showingAgent=newName;
          if(r.availability.generalAgents) r.availability.generalAgents=r.availability.generalAgents.map(name=>name===oldName ? newName : name);
          for(const block of r.availability.oneTimeHours) if(block.agent===oldName) block.agent=newName;
          for(const day of Object.values(r.availability.customHours)) {
            for(const block of day.blocks) if(block.agent===oldName) block.agent=newName;
          }
        }
        for(const v of state.viewingsList) {if(v.agent===oldName) v.agent=newName;if(v.type===`In-Person (${oldName})`) v.type=`In-Person (${newName})`;}
        if(state.selectedAvailUser===oldName) state.selectedAvailUser=newName;
        if(state.filters.user===oldName) state.filters.user=newName;
        if(state.reportFilters.agent===oldName) state.reportFilters.agent=newName;
        if(state.accessFilters.user===oldName) state.accessFilters.user=newName;
      }
      const tutorial=window.ReplicaTutorial.create({get:()=>state,el:byId,esc,save:saveState,navigate:goto,open:openModal,close:closeModal});
      const full=window.FullPracticeWorkspace.create({get:()=>state,esc,uid,byId,practiceLink,copyToClipboardSafe,defaultWeeklyHours,
        SYNDICATION_SITES,TIME_OPTIONS,saveState,openModal,closeModal,showToast,render,renderHeader,resetPractice,
        done:tutorial.record,renameAssignee,importRental:wf.importRental});

      // Global handlers
      document.getElementById("logoHomeBtn").addEventListener("click", () => {
        detailPage=null;
        state.section = "rentals";
        state.selectedRentalId = null;
        closeMobileSidebar();
        saveState();
        render();
      });

      document.getElementById("sidebarBackdrop").addEventListener("click", closeMobileSidebar);
      document.getElementById("ttModalClose").addEventListener("click", closeModal);
      document.getElementById("ttModal").addEventListener("click", e => {
        if (e.target.id === "ttModal") closeModal();
      });
      byId('ttModal').addEventListener('keydown',event=>{
        if(event.key!=='Tab') return;
        const controls=[...byId('ttModal').querySelectorAll('button, input:not([type="hidden"]), select, textarea, a[href]')]
          .filter(control=>!control.disabled && control.getClientRects().length);
        const first=controls[0];
        const last=controls.at(-1);
        if(event.shiftKey && document.activeElement===first){event.preventDefault();last?.focus();}
        if(!event.shiftKey && document.activeElement===last){event.preventDefault();first?.focus();}
      });

      const chatPop = document.getElementById("chatPopover");
      const chatFab = byId('chatFab');
      const supportTopics=[
        ['Book a showing','Open a rental’s Leads tab, choose a qualified prospect and schedule an available appointment.'],
        ['Review a practice ID','Open the alert on the prospect’s profile and work through the review options before booking.'],
        ['Find a lockbox arrival','Open Reports and choose Lockbox Access to see completed practice check-ins.'],
        ['Change weekly owner delivery','Open Reports, choose Scheduled and update the shared owner report time.'],
      ];
      let supportThreadId;
      let threadOpenedFrom;
      const supportThreadKey = row => row.threadId || 'previous-practice';

      function showSupportView(id) {
        for(const view of ['support-home','support-conversations','support-conversation']) {
          byId(view).hidden=view!==id;
        }
        chatPop.querySelector('.chat-pop-body').scrollTop=0;
      }
      function showSupport(open) {
        chatPop.classList.toggle('open',open);
        chatFab.setAttribute('aria-expanded',String(open));
        if(open) {
          showSupportView('support-home');
          byId('support-avatars').innerHTML=state.users.slice(0,3).map(user=>{
            const initials=user.name.split(/\s+/).map(part=>part[0]).slice(0,2).join('');
            return `<span>${esc(initials)}</span>`;
          }).join('');
          byId('support-status-text').textContent=navigator.onLine ? 'Online · local practice replies available' : 'Offline · local practice replies available';
          drawSupportTopics();
          byId('closeChatBtn').focus();
        } else chatFab.focus();
        tutorial.record(open ? 'open-support' : 'close-support');
      }
      chatFab.onclick=()=>showSupport(!chatPop.classList.contains('open'));
      byId('closeChatBtn').onclick=()=>showSupport(false);
      function drawSupport() {
        const messages=state.support.filter(row=>supportThreadKey(row)===supportThreadId);
        byId('support-thread-title').textContent=messages[0]?.text || 'New conversation';
        const log=byId('practice-support-thread');
        log.innerHTML=messages.map(row=>`<p><strong>${esc(row.from)}</strong><br>${esc(row.text)}</p>`).join('');
        log.scrollTop=log.scrollHeight;
      }
      function openSupportThread(id,from) {
        supportThreadId=id;
        threadOpenedFrom=from;
        showSupportView('support-conversation');
        drawSupport();
        byId('practice-support-message').value='';
        byId('practice-support-message').focus();
      }
      function openSupportHistory() {
        const threads=new Map();
        for(const row of state.support) {
          const id=supportThreadKey(row);
          if(!threads.has(id)) threads.set(id,row.text);
        }
        showSupportView('support-conversations');
        const list=byId('support-conversation-list');
        list.innerHTML=[...threads].reverse().map(([id,title])=>
          `<button type="button" class="support-thread-link" data-support-thread="${esc(id)}">${esc(title)}</button>`
        ).join('') || '<p>Your practice conversations will appear here.</p>';
        list.querySelectorAll('[data-support-thread]').forEach(button=>{
          button.onclick=()=>openSupportThread(button.dataset.supportThread,'history');
        });
        chatPop.querySelector('[data-support-home]').focus();
      }
      byId('support-new').onclick=()=>openSupportThread(uid('support'),'home');
      byId('support-history').onclick=openSupportHistory;
      chatPop.querySelector('[data-support-home]').onclick=()=>{
        showSupportView('support-home');
        byId('support-history').focus();
      };
      byId('support-back').onclick=()=>{
        if(threadOpenedFrom==='history') openSupportHistory();
        else {showSupportView('support-home');byId('support-new').focus();}
      };
      function drawSupportTopics() {
        const query=byId('practice-support-search').value.trim().toLowerCase();
        const topics=supportTopics.filter(([title,body])=>`${title} ${body}`.toLowerCase().includes(query));
        byId('practice-support-results').innerHTML=topics.map(([title,body])=>
          `<details><summary>${esc(title)}</summary><p>${esc(body)}</p></details>`).join('') || '<p>No help topics match your search.</p>';
      }
      byId('practice-support-search').oninput=drawSupportTopics;
      byId('practice-support').onsubmit=event=>{
        event.preventDefault();const field=byId('practice-support-message');const request=field.value.trim();if(!request)return;
        const topic=supportTopics.find(([title])=>title.toLowerCase().split(' ').some(word=>word.length>3 && request.toLowerCase().includes(word)));
        const reply=topic?.[1] || 'Your practice message is saved. You can look up rental, identity, lockbox and reporting steps in Search for help.';
        state.support.push({threadId:supportThreadId,from:'You',text:request},{threadId:supportThreadId,from:'Practice support',text:reply});
        field.value='';saveState();drawSupport();
      };
      byId('signBackInBtn').onclick=()=>{state.signedOut=false;saveState();render();};
      document.addEventListener('keydown',event=>{
        if(event.key!=='Escape') return;
        if(byId('ttModal').classList.contains('open')) closeModal();
        else if(chatPop.classList.contains('open')) showSupport(false);
        else closeMobileSidebar();
      });
      function openSharedRoute() {
        if(state.signedOut || !location.hash) return;
        let parts;
        try {parts=location.hash.slice(1).split('/').map(decodeURIComponent);} catch {return;}
        const [page,rid,lid,version]=parts;
        if(page==='listings'||page==='referral') {
          history.replaceState(null,'',location.pathname+location.search);
          if(page==='listings') state.filters.user=state.users.find(u=>u.id===rid)?.name || 'anyone';
          goto(page==='listings'?'rentals':'rewards');return;
        }
        const r=state.rentals.find(row=>row.id===rid);
        if(!r || !['qualify','apply','owner-report','visit'].includes(page)) return;
        const lead=r.leads.find(l=>l.id===lid);
        history.replaceState(null,'',location.pathname+location.search);
        detailPage=null;
        state.section='rentals';state.selectedRentalId=r.id;state.detailTab=page==='owner-report'?'owner':'leads';saveState();render();
        if(page==='qualify') wf.qualify(r,lead || wf.blankLead(r,{leadType:lid==='agent'?'Agent lead':'Tenant lead'}),{prospect:true});
        if(page==='apply') wf.application(r,lead);
        if(page==='visit') {
          const visit=state.viewingsList.find(v=>v.rentalId===rid && v.id===lid);
          if(visit) wf.openVisit(r,visit,version);
          else showToast('This practice appointment link is unavailable.');
        }
      }
      window.addEventListener('hashchange',openSharedRoute);
      new ResizeObserver(([{target:header}])=>{
        if(header.classList.contains('rental-header')) header.parentElement.style.setProperty('--rental-header-height',`${header.offsetHeight}px`);
      }).observe(byId('topHeader'));
      render();openSharedRoute();
      window.setInterval(()=>{
        if(document.hidden || state.signedOut) return;
        try {
          if(localStorage.getItem(STORAGE_KEY)!==savedWorkspace) return;
        } catch { /* Keep the practice workflow available without storage. */ }
        wf.reminders();
      },60_000);
    })();
