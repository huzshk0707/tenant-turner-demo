'use strict';

const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=process.env.LEASING_URL || 'http://127.0.0.1:8777/';

(async()=>{
  const browser=await chromium.launch({executablePath:process.env.LEASING_CHROMIUM || undefined});
  try {
    const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
    const $=selector=>page.locator(selector);
    const click=selector=>$(selector).click();
    const snapshot=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('tt-practice-v3')));
    const rental=async()=>(await snapshot()).rentals.find(item=>item.id==='r1');
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(base,{waitUntil:'domcontentloaded'});
    await $('.prop-card').filter({hasText:'24 Wren Lane'}).getByRole('button',{name:'SETTINGS',exact:true}).click();
    assert.deepEqual(await $('#sec-qualifying [data-history-policy]').evaluateAll(items=>items.map(item=>item.id)),['qBankruptcy','qJudgment','qEviction','qFelony']);
    assert.equal(await $('#qBankruptcy').inputValue(),'older');
    assert.equal(await $('#cqSmoke').count(),0);
    for (const id of ['qJudgment','qEviction','qFelony']) await $(`#${id}`).selectOption('older');
    for (const id of ['cqCredit620','cqOccupants']) await click(`label:has(#${id})`);
    await click('#add-custom-question');
    await $('[data-question-label="0"]').fill('When can you attend?');
    await $('[data-option-label="0:0"]').fill('Weekdays');
    await $('[data-option-label="0:1"]').fill('Unavailable');
    await click('[data-option-add="0"]');
    await $('[data-option-label="0:2"]').fill('weekdays');
    await click('#saveSettingsBtn');
    assert.match(await $('#setting-error').innerText(),/different label/);
    await $('[data-option-label="0:2"]').fill('Weekends');

    const customLink='https://example.com/sample/apply?unit=24&tour=1';
    assert.equal(await $('#sec-fees .currency-input > span').allTextContents().then(items=>items.join('')),'$$');
    await $('#appLink').fill('javascript:alert(1)');
    await click('#saveSettingsBtn');
    assert.match(await $('#setting-error').innerText(),/HTTP or HTTPS/);
    await $('#appLink').fill(customLink);
    await $('#appFee').fill('32.50');
    await click('#saveSettingsBtn');
    assert.equal((await rental()).applicationLink,customLink);
    assert.equal((await rental()).applicationFee,32.5);
    assert.equal((await rental()).qualifying.questions[0].options.length,3);

    const boundaries=await page.evaluate(async()=>{
      const data=JSON.parse(localStorage.getItem('tt-practice-v3'));
      const r=data.rentals.find(item=>item.id==='r1');
      const answers={moveIn:r.dateAvailable,income:r.rent*3,pets:0,bankruptcy:true,judgment:true,eviction:true,felony:true,
        historyDates:{bankruptcy:'2016-11-23',judgment:'2019-11-23',eviction:'2019-11-23',felony:'2021-11-23'},
        questionAnswers:{qCredit620:'Yes',qCredit700:'Yes',qOccupants:'2','custom-0':'Weekends'}};
      const exact=window.ReplicaBooking.screen(r,answers,'2026-11-23');
      const older={...answers,historyDates:{bankruptcy:'2016-11-22',judgment:'2019-11-22',eviction:'2019-11-22',felony:'2021-11-22'}};
      return [exact,window.ReplicaBooking.screen(r,older,'2026-11-23')];
    });
    assert.equal(boundaries[0].length,4);
    assert.deepEqual(boundaries[1],[]);

    await click('[data-tab="leads"]');
    await $('#leadSearchInput').fill('Jordan');
    await $('[data-lead-menu]').first().click();
    await page.getByRole('button',{name:'Open profile',exact:true}).click();
    await click('#ldApplyBtn');
    assert.ok((await snapshot()).messages.find(thread=>thread.id==='msg1').thread.at(-1).text.endsWith(customLink));
    await click('#ldMsgBtn');
    assert.equal(await $('.msg-conv-body a').filter({hasText:customLink}).getAttribute('href'),customLink);
    await page.getByRole('button',{name:'Send Application',exact:true}).click();
    assert.ok((await $('#msgReplyInput').inputValue()).endsWith(customLink));

    await $('#navStack').getByRole('button',{name:'Rentals',exact:true}).click();
    await $('.prop-card').filter({hasText:'24 Wren Lane'}).getByRole('button',{name:'LEADS',exact:true}).click();
    await click('#addLeadBtn');
    await $('#alFirst').fill('Quinn');
    await $('#alLast').fill('Practice Questions');
    await $('#alAction').selectOption('self_qualify');
    await click('#alSaveBtn');
    await click('label:has(#pq-bankruptcy)');
    await $('#pq-bankruptcy-date').fill('2000-01-01');
    await $('#pq-question-qCredit620').selectOption('Yes');
    await $('#pq-question-qCredit700').selectOption('No');
    await $('#pq-question-qOccupants').fill('3');
    await $('#pq-question-custom-0').selectOption('Unavailable');
    await click('#practice-submit');
    const lead=(await rental()).leads.find(candidate=>candidate.name==='Quinn Practice Questions');
    assert.equal(lead.archived,true);
    assert.equal(lead.answers.questionAnswers.qOccupants,'3');
    assert.equal(lead.answers.historyDates.bankruptcy,'2000-01-01');
    assert.match(lead.notes[0].text,/700/);
    assert.match(lead.notes[0].text,/attend/);
    assert.doesNotMatch(lead.notes[0].text,/Bankruptcy/);
    assert.deepEqual(errors,[]);
    console.log('Qualification exceptions, knockout options, occupant responses, fees and saved application links passed.');
  } finally {
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
