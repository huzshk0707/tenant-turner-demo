'use strict';

window.ReplicaBooking = (() => {
  const {localParts,shiftDate,epoch} = window.LeasingSchedule;
  const days = window.LeasingData.days;
  const minute = 60_000;
  const dateOffset = (offset = 0, zone = 'Mountain') => shiftDate(localParts(Date.now(),zone).date,offset);
  const toTime = value => {
    const match = /^(\d{1,2}):(\d{2}) (AM|PM)$/.exec(String(value));
    if (!match) return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(value)) ? value : '';
    return `${String(Number(match[1]) % 12 + (match[3] === 'PM' ? 12 : 0)).padStart(2,'0')}:${match[2]}`;
  };
  const overlaps = (a,b,c,d) => a < d && b > c;
  const historyRestrictions = [
    {key:'bankruptcy',id:'qBankruptcy',label:'Bankruptcy',years:10},
    {key:'judgment',id:'qJudgment',label:'Filed civil judgment',years:7},
    {key:'eviction',id:'qEviction',label:'Eviction',years:7},
    {key:'felony',id:'qFelony',label:'Felony against people or property',years:5},
  ];
  const creditChoices = [{label:'Yes',knockout:false},{label:'No',knockout:true}];
  const builtInQuestions = [
    {key:'qCredit620',settingId:'cqCredit620',label:'Is your credit score over 620?',options:creditChoices,credit:620},
    {key:'qOccupants',settingId:'cqOccupants',label:'How many occupants will be in the home?',numeric:true},
    {key:'qCredit700',settingId:'cqCredit',label:'Is your credit score over 700?',options:creditChoices,credit:700},
    {key:'qNoSmoking',settingId:'cqSmoke',label:'Will anyone on this practice application smoke in the rental?',options:[{label:'Yes',knockout:true},{label:'No',knockout:false}],legacy:true},
  ];

  function historyPolicy(settings,key) {
    const configured=settings.historyPolicies?.[key];
    if (configured) return configured;
    const legacy=`reject${key[0].toUpperCase()}${key.slice(1)}`;
    return settings[legacy] ? 'reject' : 'allow';
  }

  function questionChoices(question) {
    return question.options || [
      {label:'Yes',knockout:question.answer==='No'},
      {label:'No',knockout:question.answer!=='No'},
    ];
  }

  function qualificationQuestions(settings) {
    return [
      ...builtInQuestions.filter(rule=>settings[rule.key]),
      ...(settings.questions || []).map((question,index)=>({key:`custom-${index}`,label:question.label,options:questionChoices(question),index})),
    ];
  }

  function webUrl(value) {
    const input=String(value || '').trim();
    if (!/^https?:\/\//i.test(input) || /\s/.test(input)) return '';
    try {
      const url=new URL(input);
      return url.username || url.password ? '' : input;
    } catch {
      return '';
    }
  }
  const identityHold = lead => Boolean(lead.idMetadataWarning || lead.idRequested);

  const canShow = (state,agent) => state.users.some(user=>user.name===agent && user.active && user.canShow!==false);
  const primaryAgent = rental => rental.viewing.inPerson.showingAgent && rental.viewing.inPerson.showingAgent !== 'Any Available Agent'
    ? rental.viewing.inPerson.showingAgent : rental.assignee;

  function generalAgents(state,rental) {
    const configured=rental.availability.generalAgents;
    const defaults=rental.viewing.inPerson.showingAgent==='Any Available Agent' ? Object.keys(state.generalAvailability) : [primaryAgent(rental)];
    return (configured || defaults).filter(name=>state.generalAvailability[name] && canShow(state,name));
  }

  function subtractHours(rows, overlays) {
    return overlays.reduce((remaining,overlay)=>remaining.flatMap(row=>{
      if (!overlaps(row.start,row.end,overlay.start,overlay.end)) return [row];
      return [
        ...(row.start < overlay.start ? [{...row,end:overlay.start}] : []),
        ...(row.end > overlay.end ? [{...row,start:overlay.end}] : []),
      ];
    }),rows);
  }

  function windows(state,rental,date,method) {
    const self=method==='self';
    const config=rental.availability;
    const primary=self ? rental.assignee : primaryAgent(rental);
    const day=days[(new Date(`${date}T12:00:00Z`).getUTCDay()+6)%7];
    const normalize=(block,source,agent)=>({...block,start:toTime(block.start),end:toTime(block.end),agent,source});
    const usable=block=>block.start && block.end && block.start < block.end && (self || canShow(state,block.agent));
    const override=(config.overrides || []).filter(block=>block.date===date);
    const opens=override.filter(block=>block.type==='open')
      .map(block=>normalize(block,'Date override',self ? primary : block.agent || primary)).filter(usable);
    const recurring=config.customHours?.[day];
    const rentalHours=!self && config.mode==='custom' && recurring?.enabled
      ? recurring.blocks.map(block=>normalize(block,'Rental weekly',block.agent || primary)).filter(usable) : [];
    const oneTime=!self && config.mode==='custom' ? (config.oneTimeHours || []).filter(block=>block.date===date)
      .map(block=>normalize(block,'Rental one-time',block.agent || primary)).filter(usable) : [];
    const useGeneral=self || (config.generalEnabled ?? config.mode!=='custom');
    const general=useGeneral ? (self ? [primary] : generalAgents(state,rental)).flatMap(agent=>{
      const settings=state.generalAvailability[agent];
      if (!settings) return [];
      const rules=settings.weekly?.[day];
      const blocks=self ? [{start:settings.selfAccessStart,end:settings.selfAccessEnd}] : rules?.enabled ? rules.blocks : [];
      return blocks.map(block=>normalize(block,self ? 'Daily self-access' : 'General',agent)).filter(usable);
    }) : [];
    const combined=opens.length ? opens : [...oneTime,...subtractHours(rentalHours,oneTime),...subtractHours(general,[...rentalHours,...oneTime])];
    const rentalBlackouts=override.filter(block=>block.type==='block');
    return combined.flatMap(row=>{
      const agentBlackouts=(state.generalAvailability[row.agent]?.blockedDates || []).filter(block=>block.date===date);
      const closed=[...rentalBlackouts,...agentBlackouts];
      if (closed.some(block=>block.allDay || !block.start || !block.end)) return [];
      const hours=closed.map(block=>({start:toTime(block.start),end:toTime(block.end)}));
      return subtractHours([row],hours);
    }).sort((a,b)=>a.start.localeCompare(b.start));
  }

  function plan(state,rental,lead,date,time,method,options={}) {
    if (identityHold(lead)) return {error:'Scheduling is on hold. Resolve the practice identity review on the lead profile.'};
    const self=method==='self';
    const primary=self ? rental.assignee : primaryAgent(rental);
    const duration=Number(self ? 30 : rental.viewing.inPerson.durationMinutes) || 30;
    const blocks=windows(state,rental,date,method);
    const localTime=toTime(time);
    const availableAgents=[...new Set(blocks.filter(block=>localTime>=block.start && localTime<block.end).map(block=>block.agent))];
    const booked=options.confirm && state.viewingsList.find(v=>v.id===options.existing)?.agent;
    const agents=booked ? [booked] : availableAgents.length ? availableAgents : [primary];
    let failure;
    for(const agent of agents) {
      const result=planForAgent(state,rental,lead,date,time,method,agent,blocks,duration,options);
      if(!result.error) return result;
      failure ??=result;
    }
    return failure;
  }

  function planForAgent(state,rental,lead,date,time,method,agent,blocks,duration,{existing = '', confirm = false, now = Date.now()}) {
    const ip = rental.viewing.inPerson;
    const limits = rental.viewing.limits;
    const self = method === 'self';
    const availability = state.generalAvailability[agent];
    const zone = availability?.timezone?.split(' ')[0] || 'Mountain';
    const today = localParts(now,zone).date;
    const start = epoch(date,toTime(time),zone);
    const end = start + duration * minute;
    const fail = error => ({error});
    if (!rental.active) return fail('This rental is inactive.');
    if (rental.waitlist) return fail('Turn off the wait list in Settings before booking a showing.');
    if ((!lead.manualOverride && (lead.score === null || lead.score < 6)) || lead.archived) return fail('Review pre-qualification before booking, or record a manual override.');
    if (!self && !canShow(state,agent)) return fail('Choose an active showing agent in Viewing settings.');
    if (!(self ? rental.viewing.selfAccess : ip.enabled)) return fail('This viewing method is off for this rental.');
    if (self && rental.viewing.requireId && !lead.idReviewed) return fail('Review the practice ID on the lead profile before scheduling self-access.');
    if (!Number.isFinite(start) || start <= now) return fail('Choose a valid future showing time.');
    const notice = self ? (parseInt(limits.selfAccessAdvanceNotice,10) || 0) * (limits.selfAccessAdvanceNotice.includes('hour') ? 60 : 1) : Number(ip.advanceNoticeHours) * 60;
    if (!confirm && start - now < notice * minute) return fail(`Choose a showing with at least ${notice} minutes’ notice.`);
    if (date > shiftDate(today,Number(limits.maxDaysAdvance) || 7)) return fail('That date is outside the maximum advance booking window.');
    const override = rental.availability.overrides?.filter(o => o.date === date) || [];
    if (override.some(o => o.type === 'block' && (!o.start || overlaps(start,end,epoch(date,toTime(o.start),zone),epoch(date,toTime(o.end),zone))))) return fail('This rental is blocked at that time.');
    if (availability?.blockedDates?.some(b => b.date === date && (b.allDay || overlaps(start,end,epoch(date,toTime(b.start),zone),epoch(date,toTime(b.end),zone))))) return fail('The showing agent is unavailable at that time.');
    const block=blocks.find(b => b.agent===agent && start >= epoch(date,b.start,zone) && end <= epoch(date,b.end,zone));
    if (!block) return fail('The showing must fit within available hours.');
    const active = state.viewingsList.filter(v => v.id !== existing && ['Confirmed','Pending Confirmation','Requested'].includes(v.status) && v.date >= today);
    const atRental = active.filter(v => v.rentalId === rental.id);
    const sameLead = atRental.filter(v => v.leadId ? v.leadId === lead.id : v.leadName === lead.name);
    if (limits.limitUpcoming && atRental.length >= Number(limits.maxUpcoming)) return fail('The rental has reached its upcoming showing limit.');
    const sameDay = atRental.filter(v => v.date === date);
    if (limits.limitPerDay && (self || limits.legacyInPersonCap) && sameDay.length >= Number(limits.maxPerDay)) return fail('The rental has reached its daily showing limit.');
    if (limits.preventDuplicates && sameLead.length) return fail('This lead already has an active showing. Use Reschedule for the existing appointment.');
    if (limits.minDaysBetweenEnabled && sameLead.some(v => Math.abs(Date.parse(v.date)-Date.parse(date)) < Number(limits.minDaysBetween)*86400000)) return fail('The lead’s showings are too close together.');
    const bookingStart = v => epoch(v.date,toTime(v.time),v.zone || zone);
    const bookingEnd = v => bookingStart(v) + (v.duration || 30)*minute;
    const collisions = sameDay.filter(v => overlaps(start,end,bookingStart(v),bookingEnd(v)));
    const capacity=self || ip.allowGroupShowings===false ? 1 : Math.min(Number(ip.maxLeadsPerSlot) || 1,Number(block.capacity) || Infinity);
    if (collisions.length && (collisions.length >= capacity || collisions.some(v => !v.type.startsWith('In-Person') || bookingStart(v) !== start))) return fail('That viewing slot is full or overlaps another showing.');
    if (!self) {
      const showings=sameDay.filter(v=>v.type.startsWith('In-Person'));
      const limit=limits.inPersonVisitLimit || (ip.clusterShowings ? 'trip' : 'none');
      if (limit==='showing' && showings.length) return fail('This rental allows one in-person showing per day.');
      if (limit==='trip' && showings.length && (
        showings.some(v=>(v.agent || v.type.slice(11,-1))!==agent)
        || !showings.some(v=>start===bookingStart(v) || start===bookingEnd(v) || end===bookingStart(v))
      )) return fail('Choose an adjacent showing with the same agent for this rental’s daily trip.');
    }
    if (!self && active.some(v => {
      if (v.rentalId === rental.id || !v.type.startsWith('In-Person') || (v.agent || v.type.slice(11,-1)) !== agent) return false;
      const buffer = Math.max(Number(ip.bufferMinutes) || 0,v.buffer || 0)*minute;
      return overlaps(start,end,bookingStart(v)-buffer,bookingEnd(v)+buffer);
    })) return fail('This showing conflicts with the agent’s travel buffer.');
    const approval = block.approval || (self ? rental.viewing.viewingApproval : '');
    const status = ['Take Requests','Require Manual Approval'].includes(approval) ? 'Requested' : !self && ip.requireConfirmation ? 'Pending Confirmation' : 'Confirmed';
    return {date,time,method,agent,zone,duration,buffer:self ? 0 : Number(ip.bufferMinutes) || 0,status,
      type:self ? `Self-Access (${rental.viewing.viewingType})` : `In-Person (${agent})`};
  }

  function firstSlot(state,rental,lead,method,times,existing = '') {
    if (identityHold(lead) || (method==='self' && rental.viewing.requireId && !lead.idReviewed)) return null;
    const start = dateOffset();
    for (let offset=0; offset<=Number(rental.viewing.limits.maxDaysAdvance || 7); offset++) {
      const date=shiftDate(start,offset);
      for (const time of times) {
        const row=plan(state,rental,lead,date,time,method,{existing});
        if (!row.error) return row;
      }
    }
    return null;
  }

  function screen(rental,answers,today=dateOffset()) {
    const q=rental.qualifying;
    const reasons=[];
    const reject=(when,label)=>{ if (when) reasons.push(label); };
    reject(q.reqMoveIn && answers.moveIn > shiftDate(rental.dateAvailable,Number(q.moveInDays)), 'Move-in date is outside the allowed window.');
    reject(q.reqIncome && answers.income < rental.rent*Number(q.incomeRatio) && !(q.allowCosigner && answers.cosigner) && !(q.allowVouchers && answers.voucher), 'Income does not meet the required rent ratio.');
    reject(answers.voucher && !q.allowVouchers,'This practice rule does not allow the selected voucher.');
    reject(answers.pets && (!q.allowPets || answers.pets>q.maxPets),'The number of pets exceeds the practice limit.');
    reject(answers.pets && ((answers.petType==='cat' && !q.allowCats) || (answers.petType==='small' && !q.allowSmallDogs) || (answers.petType==='large' && !q.allowLargeDogs)),'The selected pet type does not meet the practice rule.');
    for (const {key,label,years} of historyRestrictions) {
      if (!answers[key]) continue;
      const policy=historyPolicy(q,key);
      if (policy==='allow') continue;
      const cutoff=new Date(`${today}T00:00:00Z`);
      cutoff.setUTCFullYear(cutoff.getUTCFullYear()-years);
      const eventDate=answers.historyDates?.[key] || '';
      const timestamp=Date.parse(eventDate);
      const isOld=Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0,10)===eventDate && timestamp<cutoff.getTime();
      reject(policy!=='older' || !isOld,policy==='older'
        ? `${label}: The sample event must be more than ${years} years old.`
        : `${label}: The sample event does not meet this rule.`);
    }
    const minimumCredit=Number(q.minCredit) || 0;
    reject(minimumCredit && (!Number.isFinite(answers.creditScore) || answers.creditScore<minimumCredit),'The sample credit answer does not meet the required minimum.');
    for (const rule of qualificationQuestions(q)) {
      if (rule.numeric) continue;
      let answer=answers.questionAnswers?.[rule.key];
      if (answer===undefined && rule.credit && Number.isFinite(answers.creditScore)) answer=answers.creditScore>rule.credit?'Yes':'No';
      if (answer===undefined && rule.legacy && typeof answers.smoking==='boolean') answer=answers.smoking?'Yes':'No';
      if (answer===undefined && rule.index!==undefined) answer=answers.custom?.[rule.index];
      const choice=rule.options.find(option=>option.label===answer);
      reject(!choice || choice.knockout,`Custom question did not qualify: ${rule.label}`);
    }
    return reasons;
  }

  return {dateOffset,toTime,generalAgents,windows,plan,firstSlot,screen,historyRestrictions,historyPolicy,builtInQuestions,questionChoices,qualificationQuestions,webUrl,identityHold};
})();
