"use strict";

window.FullPracticeWorkspace = {
  defaults: () => ({
        usersFilter: {
          search: "",
          role: "all",
          showInactives: false
        },
        accountSubnav: "company",
        helpFilter: {
          search: "",
          category: "All"
        },
        users: [
          {
            id: "u1",
            name: "Jamie Taylor",
            email: "jamie.taylor@example.com",
            phone: "(303) 555-0101",
            role: "Account Owner",
            active: true,
            canShow: true,
            calendarSynced: false,
            smsAlerts: true,
            emailAlerts: true,
            permissions: { rentals: true, lockboxes: true, reports: true, billing: true },
            lastLogin: "Today, 8:42 AM"
          },
          {
            id: "u2",
            name: "Casey Nguyen",
            email: "casey.nguyen@example.com",
            phone: "(303) 555-0102",
            role: "Leasing Agent",
            active: true,
            canShow: true,
            calendarSynced: false,
            smsAlerts: true,
            emailAlerts: true,
            permissions: { rentals: true, lockboxes: true, reports: true, billing: false },
            lastLogin: "Today, 9:15 AM"
          },
          {
            id: "u3",
            name: "Maya Patel",
            email: "maya.patel@example.com",
            phone: "(303) 555-0103",
            role: "Property Manager",
            active: true,
            canShow: true,
            calendarSynced: false,
            smsAlerts: false,
            emailAlerts: true,
            permissions: { rentals: true, lockboxes: true, reports: true, billing: false },
            lastLogin: "Yesterday, 4:30 PM"
          },
          {
            id: "u4",
            name: "Carlos Rivera",
            email: "carlos.rivera@example.com",
            phone: "(303) 555-0104",
            role: "Maintenance / Vendor",
            active: false,
            canShow: false,
            calendarSynced: false,
            smsAlerts: true,
            emailAlerts: false,
            permissions: { rentals: false, lockboxes: true, reports: false, billing: false },
            lastLogin: "Nov 12, 2026"
          }
        ],
        account: {
          companyName: "Brookfield Practice Management",
          website: "https://example.com",
          email: "leasing@example.com",
          phone: "(303) 555-0100",
          timezone: "Mountain Time (US & Canada)",
          street: "10 Fictional Park, Suite 2",
          city: "Denver",
          state: "CO",
          zip: "80203",
          fairHousingFooter: true,
          listingsSlug: "brookfield-practice",
          pmsProvider: "AppFolio",
          pmsConnected: false,
          pmsSyncFrequency: "Every 15 minutes",
          pmsLastSynced: "No practice sync yet",
          defaultSyndication: [
            "Apartments.com", "Homes.com", "Realtor.com",
            "Rentals.com", "Zillow, Trulia, & HotPads", "Zumper"
          ],
          defaultMinIncomeRatio: 3,
          defaultMaxMoveInDays: 30,
          defaultMinCredit: 620,
          defaultPetsPolicy: "Case-by-case",
          requireIdBeforeSelfAccess: true,
          screeningDisclosure: "All applicants 18+ must pass credit, background, rental history, and income verification (3x monthly rent).",
          defaultSelfAccessStart: "8:00 AM",
          defaultSelfAccessEnd: "8:00 PM",
          defaultDaylightOnly: true,
          defaultShowingDuration: 30,
          defaultMaxUpcomingShowings: 5,
          autoFeedbackRequest: true,
          selfieIdVerification: true,
          codeboxConnected: false,
          sentrilockConnected: false,
          trackingPhone: "(303) 555-0190",
          callCenter247: true,
          aiVirtualAgent: true,
          aiTone: "Friendly & Concise",
          officeHoursText: "Mon–Fri, 9:00 AM – 5:00 PM MT",
          voicemailGreeting: "Thank you for calling Brookfield Practice Management. Visit our online listings to pre-qualify and schedule a showing 24/7.",
          planName: "Pro Plan (Up to 50 Active Rentals)",
          planPrice: "$149 / month",
          nextBillingDate: "Dec 1, 2026",
          cardBrand: "Visa",
          cardLast4: "4242",
          cardExp: "08/2028",
          defaultApplicationFee: 50,
          invoices: [
            { id: "INV-2026-11", date: "Nov 1, 2026", amount: "$149.00", status: "Paid" },
            { id: "INV-2026-10", date: "Oct 1, 2026", amount: "$149.00", status: "Paid" },
            { id: "INV-2026-09", date: "Sep 1, 2026", amount: "$149.00", status: "Paid" }
          ]
        },
        helpTickets: [
          {
            id: "TT-40912",
            subject: "CodeBox LAB-CB-482910 battery alert threshold",
            category: "Lockboxes & Self-Access",
            priority: "Normal",
            property: "24 Wren Lane",
            status: "Resolved",
            createdAt: "Nov 16, 2026",
            message: "Confirmed 9V lithium battery replacement triggers auto-clear on next sync."
          },
          {
            id: "TT-41105",
            subject: "AppFolio feed sync for new unit photos",
            category: "Syndication & PMS",
            priority: "High",
            property: "16 Juniper Way, Unit 220",
            status: "Open",
            createdAt: "Nov 20, 2026",
            message: "Checking whether reordered AppFolio gallery photos update within the 15-minute window."
          }
        ],
        rewards: {
          referralCode: "brookfield-practice",
          referrals: [
            { id: "ref1", name: "Hannah Brooks", company: "Sample Valley Management", email: "hannah@peakviewpm.example.com", sentDate: "Oct 14, 2026", status: "Credit Applied", credit: 100 },
            { id: "ref2", name: "David Kim", company: "Cedar Practice Rentals", email: "dkim@frontrangeleasing.example.com", sentDate: "Nov 5, 2026", status: "Trial Active", credit: 0 },
            { id: "ref3", name: "Rachel Gomez", company: "Maple Sample Rentals", email: "rachel@milehighrentals.example.com", sentDate: "Nov 18, 2026", status: "Invited", credit: 0 }
          ]
        },
  }),
  create(api) {
    const {get,esc,uid,byId,practiceLink,copyToClipboardSafe,defaultWeeklyHours,SYNDICATION_SITES,TIME_OPTIONS,
      saveState,openModal,closeModal,showToast,render,renderHeader,resetPractice,done,renameAssignee,importRental}=api;
    let state;
    const getCompanyName=()=>state.account.companyName;
    const exportReportCsv=(title,headers,rows)=>window.LeasingExports.download('csv','practice-invoice',title,[headers,...rows]);
      const KB_ARTICLES = [
        {
          id: "kb1",
          category: "Lockboxes & Self-Access",
          title: "Assigning a CodeBox or SentriLock to a Rental",
          summary: "Link hardware serial numbers in Access or directly under Rental Settings → Viewing.",
          steps: [
            "Open the Access section in the left navigation rail and locate your unassigned CodeBox or SentriLock serial number.",
            "Open Settings on that device and use Assigned rental to link it to an active property, or open Rental Settings → Viewing → Self-Access Viewings.",
            "Verify the access window (default 15 minutes before to 60 minutes after appointment) and ensure Photo ID verification is enabled."
          ]
        },
        {
          id: "kb2",
          category: "Leads & Qualifying",
          title: "How Tenant Turner 0–10 Lead Pre-Qualification Scoring Works",
          summary: "Understand automatic qualification checks, manual overrides, and wait list routing.",
          steps: [
            "Configure minimum income ratio, desired move-in window, pet rules, and custom questions under Rental Settings → Qualifying.",
            "In practice, use Add Lead and the questionnaire to see the scored outcome.",
            "Open any rental's LEADS tab and click a prospect's name to inspect their score breakdown, log notes, or toggle Manual Pre-Qualify Override."
          ]
        },
        {
          id: "kb3",
          category: "Getting Started",
          title: "Setting Up General Availability vs. Per-Rental Availability",
          summary: "Control team-wide showing hours, daylight limits, and property-specific date overrides.",
          steps: [
            "Go to Viewings → General Availability and select a leasing agent to configure their default weekly hours and holiday blackout dates.",
            "Open any property's AVAILABILITY tab to inherit General Availability or switch to Custom Schedule for that unit.",
            "Use Add Date Override on the weekly calendar to block maintenance windows or add one-off open house slots."
          ]
        },
        {
          id: "kb4",
          category: "Syndication & PMS",
          title: "Connecting AppFolio, Buildium, or RentVine Feeds",
          summary: "Keep rent, beds, baths, and listing photos automatically synced every 15 minutes.",
          steps: [
            "Navigate to Account → PMS & Feeds and choose your Property Management Software provider.",
            "Click Sync Now (or use the orange circular sync button on the Rentals header) to refresh imported PMS fields.",
            "Toggle default syndication portals under Account → PMS & Feeds or customize per-property under Rental Settings → Marketing."
          ]
        },
        {
          id: "kb5",
          category: "Getting Started",
          title: "Configuring Automated Weekly Owner Reports",
          summary: "Schedule weekly leasing performance emails and moderate prospect feedback.",
          steps: [
            "Open a rental and click the OWNER REPORT tab in the blue header.",
            "Enable weekly automated delivery, set timing from Scheduled reports, and enter a practice owner recipient.",
            "Toggle Hide from Owner Report on individual prospect feedback comments before clicking Send Report Now."
          ]
        },
        {
          id: "kb6",
          category: "Billing & Account",
          title: "Managing Team Roles, Permissions & Scheduling Links",
          summary: "Add leasing agents, control billing access, and copy per-agent scheduling URLs.",
          steps: [
            "Open Users in the left sidebar and click + Add User to invite a new team member.",
            "Assign a role (Account Owner, Property Manager, Leasing Agent, or Maintenance / Vendor) and toggle granular permissions.",
            "Click Availability on an active showing agent’s row to jump straight to their General Availability schedule."
          ]
        }
      ];

      function getInitials(name) {
        const parts = String(name || "U").trim().split(/\s+/);
        return ((parts[0] ? parts[0][0] : "") + (parts[1] ? parts[1][0] : "")).toUpperCase() || "U";
      }

      function rolePillClass(role) {
        if (role === "Account Owner") return "owner";
        if (role === "Property Manager") return "pm";
        if (role === "Maintenance / Vendor") return "vendor";
        return "";
      }

      function openUserModal(userId) {
        const existing = userId ? state.users.find(u => u.id === userId) : null;
        const u = existing || {
          id: "",
          name: "",
          email: "",
          phone: "",
          role: "Leasing Agent",
          active: true,
          canShow: true,
          calendarSynced: false,
          smsAlerts: true,
          emailAlerts: true,
          permissions: { rentals: true, lockboxes: true, reports: true, billing: false }
        };

        const body = `
          <div class="account-form-grid">
            <div>
              <label class="field-label" for="umName">Full Name</label>
              <input id="umName" class="mat-input" type="text" placeholder="e.g., Jordan Taylor" value="${esc(u.name)}" />
            </div>
            <div>
              <label class="field-label" for="umRole">Role</label>
              <select id="umRole" class="mat-select">
                ${["Account Owner", "Property Manager", "Leasing Agent", "Maintenance / Vendor", "Viewer"].map(r =>
                  `<option value="${r}" ${u.role === r ? "selected" : ""}>${r}</option>`
                ).join("")}
              </select>
            </div>
            <div>
              <label class="field-label" for="umEmail">Email Address</label>
              <input id="umEmail" class="mat-input" type="email" placeholder="name@example.com" value="${esc(u.email)}" />
            </div>
            <div>
              <label class="field-label" for="umPhone">Mobile Phone (for SMS alerts)</label>
              <input id="umPhone" class="mat-input" type="tel" placeholder="(303) 555-0155" value="${esc(u.phone)}" />
            </div>
          </div>

          <div style="margin-top:18px; padding-top:14px; border-top:1px solid #ECEFF1;">
            <div class="field-label" style="margin-bottom:8px;">Status & Notifications</div>
            <div class="perm-grid">
              <label class="check-row"><input id="umActive" type="checkbox" ${u.active ? "checked" : ""} /> Active user account</label>
              <label class="check-row"><input id="umCanShow" type="checkbox" ${u.canShow ? "checked" : ""} /> Can conduct in-person showings</label>
              <label class="check-row"><input id="umSms" type="checkbox" ${u.smsAlerts ? "checked" : ""} /> Receive SMS showing & lead alerts</label>
              <label class="check-row"><input id="umEmailAlert" type="checkbox" ${u.emailAlerts ? "checked" : ""} /> Receive Email daily digest</label>
            </div>
          </div>

          <div style="margin-top:16px; padding-top:14px; border-top:1px solid #ECEFF1;">
            <div class="field-label" style="margin-bottom:8px;">Permissions</div>
            <div class="perm-grid">
              <label class="check-row"><input id="umPermRentals" type="checkbox" ${u.permissions.rentals ? "checked" : ""} /> Manage Rentals & Settings</label>
              <label class="check-row"><input id="umPermLockboxes" type="checkbox" ${u.permissions.lockboxes ? "checked" : ""} /> Manage Lockboxes & Codes</label>
              <label class="check-row"><input id="umPermReports" type="checkbox" ${u.permissions.reports ? "checked" : ""} /> View Company Reports</label>
              <label class="check-row"><input id="umPermBilling" type="checkbox" ${u.permissions.billing ? "checked" : ""} /> Manage Account & Billing</label>
            </div>
          </div>
        `;

        const foot = `
          <button id="umCancel" class="btn-outline" type="button">Cancel</button>
          <button id="umSave" class="btn-blue" type="button">${existing ? "Save Changes" : "Create User"}</button>
        `;

        openModal(existing ? `Edit User — ${existing.name}` : "Add New User", body, foot);

        document.getElementById("umCancel").addEventListener("click", closeModal);
        document.getElementById("umSave").addEventListener("click", () => {
          const name = document.getElementById("umName").value.trim();
          const email = document.getElementById("umEmail").value.trim();
          if (!name || Object.hasOwn(Object.prototype,name) || !byId('umEmail').checkValidity() || !email ||
              state.users.some(other=>other.id!==existing?.id && (other.name.toLowerCase()===name.toLowerCase() || other.email.toLowerCase()===email.toLowerCase()))) {
            showToast("Enter a unique practice name and email address");
            return;
          }
          if (!byId('umActive').checked && !state.users.some(row=>row.id!==existing?.id && row.active)) {
            showToast('Keep at least one practice user active.');return;
          }
          const updated = {
            id: existing?.id || uid('user'),
            name,
            email,
            phone: document.getElementById("umPhone").value.trim() || "(303) 555-0199",
            role: document.getElementById("umRole").value,
            active: document.getElementById("umActive").checked,
            canShow: document.getElementById("umCanShow").checked,
            calendarSynced: existing ? existing.calendarSynced : false,
            smsAlerts: document.getElementById("umSms").checked,
            emailAlerts: document.getElementById("umEmailAlert").checked,
            permissions: {
              rentals: document.getElementById("umPermRentals").checked,
              lockboxes: document.getElementById("umPermLockboxes").checked,
              reports: document.getElementById("umPermReports").checked,
              billing: document.getElementById("umPermBilling").checked
            },
            lastLogin: existing ? existing.lastLogin : "Practice invite pending"
          };

          if (existing) {
            const oldName = existing.name;
            Object.assign(existing, updated);
            if (oldName !== name) renameAssignee(oldName,name);
          } else {
            state.users.push(updated);
          }

          if (updated.canShow && !state.generalAvailability[updated.name]) {
            state.generalAvailability[updated.name] = {
              timezone: state.account.timezone || "Mountain Time (US & Canada)",
              weekly: defaultWeeklyHours("9:00 AM", "5:00 PM", false),
              selfAccessStart: state.account.defaultSelfAccessStart || "8:00 AM",
              selfAccessEnd: state.account.defaultSelfAccessEnd || "8:00 PM",
              daylightOnly: true,
              blockedDates: []
            };
          }

          saveState();
          closeModal();
          renderUsersSection();
          showToast(existing ? `Updated ${updated.name}` : `Added ${updated.name} to Users`);
          done("workspace-user");
        });
      }

      function renderUsersSection() {
        const canvas = document.getElementById("canvas");
        const uf = state.usersFilter;
        const q = uf.search.trim().toLowerCase();

        const activeCount = state.users.filter(u => u.active).length;
        const showingAgents = state.users.filter(u => u.active && u.canShow).length;
        const syncedCals = state.users.filter(u => u.active && u.calendarSynced).length;

        const filtered = state.users.filter(u => {
          if (!uf.showInactives && !u.active) return false;
          if (uf.role !== "all" && u.role !== uf.role) return false;
          if (q && !`${u.name} ${u.email} ${u.role} ${u.phone}`.toLowerCase().includes(q)) return false;
          return true;
        });

        canvas.innerHTML = `
          <div class="kpi-strip" style="max-width:1160px; margin-bottom:18px;">
            <div class="kpi-box">
              <div class="kpi-label">Active Users</div>
              <div class="kpi-val">${activeCount}</div>
              <div class="kpi-sub">${state.users.length} total team accounts</div>
            </div>
            <div class="kpi-box">
              <div class="kpi-label">Showing Agents</div>
              <div class="kpi-val">${showingAgents}</div>
              <div class="kpi-sub">Enabled for in-person tours</div>
            </div>
            <div class="kpi-box">
              <div class="kpi-label">Calendars Synced</div>
              <div class="kpi-val">${syncedCals}</div>
              <div class="kpi-sub">Practice connection status</div>
            </div>
            <div class="kpi-box">
              <div class="kpi-label">Assigned Rentals</div>
              <div class="kpi-val">${state.rentals.filter(r => r.active).length}</div>
              <div class="kpi-sub">Active portfolio listings</div>
            </div>
          </div>

          <div class="users-toolbar">
            <div class="users-filters">
              <div class="mat-field-underlined" style="min-width:220px;">
                <input id="userSearchInput" type="search" placeholder="Search name, email, or phone" value="${esc(uf.search)}" />
              </div>
              <select id="userRoleFilter" class="mat-select" style="width:auto; min-width:180px;">
                <option value="all" ${uf.role === "all" ? "selected" : ""}>All Roles</option>
                ${["Account Owner", "Property Manager", "Leasing Agent", "Maintenance / Vendor", "Viewer"].map(r =>
                  `<option value="${r}" ${uf.role === r ? "selected" : ""}>${r}</option>`
                ).join("")}
              </select>
              <label class="toggle-inline">
                <span class="tt-switch">
                  <input id="showInactiveUsers" type="checkbox" ${uf.showInactives ? "checked" : ""} />
                  <span class="tt-slider"></span>
                </span>
                <span>Show inactive users</span>
              </label>
            </div>
            <button id="addUserBtn" class="btn-orange" type="button">+ ADD USER</button>
          </div>

          <div class="mat-card" style="max-width:1160px; padding:0; overflow:hidden;">
            <div style="overflow-x:auto;">
              <table class="tt-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Assigned Rentals</th>
                    <th>Calendar & Alerts</th>
                    <th>Status</th>
                    <th style="text-align:right;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${filtered.length ? filtered.map(u => {
                    const assignedCount = state.rentals.filter(r => r.assignee === u.name && r.active).length;

                    return `
                      <tr>
                        <td>
                          <div class="user-cell-flex">
                            <span class="user-avatar-circle ${u.active ? "" : "inactive"}">${getInitials(u.name)}</span>
                            <div>
                              <div style="font-weight:600; color:#263238;">${esc(u.name)}</div>
                              <div style="font-size:12px; color:#607D8B;">${esc(u.email)} · ${esc(u.phone)}</div>
                              <div style="font-size:11px; color:#90A4AE;">Last login: ${esc(u.lastLogin)}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span class="role-pill ${rolePillClass(u.role)}">${esc(u.role)}</span>
                        </td>
                        <td>
                          <div style="font-weight:600;">${assignedCount} active</div>
                          <div style="font-size:11px; color:#78909C;">${u.canShow ? "In-person enabled" : "No showings"}</div>
                        </td>
                        <td>
                          <div style="font-size:12px; margin-bottom:3px;">
                            <span class="status-dot ${u.calendarSynced ? "" : "off"}"></span>${u.calendarSynced ? "Calendar Synced" : "Not Synced"}
                          </div>
                          <div style="font-size:11px; color:#607D8B;">
                            ${u.smsAlerts ? "SMS" : ""}${u.smsAlerts && u.emailAlerts ? " + " : ""}${u.emailAlerts ? "Email" : (!u.smsAlerts ? "Alerts muted" : "")}
                          </div>
                        </td>
                        <td>
                          <label class="tt-switch" title="Toggle user active status">
                            <input type="checkbox" data-toggle-user="${u.id}" ${u.active ? "checked" : ""} />
                            <span class="tt-slider"></span>
                          </label>
                        </td>
                        <td style="text-align:right; white-space:nowrap;">
                          <button class="btn-outline btn-sm" data-edit-user="${u.id}" type="button">Edit</button>
                          ${u.canShow ? `<button class="btn-outline btn-sm" data-avail-user="${esc(u.name)}" type="button" style="margin-left:4px;">Availability</button>` : ""}
                          <button class="btn-outline btn-sm" data-copy-user="${esc(practiceLink("listings",u.id))}" type="button" style="margin-left:4px;">Copy Link</button>
                        </td>
                      </tr>
                    `;
                  }).join("") : `
                    <tr><td colspan="6" style="text-align:center; padding:28px; color:#78909C;">No users match the current filter.</td></tr>
                  `}
                </tbody>
              </table>
            </div>
          </div>
        `;

        document.getElementById("userSearchInput").addEventListener("input", e => {
          state.usersFilter.search = e.target.value;
          const position=e.target.selectionStart;
          saveState();renderUsersSection();
          byId('userSearchInput').focus();byId('userSearchInput').setSelectionRange(position,position);
        });
        document.getElementById("userRoleFilter").addEventListener("change", e => {
          state.usersFilter.role = e.target.value;
          saveState();
          renderUsersSection();
        });
        document.getElementById("showInactiveUsers").addEventListener("change", e => {
          state.usersFilter.showInactives = e.target.checked;
          saveState();
          renderUsersSection();
        });
        document.getElementById("addUserBtn").addEventListener("click", () => openUserModal(null));

        canvas.querySelectorAll("[data-toggle-user]").forEach(chk => {
          chk.addEventListener("change", () => {
            const u = state.users.find(x => x.id === chk.dataset.toggleUser);
            if (u) {
              if (!chk.checked && !state.users.some(other=>other.id!==u.id && other.active)) {chk.checked=true;showToast('Keep at least one practice user active.');return;}
              u.active = chk.checked;
              saveState();
              renderUsersSection();
              showToast(`${u.name} marked ${u.active ? "active" : "inactive"}`);
            }
          });
        });
        canvas.querySelectorAll("[data-edit-user]").forEach(btn => {
          btn.addEventListener("click", () => openUserModal(btn.dataset.editUser));
        });
        canvas.querySelectorAll("[data-avail-user]").forEach(btn => {
          btn.addEventListener("click", () => {
            const uname = btn.dataset.availUser;
            if (!state.generalAvailability[uname]) {
              state.generalAvailability[uname] = {
                timezone: state.account.timezone || "Mountain Time (US & Canada)",
                weekly: defaultWeeklyHours("9:00 AM", "5:00 PM", false),
                selfAccessStart: "8:00 AM",
                selfAccessEnd: "8:00 PM",
                daylightOnly: true,
                blockedDates: []
              };
            }
            state.selectedAvailUser = uname;
            state.section = "viewings";
            state.viewingsTab = "general";
            saveState();
            render();
            showToast(`Viewing General Availability for ${uname}`);
          });
        });
        canvas.querySelectorAll("[data-copy-user]").forEach(btn => {
          btn.addEventListener("click", () => {
            copyToClipboardSafe(btn.dataset.copyUser, "Agent scheduling link copied to clipboard");
          });
        });
      }

      function renderAccountSection() {
        const canvas = document.getElementById("canvas");
        const acc = state.account;
        const activeRentalsCount = state.rentals.filter(r => r.active).length;
        const usagePct = Math.min(100, Math.round((activeRentalsCount / 50) * 100));

        const subnavItems = [
          { id: "company", label: "Company Info" },
          { id: "pms", label: "PMS & Feeds" },
          { id: "qualifying", label: "Default Qualifying" },
          { id: "showings", label: "Showing & Access" },
          { id: "phone", label: "Phone, SMS & AI" },
          { id: "billing", label: "Billing & Plan" }
        ];

        const listingsUrl = practiceLink("listings");

        canvas.innerHTML = `
          <div class="settings-layout">
            <nav class="subnav" aria-label="Account sections">
              ${subnavItems.map(item => `
                <button class="subnav-item ${state.accountSubnav === item.id ? "active" : ""}" data-asub="${item.id}" type="button">${item.label}</button>
              `).join("")}
            </nav>

            <div class="settings-cards">
              <!-- Company Info -->
              <section id="acc-company" class="mat-card">
                <div class="row-inline practice-between"><h2 class="mat-card-title">Company Info & Branding</h2><button id="account-reset" class="btn-outline" type="button">Reset practice data</button></div>
                <p class="field-help" style="margin-top:-6px; margin-bottom:16px;">Changes to your company name update the blue Tenant Turner header and Owner Reports immediately.</p>
                <div class="account-form-grid">
                  <div class="full-span">
                    <label class="field-label" for="accCompanyName">Company Name</label>
                    <input id="accCompanyName" class="mat-input" type="text" value="${esc(acc.companyName)}" />
                  </div>
                  <div>
                    <label class="field-label" for="accEmail">Primary Leasing Email</label>
                    <input id="accEmail" class="mat-input" type="email" value="${esc(acc.email)}" />
                  </div>
                  <div>
                    <label class="field-label" for="accPhone">Main Office Phone</label>
                    <input id="accPhone" class="mat-input" type="tel" value="${esc(acc.phone)}" />
                  </div>
                  <div>
                    <label class="field-label" for="accWebsite">Company Website</label>
                    <input id="accWebsite" class="mat-input" type="url" value="${esc(acc.website)}" />
                  </div>
                  <div>
                    <label class="field-label" for="accTimezone">Default Timezone</label>
                    <select id="accTimezone" class="mat-select">
                      ${["Eastern Time (US & Canada)", "Central Time (US & Canada)", "Mountain Time (US & Canada)", "Pacific Time (US & Canada)"].map(tz =>
                        `<option value="${tz}" ${acc.timezone === tz ? "selected" : ""}>${tz}</option>`
                      ).join("")}
                    </select>
                  </div>
                  <div class="full-span">
                    <label class="field-label" for="accStreet">Office Street Address</label>
                    <input id="accStreet" class="mat-input" type="text" value="${esc(acc.street)}" />
                  </div>
                  <div>
                    <label class="field-label" for="accCity">City</label>
                    <input id="accCity" class="mat-input" type="text" value="${esc(acc.city)}" />
                  </div>
                  <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                    <div>
                      <label class="field-label" for="accState">State</label>
                      <input id="accState" class="mat-input" type="text" value="${esc(acc.state)}" />
                    </div>
                    <div>
                      <label class="field-label" for="accZip">ZIP</label>
                      <input id="accZip" class="mat-input" type="text" value="${esc(acc.zip)}" />
                    </div>
                  </div>
                </div>

                <div style="margin-top:16px; padding:12px 14px; background:#F5F7F9; border-radius:4px; display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:10px;">
                  <div>
                    <div style="font-size:12px; font-weight:600; color:#546E7A;">Public Listings & Scheduling Page</div>
                    <div style="font-size:13px; color:#0277BD; font-family:monospace;">${esc(listingsUrl)}</div>
                  </div>
                  <button id="copyPublicListingsBtn" class="btn-outline btn-sm" type="button">Copy Link</button>
                </div>

                <label class="check-row" style="margin-top:14px;">
                  <input id="accFairHousing" type="checkbox" ${acc.fairHousingFooter ? "checked" : ""} />
                  Display Equal Housing Opportunity & Fair Housing footer on public listing pages
                </label>
              </section>

              <!-- PMS & Feeds -->
              <section id="acc-pms" class="mat-card">
                <h2 class="mat-card-title">PMS Integration & Syndication Feeds</h2>
                <div class="pms-banner ${acc.pmsConnected ? "" : "disconnected"}">
                  <div>
                    <div style="font-weight:700; color:#263238; font-size:14px;">
                      <span class="status-dot ${acc.pmsConnected ? "" : "warn"}"></span>
                      ${esc(acc.pmsProvider)} Feed — ${acc.pmsConnected ? "Connected" : "Disconnected"}
                    </div>
                    <div style="font-size:12px; color:#546E7A; margin-top:2px;">Last synced: ${esc(acc.pmsLastSynced)} · Frequency: ${esc(acc.pmsSyncFrequency)}</div>
                  </div>
                  <div style="display:flex; gap:8px;">
                    <button id="pmsSyncNowBtn" class="btn-blue btn-sm" type="button">Sync Now</button>
                    <button id="pmsToggleConnBtn" class="btn-outline btn-sm" type="button">${acc.pmsConnected ? "Disconnect" : "Reconnect"}</button>
                  </div>
                </div>

                <div class="account-form-grid">
                  <div>
                    <label class="field-label" for="accPmsProvider">Property Management Software</label>
                    <select id="accPmsProvider" class="mat-select">
                      ${["AppFolio", "Buildium", "RentVine", "Propertyware", "Yardi Breeze", "Rent Manager", "Manual / None"].map(p =>
                        `<option value="${p}" ${acc.pmsProvider === p ? "selected" : ""}>${p}</option>`
                      ).join("")}
                    </select>
                  </div>
                  <div>
                    <label class="field-label" for="accPmsFreq">Auto-Sync Frequency</label>
                    <select id="accPmsFreq" class="mat-select">
                      ${["Every 15 minutes", "Hourly", "Every 6 hours", "Manual Only"].map(f =>
                        `<option value="${f}" ${acc.pmsSyncFrequency === f ? "selected" : ""}>${f}</option>`
                      ).join("")}
                    </select>
                  </div>
                </div>

                <div style="margin-top:18px;">
                  <div class="field-label" style="margin-bottom:8px;">Default Syndication Channels (for new rentals)</div>
                  <div class="syndication-grid">
                    ${SYNDICATION_SITES.map(site => `
                      <label class="check-row">
                        <input type="checkbox" data-def-synd="${esc(site)}" ${acc.defaultSyndication.includes(site) ? "checked" : ""} />
                        <span>${esc(site)}</span>
                      </label>
                    `).join("")}
                  </div>
                  <div style="margin-top:12px;">
                    <button id="applySyndAllBtn" class="btn-outline btn-sm" type="button">Apply Default Channels to All Active Rentals</button>
                  </div>
                </div>
              </section>

              <!-- Default Qualifying -->
              <section id="acc-qualifying" class="mat-card">
                <h2 class="mat-card-title">Default Qualifying & Restrictions</h2>
                <div class="account-form-grid">
                  <div>
                    <label class="field-label" for="accMinIncome">Default Minimum Income Ratio (x Rent)</label>
                    <input id="accMinIncome" class="mat-input" type="number" min="1" max="10" step="0.5" value="${acc.defaultMinIncomeRatio}" />
                  </div>
                  <div>
                    <label class="field-label" for="accMaxMoveIn">Default Max Move-In Window (Days)</label>
                    <input id="accMaxMoveIn" class="mat-input" type="number" min="7" max="180" value="${acc.defaultMaxMoveInDays}" />
                  </div>
                  <div>
                    <label class="field-label" for="accMinCredit">Recommended Minimum Credit Score</label>
                    <input id="accMinCredit" class="mat-input" type="number" min="500" max="800" step="10" value="${acc.defaultMinCredit}" />
                  </div>
                  <div>
                    <label class="field-label" for="accPetsPolicy">Default Pet Policy</label>
                    <select id="accPetsPolicy" class="mat-select">
                      ${["Case-by-case", "Pets Allowed", "Small Dogs & Cats Only", "No Pets"].map(p =>
                        `<option value="${p}" ${acc.defaultPetsPolicy === p ? "selected" : ""}>${p}</option>`
                      ).join("")}
                    </select>
                  </div>
                  <div class="full-span">
                    <label class="field-label" for="accDisclosure">Pre-Qualification & Screening Disclosure</label>
                    <textarea id="accDisclosure" class="mat-textarea" rows="2">${esc(acc.screeningDisclosure)}</textarea>
                  </div>
                </div>
                <label class="check-row" style="margin-top:12px;">
                  <input id="accReqId" type="checkbox" ${acc.requireIdBeforeSelfAccess ? "checked" : ""} />
                  Require government-issued Photo ID verification before issuing any self-access lockbox code
                </label>
                <div style="margin-top:14px;">
                  <button id="applyQualAllBtn" class="btn-outline btn-sm" type="button">Push Income & Move-In Defaults to All Rentals</button>
                </div>
              </section>

              <!-- Showing & Access Defaults -->
              <section id="acc-showings" class="mat-card">
                <h2 class="mat-card-title">Showing & Lockbox Defaults</h2>
                <div class="account-form-grid">
                  <div>
                    <label class="field-label" for="accSaStart">Default Self-Access Earliest Start</label>
                    <select id="accSaStart" class="mat-select">
                      ${TIME_OPTIONS.map(t => `<option value="${t}" ${acc.defaultSelfAccessStart === t ? "selected" : ""}>${t}</option>`).join("")}
                    </select>
                  </div>
                  <div>
                    <label class="field-label" for="accSaEnd">Default Self-Access Latest End</label>
                    <select id="accSaEnd" class="mat-select">
                      ${TIME_OPTIONS.map(t => `<option value="${t}" ${acc.defaultSelfAccessEnd === t ? "selected" : ""}>${t}</option>`).join("")}
                    </select>
                  </div>
                  <div>
                    <label class="field-label" for="accDuration">Default Showing Duration (Minutes)</label>
                    <select id="accDuration" class="mat-select">
                      ${[15, 30, 45, 60].map(m => `<option value="${m}" ${Number(acc.defaultShowingDuration) === m ? "selected" : ""}>${m} minutes</option>`).join("")}
                    </select>
                  </div>
                  <div>
                    <label class="field-label" for="accMaxUpcoming">Max Upcoming Showings per Prospect</label>
                    <input id="accMaxUpcoming" class="mat-input" type="number" min="1" max="20" value="${acc.defaultMaxUpcomingShowings}" />
                  </div>
                </div>

                <div class="perm-grid" style="margin-top:14px;">
                  <label class="check-row"><input id="accDaylight" type="checkbox" ${acc.defaultDaylightOnly ? "checked" : ""} /> Restrict self-access tours to daylight hours</label>
                  <label class="check-row"><input id="accFeedback" type="checkbox" ${acc.autoFeedbackRequest ? "checked" : ""} /> Auto-send feedback request 1 hr after tour</label>
                  <label class="check-row"><input id="accSelfie" type="checkbox" ${acc.selfieIdVerification ? "checked" : ""} /> Require live selfie match with Photo ID</label>
                  <label class="check-row"><input id="accCodebox" type="checkbox" ${acc.codeboxConnected ? "checked" : ""} /> CodeBox API integration enabled</label>
                </div>
              </section>

              <!-- Phone, SMS & AI -->
              <section id="acc-phone" class="mat-card">
                <h2 class="mat-card-title">Phone, SMS & AI Virtual Agent</h2>
                <div class="account-form-grid">
                  <div>
                    <label class="field-label" for="accTrackingPhone">Dedicated Tracking Phone Number</label>
                    <input id="accTrackingPhone" class="mat-input" type="text" value="${esc(acc.trackingPhone)}" readonly style="background:#F5F7F9;" />
                  </div>
                  <div>
                    <label class="field-label" for="accAiTone">AI Virtual Agent Response Style</label>
                    <select id="accAiTone" class="mat-select">
                      ${["Friendly & Concise", "Formal & Professional", "High-Touch Leasing"].map(t =>
                        `<option value="${t}" ${acc.aiTone === t ? "selected" : ""}>${t}</option>`
                      ).join("")}
                    </select>
                  </div>
                  <div class="full-span">
                    <label class="field-label" for="accOfficeHours">Office Business Hours (for Call Forwarding)</label>
                    <input id="accOfficeHours" class="mat-input" type="text" value="${esc(acc.officeHoursText)}" />
                  </div>
                  <div class="full-span">
                    <label class="field-label" for="accVoicemail">After-Hours Voicemail Greeting</label>
                    <textarea id="accVoicemail" class="mat-textarea" rows="2">${esc(acc.voicemailGreeting)}</textarea>
                  </div>
                </div>
                <div class="perm-grid" style="margin-top:12px;">
                  <label class="check-row"><input id="accCallCenter" type="checkbox" ${acc.callCenter247 ? "checked" : ""} /> Enable 24/7 Live Call Center Lead Capture</label>
                  <label class="check-row"><input id="accAiAgent" type="checkbox" ${acc.aiVirtualAgent ? "checked" : ""} /> Enable AI Virtual Agent SMS/Email Auto-Reply</label>
                </div>
              </section>

              <!-- Billing & Plan -->
              <section id="acc-billing" class="mat-card">
                <div class="mat-field"><label class="mat-label" for="default-application-fee">Default application fee</label><input id="default-application-fee" class="mat-input" type="number" min="0" value="${esc(acc.defaultApplicationFee)}"></div>
                <h2 class="mat-card-title">Billing & Subscription Plan</h2>
                <div class="plan-box">
                  <div style="flex:1; min-width:240px;">
                    <div style="font-size:15px; font-weight:700; color:#263238;">${esc(acc.planName)}</div>
                    <div style="font-size:13px; color:#546E7A; margin-top:2px;">${esc(acc.planPrice)} · Next billing date: ${esc(acc.nextBillingDate)}</div>
                    <div style="font-size:12px; color:#455A64; margin-top:8px;">Active Rentals Usage: <strong>${activeRentalsCount} / 50</strong> (${usagePct}%)</div>
                    <div class="usage-bar-track"><div class="usage-bar-fill" style="width:${usagePct}%;"></div></div>
                  </div>
                  <div style="text-align:right;">
                    <div style="font-size:13px; font-weight:600; color:#263238;">${esc(acc.cardBrand)} ending in ${esc(acc.cardLast4)}</div>
                    <div style="font-size:12px; color:#607D8B; margin-bottom:8px;">Expires ${esc(acc.cardExp)}</div>
                    <button id="updateCardBtn" class="btn-outline btn-sm" type="button">Update Payment Method</button>
                  </div>
                </div>

                <h3 style="font-size:13px; text-transform:uppercase; color:#546E7A; margin:0 0 10px;">Recent Invoices</h3>
                <table class="tt-table">
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th style="text-align:right;">Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${acc.invoices.map(inv => `
                      <tr>
                        <td style="font-weight:600;">${esc(inv.id)}</td>
                        <td>${esc(inv.date)}</td>
                        <td>${esc(inv.amount)}</td>
                        <td><span class="role-pill pm">${esc(inv.status)}</span></td>
                        <td style="text-align:right;">
                          <button class="btn-outline btn-sm" data-dl-inv="${esc(inv.id)}" type="button">Download CSV</button>
                        </td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table>
              </section>
            </div>
          </div>
        `;

        // Sticky subnav smooth scroll
        canvas.querySelectorAll("[data-asub]").forEach(btn => {
          btn.addEventListener("click", () => {
            state.accountSubnav = btn.dataset.asub;
            saveState();
            canvas.querySelectorAll("[data-asub]").forEach(b => b.classList.toggle("active", b.dataset.asub === state.accountSubnav));
            const targetEl = document.getElementById("acc-" + state.accountSubnav);
            if (targetEl) targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
          });
        });

        const bindAccVal = (id, key, updateHeader = false) => {
          const el = document.getElementById(id);
          if (!el) return;
          el.addEventListener("change", () => {
            if (!el.checkValidity() || (!el.value.trim() && key==='companyName')) {el.reportValidity();return;}
            state.account[key] = el.type === "number" ? Number(el.value) : el.value;
            saveState();done('workspace-account',{key});
            if (updateHeader) renderHeader();
            showToast("Account setting saved");
          });
        };
        const bindAccCheck = (id, key) => {
          const el = document.getElementById(id);
          if (!el) return;
          el.addEventListener("change", () => {
            state.account[key] = el.checked;
            saveState();
            showToast("Account setting saved");
          });
        };

        bindAccVal("accCompanyName", "companyName", true);
        bindAccVal("accEmail", "email");
        bindAccVal("accPhone", "phone");
        bindAccVal("accWebsite", "website");
        bindAccVal("accTimezone", "timezone");
        bindAccVal("accStreet", "street");
        bindAccVal("accCity", "city");
        bindAccVal("accState", "state");
        bindAccVal("accZip", "zip");
        bindAccCheck("accFairHousing", "fairHousingFooter");

        document.getElementById("copyPublicListingsBtn").addEventListener("click", () => {
          copyToClipboardSafe(listingsUrl, "Public listings URL copied");
        });

        bindAccVal("accPmsProvider", "pmsProvider");
        bindAccVal("accPmsFreq", "pmsSyncFrequency");

        byId('pmsSyncNowBtn').onclick=importRental;

        document.getElementById("pmsToggleConnBtn").addEventListener("click", () => {
          state.account.pmsConnected = !state.account.pmsConnected;
          saveState();
          renderAccountSection();
          showToast(state.account.pmsConnected ? `${state.account.pmsProvider} practice feed enabled` : `${state.account.pmsProvider} practice feed disabled`);
        });

        canvas.querySelectorAll("[data-def-synd]").forEach(chk => {
          chk.addEventListener("change", () => {
            const site = chk.dataset.defSynd;
            const list = state.account.defaultSyndication;
            if (chk.checked && !list.includes(site)) list.push(site);
            if (!chk.checked) {
              const idx = list.indexOf(site);
              if (idx >= 0) list.splice(idx, 1);
            }
            saveState();
            showToast("Default syndication channels updated");
          });
        });

        document.getElementById("applySyndAllBtn").addEventListener("click", () => {
          let count = 0;
          state.rentals.forEach(r => {
            if (r.active) {
              r.syndication=Object.fromEntries(SYNDICATION_SITES.map(site=>[site,state.account.defaultSyndication.includes(site)]));
              count++;
            }
          });
          saveState();
          showToast(`Applied default syndication to ${count} active rentals`);
        });

        bindAccVal('default-application-fee','defaultApplicationFee');
        bindAccVal("accMinIncome", "defaultMinIncomeRatio");
        bindAccVal("accMaxMoveIn", "defaultMaxMoveInDays");
        bindAccVal("accMinCredit", "defaultMinCredit");
        bindAccVal("accPetsPolicy", "defaultPetsPolicy");
        bindAccVal("accDisclosure", "screeningDisclosure");
        bindAccCheck("accReqId", "requireIdBeforeSelfAccess");

        document.getElementById("applyQualAllBtn").addEventListener("click", () => {
          state.rentals.forEach(r => {
            r.qualifying.incomeRatio = state.account.defaultMinIncomeRatio;
            r.qualifying.moveInDays = state.account.defaultMaxMoveInDays;
          });
          saveState();
          showToast(`Updated qualifying defaults across all ${state.rentals.length} rentals`);
        });

        bindAccVal("accSaStart", "defaultSelfAccessStart");
        bindAccVal("accSaEnd", "defaultSelfAccessEnd");
        bindAccVal("accDuration", "defaultShowingDuration");
        bindAccVal("accMaxUpcoming", "defaultMaxUpcomingShowings");
        bindAccCheck("accDaylight", "defaultDaylightOnly");
        bindAccCheck("accFeedback", "autoFeedbackRequest");
        bindAccCheck("accSelfie", "selfieIdVerification");
        bindAccCheck("accCodebox", "codeboxConnected");

        bindAccVal("accAiTone", "aiTone");
        bindAccVal("accOfficeHours", "officeHoursText");
        bindAccVal("accVoicemail", "voicemailGreeting");
        bindAccCheck("accCallCenter", "callCenter247");
        bindAccCheck("accAiAgent", "aiVirtualAgent");

        byId('updateCardBtn').onclick=()=>{
          const cards=[['Visa','4242','08/2028'],['Mastercard','5556','04/2029'],['American Express','1000','06/2029']];
          openModal('Update practice payment method',`<label class="mat-field"><span class="mat-label">Sample card</span><select id="pmSample" class="mat-select">${cards.map(([name,last],i)=>`<option value="${i}">${name} •••• ${last}</option>`).join('')}</select></label>`,
            `<button id="pmCancel" class="btn-outline" type="button">Cancel</button><button id="pmSave" class="btn-blue" type="button">Save sample card</button>`);
          byId('pmCancel').onclick=closeModal;
          byId('pmSave').onclick=()=>{[acc.cardBrand,acc.cardLast4,acc.cardExp]=cards[Number(byId('pmSample').value)];saveState();closeModal();renderAccountSection();showToast('Sample payment method saved.');done('workspace-billing');};
        };
        byId('account-reset').onclick=resetPractice;

        canvas.querySelectorAll("[data-dl-inv]").forEach(btn => {
          btn.addEventListener("click", () => {
            const inv = state.account.invoices.find(i => i.id === btn.dataset.dlInv);
            if (!inv) return;
            exportReportCsv(
              `TenantTurner_${inv.id}`,
              ["Invoice ID", "Company", "Date", "Plan", "Amount", "Status"],
              [[inv.id, getCompanyName(), inv.date, state.account.planName, inv.amount, inv.status]]
            );
          });
        });
      }

      function renderHelpSection() {
        const canvas = document.getElementById("canvas");
        const hf = state.helpFilter;
        const q = hf.search.trim().toLowerCase();
        const cats = ["All", "Getting Started", "Lockboxes & Self-Access", "Leads & Qualifying", "Syndication & PMS", "Billing & Account"];

        const filteredArticles = KB_ARTICLES.filter(a => {
          if (hf.category !== "All" && a.category !== hf.category) return false;
          if (q && !`${a.title} ${a.summary} ${a.category}`.toLowerCase().includes(q)) return false;
          return true;
        });

        canvas.innerHTML = `
          <div class="help-grid">
            <div>
              <div class="mat-card">
                <h2 class="mat-card-title">Tenant Turner Knowledge Base</h2>
                <div class="mat-field-underlined" style="width:100%;">
                  <input id="kbSearchInput" type="search" placeholder="Search guides, lockboxes, pre-qualifying, or syndication..." value="${esc(hf.search)}" />
                </div>
                <div class="kb-chip-row">
                  ${cats.map(c => `<button class="kb-chip ${hf.category === c ? "active" : ""}" data-kbcat="${esc(c)}" type="button">${esc(c)}</button>`).join("")}
                </div>
                <div>
                  ${filteredArticles.length ? filteredArticles.map(a => `
                    <div class="kb-article-item" data-kb-open="${a.id}">
                      <div>
                        <div style="font-size:14px; font-weight:600; color:#0277BD;">${esc(a.title)}</div>
                        <div style="font-size:12px; color:#546E7A; margin-top:3px;">${esc(a.summary)}</div>
                      </div>
                      <span class="role-pill" style="flex-shrink:0;">${esc(a.category)}</span>
                    </div>
                  `).join("") : `<p style="color:#78909C; font-size:13px;">No help articles match your search.</p>`}
                </div>
              </div>

              <div class="mat-card">
                <h2 class="mat-card-title">My Support Tickets (${state.helpTickets.length})</h2>
                <div style="overflow-x:auto;">
                  <table class="tt-table">
                    <thead>
                      <tr>
                        <th>Ticket #</th>
                        <th>Subject</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th style="text-align:right;">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${state.helpTickets.map(t => `
                        <tr>
                          <td style="font-family:monospace; font-weight:600;">${esc(t.id)}</td>
                          <td>
                            <div style="font-weight:600;">${esc(t.subject)}</div>
                            <div style="font-size:11px; color:#78909C;">${esc(t.property)} · ${esc(t.createdAt)}</div>
                          </td>
                          <td>${esc(t.category)}</td>
                          <td><span class="role-pill ${t.status === "Resolved" ? "pm" : "vendor"}">${esc(t.status)}</span></td>
                          <td style="text-align:right;">
                            <button class="btn-outline btn-sm" data-toggle-ticket="${t.id}" type="button">${t.status === "Open" ? "Mark Resolved" : "Reopen"}</button>
                          </td>
                        </tr>
                      `).join("")}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div>
              <div class="mat-card">
                <h2 class="mat-card-title">Quick Practice Shortcuts</h2>
                <div style="display:flex; flex-direction:column; gap:8px;">
                  <button class="report-link-btn" data-jump-sec="rentals" type="button">
                    <div>
                      <div class="report-link-name">RENTALS & SETTINGS</div>
                      <div class="report-link-desc">Edit Marketing, Qualifying, Wait List & Self-Access</div>
                    </div>
                    <span>→</span>
                  </button>
                  <button class="report-link-btn" data-jump-sec="viewings" type="button">
                    <div>
                      <div class="report-link-name">GENERAL AVAILABILITY</div>
                      <div class="report-link-desc">Configure agent hours, blackout dates & Calendar Sync</div>
                    </div>
                    <span>→</span>
                  </button>
                  <button class="report-link-btn" data-jump-sec="access" type="button">
                    <div>
                      <div class="report-link-name">LOCKBOXES & CODES</div>
                      <div class="report-link-desc">Reassign CodeBox/SentriLock devices & view codes</div>
                    </div>
                    <span>→</span>
                  </button>
                  <button class="report-link-btn" data-jump-sec="reports" type="button">
                    <div>
                      <div class="report-link-name">COMPANY REPORTS</div>
                      <div class="report-link-desc">Inspect all 9 leasing reports & export CSVs</div>
                    </div>
                    <span>→</span>
                  </button>
                </div>
              </div>

              <div class="mat-card">
                <h2 class="mat-card-title">Submit a Support Request</h2>
                <div style="display:flex; flex-direction:column; gap:12px;">
                  <div>
                    <label class="field-label" for="htSubject">Subject</label>
                    <input id="htSubject" class="mat-input" type="text" placeholder="e.g., Question about SentriLock shackle code" />
                  </div>
                  <div>
                    <label class="field-label" for="htCategory">Category</label>
                    <select id="htCategory" class="mat-select">
                      ${cats.slice(1).map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join("")}
                    </select>
                  </div>
                  <div>
                    <label class="field-label" for="htProperty">Related Property</label>
                    <select id="htProperty" class="mat-select">
                      <option value="General Account">General Account</option>
                      ${state.rentals.map(r => `<option value="${esc(r.address)}">${esc(r.address)}</option>`).join("")}
                    </select>
                  </div>
                  <div>
                    <label class="field-label" for="htMessage">Details</label>
                    <textarea id="htMessage" class="mat-textarea" rows="3" placeholder="Describe what you need help with..."></textarea>
                  </div>
                  <button id="htSubmitBtn" class="btn-blue" type="button">Submit Ticket</button>
                </div>
              </div>

              <div class="mat-card">
                <h2 class="mat-card-title">System & Hardware Status</h2>
                <div class="sys-status-row"><span>Tenant Turner Web App</span><span><span class="status-dot"></span>Operational</span></div>
                <div class="sys-status-row"><span>SMS & 24/7 Call Center</span><span><span class="status-dot"></span>Operational</span></div>
                <div class="sys-status-row"><span>CodeBox / SentriLock API</span><span><span class="status-dot"></span>Operational</span></div>
                <div class="sys-status-row"><span>Zillow & Apartments.com Feed</span><span><span class="status-dot"></span>Operational</span></div>
              </div>
            </div>
          </div>
        `;

        document.getElementById("kbSearchInput").addEventListener("input", e => {
          state.helpFilter.search = e.target.value;
          saveState();
          renderHelpSection();
          const search=byId('kbSearchInput');
          search.focus();
          search.setSelectionRange(search.value.length,search.value.length);
        });
        canvas.querySelectorAll("[data-kbcat]").forEach(btn => {
          btn.addEventListener("click", () => {
            state.helpFilter.category = btn.dataset.kbcat;
            saveState();
            renderHelpSection();
          });
        });
        canvas.querySelectorAll("[data-kb-open]").forEach(item => {
          item.addEventListener("click", () => {
            const art = KB_ARTICLES.find(a => a.id === item.dataset.kbOpen);
            if (!art) return;
            openModal(
              art.title,
              `
                <div style="margin-bottom:10px;"><span class="role-pill">${esc(art.category)}</span></div>
                <p style="margin:0 0 14px; color:#455A64;">${esc(art.summary)}</p>
                <ol style="margin:0; padding-left:20px; color:#263238; line-height:1.6;">
                  ${art.steps.map(s => `<li style="margin-bottom:8px;">${esc(s)}</li>`).join("")}
                </ol>
              `,
              `<button id="kbCloseBtn" class="btn-blue" type="button">Got It</button>`
            );
            document.getElementById("kbCloseBtn").addEventListener("click", closeModal);
          });
        });
        canvas.querySelectorAll("[data-jump-sec]").forEach(btn => {
          btn.addEventListener("click", () => {
            state.section = btn.dataset.jumpSec;
            state.selectedRentalId = null;
            saveState();
            render();
          });
        });
        document.getElementById("htSubmitBtn").addEventListener("click", () => {
          const subject = document.getElementById("htSubject").value.trim();
          const message = document.getElementById("htMessage").value.trim();
          if (!subject) {
            showToast("Please enter a ticket subject");
            return;
          }
          const newId = "TT-" + Math.floor(42000 + Math.random() * 5000);
          state.helpTickets.unshift({
            id: newId,
            subject,
            category: document.getElementById("htCategory").value,
            priority: "Normal",
            property: document.getElementById("htProperty").value,
            status: "Open",
            createdAt: "Just now",
            message: message || "Submitted via practice support form."
          });
          saveState();
          renderHelpSection();
          showToast(`Practice support ticket ${newId} recorded`);done('workspace-ticket');
        });
        canvas.querySelectorAll("[data-toggle-ticket]").forEach(btn => {
          btn.addEventListener("click", () => {
            const t = state.helpTickets.find(x => x.id === btn.dataset.toggleTicket);
            if (t) {
              t.status = t.status === "Open" ? "Resolved" : "Open";
              saveState();
              renderHelpSection();
              showToast(`Ticket ${t.id} marked ${t.status}`);
            }
          });
        });
      }

      function renderRewardsSection() {
        const canvas = document.getElementById("canvas");
        const refs = state.rewards.referrals;
        const refUrl = practiceLink("referral");
        const totalCredits = refs.reduce((sum, r) => sum + (Number(r.credit) || 0), 0);
        const converted = refs.filter(r => r.status === "Credit Applied").length;
        const pending = refs.filter(r => r.status !== "Credit Applied").length;

        canvas.innerHTML = `
          <div class="rewards-hero">
            <h2>Refer a Property Manager, Earn $100 in Account Credit</h2>
            <p>Share your unique Tenant Turner referral link with fellow property managers. When they activate a paid account, you both receive a $100 billing credit.</p>
            <div class="ref-link-bar">
              <input id="refLinkField" class="ref-link-input" type="text" readonly value="${esc(refUrl)}" />
              <button id="copyRefLinkBtn" class="btn-orange" type="button">COPY REFERRAL LINK</button>
            </div>
          </div>

          <div class="kpi-strip" style="max-width:1160px; margin-bottom:18px;">
            <div class="kpi-box">
              <div class="kpi-label">Total Credits Earned</div>
              <div class="kpi-val" style="color:#2E7D32;">$${totalCredits}</div>
              <div class="kpi-sub">Applied automatically to invoices</div>
            </div>
            <div class="kpi-box">
              <div class="kpi-label">Total Referrals Sent</div>
              <div class="kpi-val">${refs.length}</div>
              <div class="kpi-sub">All-time invites</div>
            </div>
            <div class="kpi-box">
              <div class="kpi-label">Qualified Sign-Ups</div>
              <div class="kpi-val">${converted}</div>
              <div class="kpi-sub">$100 credit unlocked each</div>
            </div>
            <div class="kpi-box">
              <div class="kpi-label">Pending / In Trial</div>
              <div class="kpi-val">${pending}</div>
              <div class="kpi-sub">Awaiting paid activation</div>
            </div>
          </div>

          <div class="rewards-grid">
            <div class="mat-card">
              <h2 class="mat-card-title">Send a Referral Invite</h2>
              <div style="display:flex; flex-direction:column; gap:12px;">
                <div>
                  <label class="field-label" for="refName">Colleague's Name</label>
                  <input id="refName" class="mat-input" type="text" placeholder="e.g., Alex Morgan" />
                </div>
                <div>
                  <label class="field-label" for="refCompany">Company Name</label>
                  <input id="refCompany" class="mat-input" type="text" placeholder="e.g., Summit Property Group" />
                </div>
                <div>
                  <label class="field-label" for="refEmail">Email Address</label>
                  <input id="refEmail" class="mat-input" type="email" placeholder="alex@summitpm.example.com" />
                </div>
                <div>
                  <label class="field-label" for="refNote">Personal Note (Optional)</label>
                  <textarea id="refNote" class="mat-textarea" rows="2" placeholder="We use Tenant Turner to automate our showings and pre-qualifying..."></textarea>
                </div>
                <button id="sendRefInviteBtn" class="btn-blue" type="button">Send Referral Invite</button>
              </div>
            </div>

            <div class="mat-card" style="padding:0; overflow:hidden;">
              <div style="padding:18px 20px 10px;">
                <h2 class="mat-card-title" style="margin:0;">Referral History</h2>
              </div>
              <div style="overflow-x:auto;">
                <table class="tt-table">
                  <thead>
                    <tr>
                      <th>Referred Contact</th>
                      <th>Sent</th>
                      <th>Status</th>
                      <th>Credit</th>
                      <th style="text-align:right;">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${refs.map(r => `
                      <tr>
                        <td>
                          <div style="font-weight:600;">${esc(r.name)}</div>
                          <div style="font-size:12px; color:#607D8B;">${esc(r.company)} · ${esc(r.email)}</div>
                        </td>
                        <td style="white-space:nowrap;">${esc(r.sentDate)}</td>
                        <td>
                          <span class="role-pill ${r.status === "Credit Applied" ? "pm" : (r.status === "Trial Active" ? "" : "vendor")}">${esc(r.status)}</span>
                        </td>
                        <td style="font-weight:700; color:${r.credit > 0 ? "#2E7D32" : "#78909C"};">${r.credit > 0 ? "$" + r.credit : "—"}</td>
                        <td style="text-align:right; white-space:nowrap;">
                          ${r.status !== "Credit Applied"
                            ? `<button class="btn-outline btn-sm" data-conv-ref="${r.id}" type="button">Mark Converted</button>`
                            : `<span style="font-size:12px; color:#78909C;">Applied</span>`
                          }
                        </td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        `;

        document.getElementById("copyRefLinkBtn").addEventListener("click", () => {
          copyToClipboardSafe(refUrl, "Referral link copied to clipboard");
        });

        document.getElementById("sendRefInviteBtn").addEventListener("click", () => {
          const name = document.getElementById("refName").value.trim();
          const company = document.getElementById("refCompany").value.trim();
          const email = document.getElementById("refEmail").value.trim();
          if (!name || !email || !byId('refEmail').checkValidity()) {
            showToast("Enter a fictional name and valid example email");
            return;
          }
          state.rewards.referrals.unshift({
            id: "ref_" + Date.now(),
            name,
            company: company || "Independent PM",
            email,
            sentDate: "Today",
            status: "Invited",
            credit: 0
          });
          saveState();
          renderRewardsSection();
          showToast(`Practice referral recorded for ${name}`);done('workspace-referral');
        });

        canvas.querySelectorAll("[data-conv-ref]").forEach(btn => {
          btn.addEventListener("click", () => {
            const ref = state.rewards.referrals.find(x => x.id === btn.dataset.convRef);
            if (ref) {
              ref.status = "Credit Applied";
              ref.credit = 100;
              saveState();
              renderRewardsSection();
              showToast(`Practice credit applied for ${ref.company}`);
            }
          });
        });
      }

      function openSignOutModal() {
        openModal('Sign Out',`<p>Pause practice as <strong>${esc(state.users.find(user=>user.active)?.name)}</strong>. Your work stays in this browser.</p>`,
          `<button id="soCancelBtn" class="btn-outline" type="button">Cancel</button><button id="soResetBtn" class="btn-outline" type="button">Reset practice data</button><button id="soLockBtn" class="btn-blue" type="button">Sign Out</button>`);
        byId('soCancelBtn').onclick=closeModal;
        byId('soResetBtn').onclick=resetPractice;
        byId('soLockBtn').onclick=()=>{done('workspace-signout');state.signedOut=true;saveState();closeModal();render();};
      }

    return {
      render(section) {
        state=get();
        ({users:renderUsersSection,account:renderAccountSection,help:renderHelpSection,rewards:renderRewardsSection})[section]?.();
      },
      openSignOut() {state=get();openSignOutModal();},
    };
  },
};
