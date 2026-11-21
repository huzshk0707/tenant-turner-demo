'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const {chromium}=require('playwright');
const base=process.env.LEASING_URL || 'http://127.0.0.1:8777/';

(async()=>{
  const browser=await chromium.launch({executablePath:process.env.LEASING_CHROMIUM || undefined});
  try {
    const page=await browser.newPage({viewport:{width:1440,height:900},acceptDownloads:true,permissions:['clipboard-read','clipboard-write'],reducedMotion:'reduce'});
    page.setDefaultTimeout(15000);
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base,{waitUntil:'domcontentloaded'});
    const $=sel=>page.locator(sel);
    const nav=name=>$('#navStack').getByRole('button',{name,exact:true});
    const click=sel=>$(sel).click();
    const fill=(id,value)=>$(`#${id}`).fill(value);
    const pick=(id,value)=>$(`#${id}`).selectOption(value);
    const store=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('tt-practice-v3')));
    const rail=['Rentals','Messages','Viewings','Access','Reports','Users','Account','Help','Rewards','Sign Out'];
    assert.deepEqual((await $('#navStack button').allTextContents()).map(s=>s.trim()),rail);
    for(const item of rail){await nav(item).click();assert.equal(await $('h1').innerText(),item);}
    await nav('Rentals').click();
    assert.equal(await $('.rentals-grid > *').count(),7);
    await click('#syncFab');await fill('import-address','52 Fieldstone Practice Lane');await click('#practice-submit');
    assert.ok((await store()).rentals.find(r=>r.address==='52 Fieldstone Practice Lane').imported);

    const rentalButton=label=>$('.rentals-grid > *').filter({hasText:'24 Wren Lane'}).getByRole('button',{name:new RegExp(`^${label}$`,'i')});
    await rentalButton('Settings').click();
    assert.deepEqual((await $('[data-tab]').allTextContents()).map(s=>s.trim()),['LEADS','OWNER REPORT','AVAILABILITY','SETTINGS']);
    const original=(await store()).rentals.find(r=>r.id==='r1').customTitle;
    await fill('mkTitle','Unsaved practice title');await click('#cancelSettingsBtn');assert.equal(await $('#mkTitle').inputValue(),original);
    await fill('mkTitle','Saved practice title');
    await fill('appFee','70');await click('#add-custom-question');await $('[data-question-label]').first().fill('Can you attend a practice tour?');
    await click('#saveSettingsBtn');
    let r=(await store()).rentals.find(r=>r.id==='r1');assert.equal(r.customTitle,'Saved practice title');assert.equal(r.applicationFee,70);assert.equal(r.qualifying.questions.length,1);console.log('Recorded navigation, import, and save/cancel settings passed');

    await click('[data-tab="availability"]');await click('#addOverrideModalBtn');
    const blocked=await $('#ovDate').inputValue();await click('#ovSaveBtn');
    assert.ok((await store()).rentals.find(r=>r.id==='r1').availability.overrides.some(o=>o.date===blocked && o.type==='block' && o.start===''));
    await click('[data-tab="leads"]');
    async function qualify(first,last,fail){
      await click('#addLeadBtn');await fill('alFirst',first);await fill('alLast',last);await pick('alAction','self_qualify');await click('#alSaveBtn');
      if(fail) await fill('pq-income','500');
      await click('#practice-submit');
    }
    await qualify('Nora','Decline',true);
    assert.equal((await store()).rentals.find(r=>r.id==='r1').leads.find(l=>l.name==='Nora Decline').archived,true);
    assert.ok(!(await $('#canvas').innerText()).includes('Nora Decline'));
    await $('label:has(#show-archived-leads)').click();assert.ok((await $('#canvas').innerText()).includes('Nora Decline'));
    await qualify('Alex','Practice',false);
    await $('#book-date').waitFor();const validDate=await $('#book-date').inputValue();const validTime=await $('#book-time').inputValue();
    await fill('book-date',blocked);await fill('book-time','11:00');await click('#practice-submit');assert.match(await $('#practice-error').innerText(),/blocked/);
    await fill('book-date',validDate);await fill('book-time',validTime);await click('#practice-submit');
    let viewing=(await store()).viewingsList.find(v=>v.leadName==='Alex Practice');assert.equal(viewing.status,'Pending Confirmation');
    await nav('Viewings').click();const row=$('#canvas tr').filter({hasText:'Alex Practice'});
    await row.getByRole('button',{name:'Confirm',exact:true}).click();await row.getByRole('button',{name:'Complete',exact:true}).click();
    await fill('view-comments','Good practice viewing.');await click('#practice-submit');
    viewing=(await store()).viewingsList.find(v=>v.leadName==='Alex Practice');assert.equal(viewing.status,'Viewed');
    const replies=(await store()).messages.find(m=>m.leadName==='Alex Practice').thread;
    assert.ok(replies.some(e=>e.text.includes('#apply/')));console.log('Qualification, archived declines, blocked-date validation, booking, confirmation and follow-up passed');

    await nav('Rentals').click();await rentalButton('Settings').click();await click('[data-tab="owner"]');
    const feedback=$('.fb-item').filter({hasText:'Good practice viewing'});
    await feedback.locator('[data-feedback-detail]').click();await click('#feedback-visibility');
    assert.equal((await store()).rentals.find(r=>r.id==='r1').ownerReport.feedback.find(f=>f.comment==='Good practice viewing.').visible,false);
    await nav('Messages').click();await $('[data-thread-id]').filter({hasText:'Alex Practice'}).click();await fill('msgReplyInput','Sample follow-up reply');await click('#msgSendBtn');
    assert.ok((await store()).messages.find(m=>m.leadName==='Alex Practice').thread.some(e=>e.text==='Sample follow-up reply'));
    console.log('Owner report visibility and practice message reply passed');

    await nav('Access').click();assert.deepEqual((await $('[data-atab]').allTextContents()).map(s=>s.trim()),['CODEBOX','SENTRILOCK','POINTCENTRAL','AUTHORIZED CONTACTS']);
    await $('[data-code-send]').first().click();await fill('code-company','Sample Vendor Co.');await click('#practice-submit');
    assert.match((await store()).accessEvents[0].code,/^SIM-/);await click('#code-done');
    await click('[data-atab="contacts"]');await click('#add-contact');await fill('contact-name','Riley Sample');await click('#practice-submit');
    assert.ok((await store()).contacts.some(c=>c.name==='Riley Sample'));
    await nav('Reports').click();assert.deepEqual((await $('[data-report-tab]').allTextContents()).map(s=>s.trim()),['STANDARD','SCHEDULED']);
    assert.equal(await $('[data-report-id]').count(),12);await click('[data-report-id="codebox_access"]');
    assert.ok((await $('#canvas').innerText()).includes((await store()).accessEvents[0].code));
    for(const [format,magic] of [['csv','Date'],['xlsx','PK'],['pdf','%PDF']]){
      const waiting=page.waitForEvent('download');await click(`[data-export="${format}"]`);const download=await waiting;
      assert.ok(download.suggestedFilename().endsWith('.'+format));
      const bytes=await fs.readFile(await download.path());assert.ok(bytes.subarray(0,160).toString().includes(magic),`${format} export header`);
    }
    await click('[data-report-tab="scheduled"]');await pick('owner-day','Wednesday');await fill('owner-time','10:30');
    await $('label:has(#schedule-0-Weekly)').click();await fill('schedule-email-0','owner@example.com');await click('#save-report-schedule');
    assert.equal((await store()).ownerDelivery.day,'Wednesday');assert.equal((await store()).standardDelivery.rental_activity.Weekly,true);
    console.log('Recorded Access tabs, practice SMS form, contact, report schedule and CSV/Excel/PDF downloads passed');

    await nav('Users').click();await click('#add-user');await fill('team-name','Sage Sample');await fill('team-email','sage@example.com');await click('#practice-submit');
    await nav('Account').click();await fill('profile-name','Sample Leasing Office');await page.getByRole('button',{name:/^Save account$/i}).click();
    await nav('Rewards').click();await click('#add-referral');await fill('ref-name','Practice Company');await fill('ref-email','practice@example.com');await click('#practice-submit');
    await nav('Help').click();await click('#help-tutorial');await click('[data-lesson="rentals"]');
    await $('#practice-guide').waitFor();await click('#syncFab');await fill('import-address','11 Tutorial Road');await click('#practice-submit');
    assert.ok((await store()).guide.completed.includes('rentals'));await click('#practice-guide-hide');assert.equal(await $('#practice-guide').isVisible(),false);
    await nav('Sign Out').click();await click('#practice-exit');await click('#practice-submit');await page.reload({waitUntil:'domcontentloaded'});
    assert.equal(await $('#navStack').isVisible(),false);await click('#practice-exit');
    assert.ok((await store()).users.some(u=>u.name==='Sage Sample'));assert.equal((await store()).profile.name,'Sample Leasing Office');assert.ok((await store()).referrals.length);
    assert.deepEqual(errors,[]);console.log('Users, Account, Rewards, tutorial progress, free practice and sign out persistence passed');

    const phone=await browser.newPage({viewport:{width:390,height:844}});
    await phone.goto(base,{waitUntil:'domcontentloaded'});
    await phone.getByRole('button',{name:'Menu',exact:true}).click();
    assert.deepEqual((await phone.locator('#navStack button').allTextContents()).map(s=>s.trim()),rail);
    await phone.locator('#navStack').getByRole('button',{name:'Reports',exact:true}).click();
    assert.equal(await phone.locator('h1').innerText(),'Reports');
    assert.equal(await phone.evaluate(()=>document.documentElement.scrollWidth),390);console.log('Mobile navigation and report layout passed');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
