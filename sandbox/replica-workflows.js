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
  function message(r,lead,text,label='Practice automation') {
    let m=get().messages.find(row=>row.rentalId===r.id && (row.leadId ? row.leadId===lead.id : row.leadName===lead.name));
    if (!m) {
      m={id:uid('message'),rentalId:r.id,leadId:lead.id,leadName:lead.name,phone:lead.phone,email:lead.email,channel:'SMS',unread:false,needsReply:false,aiHandled:true,thread:[]};
      get().messages.unshift(m);
    }
    m.leadId=lead.id; m.updatedAt='Just now';m.score=lead.score;
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
    const url=link('qualify',r.id,l.id);
    note(l,'Practice pre-qualification invitation recorded.');
    message(r,l,`Complete practice pre-qualification: ${url}`);
    finish('Practice invitation saved in Messages.','lead-invite');
  }
  function qualify(r,l=blankLead(r),{prospect = false, thenBook = false}={}) {
    const q=r.qualifying;
    form(`Pre-qualification — ${r.address}`,`
      <div class="grid-2">${prospect ? input('pq-name','Name',l.name,'text','required') : ''}
        ${input('pq-move','Move-in date',r.dateAvailable || date(10),'date','required')}${input('pq-income','Monthly income',Math.round(r.rent*3),'number','required min="0"')}
        ${input('pq-pets','Number of pets',0,'number','required min="0" max="15"')}${select('pq-type','Pet type',[['cat','Cat'],['small','Small dog'],['large','Large dog']].map(([k,v])=>opt(k,v,'cat')).join(''))}</div>
      <div class="grid-2 practice-grid-gap">${toggle('pq-cosigner','I have a co-signer')}${toggle('pq-voucher','I have a voucher')}${toggle('pq-bankruptcy','Sample bankruptcy answer is Yes')}${toggle('pq-judgment','Sample civil judgment answer is Yes')}${toggle('pq-eviction','Sample eviction answer is Yes')}${toggle('pq-felony','Sample criminal-history answer is Yes')}${input('pq-credit-score','Sample credit score',720,'number','required min="300" max="850"')}${toggle('pq-smoking','Sample smoking answer is Yes')}</div>
      ${(q.questions || []).map((question,i)=>select(`pq-custom-${i}`,question.label,['Yes','No'].map(x=>fmt(x,'Yes')).join(''))).join('')}`, 'Submit practice answers', () => {
      if (prospect) { const name=val('pq-name');if(!name) return alert('Enter a sample name.');l.name=name; }
      const answers={moveIn:val('pq-move'),income:Number(val('pq-income')),pets:Number(val('pq-pets')),petType:val('pq-type'),cosigner:on('pq-cosigner'),voucher:on('pq-voucher'),bankruptcy:on('pq-bankruptcy'),judgment:on('pq-judgment'),eviction:on('pq-eviction'),felony:on('pq-felony'),creditScore:Number(val('pq-credit-score')),smoking:on('pq-smoking'),custom:(q.questions || []).map((_,i)=>val(`pq-custom-${i}`))};
      const reasons=engine.screen(r,answers);
      l.answers=answers;l.customResponses=(q.questions || []).map((item,i)=>({label:item.label,answer:answers.custom[i]}));
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
      else { finish(outcome);done('lead-screen',{qualified:!reasons.length}); }
    });
  }
  function book(r,l,existing=null) {
    const methods=[r.viewing.selfAccess && ['self','Self-Access'],r.viewing.inPerson.enabled && ['person','In-Person']].filter(Boolean);
    if (!methods.length) {toast('Enable a viewing method in Settings first.');return;}
    const getMethod = row => row?.method || (row?.type.startsWith('In-Person') ? 'person' : 'self');
    const preferred=existing ? getMethod(existing) : methods.find(([m])=>m==='person')?.[0] || methods[0][0];
    const available=engine.firstSlot(get(),r,l,preferred,api.times,existing?.id);
    form(existing ? 'Reschedule showing':'Schedule showing', `<div class="grid-2">${select('book-method','Showing method',methods.map(([key,label])=>opt(key,label,preferred)).join(''))}${input('book-date','Date',existing?.date || available?.date || date(1),'date','required')}${input('book-time','Time',engine.toTime(existing?.time || available?.time || '11:00 AM'),'time','required')}</div>
      ${(r.viewing.requireId || l.idRequested) ? toggle('book-id',l.idRequested?'Replacement practice ID reviewed':'Practice ID reviewed',l.idReviewed) : ''}<p class="practice-note">Calendar, access and messages use fictional data.</p>`, 'Save showing', () => {
      const method=val('book-method');
      const reviewed=l.idReviewed || on('book-id');
      const outcome=engine.plan(get(),r,{...l,idReviewed:reviewed},val('book-date'),val('book-time'),method,{existing:existing?.id});
      if (outcome.error) return alert(outcome.error);
      l.idReviewed=reviewed;if(reviewed) l.idRequested=false;l.status=outcome.status==='Confirmed'?'Scheduled':'Showing requested';
      storeLead(r,l);
      const v=existing || {id:uid('showing'),rentalId:r.id,leadId:l.id,leadName:l.name,leadPhone:l.phone};
      const start=window.LeasingSchedule.epoch(outcome.date,engine.toTime(outcome.time),outcome.zone);
      Object.assign(v,outcome,{reminder:false,confirmBy:outcome.status==='Pending Confirmation'?Math.max(Date.now()+60000,start-2*3600000):null});
      if (!existing) get().viewingsList.push(v);
      note(l,`${outcome.status} showing for ${outcome.date} at ${outcome.time}.`);
      message(r,l,`Practice showing ${outcome.status.toLowerCase()}: ${outcome.date} at ${outcome.time}.`);
      delete v.practiceCode;
      if(outcome.status==='Confirmed' && method==='person' && r.viewing.inPerson.notifyOccupants) note(l,'Practice occupant notice recorded.');
      finish('Practice showing saved.','showing');
    });
    const suggestSlot=()=>{
      const current=engine.firstSlot(get(),r,{...l,idReviewed:l.idReviewed || on('book-id')},val('book-method'),api.times,existing?.id);
      if (current) {el('book-date').value=current.date;el('book-time').value=engine.toTime(current.time);}
    };
    el('book-method').addEventListener('change',suggestSlot);
    el('book-id')?.addEventListener('change',suggestSlot);
  }
  function linkedLead(v,r) { return r.leads.find(l=>v.leadId ? l.id===v.leadId : l.name===v.leadName); }
  function scheduledFor(r,l) { return get().viewingsList.find(v=>v.rentalId===r.id && (v.leadId ? v.leadId===l.id : v.leadName===l.name) && ['Confirmed','Pending Confirmation','Requested'].includes(v.status)); }
  function reminders() {
    const now=Date.now(); let changed=false;
    for (const v of get().viewingsList) {
      const r=rental(v.rentalId); const l=r && linkedLead(v,r);
      if(v.status==='Pending Confirmation' && v.confirmBy && v.confirmBy<=now && l) {
        v.status='Canceled';l.status='Pre-Qualified';message(r,l,'Practice showing canceled because it was not confirmed.');changed=true;continue;
      }
      const ts=window.LeasingSchedule.epoch(v.date,engine.toTime(v.time),v.zone || 'Mountain');
      if (v.reminder || !['Confirmed','Pending Confirmation'].includes(v.status) || ts<=now || ts-now>86400000) continue;
      if (!l) continue;
      message(r,l,`Reminder for your practice viewing on ${v.date} at ${v.time}.`);v.reminder=true;changed=true;
    }
    if (changed) save();
  }
  function practiceArrival(r,l,v) {
    const device=get().devices.find(d=>d.type==='CodeBox' && d.rentalId===r.id && d.serial===r.serialNumber);
    const body=`<p>${esc(r.address)} · ${esc(v.date)} at ${esc(v.time)}</p>
      <p>This exercise moves the practice clock to the appointment. The fictional box at the door is <strong>${esc(device?.serial || 'unassigned')}</strong>.</p>
      ${select('arrival-time','Arrival',['At the confirmed appointment','Outside the permitted hours'].map(x=>fmt(x,'At the confirmed appointment')).join(''))}
      ${input('arrival-device','Box shown at the door','','text','required')}`;
    form('Practice CodeBox arrival',body,'Check in',()=>{
      if(v.status!=='Confirmed' || !r.active || !r.viewing.selfAccess || r.viewing.viewingType!=='CodeBox' || l.archived || l.idRequested || (r.viewing.requireId && !l.idReviewed))
        return alert('Access held. Review the appointment, rental and ID before checking in.');
      if(val('arrival-time')!=='At the confirmed appointment') return alert('Outside the appointment window. Contact the leasing office.');
      if(!device || val('arrival-device')!==device.serial) return alert('This box does not match the assigned rental.');
      if(!v.practiceCode) {
        v.practiceCode='SIM-'+uid('visit').slice(-8).toUpperCase();
        message(r,l,`Practice arrival confirmed. Your code for this visit is ${v.practiceCode}. Return the key and secure the property when you leave.`);
        note(l,'Practice self-access check-in recorded.');save();
      }
      modal('Practice check-in',`<p>Code for this visit: <strong>${esc(v.practiceCode)}</strong></p><p>The recording describes a code for the appointment date with 90 minutes of access after activation. This practice code opens no lock.</p>`,button('arrival-done','Done'));
      click('arrival-done',()=>{close();render();});
    });
  }
  function showingAction(action,id) {
    const v=get().viewingsList.find(row=>row.id===id);
    const r=v && rental(v.rentalId);if(!r) return;
    const l=linkedLead(v,r) || blankLead(r,{name:v.leadName,phone:v.leadPhone,manualOverride:true,idReviewed:true});
    if (action==='arrival') {practiceArrival(r,l,v);return;}
    if (action==='edit') {book(r,l,v);return;}
    if (action==='confirm') {
      const method=v.method || (v.type.startsWith('In-Person')?'person':'self');
      const result=engine.plan(get(),r,l,v.date,v.time,method,{existing:v.id,confirm:true});
      if (result.error) {toast(result.error);return;}
      v.status='Confirmed';v.confirmBy=null;l.status='Scheduled';if(method==='person' && r.viewing.inPerson.notifyOccupants) note(l,'Practice occupant notice recorded.');storeLead(r,l);message(r,l,'Practice showing confirmed.');finish('Showing confirmed.');return;
    }
    if (action==='complete') {
      form('Record viewing feedback',`${select('view-rating','Rating',[1,2,3,4,5].map(x=>fmt(x,5)).join(''))}${textarea('view-comments','Comments')}`,'Complete viewing',()=>{
        v.status='Viewed';l.status='Viewed';storeLead(r,l);note(l,'Practice viewing completed.');
        if (val('view-comments')) addFeedback(r,l,Number(val('view-rating')),val('view-comments'));
        message(r,l,`Thanks for visiting. Share feedback with the leasing team or open the sample application: ${link('apply',r.id,l.id)}`);
        finish('Viewing completed and practice follow-up recorded.','complete');
      });return;
    }
    v.status=action==='no-show'?'No-show':'Canceled';
    l.status='Pre-Qualified';storeLead(r,l);note(l,`Practice showing marked ${v.status}.`);
    message(r,l,`Practice showing ${v.status.toLowerCase()}. Contact the leasing team to reschedule.`);
    finish(`Showing ${v.status.toLowerCase()}.`);
  }
  function renderShowings() {
    const filters=get().viewingsFilter;
    const rows=get().viewingsList.filter(v=>(filters.property==='all'||filters.property===v.rentalId) && (filters.type==='all'||v.type.startsWith(filters.type==='self'?'Self-Access':'In-Person')) && (filters.status==='all'||(filters.status==='upcoming'?v.date>=date() && ['Confirmed','Requested','Pending Confirmation'].includes(v.status):v.date<date() || !['Confirmed','Requested','Pending Confirmation'].includes(v.status))));
    el('canvas').innerHTML=`<div class="practice-width"><div class="filter-bar"><div class="filter-left">${select('show-prop','Property',opt('all','All Rentals',filters.property)+get().rentals.map(r=>opt(r.id,r.address,filters.property)).join(''))}${select('show-type','Showing type',[['all','All types'],['self','Self-Access'],['person','In-Person']].map(([k,v])=>opt(k,v,filters.type)).join(''))}${select('show-status','Viewings',[['upcoming','Upcoming'],['past','Past and closed'],['all','All viewings']].map(([k,v])=>opt(k,v,filters.status)).join(''))}</div>${button('scheduleShowingBtn','+ Schedule Practice Showing')}</div>
      <div class="mat-card practice-table">${table(['Date & Time','Property','Lead','Showing Method','Status','Actions'],rows.map(v=>[`${esc(v.date)}<br>${esc(v.time)}`,esc(rental(v.rentalId)?.address),esc(v.leadName),esc(v.type),esc(v.status),['Confirmed','Requested','Pending Confirmation'].includes(v.status) ? `<div class="practice-actions">${(v.status==='Confirmed'?[...(v.type==='Self-Access (CodeBox)' ? [['arrival','Practice arrival']] : []),['complete','Complete'],['no-show','No-show']]:[['confirm','Confirm']]).concat([['edit','Reschedule'],['cancel','Cancel']]).map(([k,label])=>`<button class="btn-flat btn-sm" type="button" data-show-action="${k}" data-vid="${esc(v.id)}">${label}</button>`).join('')}</div>`:'—']),'No viewings match these filters.')}</div></div>`;
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
  function issueCode(d,send,draft={}) {
    pageForm(`${send ? 'Send' : 'Get'} ${d.type} Code`,'Back to Access',`${input('code-date','Date',draft.date ?? date(1),'date','required')}${select('code-type','Code type',['One-time code','Date access'].map(v=>fmt(v,draft.type || 'One-time code')).join(''))}
      ${send ? input('code-phone','Mobile phone','(303) 555-0199','tel','required') : ''}${input('code-name','Name',draft.name ?? 'Practice vendor','text','required')}${input('code-company','Company',draft.company ?? 'Practice Maintenance')}${textarea('code-note','Message',draft.message)}`,send ? 'Send Code' : 'Get Code',()=>{
      if (val('code-date')<date()) return alert('Choose a practice date today or later.');
      const code=`SIM-${uid('code').split('-')[1].slice(0,6).toUpperCase()}`;
      get().accessEvents.unshift({id:uid('access'),device:d.serial,rentalId:d.rentalId,date:val('code-date'),type:val('code-type'),recipient:val('code-name'),company:val('code-company'),phone:send?val('code-phone'):'',message:val('code-note'),code,action:send?'Simulated send':'Generated'});
      const day=val('code-date');
      save();backFromDetail();done('code',{method:send?'Send':'Get'});
      modal('Practice access code',`<p><strong>${esc(code)}</strong> for ${esc(day)}.</p><p>This code is recorded in the Lockbox Access Report.</p>`,button('code-done','Done'));
      click('code-done',close);
    },send ? {label:'Just get a code',run:()=>issueCode(d,false,{date:val('code-date'),type:val('code-type'),name:val('code-name'),company:val('code-company'),message:val('code-note')})} : null);
  }
  function contactEditor(id) {
    const c=get().contacts.find(row=>row.id===id);
    pageForm(c?'Edit Authorized Contact':'Add Authorized Contact','Back to Authorized Contacts',`<h2 class="mat-card-title">Profile</h2>${input('contact-name','Name',c?.name || '','text','required')}${input('contact-company','Company',c?.company || '')}${input('contact-phone','Mobile phone',c?.phone || '(303) 555-0199','tel','required')}${input('contact-email','Email',c?.email || '','email')}${select('contact-access','Access level',['Recurring','By request'].map(x=>fmt(x,c?.access || 'Recurring')).join(''))}`,'Save contact',()=>{
      if (!val('contact-name') || !val('contact-phone')) return alert('Enter a sample contact name and phone.');
      const row={id:c?.id || uid('contact'),name:val('contact-name'),company:val('contact-company'),phone:val('contact-phone'),email:val('contact-email'),access:val('contact-access')};
      if (c) Object.assign(c,row);else get().contacts.push(row);
      save();backFromDetail();toast('Authorized practice contact saved.');done('contact');
    });
  }
  function remove(label,callback) {
    form(label,'<p>Remove this fictional record from your practice workspace?</p>','Remove',callback);
  }
  function renderAccess() {
    const s=get();const tab=s.accessTab;
    if (tab==='contacts') {
      el('canvas').innerHTML=`<div class="mat-card practice-table">${table(['Name','Company','Mobile phone','Email','Access','Actions'],s.contacts.map(c=>[c.name,c.company,c.phone,c.email,c.access].map(esc).concat(`<button class="btn-flat" data-contact="${esc(c.id)}">Edit</button><button class="btn-danger-flat" data-remove-contact="${esc(c.id)}">Remove</button>`)),'No authorized contacts.')}</div>`;
      click('add-contact',()=>contactEditor());
      el('canvas').querySelectorAll('[data-contact]').forEach(b=>b.onclick=()=>contactEditor(b.dataset.contact));
      el('canvas').querySelectorAll('[data-remove-contact]').forEach(b=>b.onclick=()=>remove('Remove contact?',()=>{s.contacts=s.contacts.filter(c=>c.id!==b.dataset.removeContact);finish('Contact removed.');}));
      return;
    }
    const f=s.accessFilters;
    const results=()=>s.devices.filter(d=>d.type===tab && (!f.search || `${d.serial} ${rental(d.rentalId)?.address || ''}`.toLowerCase().includes(f.search.toLowerCase().trim())) && (d.rentalId ? !f.user || rental(d.rentalId)?.assignee===f.user : f.unassigned));
    const draw=()=>{
      const list=results();
      el('practice-device-list').innerHTML=list.length ? list.map(d=>`<article class="practice-device mat-card"><div class="practice-device-label ${d.rentalId?'assigned':''}"><strong>${esc(d.serial)}</strong><small>${esc(rental(d.rentalId)?.address || 'Unassigned')}</small></div><div class="practice-device-body"><p>${esc(d.battery || 'Practice device')}</p><div class="practice-actions"><span class="status-dot ${d.rentalId?'':'off'}" aria-label="${d.rentalId?'Assigned':'Unassigned'}" role="img"></span><button class="btn-flat" data-code-send="${esc(d.id)}">Send</button><button class="btn-flat" data-code-get="${esc(d.id)}">Get</button><button class="btn-flat" data-edit-device="${esc(d.id)}">Settings</button></div></div></article>`).join('') : '<div class="mat-card">No devices match these filters.</div>';
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
  function application(r,l) {
    form(`Practice application — ${r.address}`,`${input('application-name','Name',l?.name || '','text','required')}${input('application-email','Practice email',l?.email || '','email','required')}<p>Application fee ${esc(r.applicationFee ?? get().account.defaultApplicationFee)} · practice only</p>`,'Submit practice application',()=>{
      const lead=l || blankLead(r,{name:val('application-name'),email:val('application-email')});
      lead.name=val('application-name');lead.email=val('application-email');
      lead.status='Applied';lead.archived=false;storeLead(r,lead);note(lead,'Practice application received.');message(r,lead,'Your fictional application was received.');finish('Practice application saved.');
    });
  }
  return {blankLead,invite,qualify,book,scheduledFor,note,message,renderShowings,reminders,renderAccess,scheduledReports,reportExports,importRental,done,application,storeLead};
};
