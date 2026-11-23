'use strict';

const assert = require('node:assert/strict');
const {chromium} = require('playwright');
const base = process.env.LEASING_URL || 'http://127.0.0.1:8777/';
const storageKey = 'tt-practice-v3';
const start = Date.parse('2030-01-07T16:00:00Z');
const hour = 60 * 60 * 1000;
const readState = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)),storageKey);

async function setTime(page,offsetHours) {
  await page.clock.setFixedTime(new Date(start+offsetHours*hour));
}

(async()=>{
  const browser=await chromium.launch({executablePath:process.env.LEASING_CHROMIUM || undefined});
  try {
    const staff=await browser.newPage();
    await setTime(staff,0);
    await staff.goto(base);
    await staff.locator('[data-open-leads="r1"]').click();
    await staff.locator('[data-lead-view="lead_r1_2"]').click();
    assert.ok(await staff.locator('#ldScheduleBtn').isDisabled());
    assert.match(await staff.locator('.prospect-summary').innerText(),/Staff review required/);
    const held=await staff.evaluate(key=>{
      const state=JSON.parse(localStorage.getItem(key));
      const r=state.rentals.find(rental=>rental.id==='r1');
      const lead=r.leads.find(l=>l.id==='lead_r1_2');
      const v=state.viewingsList.find(row=>row.id==='v2');
      return ['self','person'].map(method=>ReplicaBooking.plan(state,r,{...lead,idReviewed:true,manualOverride:true},v.date,v.time,method,{existing:v.id,confirm:true}).error);
    },storageKey);
    assert.ok(held.every(error=>/Scheduling is on hold/.test(error)));
    assert.equal((await readState(staff)).viewingsList.find(v=>v.id==='v2').status,'Requested');
    await staff.locator('#ldRequestId').click();
    assert.ok(await staff.locator('#ldScheduleBtn').isDisabled());
    await staff.locator('#ldReviewId').click();
    assert.ok(await staff.locator('#ld-id-resolve').isDisabled());
    await staff.locator('#ld-id-ack').check();
    await staff.locator('#ld-id-resolve').click();
    const reviewed = (await readState(staff)).rentals[0].leads.find(l=>l.id==='lead_r1_2');
    assert.equal(reviewed.idReviewed,true);
    assert.equal(reviewed.idRequested,false);
    assert.equal(reviewed.idMetadataWarning,false);
    await staff.locator('#ldScheduleBtn').click();
    assert.equal(await staff.locator('#book-id').count(),0);
    await staff.close();

    const arrival=await browser.newPage();
    await setTime(arrival,0);
    await arrival.goto(base+'#visit/r4/v4');
    const moment=arrival.locator('#arrival-moment');
    const serial=await arrival.locator('#practice-form p strong').innerText();
    const appointment=await moment.inputValue();
    assert.match(await arrival.locator('h1').innerText(),/Practice self-showing/);
    await arrival.locator('#arrival-device').fill('wrong practice device');
    await arrival.locator('#practice-submit').click();
    assert.match(await arrival.locator('#practice-error').innerText(),/does not match/);
    await arrival.locator('#arrival-device').fill(serial);
    await moment.fill(appointment.replace(/T.*/,'T02:00'));
    await arrival.locator('#practice-submit').click();
    assert.match(await arrival.locator('#practice-error').innerText(),/Outside the appointment window/);
    await moment.fill(appointment.replace(/T.*/,'T16:10'));
    await arrival.locator('#practice-submit').click();
    assert.match(await arrival.locator('#visit-code').innerText(),/SIM-/);
    const first=(await readState(arrival)).accessEvents.find(event=>event.viewingId==='v4');
    assert.equal(first.action,'Arrival');
    assert.equal(first.actualArrival-first.scheduledArrival,10*60*1000);
    assert.equal(first.recipient,'Devon Brooks');
    assert.equal((await readState(arrival)).viewingsList.find(row=>row.id==='v4').codeExpiresAt,first.actualArrival+90*60*1000);
    await arrival.locator('#practice-submit').click();
    assert.equal((await readState(arrival)).accessEvents.filter(event=>event.viewingId==='v4').length,1);
    assert.match(await arrival.locator('#visit-code').innerText(),new RegExp(first.code));
    await arrival.close();

    const reschedule=await browser.newPage();
    await setTime(reschedule,0);
    await reschedule.goto(base+'#visit/r4/v4');
    await reschedule.locator('#access-secondary').click();
    const getLead=async()=>(await readState(reschedule)).rentals.find(rental=>rental.id==='r4').leads.find(lead=>lead.name==='Devon Brooks');
    assert.equal((await getLead()).status,'Waiting on Lead');
    assert.equal((await getLead()).followUp.dueAt,start+48*hour);
    assert.equal((await readState(reschedule)).viewingsList.find(row=>row.id==='v4').status,'Reschedule Requested');
    assert.ok((await readState(reschedule)).messages.find(row=>row.leadName==='Devon Brooks').needsReply);
    await setTime(reschedule,47);
    await reschedule.reload();
    assert.equal((await getLead()).followUp.attempts,0);
    for(const [offset,attempts] of [[48,1],[96,2]]) {
      await setTime(reschedule,offset);
      await reschedule.reload();
      assert.equal((await getLead()).followUp.attempts,attempts);
      assert.equal((await getLead()).archived,false);
    }
    await setTime(reschedule,144);
    await reschedule.reload();
    const archived=await getLead();
    assert.equal(archived.status,'Archived');
    assert.equal(archived.archived,true);
    assert.match(archived.notes[0].text,/two unanswered/);
    assert.equal((await readState(reschedule)).viewingsList.find(row=>row.id==='v4').status,'Canceled');
    console.log('Identity holds, deliberate review, prospect check-in, 48-hour follow-up and inactivity archive passed.');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
