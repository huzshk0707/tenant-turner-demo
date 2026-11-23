'use strict';

const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=process.env.LEASING_URL || 'http://127.0.0.1:8777/';

(async()=>{
  const browser=await chromium.launch({executablePath:process.env.LEASING_CHROMIUM || undefined});
  try {
    const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
    page.setDefaultTimeout(9000);
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(base,{waitUntil:'domcontentloaded'});
    const $=selector=>page.locator(selector);
    await $('button[data-open-settings="r1"]').click();
    await $('#jumpToRentalAvailBtn').click();
    assert.equal(await $('#inline-general-enabled').isChecked(),true);
    await $('#inline-general-agent').selectOption('Casey Nguyen');
    await $('#inline-general-add').click();
    assert.equal(await $('.availability-agent').count(),2);
    assert.ok(await $('[data-general-name="Casey Nguyen"]').getAttribute('open')!==null);
    await $('label:has(#inline-custom-enabled)').click();
    await $('label:has([data-hour-field="repeat"])').first().click();
    const oneTime=$('[data-inline-day=""]').first();
    const date=await page.evaluate(()=>window.ReplicaBooking.dateOffset(4));
    await oneTime.locator('[data-hour-field="date"]').fill(date);
    await oneTime.locator('[data-hour-field="capacity"]').fill('1');
    await $('#ipVisitLimit').selectOption('trip');
    await $('#saveSettingsBtn').click();
    await page.reload({waitUntil:'domcontentloaded'});
    assert.equal(await $('#inline-general-enabled').isChecked(),true);
    assert.equal(await $('#inline-custom-enabled').isChecked(),true);
    assert.equal(await $('.availability-agent').count(),2);
    assert.equal(await $('[data-inline-day=""] [data-hour-field="date"]').inputValue(),date);
    assert.equal(await $('#ipVisitLimit').inputValue(),'trip');
    assert.equal(await $('#ipMaxLeads').isVisible(),true);
    assert.equal(await $('#ipInstr').isVisible(),false);
    await $('details.showing-details').getByText('Optional showing details',{exact:true}).click();
    assert.equal(await $('#ipInstr').isVisible(),true);

    const outcomes=await page.evaluate(()=>{
      const state=JSON.parse(localStorage.getItem('tt-practice-v3'));
      const rental=state.rentals.find(r=>r.id==='r1');
      const booking=window.ReplicaBooking;
      const date='2030-01-08';
      const lead={id:'practice-new',score:10,idReviewed:true,name:'Practice guest'};
      const now=Date.parse('2030-01-07T13:00:00Z');
      const makeBlock=(start,end,extra={})=>({start,end,...extra});
      for(const agent of ['Jamie Taylor','Casey Nguyen']) {
        state.generalAvailability[agent].blockedDates=[];
        state.generalAvailability[agent].weekly.Tuesday={enabled:true,blocks:[makeBlock('09:00','17:00')]};
      }
      Object.assign(rental.availability,{
        mode:'custom',generalEnabled:true,generalAgents:['Jamie Taylor','Casey Nguyen'],
        customHours:{Tuesday:{enabled:true,blocks:[makeBlock('12:00','14:00',{agent:'Casey Nguyen',approval:'Take Requests',capacity:1})]}},
        oneTimeHours:[makeBlock('13:00','13:30',{date,agent:'Jamie Taylor',approval:'Set Appointments'})],overrides:[],
      });
      Object.assign(rental.viewing.inPerson,{enabled:true,durationMinutes:30,advanceNoticeHours:2,maxLeadsPerSlot:3,bufferMinutes:30,requireConfirmation:false});
      Object.assign(rental.viewing.limits,{inPersonVisitLimit:'none',limitUpcoming:false,maxDaysAdvance:7});
      state.viewingsList=[];
      const at=time=>booking.plan(state,rental,lead,date,time,'person',{now});
      const base={morning:at('09:00'),overlap:at('12:00'),oneTime:at('13:00'),after:at('15:00'),crossing:at('11:45'),reportWindows:booking.windows(state,rental,date,'person')};
      state.viewingsList=[{id:'booking',rentalId:rental.id,leadId:'someone-else',agent:'Casey Nguyen',type:'In-Person (Casey Nguyen)',status:'Confirmed',date,time:'12:00',duration:30}];
      const sameSlot=at('12:00');
      rental.viewing.limits.inPersonVisitLimit='showing';
      const limited=at('12:30');
      rental.viewing.limits.inPersonVisitLimit='trip';
      const adjacent=at('12:30');
      const changedAgent=at('13:00');
      const secondTrip=at('14:30');
      rental.viewing.limits.inPersonVisitLimit='none';
      state.viewingsList=[{id:'other-rental',rentalId:'r2',agent:'Casey Nguyen',type:'In-Person (Casey Nguyen)',status:'Confirmed',date,time:'11:30',duration:30}];
      const travel=at('12:00');
      rental.availability.generalEnabled=false;
      const generalDisabled=at('09:00');
      state.viewingsList=[];
      state.generalAvailability['Casey Nguyen'].blockedDates=[{date,start:'12:00',end:'13:00'}];
      const blocked=at('12:00');
      const remaining=at('13:30');
      rental.availability.mode='general';
      const selfAccess=booking.plan(state,rental,lead,date,'12:00','self',{now});
      return {...base,sameSlot,limited,adjacent,changedAgent,secondTrip,travel,generalDisabled,blocked,remaining,selfAccess};
    });
    assert.equal(outcomes.morning.agent,'Jamie Taylor');
    assert.equal(outcomes.overlap.agent,'Casey Nguyen');
    assert.equal(outcomes.overlap.status,'Requested');
    assert.equal(outcomes.oneTime.agent,'Jamie Taylor');
    assert.equal(outcomes.oneTime.status,'Confirmed');
    assert.equal(outcomes.after.agent,'Jamie Taylor');
    assert.match(outcomes.crossing.error,/available hours/);
    assert.match(outcomes.sameSlot.error,/full/);
    assert.match(outcomes.limited.error,/one in-person showing/);
    assert.equal(outcomes.adjacent.agent,'Casey Nguyen');
    assert.match(outcomes.changedAgent.error,/same agent/);
    assert.match(outcomes.secondTrip.error,/daily trip/);
    assert.match(outcomes.travel.error,/travel buffer/);
    assert.match(outcomes.generalDisabled.error,/available hours/);
    assert.ok(outcomes.blocked.error);
    assert.equal(outcomes.remaining.agent,'Casey Nguyen');
    assert.equal(outcomes.selfAccess.method,'self');
    assert.ok(outcomes.reportWindows.some(row=>row.source==='Rental one-time' && row.start==='13:00' && row.end==='13:30'));

    await page.evaluate(()=>{
      const data=JSON.parse(localStorage.getItem('tt-practice-v3'));
      const r=data.rentals.find(r=>r.id==='r1');
      delete r.availability.generalEnabled;
      delete r.availability.oneTimeHours;
      delete r.viewing.limits.inPersonVisitLimit;
      Object.assign(r.viewing.limits,{limitPerDay:true,maxPerDay:3});
      Object.assign(r.viewing.inPerson,{clusterShowings:true,allowGroupShowings:false,maxLeadsPerSlot:3});
      localStorage.setItem('tt-practice-v3',JSON.stringify(data));
    });
    await page.reload({waitUntil:'domcontentloaded'});
    assert.equal(await $('#inline-general-enabled').isChecked(),false);
    assert.equal(await $('#inline-custom-enabled').isChecked(),true);
    assert.equal(await $('#ipVisitLimit').inputValue(),'trip');
    assert.equal(await $('#ipMaxLeads').inputValue(),'1');
    assert.deepEqual(errors,[]);
    console.log('Availability editing, legacy migration, overlapping scopes, blackout-aware planning, per-block capacity/approval, visit limits, and travel buffers passed');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
