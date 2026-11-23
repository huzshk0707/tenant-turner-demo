'use strict';

window.createReplicaWorkflows = api => {
  const {get,el,esc,save,render,toast,modal,close,uid,date,link,defaultRental,addFeedback,openDetail,backFromDetail} = api;
  const engine = window.ReplicaBooking;
  const fmt = (value,chosen) => `<option${String(chosen) === String(value) ? ' selected' : ''}>${esc(value)}</option>`;
  const opt = (key,value,chosen) => `<option value="${esc(key)}"${String(chosen) === String(key) ? ' selected' : ''}>${esc(value)}</option>`;
  const input = (id,label,value='',type='text',attrs='') => `<label class="mat-field"><span class="mat-label">${esc(label)}</span><input id="${id}" class="mat-input" type="${type}" value="${esc(value)}" ${attrs}></label>`;
  const select = (id,label,options) => `<label class="mat-field"><span class="mat-label">${esc(label)}</span><select id="${id}" class="mat-select">${options}</select></label>`;
  const textarea = (id,label,value='') => `<label class="mat-field"><span class="mat-label">${esc(label)}</span><textarea id="${id}" class="mat-textarea" rows="3">${esc(value)}</textarea></label>`;
  const toggle = (id,label,checked=false) => `<label class="mat-switch"><input id="${id}" type="checkbox"${checked ? ' checked' : ''}><span class="switch-track"></span><span>${esc(label)}</span></label>`;
  const val = id => el(id).value.trim();
  const on = id => Boolean(el(id)?.checked);
  const click = (id,fn) => el(id)?.addEventListener('click',fn);
  const validEmail = x => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x);
  const rental = id => get().rentals.find(r => r.id === id);
  const alert = (msg,id='practice-error') => {
    const target=el(id);
    if (target) {target.textContent=msg;target.hidden=false;} else toast(msg);
  };
  const err = '<p id="practice-error" role="alert" class="practice-error" hidden></p>';
  const button = (id,label,kind='btn-blue') => `<button id="${id}" type="button" class="${kind}">${esc(label)}</button>`;
  const footer = label => button('practice-cancel','Cancel','btn-ghost')+button('practice-submit',label);
  function form(title,body,label,fn) {
    modal(title,`<form id="practice-form">${body}${err}<button hidden type="submit">${esc(label)}</button></form>`,footer(label));
    click('practice-cancel',close);
    click('practice-submit',()=>el('practice-form').requestSubmit());
    el('practice-form').addEventListener('submit',event=>{event.preventDefault();fn();});
  }
  function pageForm(title,backLabel,body,label,onSubmit,secondary) {
    openDetail(title,backLabel,()=>{
      el('canvas').innerHTML=`<form id="practice-form" class="practice-form-width access-form">
        <section class="mat-card">${body}${err}</section>
        <div class="practice-actions"><button id="practice-submit" type="submit" class="btn-orange">${esc(label)}</button>
          ${secondary ? button('access-secondary',secondary.label,'btn-flat') : ''}</div>
      </form>`;
      el('practice-form').onsubmit=event=>{event.preventDefault();onSubmit();};
      if(secondary) click('access-secondary',secondary.run);
    });
  }
  function finish(label,event) { save(); close(); render(); toast(label); if (event) done(event); }
  function table(headers,rows,message) {
    return `<div class="table-scroll"><table class="tt-table"><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.length ? rows.map(row=>`<tr>${row.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${headers.length}">${esc(message)}</td></tr>`}</tbody></table></div>`;
  }
  function threadFor(r,lead) {
    let m=get().messages.find(row=>row.rentalId===r.id && (row.leadId ? row.leadId===lead.id : row.leadName===lead.name));
    if (!m) {
      m={id:uid('message'),rentalId:r.id,leadId:lead.id,leadName:lead.name,phone:lead.phone,email:lead.email,channel:'SMS',unread:false,needsReply:false,aiHandled:false,thread:[]};
      get().messages.unshift(m);
    }
    m.leadId=lead.id;m.score=lead.score;
    return m;
  }
  function message(r,lead,text,label='Practice automation') {
    const m=threadFor(r,lead);
    m.updatedAt='Just now';
    m.thread.push({sender:'auto',label,time:'Just now',date:date(),text});
    return m;
  }
  function note(lead,text) { lead.notes.unshift({time:'Just now',at:Date.now(),text,internal:false}); }
  function storeLead(r,l) { if (!r.leads.some(row=>row.id===l.id)) r.leads.unshift(l); }
  function blankLead(r, fields={}) {
    return {id:uid('lead'),name:'Practice prospect',email:'prospect@example.com',phone:'(303) 555-0199',leadType:'Tenant lead',source:'Website',status:'Unscored',score:null,
      moveInDate:r.dateAvailable,monthlyIncome:0,pets:'None',manualOverride:false,createdAt:'Just now',createdDate:date(),notes:[],...fields};
  }
  function invite(r,l) {
    storeLead(r,l);
    startFollowUps(r,l,'invitation');
    const url=link('qualify',r.id,l.id);
    note(l,'Practice pre-qualification invitation recorded.');
    message(r,l,`Complete practice pre-qualification: ${url}`);
    finish('Practice invitation saved in Messages.','lead-invite');
  }
  function qualify(r,l=blankLead(r),{prospect = false, thenBook = false}={}) {
    const q=r.qualifying;
    const today=date();
    const questions=engine.qualificationQuestions(q);
    const history=engine.historyRestrictions.map(({key,label})=>{
      const dateField=engine.historyPolicy(q,key)==='older'
        ? `<div data-history-date="${key}" hidden>${input(`pq-${key}-date`,`Sample ${label.toLowerCase()} date`,'','date',`max="${today}" disabled`)}</div>` : '';
      return `<div>${toggle(`pq-${key}`,`Sample ${label.toLowerCase()} answer is Yes`)}${dateField}</div>`;
    }).join('');
    form(`Pre-qualification — ${r.address}`,`
      <div class="grid-2">${prospect ? input('pq-name','Name',l.name,'text','required') : ''}
        ${input('pq-move','Move-in date',r.dateAvailable || date(10),'date','required')}${input('pq-income','Monthly income',Math.round(r.rent*3),'number','required min="0"')}
        ${input('pq-pets','Number of pets',0,'number','required min="0" max="15"')}${select('pq-type','Pet type',[['cat','Cat'],['small','Small dog'],['large','Large dog']].map(([k,v])=>opt(k,v,'cat')).join(''))}</div>
      <div class="grid-2 practice-grid-gap">${toggle('pq-cosigner','I have a co-signer')}${toggle('pq-voucher','I have a voucher')}${history}</div>
      ${Number(q.minCredit)>0 ? input('pq-credit-score','Sample credit score',720,'number','required min="300" max="850"') : ''}
      ${questions.map(question=>{
        const id=`pq-question-${question.key}`;
        if (question.numeric) return input(id,question.label,1,'number','required min="1"');
        const initial=question.options.find(answer=>!answer.knockout)?.label;
        return select(id,question.label,question.options.map(({label})=>opt(label,label,initial)).join(''));
      }).join('')}`, 'Submit practice answers', () => {
      if (prospect) { const name=val('pq-name');if(!name) return alert('Enter a sample name.');l.name=name; }
      const answers={
        moveIn:val('pq-move'),income:Number(val('pq-income')),pets:Number(val('pq-pets')),petType:val('pq-type'),
        cosigner:on('pq-cosigner'),voucher:on('pq-voucher'),
        ...Object.fromEntries(engine.historyRestrictions.map(({key})=>[key,on(`pq-${key}`)])),
        historyDates:Object.fromEntries(engine.historyRestrictions.filter(({key})=>on(`pq-${key}`) && el(`pq-${key}-date`)).map(({key})=>[key,val(`pq-${key}-date`)])),
        ...(el('pq-credit-score') ? {creditScore:Number(val('pq-credit-score'))} : {}),
        questionAnswers:Object.fromEntries(questions.map(({key})=>[key,val(`pq-question-${key}`)])),
      };
      const reasons=engine.screen(r,answers,today);
      l.answers=answers;l.customResponses=questions.map(({key,label})=>({label,answer:answers.questionAnswers[key]}));
      l.qualifiedOn=reasons.length ? null : date();
      l.score=reasons.length ? 2 : 9;
      l.archived=Boolean(reasons.length);
      l.status=reasons.length ? 'Disqualified' : r.waitlist ? 'Wait List' : 'Pre-Qualified';
      l.moveInDate=answers.moveIn;l.monthlyIncome=answers.income;l.pets=answers.pets ? `${answers.pets} (${answers.petType})`:'None';
      note(l,reasons.length ? reasons.join(' ') : 'Practice pre-qualification completed.');
      storeLead(r,l);
      const outcome=reasons.length ? `Archived: ${reasons.join(' ')}` : r.waitlist ? r.waitlistMessage : 'Pre-qualified. Choose a showing from the available hours.';
      message(r,l,outcome);
      if (!reasons.length && !r.waitlist && (thenBook || prospect)) { save();done('lead-screen',{qualified:true});book(r,l); }
      else {
        if (!reasons.length && !r.waitlist && typeof startFollowUps==='function') startFollowUps(r,l,'Waiting on Lead');
        finish(outcome);done('lead-screen',{qualified:!reasons.length});
      }
    });
    for (const {key} of engine.historyRestrictions) {
      const input=el(`pq-${key}-date`);
      if (!input) continue;
      el(`pq-${key}`).addEventListener('change',()=>{
        const shown=on(`pq-${key}`);
        input.closest('[data-history-date]').hidden=!shown;
        input.disabled=!shown;
        input.required=shown;
      });
    }
  }
  function book(r,l,existing=null) {
    if (engine.identityHold(l)) {
      toast('Scheduling is on hold. Resolve the practice identity review on the lead profile.');
      return;
    }
    const methods=[r.viewing.selfAccess && ['self','Self-Access'],r.viewing.inPerson.enabled && ['person','In-Person']].filter(Boolean);
    if (!methods.length) {toast('Enable a viewing method in Settings first.');return;}
    if (methods.length===1 && methods[0][0]==='self' && r.viewing.requireId && !l.idReviewed) {
      storeLead(r,l);
      finish('Open the lead profile to review the practice ID before booking self-access.');
      return;
    }
    const previous=existing?.method || (existing?.type.startsWith('In-Person') ? 'person' : 'self');
    const preferred=existing && methods.some(([method])=>method===previous) ? previous : methods.find(([method])=>method==='person')?.[0] || methods[0][0];
    const available=engine.firstSlot(get(),r,l,preferred,api.times,existing?.id);
    form(existing ? 'Reschedule showing':'Schedule showing', `<div class="grid-2">${select('book-method','Showing method',methods.map(([key,label])=>opt(key,label,preferred)).join(''))}${input('book-date','Date',existing?.date || available?.date || date(1),'date','required')}${input('book-time','Time',engine.toTime(existing?.time || available?.time || '11:00 AM'),'time','required')}</div>
      ${r.viewing.selfAccess && r.viewing.requireId && !l.idReviewed ? '<p class="practice-note">Review the practice ID on the lead profile to enable self-access.</p>' : ''}`, 'Save showing', () => {
      const method=val('book-method');
      const outcome=engine.plan(get(),r,l,val('book-date'),val('book-time'),method,{existing:existing?.id});
      if (outcome.error) return alert(outcome.error);
      l.status=outcome.status==='Confirmed'?'Scheduled':'Showing requested';
      delete l.followUp;
      storeLead(r,l);
      const v=existing || {id:uid('showing'),rentalId:r.id,leadId:l.id,leadName:l.name,leadPhone:l.phone};
      const start=window.LeasingSchedule.epoch(outcome.date,engine.toTime(outcome.time),outcome.zone);
      const prior=existing && {status:v.status,date:v.date,time:v.time,method:v.method,type:v.type};
      Object.assign(v,outcome,{instructions:method==='self'?r.viewing.instructions:r.viewing.inPerson.instructions,
        reminder:false,confirmBy:outcome.status==='Pending Confirmation'?Math.max(Date.now()+60000,start-2*3600000):null});
      const moved=!prior || prior.date!==v.date || prior.time!==v.time || (prior.method || (prior.type.startsWith('In-Person')?'person':'self'))!==method;
      if (moved || prior?.status==='Reschedule Requested') {
        v.visitVersion=uid('appointment');
        delete v.practiceCode;
        delete v.checkedInAt;
        delete v.checkedInDevice;
        delete v.codeExpiresAt;
      }
      if (!existing) get().viewingsList.push(v);
      note(l,`${outcome.status} showing for ${outcome.date} at ${outcome.time}.`);
      message(r,l,appointmentMessage(r,v));
      if(outcome.status==='Confirmed' && method==='person' && (moved || prior?.status!=='Confirmed')) notifyOccupants(r,l,v);
      finish('Practice showing saved.','showing');
    });
    el('book-method').addEventListener('change',()=>{
      const current=engine.firstSlot(get(),r,l,val('book-method'),api.times,existing?.id);
      if (current) {el('book-date').value=current.date;el('book-time').value=engine.toTime(current.time);}
    });
  }
  function linkedLead(v,r) { return r.leads.find(l=>v.leadId ? l.id===v.leadId : l.name===v.leadName); }
  function scheduledFor(r,l) { return get().viewingsList.find(v=>v.rentalId===r.id && linkedLead(v,r)===l && ['Confirmed','Pending Confirmation','Requested','Reschedule Requested'].includes(v.status)); }
  const codeBoxVisit = v => v.type==='Self-Access (CodeBox)';
  const appointmentUrl = (r,v) => link('visit',r.id,v.id,...(v.visitVersion ? [v.visitVersion] : []));
  function appointmentMessage(r,v) {
    return `Practice showing ${v.status.toLowerCase()}: ${v.date} at ${v.time}.` +
      (v.status==='Confirmed' && codeBoxVisit(v) ? ` Use your appointment link when you arrive: ${appointmentUrl(r,v)}` : '');
  }
  function notifyOccupants(r,l,v) {
    if (!r.viewing.inPerson.notifyOccupants) return;
    note(l,'Practice occupant notice recorded.');
    api.recordNotice?.(r,{type:'Occupant',recipient:'Current occupants',message:`Viewing scheduled for ${v.date} at ${v.time}.`});
  }
  const followUpDelay = 48 * 60 * 60 * 1000;
  function startFollowUps(r,l,kind='booking') {
    l.status='Waiting on Lead';
    l.followUp={kind,attempts:0,dueAt:Date.now()+followUpDelay};
  }
  function sendDueFollowUp(r,l,now) {
    const followUp=l.followUp;
    if (!followUp) return false;
    if (l.archived || l.status!=='Waiting on Lead') {
      delete l.followUp;
      return true;
    }
    if (engine.identityHold(l) || !r.active || r.waitlist || followUp.dueAt>now) return false;
    if (followUp.attempts>=2) {
      l.archived=true;
      l.status='Archived';
      delete l.followUp;
      const pending=scheduledFor(r,l);
      if(pending?.status==='Reschedule Requested') pending.status='Canceled';
      note(l,'Archived for inactivity after two unanswered practice follow-ups.');
      return true;
    }
    followUp.attempts++;
    followUp.dueAt=now+followUpDelay;
    const text=followUp.kind==='reschedule' ? 'Do you still want to reschedule your practice showing? Reply with a time that works for you.'
      : followUp.kind==='invitation' ? `Are you still interested? Complete practice pre-qualification here: ${link('qualify',r.id,l.id)}`
      : 'Are you still interested? Reply for help choosing an available practice showing time.';
    message(r,l,text);
    note(l,`48-hour practice follow-up ${followUp.attempts} recorded.`);
    return true;
  }
  function reminders() {
    const now=Date.now(); let changed=false;
    for (const v of get().viewingsList) {
      const r=rental(v.rentalId); const l=r && linkedLead(v,r);
      if(!l || l.archived) continue;
      if(engine.identityHold(l) && ['Confirmed','Pending Confirmation'].includes(v.status)) {
        v.status='Requested';v.confirmBy=null;
        l.status='Showing requested';
        note(l,'Showing held for practice identity review.');
        changed=true;
        continue;
      }
      if(engine.identityHold(l)) continue;
      if(v.status==='Pending Confirmation' && v.confirmBy && v.confirmBy<=now) {
        requestReschedule(r,l,v,'The practice showing was not confirmed. Reply to choose a different time.');
        changed=true;
        continue;
      }
      if(v.reminder || !['Confirmed','Pending Confirmation'].includes(v.status)) continue;
      const zone=v.zone || 'Mountain';
      const ts=window.LeasingSchedule.epoch(v.date,engine.toTime(v.time),zone);
      if (ts<=now || window.LeasingSchedule.localParts(now,zone).date!==v.date) continue;
      const request=v.status==='Pending Confirmation'?'Please confirm your practice viewing':'Reminder for your practice viewing';
      message(r,l,`${request} on ${v.date} at ${v.time}.`);v.reminder=true;changed=true;
    }
    for(const r of get().rentals) {
      for(const lead of r.leads) if(sendDueFollowUp(r,lead,now)) changed=true;
    }
    if (changed) save();
  }
  function requestReschedule(r,l,v,reply='Choose another time for your practice showing.') {
    v.status='Reschedule Requested';
    v.confirmBy=null;
    startFollowUps(r,l,'reschedule');
    note(l,'Reschedule requested. A practice follow-up is due in 48 hours.');
    message(r,l,reply);
  }
  function openVisit(r,v,version) {
    const lead=linkedLead(v,r);
    if(!lead || !codeBoxVisit(v) || (v.visitVersion || '')!==(version || '')) {
      toast('This practice appointment link has expired.');
      return;
    }
    const device=()=>get().devices.find(d=>d.type==='CodeBox' && d.rentalId===r.id && d.serial===r.serialNumber);
    const appointmentTime=engine.toTime(v.time);
    const accessAllowed=()=>v.status==='Confirmed' && !lead.archived && !engine.identityHold(lead) && r.active && r.viewing.selfAccess &&
       r.viewing.viewingType==='CodeBox' && (!r.viewing.requireId || lead.idReviewed);
    const body=()=>`<div class="practice-note"><strong>Prospect exercise</strong> · Use fictional details.</div>
      <p>${esc(r.address)} · ${esc(v.date)} at ${esc(v.time)} ${esc(v.zone || 'Mountain')}</p>
      <p>${esc(v.instructions || r.viewing.instructions || 'Follow the showing instructions to find the assigned box at the property.')}</p>
      <p>Use the time you arrive and enter the serial visible on the fictional box at the property. Adjust the practice time to try different arrival scenarios.</p>
      <p>Fictional box at the property: <strong>${esc(device()?.serial || 'Unassigned')}</strong></p>
      ${input('arrival-moment','Practice arrival date and time',`${v.date}T${appointmentTime}`,'datetime-local','required')}
      ${input('arrival-device','CodeBox serial','','text','required')}
      <p id="visit-code" class="practice-note" aria-live="polite" hidden></p>`;
    const record=()=>{
      if(!accessAllowed()) return alert('Access is on hold. Contact the practice leasing team about the appointment.');
      const zone=v.zone || 'Mountain';
      const schedule=window.LeasingSchedule;
      const [arrivalDate,arrivalTime]=val('arrival-moment').split('T');
      const scheduledArrival=schedule.epoch(v.date,appointmentTime,zone);
      const actualArrival=schedule.epoch(arrivalDate,arrivalTime,zone);
      const appointmentEnd=scheduledArrival+(v.duration || 30)*60_000;
      if (arrivalDate!==v.date || !Number.isFinite(actualArrival) || actualArrival<scheduledArrival || actualArrival>=appointmentEnd)
        return alert('Outside the appointment window. Contact the practice leasing team.');
      const assigned=device();
      if(!assigned || (v.checkedInDevice && v.checkedInDevice!==assigned.serial) || val('arrival-device').toUpperCase()!==assigned.serial.toUpperCase()) return alert('This box does not match the assigned rental.');
      if(!v.checkedInAt) {
        v.practiceCode=`SIM-${uid('visit').slice(-8).toUpperCase()}`;
        v.checkedInAt=actualArrival;
        v.checkedInDevice=assigned.serial;
        v.codeExpiresAt=Math.min(actualArrival+90*60_000,schedule.epoch(schedule.shiftDate(arrivalDate,1),'00:00',zone));
        get().accessEvents.unshift({id:uid('access'),device:assigned.serial,rentalId:r.id,viewingId:v.id,recipient:lead.name,code:v.practiceCode,
          date:arrivalDate,action:'Arrival',type:'Showing check-in',actualArrival,scheduledArrival,zone});
        message(r,lead,`Practice arrival confirmed. Your code for this visit is ${v.practiceCode}. Return the key and secure the property when you leave.`);
        note(lead,'Practice self-access check-in recorded.');
        save();
      }
      el('practice-error').hidden=true;
      const code=el('visit-code');
      code.hidden=false;
      code.textContent=`Your practice code is ${v.practiceCode}. The example code runs from activation for up to 90 minutes on the appointment date.`;
      if(el('access-secondary')) el('access-secondary').hidden=true;
    };
    if(v.status==='Reschedule Requested') {
      openDetail('Practice self-showing','Back to Leads',()=>{el('canvas').innerHTML='<section class="mat-card"><h2>Reschedule requested</h2><p>The practice leasing team will follow up about a new showing time.</p></section>';});
      return;
    }
    pageForm('Practice self-showing','Back to Leads',body(),'Check in',record,
      accessAllowed() && !v.checkedInAt ? {label:'Request a new time',run:()=>{
        if(!accessAllowed() || v.checkedInAt) return;
        const thread=threadFor(r,lead);
        thread.thread.push({sender:'inbound',label:lead.name,time:'Just now',date:date(),text:'Could I reschedule my practice showing?'});
        thread.unread=true;thread.needsReply=true;
        requestReschedule(r,lead,v,'We received your practice reschedule request.');
        save();openVisit(r,v,version);
      }} : null);
  }
  function showingAction(action,id) {
    const v=get().viewingsList.find(row=>row.id===id);
    const r=v && rental(v.rentalId);if(!r) return;
    const l=linkedLead(v,r);
    if (!l) {toast('Open the rental’s Leads tab to locate the practice prospect.');return;}
    if (action==='edit') {book(r,l,v);return;}
    if (action==='confirm') {
      const method=v.method || (v.type.startsWith('In-Person')?'person':'self');
      const result=engine.plan(get(),r,l,v.date,v.time,method,{existing:v.id,confirm:true});
      if (result.error) {toast(result.error);return;}
      v.status='Confirmed';v.confirmBy=null;l.status='Scheduled';
      delete l.followUp;
      if(method==='person') notifyOccupants(r,l,v);
      note(l,'Practice showing confirmed.');
      message(r,l,appointmentMessage(r,v));
      finish('Showing confirmed.');return;
    }
    if (action==='complete') {
      form('Record viewing feedback',`${select('view-rating','Rating',[1,2,3,4,5].map(x=>fmt(x,5)).join(''))}${textarea('view-comments','Comments')}`,'Complete viewing',()=>{
        v.status='Viewed';l.status='Viewing Completed';delete l.followUp;note(l,'Practice viewing completed.');
        if (val('view-comments')) addFeedback(r,l,Number(val('view-rating')),val('view-comments'),v);
        message(r,l,`Thanks for visiting. Share feedback with the leasing team or open the sample application: ${applicationUrl(r,l)}`);
        finish('Viewing completed and practice follow-up recorded.','complete');
      });return;
    }
    if (action==='no-show') {
      requestReschedule(r,l,v,'You missed the practice showing. Reply to choose a different time.');
      finish('Practice reschedule follow-up queued.');return;
    }
    v.status='Canceled';v.confirmBy=null;
    l.status='Pre-Qualified';delete l.followUp;
    note(l,'Practice showing canceled.');
    message(r,l,'Practice showing canceled. Contact the leasing team to arrange a new time.');
    finish('Showing canceled.');
  }
  function renderShowings() {
    const filters=get().viewingsFilter;
    const upcoming=v=>v.status==='Reschedule Requested' || (v.date>=date() && ['Confirmed','Requested','Pending Confirmation'].includes(v.status));
    const rows=get().viewingsList.filter(v=>(filters.property==='all'||filters.property===v.rentalId) && (filters.type==='all'||v.type.startsWith(filters.type==='self'?'Self-Access':'In-Person')) && (filters.status==='all'||(filters.status==='upcoming'?upcoming(v):!upcoming(v))));
    const availableActions=v=>{
      if (v.status==='Confirmed') return [['complete','Complete'],['no-show','No-show'],['edit','Reschedule'],['cancel','Cancel']];
      if (v.status==='Reschedule Requested') return [['edit','Reschedule'],['cancel','Cancel']];
      if (['Requested','Pending Confirmation'].includes(v.status)) return [['confirm','Confirm'],['edit','Reschedule'],['cancel','Cancel']];
      return [];
    };
    el('canvas').innerHTML=`<div class="practice-width"><div class="filter-bar"><div class="filter-left">${select('show-prop','Property',opt('all','All Rentals',filters.property)+get().rentals.map(r=>opt(r.id,r.address,filters.property)).join(''))}${select('show-type','Showing type',[['all','All types'],['self','Self-Access'],['person','In-Person']].map(([k,v])=>opt(k,v,filters.type)).join(''))}${select('show-status','Viewings',[['upcoming','Upcoming'],['past','Past and closed'],['all','All viewings']].map(([k,v])=>opt(k,v,filters.status)).join(''))}</div>${button('scheduleShowingBtn','+ Schedule Practice Showing')}</div>
      <div class="mat-card practice-table">${table(['Date & Time','Property','Lead','Showing Method','Status','Actions'],rows.map(v=>[`${esc(v.date)}<br>${esc(v.time)}`,esc(rental(v.rentalId)?.address),esc(v.leadName),esc(v.type),esc(v.status),availableActions(v).length ? `<div class="practice-actions">${availableActions(v).map(([k,label])=>`<button class="btn-flat btn-sm" type="button" data-show-action="${k}" data-vid="${esc(v.id)}">${label}</button>`).join('')}</div>`:'—']),'No viewings match these filters.')}</div></div>`;
    for (const [id,key] of [['show-prop','property'],['show-type','type'],['show-status','status']]) el(id).addEventListener('change',()=>{filters[key]=val(id);save();renderShowings();});
    el('canvas').querySelectorAll('[data-show-action]').forEach(btn=>btn.onclick=()=>showingAction(btn.dataset.showAction,btn.dataset.vid));
    click('scheduleShowingBtn',()=>form('Select rental and lead',`${select('pick-rental','Rental',get().rentals.filter(r=>r.active).map(r=>opt(r.id,r.address)).join(''))}${select('pick-lead','Lead','')}`,'Continue to showing',()=>{
      const r=rental(val('pick-rental')); const l=r?.leads.find(lead=>lead.id===val('pick-lead'));
      if (!l) return alert('Choose a qualified lead or review a lead from the rental’s Leads tab.');
      book(r,l,scheduledFor(r,l));
    }));
    // Populate the dependent list immediately when the schedule dialog opens.
    el('scheduleShowingBtn').addEventListener('click',()=>{
      const update=()=>{
        const r=rental(val('pick-rental'));
        const eligible=(r?.leads || []).filter(l=>!l.archived && (l.score>=6 || l.manualOverride));
        el('pick-lead').innerHTML=eligible.length ? eligible.map(l=>opt(l.id,l.name)).join('') : opt('','No qualified practice leads');
      };
      el('pick-rental').addEventListener('change',update);update();
    });
  }

  function deviceEditor(device,model) {
    form(device ? 'Device Settings' : 'Add device',`${input('dev-serial','Practice serial',device?.serial || '', 'text','required maxlength="48"')}
      ${select('dev-type','Type',['CodeBox','SentriLock','PointCentral','Lockbox'].map(v=>fmt(v,device?.type || model)).join(''))}
      ${select('dev-rental','Assigned rental',opt('','Unassigned',device?.rentalId)+get().rentals.map(r=>opt(r.id,r.address,device?.rentalId)).join(''))}`, 'Save device', () => {
      const serial=val('dev-serial');
      if (!serial || get().devices.some(d=>d.id!==device?.id && d.serial.toLowerCase()===serial.toLowerCase())) return alert('Enter a unique practice serial.');
      const row=device || {id:uid('device'),rentalId:'',battery:'Practice device',lastSync:'Not connected'};
      const oldSerial=row.serial;
      const oldRental=rental(row.rentalId);
      if (oldRental && oldRental.serialNumber===oldSerial) oldRental.serialNumber='';
      Object.assign(row,{serial,type:val('dev-type')});
      if (!device) get().devices.push(row);
      api.assign(row.id,val('dev-rental'));
      finish('Practice device saved.','device');
    });
  }
  const codeTypes = ['One-time code','Date access'];
  const phoneNumber = value => value.replace(/\D/g,'').replace(/^1(?=\d{10}$)/,'');
  const validMobile = value => /^[+\d ().-]+$/.test(value) && /^\d{7,15}$/.test(phoneNumber(value));
  const accessZone = () => get().account.timezone?.split(' ')[0] || 'Mountain';
  const accessClock = () => window.LeasingSchedule.localParts(Date.now(),accessZone());
  const practiceCode = () => `SIM-${uid('code').split('-')[1].slice(0,8).toUpperCase()}`;

  function codeTypeOptions(chosen,describeDate = false) {
    return codeTypes.map(type => opt(type,describeDate && type === codeTypes[0] ? 'One-time code · valid on the selected date only' : type,chosen)).join('');
  }
  function issueCode(d,send,draft={}) {
    const today = accessClock().date;
    const tomorrow = window.LeasingSchedule.shiftDate(today,1);
    const fields = `<p class="practice-note">${send ? 'Codes are sent via text message only. This practice send stays in your browser.' : 'Generate a code for a practice visit.'}</p>
      ${input('code-date','Date *',draft.date ?? tomorrow,'date',`required min="${today}"`)}
      ${select('code-type','Code type *',codeTypeOptions(draft.type || codeTypes[0],true))}
      ${send ? input('code-phone','Mobile number *',draft.phone ?? '','tel','required autocomplete="off"') : ''}
      ${input('code-name','Recipient name *',draft.name ?? '','text','required autocomplete="off"')}
      ${input('code-company','Company',draft.company ?? '')}
      ${textarea('code-note','Message',draft.message)}
      ${button('code-sample','Use sample recipient','btn-flat')}`;
    pageForm(`${send ? 'Send' : 'Get'} ${d.type} Code`,'Back to Access',fields,send ? 'Send Code' : 'Get Code',()=>{
      const day = val('code-date');
      const name = val('code-name');
      const phone = send ? val('code-phone') : '';
      if (day < accessClock().date) return alert('Choose a practice date today or later.');
      if (!name) return alert('Enter a practice recipient name.');
      if (send && !validMobile(phone)) return alert('Enter a practice mobile number.');
      const code = practiceCode();
      get().accessEvents.unshift({
        id:uid('access'),device:d.serial,rentalId:d.rentalId,date:day,type:val('code-type'),
        recipient:name,company:val('code-company'),phone,message:val('code-note'),code,
        action:send?'Simulated send':'Generated',
      });
      save();backFromDetail();done('code',{method:send?'Send':'Get'});
      modal(send ? 'Practice text recorded' : 'Practice access code',
        `<p>${send ? `To ${esc(name)} at ${esc(phone)}` : esc(name)} · ${esc(day)}</p><p><strong>${esc(code)}</strong></p>`,
        button('code-done','Done'));
      click('code-done',close);
    },send ? {label:'Just get a code',run:()=>issueCode(d,false,{
      date:val('code-date'),type:val('code-type'),name:val('code-name'),company:val('code-company'),message:val('code-note'),
    })} : null);
    click('code-sample',()=>{
      if (send && !val('code-phone')) el('code-phone').value = '(303) 555-0199';
      if (!val('code-name')) el('code-name').value = 'Practice vendor';
      if (!val('code-company')) el('code-company').value = 'Practice Maintenance';
    });
  }

  function contactHours(contact) {
    return contact?.accessHours || {days:[...api.days],start:'00:00',end:'23:59'};
  }
  function confirmContactRemoval(contact) {
    modal('Remove authorized contact?',`<p>Remove ${esc(contact.name)} from this practice workspace?</p>`,
      button('contact-remove-cancel','Cancel','btn-ghost')+button('contact-remove','Remove'));
    click('contact-remove-cancel',close);
    click('contact-remove',()=>{
      get().contacts = get().contacts.filter(row=>row.id!==contact.id);
      save();close();backFromDetail();toast('Authorized contact removed.');
    });
  }
  function contactEditor(id) {
    const contact = get().contacts.find(row=>row.id===id);
    const hours = contactHours(contact);
    const removeContact = contact ? {label:'Remove contact',run:()=>confirmContactRemoval(contact)} : null;
    pageForm(contact ? 'Edit Authorized Contact' : 'Add Authorized Contact','Back to Authorized Contacts',`
      <h2 class="mat-card-title">Profile</h2>
      ${input('contact-name','Name *',contact?.name || '','text','required')}
      ${input('contact-company','Company',contact?.company || '')}
      ${input('contact-phone','Mobile number *',contact?.phone || '','tel','required')}
      <p class="practice-note">Access codes are sent via text message only.</p>
      <fieldset class="contact-hours">
        <legend>Access</legend>
        ${toggle('contact-recurring','Allow recurring vendor check-in',contact?.access!=='By request')}
        <div id="contact-recurring-fields">
          <fieldset class="contact-days">
            <legend>Access Hours</legend>
            <div class="contact-days-list">${api.days.map(day =>
              `<label><input type="checkbox" name="contact-day" aria-label="${esc(day)}" value="${esc(day)}"${hours.days.includes(day)?' checked':''}>${esc(day.slice(0,3))}</label>`).join('')}
            </div>
          </fieldset>
          <div class="grid-2">${input('contact-start','From *',hours.start,'time')}
            ${input('contact-end','Until *',hours.end,'time')}</div>
          <p class="practice-note">Hours use the workspace time zone (${esc(accessZone())}).</p>
        </div>
        ${select('contact-code','Code type',codeTypeOptions(contact?.codeType || codeTypes[0]))}
      </fieldset>`,'Save contact',()=>{
      const name = val('contact-name');
      const phone = val('contact-phone');
      if (!name || !validMobile(phone)) return alert('Enter a sample contact name and mobile number.');
      if (get().contacts.some(row=>row.id!==contact?.id && phoneNumber(row.phone || '')===phoneNumber(phone))) return alert('A contact already uses that mobile number.');
      const recurring = on('contact-recurring');
      const days = [...el('contact-recurring-fields').querySelectorAll('[name="contact-day"]:checked')].map(field=>field.value);
      const start = val('contact-start');
      const end = val('contact-end');
      if (recurring && (!days.length || !start || !end || start >= end)) return alert('Choose at least one access day and an end time after the start time.');
      const next = {
        id:contact?.id || uid('contact'),name,company:val('contact-company'),phone,
        access:recurring?'Recurring':'By request',accessHours:recurring?{days,start,end}:hours,codeType:val('contact-code'),
      };
      if (contact) Object.assign(contact,next);else get().contacts.push(next);
      get().accessFilters.contactsSearch = '';
      save();backFromDetail();toast('Authorized practice contact saved.');done('contact');
    },removeContact);
    const showHours = () => {el('contact-recurring-fields').hidden = !on('contact-recurring');};
    el('contact-recurring').addEventListener('change',showHours);
    showHours();
  }

  function vendorCheckIn(contact) {
    const {date: today,time} = accessClock();
    const boxes = get().devices.filter(d=>d.type==='CodeBox' && rental(d.rentalId)?.serialNumber===d.serial);
    if (!boxes.length) { toast('Assign a practice CodeBox to a rental first.'); return; }
    form('Practice vendor check-in',`<p>${esc(contact.name)} can request a code by texting the serial on the assigned box.</p>
      ${input('vendor-phone','From mobile number *',contact.phone,'tel','required')}
      ${input('vendor-box','Text the CodeBox serial *','','text','required list="vendor-boxes" autocomplete="off"')}
      <datalist id="vendor-boxes">${boxes.map(d=>`<option value="${esc(d.serial)}">${esc(rental(d.rentalId).address)}</option>`).join('')}</datalist>
      <p class="practice-note">For example, try ${esc(boxes[0].serial)}.</p>
      <div class="grid-2">
        ${input('vendor-date','Practice arrival date *',today,'date','required')}
        ${input('vendor-time','Practice arrival time *',time,'time','required')}
      </div>`,'Simulate vendor text',()=>{
      const phone = val('vendor-phone');
      const box = boxes.find(d=>d.serial.toLowerCase()===val('vendor-box').toLowerCase());
      if (!box || rental(box.rentalId)?.serialNumber!==box.serial) return alert('Enter the serial of an assigned practice CodeBox.');
      if (!validMobile(phone) || phoneNumber(phone)!==phoneNumber(contact.phone) || contact.access==='By request') return alert('That mobile number is not authorized for recurring access.');
      const day = val('vendor-date');
      const arrivalTime = val('vendor-time');
      const zone = accessZone();
      const actualArrival = window.LeasingSchedule.epoch(day,arrivalTime,zone);
      const weekday = api.days[(new Date(`${day}T12:00:00Z`).getUTCDay()+6)%7];
      const hours = contactHours(contact);
      if (!Number.isFinite(actualArrival) || !hours.days.includes(weekday) || arrivalTime<hours.start || arrivalTime>hours.end) {
        return alert('The arrival is outside this contact’s access hours.');
      }
      const code = practiceCode();
      const r = rental(box.rentalId);
      get().accessEvents.unshift({
        id:uid('access'),action:'Arrival',date:day,actualArrival,scheduledArrival:null,zone,
        recipient:contact.name,company:contact.company,contactId:contact.id,phone,
        code,device:box.serial,rentalId:r.id,type:contact.codeType || codeTypes[0],
      });
      const notice = {
        sender:'inbound',label:'Practice access notification',time:`${day} at ${arrivalTime}`,
        text:`${contact.name} arrived at ${r.address} and received an access code.`,
      };
      const messages = get().messages;
      let thread = messages.find(row=>row.contactId===contact.id && row.rentalId===r.id);
      if (!thread) {
        thread = {id:uid('message'),contactId:contact.id,rentalId:r.id,leadId:`vendor:${contact.id}`,
          leadName:contact.name,phone,email:'',channel:'SMS',needsReply:false,aiHandled:false,thread:[]};
        messages.unshift(thread);
      }
      thread.leadName = contact.name;
      thread.phone = phone;
      thread.unread = true;
      thread.updatedAt = 'Just now';
      thread.thread.push(notice);
      save();done('vendor-arrival');
      modal('Vendor text simulation',`<p>Practice reply to ${esc(contact.name)} at ${esc(contact.phone)}</p>
        <p><strong>${esc(code)}</strong> · ${esc(contact.codeType || codeTypes[0])}</p>
        <p class="practice-note">The arrival is recorded in the Lockbox Access Report. Staff can read the notification in Messages.</p>`,
        button('vendor-done','Done'));
      click('vendor-done',close);
    });
  }

  function renderContacts(s) {
    el('canvas').innerHTML=`<div class="filter-bar"><div class="filter-left">
        ${input('search-contacts','Search',s.accessFilters.contactsSearch || '','search', 'placeholder="Name, company or mobile number"')}
      </div></div><div id="practice-contact-results" class="mat-card practice-table"></div>`;
    const draw = () => {
      const query = val('search-contacts').toLowerCase();
      const digits = phoneNumber(query);
      const rows = s.contacts.filter(c=>`${c.name} ${c.company || ''} ${c.phone || ''}`.toLowerCase().includes(query)
        || (digits && /^[\d()+\s-]+$/.test(query) && phoneNumber(c.phone || '').includes(digits)));
      const results = el('practice-contact-results');
      results.innerHTML = table(['Name','Company','Mobile number','Access Hours','Code type','Actions'],rows.map(c=>{
        const hours = contactHours(c);
        const hoursLabel = c.access==='By request' ? 'By request' : `${hours.days.map(d=>d.slice(0,3)).join(', ')} · ${hours.start}–${hours.end}`;
        const actions = `<div class="contact-row-actions"><button class="btn-flat" type="button" data-contact="${esc(c.id)}">Edit</button>
          ${c.access==='By request' ? '' : `<button class="btn-flat" type="button" data-vendor-contact="${esc(c.id)}">Practice check-in</button>`}</div>`;
        return [c.name,c.company,c.phone,hoursLabel,c.codeType || codeTypes[0]].map(esc).concat(actions);
      }),query ? 'No authorized contacts match this search.' : 'No authorized contacts.');
      results.querySelectorAll('[data-contact]').forEach(b=>b.onclick=()=>contactEditor(b.dataset.contact));
      results.querySelectorAll('[data-vendor-contact]').forEach(b=>b.onclick=()=>vendorCheckIn(s.contacts.find(c=>c.id===b.dataset.vendorContact)));
    };
    el('search-contacts').addEventListener('input',()=>{
      s.accessFilters.contactsSearch = el('search-contacts').value;
      save();draw();
    });
    click('add-contact',()=>contactEditor());
    draw();
  }
  function renderAccess() {
    const s=get();const tab=s.accessTab;
    if (tab==='contacts') { renderContacts(s); return; }
    const f=s.accessFilters;
    const results=()=>s.devices.filter(d=>d.type===tab && (!f.search || `${d.serial} ${rental(d.rentalId)?.address || ''}`.toLowerCase().includes(f.search.toLowerCase().trim())) && (d.rentalId ? !f.user || rental(d.rentalId)?.assignee===f.user : f.unassigned));
    const draw=()=>{
      const list=results();
      el('practice-device-list').innerHTML=list.length ? list.map(d=>{
        const battery = Number.parseInt(d.battery,10);
        const status = !d.rentalId ? 'Unassigned' : battery <= 25 ? 'Low battery' : battery <= 80 ? 'Battery check suggested' : 'Assigned';
        const tone = !d.rentalId ? 'off' : battery <= 25 ? 'critical' : battery <= 80 ? 'warn' : '';
        return `<article class="practice-device mat-card">
          <div class="practice-device-label ${d.rentalId?'assigned':''}"><strong>${esc(d.serial)}</strong><small>${esc(rental(d.rentalId)?.address || 'Unassigned')}</small></div>
          <div class="practice-device-body practice-device-actions">
            <span class="status-dot ${tone}" aria-label="${status}" title="${status}" role="img"></span>
            <button class="btn-flat" type="button" data-code-send="${esc(d.id)}">Send</button>
            <button class="btn-flat" type="button" data-code-get="${esc(d.id)}">Get</button>
            <button class="btn-flat" type="button" data-edit-device="${esc(d.id)}">Settings</button>
          </div>
        </article>`;
      }).join('') : '<div class="mat-card">No devices match these filters.</div>';
      const load=id=>s.devices.find(d=>d.id===id);
      el('practice-device-list').querySelectorAll('[data-code-send]').forEach(b=>b.onclick=()=>issueCode(load(b.dataset.codeSend),true));
      el('practice-device-list').querySelectorAll('[data-code-get]').forEach(b=>b.onclick=()=>issueCode(load(b.dataset.codeGet),false));
      el('practice-device-list').querySelectorAll('[data-edit-device]').forEach(b=>b.onclick=()=>deviceEditor(load(b.dataset.editDevice),tab));
    };
    el('canvas').innerHTML=`<div class="filter-bar"><div class="filter-left">${select('access-user','User',opt('','anyone',f.user)+s.users.map(u=>opt(u.name,u.name,f.user)).join(''))}${toggle('access-unassigned','Show unassigned',f.unassigned)}</div>${input('practice-device-search','Search',f.search,'search')}</div><div id="practice-device-list" class="practice-device-grid"></div>`;
    for (const [id,key] of [['access-user','user'],['access-unassigned','unassigned'],['practice-device-search','search']]) el(id).addEventListener(id==='practice-device-search'?'input':'change',()=>{f[key]=key==='unassigned'?on(id):val(id);save();draw();if(key==='unassigned')done('access-filter');});
    click('practice-add-device',()=>deviceEditor(null,tab));draw();
  }
  function scheduledReports(catalog) {
    const s=get(); const owner=s.ownerDelivery;
    const options=['Daily','Weekly','Monthly'];
    el('canvas').innerHTML=`<div class="practice-form-width"><section class="mat-card"><h2 class="mat-card-title">Schedule Owner Reports</h2>
      <div class="grid-2">${select('owner-day','Send day',api.days.map(d=>fmt(d,owner.day)).join(''))}${input('owner-time','Send time',engine.toTime(owner.time),'time','required')}</div></section>
      <section class="mat-card"><h2 class="mat-card-title">Schedule Standard Reports</h2>${catalog.flatMap(group=>group.items).map((item,i)=>{
        const preference=s.standardDelivery[item.id] || {};
        return `<fieldset class="practice-report-setting"><legend>${esc(item.name)}</legend><div class="practice-actions">${options.map(period=>toggle(`schedule-${i}-${period}`,`Receive ${period.toLowerCase()}`,preference[period])).join('')}</div>${input(`schedule-email-${i}`,'Practice recipients',preference.email || '')}</fieldset>`;
      }).join('')}</section>${button('save-report-schedule','Save schedules')}</div>`;
    click('save-report-schedule',()=>{
      if (!val('owner-time')) {toast('Enter an owner report send time.');return;}
      const rows=catalog.flatMap(group=>group.items).map((item,i)=>[item.id,{email:val(`schedule-email-${i}`),...Object.fromEntries(options.map(period=>[period,on(`schedule-${i}-${period}`)]))}]);
      if (rows.some(([,v])=>options.some(period=>v[period]) && (!v.email || !v.email.split(',').map(e=>e.trim()).every(validEmail)))) {toast('Enter valid practice recipients for each enabled report.');return;}
      s.ownerDelivery={day:val('owner-day'),time:val('owner-time')};s.standardDelivery=Object.fromEntries(rows);
      finish('Practice report schedules saved.','schedule-report');
    });
  }
  function reportExports(data,id) {
    const rows=[data.headers,...data.rows];
    el('report-export-tools').innerHTML=[['copy','Copy'],['csv','CSV'],['xlsx','Excel'],['pdf','PDF'],['print','Print']].map(([key,label])=>`<button class="btn-outline btn-sm" type="button" data-export="${key}">${label}</button>`).join('');
    el('report-export-tools').querySelectorAll('[data-export]').forEach(b=>b.onclick=async()=>{
      try {
        if (b.dataset.export==='copy') {await window.LeasingExports.copy(rows);toast('Copied report rows.');}
        else if (b.dataset.export==='print') window.print();
        else window.LeasingExports.download(b.dataset.export,id,data.title,rows);
        done('export',{id});
      } catch {toast('The report could not be exported.');}
    });
  }
  function importRental() {
    form('Sync rentals',`<p>Practice importing a rental or create a manual listing.</p>${select('import-mode','Rental source',[['sync','Sample property management import'],['manual','Add manual rental']].map(([k,v])=>opt(k,v,'sync')).join(''))}
      ${input('import-address','Practice address','29 Willow Bend','text','required')}${input('import-rent','Monthly rent',2150,'number','required min="1"')}${input('import-date','Available for move-in',date(7),'date','required')}`, 'Add practice rental',()=>{
      if (!val('import-address') || get().rentals.some(r=>r.address.toLowerCase()===val('import-address').toLowerCase())) return alert('Enter a new fictional address.');
      const imported=val('import-mode')==='sync';
      get().rentals.unshift(defaultRental(val('import-address'),Number(val('import-rent')),val('import-date'),imported));
      if(imported){get().account.pmsConnected=true;get().account.pmsLastSynced='Just now · practice';}
      finish('Practice rental added.','rental');
    });
  }
  const done = (action,detail) => api.onAction(action,detail);
  function applicationUrl(r,l) {
    const configured=engine.webUrl(r.applicationLink);
    if (configured && configured!==link('apply',r.id)) return configured;
    return l ? link('apply',r.id,l.id) : link('apply',r.id);
  }
  function application(r,l) {
    form(`Practice application — ${r.address}`,`${input('application-name','Name',l?.name || '','text','required')}${input('application-email','Practice email',l?.email || '','email','required')}<p>Application fee ${esc(r.applicationFee ?? get().account.defaultApplicationFee)} · practice only</p>`,'Submit practice application',()=>{
      const lead=l || blankLead(r,{name:val('application-name'),email:val('application-email')});
      lead.name=val('application-name');lead.email=val('application-email');
      lead.status='Applied';lead.archived=false;storeLead(r,lead);note(lead,'Practice application received.');message(r,lead,'Your fictional application was received.');finish('Practice application saved.');
    });
  }
  return {blankLead,invite,qualify,book,scheduledFor,note,threadFor,message,renderShowings,reminders,renderAccess,scheduledReports,reportExports,importRental,done,application,applicationUrl,storeLead,openVisit,appointmentUrl,startFollowUps};
};
