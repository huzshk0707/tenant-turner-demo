# Leasing Lab practice sandbox

Leasing Lab uses its own design and keeps the recorded sidebar order and the rental tabs **Leads → Owner Report → Availability → Settings**. Sample properties, people and codes are fictional. Practice messages, calendar settings, access codes and report delivery preferences are stored in this browser.

Choose **Tutorial** in the header for 11 chapters in recording order, a guided self-viewing exercise and an extra chapter for the supplied workspace screens. **Show me where** opens the screen and highlights the relevant control. Perform the action to advance the checklist. Chapters link the matching screenshot and video timestamp where available. **Free Practice** hides the guide and pauses checklist tracking while you use the same workspace. Progress resumes when you switch back. **Account → Reset practice data** restores the fictional portfolio and clears tutorial progress.

- **Rentals** has a sample sync and manual rental entry. The descriptive title and source fields on imported rentals are read-only. Use **Custom Title** for a local title and open a photo to browse the gallery. **Save Rental Settings** applies your changes.
- **Leads** opens with the qualification and activity queue. Failed screening goes to **Show archived**. Identity warnings appear on the rental card and lead queue. Practice inquiries and reschedule requests receive follow-ups, and unanswered leads can be archived automatically.
- **Rental Settings → Viewing** lets you edit several agents’ General Availability and set repeating or one-time rental hours. Rental-specific hours take precedence during overlaps. Use **Save Rental Settings** to apply changes. **Viewings** handles confirmations, rescheduling, no-shows and feedback.
- **Rental Settings → Application & Fees** can use the default practice application link or a saved web address. Application messages use the saved link. **Owner Report** shows weekly timing and opens a dated feedback row for visibility controls. Edit the shared schedule under **Reports → Scheduled**.
- **Reports** has sorting, pagination and Copy, CSV, Excel, PDF and Print. Lockbox Access shows completed prospect and vendor check-ins. **Access** keeps CodeBox, SentriLock, PointCentral and Authorized Contacts in order. Set a recurring vendor’s access hours and code type, then run a fictional check-in to see the staff alert.
- **Users, Account, Help, Rewards and Sign Out** use the supplied screens for team roles, defaults, support tickets, referral credits and pausing the practice session. The extra tutorial chapter covers these screens using the supplied HTML as its reference.

Calendar connection switches, mail, SMS, application submission, identity review, lockbox access and report delivery are simulations. Reminder and expiry checks run while the workspace is used or when it reopens. Standard scheduled report settings are saved as preferences.

The earlier Leasing Lab remains available at `legacy.html` with its own browser data. The newer supplied HTML app retains the previous practice records, with a fresh checklist for the new set of chapters.

## Run and verify locally

```sh
python3 -m http.server 8777 --directory sandbox
node tools/check-replica.cjs
```

The browser check covers navigation order, sample sync, rental settings, screening and booking, feedback, messages, codes and contacts, report schedules and exports, workspace screens, and switching modes. It checks that lesson steps persist, archived screenshot references exist, and the guide fits on a phone. Install Playwright and set `LEASING_CHROMIUM` to use a system Chromium. Set `LEASING_URL` for another server. `tools/check-sandbox.cjs` checks the legacy app.

## GitHub Pages

The site serves `gh-pages` at `https://huzshk0707.github.io/tenant-turner-demo/`. Publish the contents of `sandbox/` to the root of `gh-pages`, retaining `.nojekyll`. Main also contains the annotated recording and screenshot index.

The fictional listings use illustrative photos. [Photo credits](sandbox/assets/photo-credits.txt)

## Practice a self-viewing and review a prospect

Choose **Tutorial → Self-viewings, scams and automatic replies**. Follow a listing inquiry through screening, a possible fraud flag, an appointment and a staff reply. In Free Practice, open **24 Wren Lane → Leads → Priya Nair** for the recorded profile layout with a fictional ID warning, prior viewing code and feedback form. **Jordan Ellis** demonstrates a completed tour with feedback. Opening a linked feedback date on Owner Report takes you to that prospect. The back arrow returns to the report or queue you came from.

Open the prospect appointment link from **Messages** or a confirmed CodeBox viewing on the prospect’s profile. The prospect exercise uses a practice arrival time and the fictional serial on the assigned box. Try the wrong box or a time outside the appointment window, then check in at the appointment. A successful check-in records one SIM code in the viewing, Messages and Lockbox Access. [Recording at 05:38](https://vimeo.com/688083346#t=05m38s) · [CodeBox renter help](https://help.tenantturner.com/articles/480991-help-for-renters-codebox-lockbox)

Tenant Turner describes an automatic invitation after a listing inquiry, qualification, a calendar invitation, a confirmation request and showing instructions. The presenter also describes a post-tour feedback request and application link. Someone asking you to pay a deposit after a tour may be impersonating the manager. Verify the listing and payment instructions with management using independently obtained contact details. Having access to a home proves nothing about who can rent it to you. [Listing inquiry workflow](https://help.tenantturner.com/what-happens-when-a-lead-inquires-through-an-online-listing) · [Recording at 03:28](https://vimeo.com/688083346#t=03m28s)

For open-ended questions, Tenant Turner also offers an AI Virtual Agent. Coverage depends on the leasing office’s setup. In this sandbox, automated events and manually sent messages appear together in the thread. Use the fictional parking question to practice answering as staff. [Tenant Turner AI Virtual Agent](https://tenantturner.com/ai-virtual-agent/)
