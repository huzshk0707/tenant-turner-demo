'use strict';

const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const base = process.env.LEASING_URL || 'http://127.0.0.1:8777/';

(async () => {
  const browser = await chromium.launch({executablePath:process.env.LEASING_CHROMIUM || undefined});
  try {
    const page = await browser.newPage({viewport:{width:1440,height:900}});
    page.setDefaultTimeout(7500);
    const errors = [];
    page.on('pageerror',error => errors.push(error.message));
    await page.goto(base,{waitUntil:'domcontentloaded'});
    await page.clock.setFixedTime(new Date('2030-01-07T17:00:00Z'));
    const at = id => page.locator(`#${id}`);
    const select = selector => page.locator(selector);
    const nav = label => select('#navStack').getByRole('button',{name:label,exact:true});
    const load = () => page.evaluate(() => JSON.parse(localStorage.getItem('tt-practice-v3')));

    await nav('Access').click();
    const card = select('.practice-device').first();
    const actions = await card.locator('.practice-device-actions > *').evaluateAll(controls =>
      controls.map(control => Math.round(control.getBoundingClientRect().top + control.getBoundingClientRect().height / 2)));
    assert.equal(new Set(actions).size,1);
    await card.locator('[data-code-send]').click();
    assert.equal(await at('code-phone').inputValue(),'');
    assert.equal(await at('code-name').inputValue(),'');
    assert.match(await select('main').innerText(),/codes are sent via text message only/i);
    assert.match(await at('code-type').locator('option').first().innerText(),/selected date only/);
    await at('code-sample').click();
    await at('code-phone').fill('abc123');
    await at('practice-submit').click();
    assert.match(await at('practice-error').innerText(),/practice mobile number/i);
    await at('code-phone').fill('(303) 555-0120');
    await at('practice-submit').click();
    const staffCode = (await load()).accessEvents[0];
    assert.equal(staffCode.action,'Simulated send');
    assert.match(staffCode.code,/^SIM-/);
    await at('code-done').click();

    await select('[data-atab="contacts"]').click();
    await at('search-contacts').fill('3035550169');
    assert.match(await at('practice-contact-results').innerText(),/Morgan Ellis/);
    await at('search-contacts').fill('no contact expected');
    assert.match(await at('practice-contact-results').innerText(),/no authorized contacts match/i);
    await at('search-contacts').clear();

    await at('add-contact').click();
    await at('contact-name').fill('Casey Practice Vendor');
    await at('contact-company').fill('Sample Turnover');
    await at('contact-phone').fill('(303) 555-0118');
    await at('contact-code').selectOption('Date access');
    await at('contact-start').fill('09:00');
    await at('contact-end').fill('11:30');
    for (const day of ['Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']) {
      await select(`[name="contact-day"][value="${day}"]`).uncheck();
    }
    await at('practice-submit').click();
    const contact = (await load()).contacts.find(row=>row.name==='Casey Practice Vendor');
    assert.deepEqual(contact.accessHours,{days:['Monday'],start:'09:00',end:'11:30'});
    assert.equal(contact.codeType,'Date access');

    await select(`[data-vendor-contact="${contact.id}"]`).click();
    await at('vendor-box').fill('WRONG-PRACTICE-BOX');
    await at('practice-submit').click();
    assert.match(await at('practice-error').innerText(),/assigned practice CodeBox/);
    await at('vendor-box').fill('LAB-CB-482910');
    await at('vendor-phone').fill('(303) 555-0117');
    await at('practice-submit').click();
    assert.match(await at('practice-error').innerText(),/not authorized/);
    await at('vendor-phone').fill('+1 (303) 555-0118');
    await at('vendor-date').fill('2030-01-08');
    await at('practice-submit').click();
    assert.match(await at('practice-error').innerText(),/outside.*access hours/);
    await at('vendor-date').fill('2030-01-07');
    await at('vendor-time').fill('08:30');
    await at('practice-submit').click();
    assert.match(await at('practice-error').innerText(),/outside.*access hours/);
    assert.equal((await load()).accessEvents.length,1);

    await at('vendor-time').fill('10:00');
    await at('practice-submit').click();
    const saved = await load();
    const arrival = saved.accessEvents[0];
    assert.equal(arrival.action,'Arrival');
    assert.equal(arrival.device,'LAB-CB-482910');
    assert.equal(arrival.actualArrival,Date.parse('2030-01-07T17:00:00Z'));
    assert.equal(arrival.scheduledArrival,null);
    assert.equal(arrival.type,'Date access');
    assert.match(arrival.code,/^SIM-/);
    assert.notEqual(arrival.code,staffCode.code);
    await at('vendor-done').click();
    await nav('Messages').click();
    await select('[data-thread-id]').filter({hasText:'Casey Practice Vendor'}).click();
    assert.match(await at('msgConvBody').innerText(),/Casey Practice Vendor arrived at 24 Wren Lane/);

    await nav('Access').click();
    await select('[data-atab="contacts"]').click();
    await select(`[data-contact="${contact.id}"]`).click();
    await at('contact-recurring').uncheck({force:true});
    await at('practice-submit').click();
    assert.equal(await select(`[data-vendor-contact="${contact.id}"]`).count(),0);
    await select(`[data-contact="${contact.id}"]`).click();
    await at('access-secondary').click();
    await at('contact-remove').click();
    const remaining = await load();
    assert.ok(!remaining.contacts.some(row=>row.id===contact.id));
    assert.equal(remaining.accessEvents[0].id,arrival.id);
    assert.deepEqual(errors,[]);
    console.log('CodeBox sends, authorized contact search, access hours, vendor arrivals, staff alerts and contact removal passed');
  } finally {
    await browser.close();
  }
})().catch(error => {console.error(error);process.exitCode=1;});
