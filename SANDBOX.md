# Leasing Lab practice sandbox

The GitHub Pages app uses the supplied HTML layout and styling. It keeps the recorded left sidebar sequence and the rental tabs **Leads → Owner Report → Availability → Settings**. Sample properties, people and codes are fictional. Practice messages, calendar settings, access codes and report delivery preferences are stored in this browser.

Open the blue helper button or select **Help → Tutorial** to choose a lesson. Lessons point to controls and link the recorded screens where available. Close the guide or choose **Free practice** to remove the hints. **Account → Reset practice data** restores the fictional portfolio and clears tutorial progress.

- **Rentals** has a sample sync and manual rental entry. Imported fields remain locked on Rental Settings. Editable settings commit with **Save Rental Settings** and revert with **Cancel**.
- **Leads** supports a practice invitation, the prospect questionnaire, manual review and booking. Failed screening goes to **Show archived**. Wait-listed leads can receive a simulated reopening message.
- **Availability and Viewings** support team hours, rental hours, blackout dates, special date overrides, booking limits, confirmations, rescheduling, no-shows and completed viewing feedback.
- **Messages and Owner Report** show practice replies, confirmations and follow-up. A dated feedback entry opens visibility controls. Scheduled report preferences sit under **Reports → Scheduled**.
- **Reports** offers the twelve report areas from the recording and Copy, CSV, Excel, PDF and Print. **Access** keeps CodeBox, SentriLock, PointCentral, and Authorized Contacts in order. Send and Get generate fictional `SIM-` codes that appear in the Lockbox Access Report.
- **Users, Account, Rewards and Sign Out** include practice operations in the supplied shell. The recording shows their tab names. It does not demonstrate the screens inside them.

Practice links point back to this GitHub Pages app. Calendar connection switches, mail, SMS, application submission, identity review, lockbox access and report delivery are simulations. Reminder and expiry checks run while the workspace is used or when it reopens. Standard scheduled report settings are saved as preferences.

The earlier Leasing Lab remains available at `legacy.html`. It uses its previous browser storage, so its existing saved records are available there. The supplied HTML build uses a separate fictional dataset.

## Run and verify locally

```sh
python3 -m http.server 8777 --directory sandbox
node tools/check-replica.cjs
```

The browser check covers navigation order, sample sync, save and cancel, screening, blocked-date validation, booking, confirmation, feedback, messages, code and contact entry, report schedules and exports, persistence, and the phone menu. Install Playwright and set `LEASING_CHROMIUM` to use a system Chromium. Set `LEASING_URL` for another server. `tools/check-sandbox.cjs` checks the legacy app.

## GitHub Pages

The site serves `gh-pages` at `https://huzshk0707.github.io/tenant-turner-demo/`. Publish the contents of `sandbox/` to the root of `gh-pages`, retaining `.nojekyll`. Main also contains the annotated recording and screenshot index.

The fictional listings use illustrative photos. [Photo credits](sandbox/assets/photo-credits.txt)
