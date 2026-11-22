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

  function plan(state,rental,lead,date,time,method,options={}) {
    const self=method==='self';
    const primary=self ? rental.assignee : rental.viewing.inPerson.showingAgent || rental.assignee;
    const duration=Number(self ? 30 : rental.viewing.inPerson.durationMinutes) || 30;
    const day=days[(new Date(`${date}T12:00:00Z`).getUTCDay()+6)%7];
    const rules=rental.availability.customHours?.[day];
    const special=rental.availability.overrides?.some(row=>row.date===date && row.type==='open');
    let agents=[primary];
    if(!self && rental.availability.mode==='custom' && rules?.enabled && !special) {
      const start=toTime(time);
      const matches=rules.blocks.filter(block=>{
        const end=toTime(block.end);
        const minutes=value=>Number(value.slice(0,2))*60+Number(value.slice(3));
        return start && end && start>=toTime(block.start) && minutes(start)+duration<=minutes(end);
      });
      if(matches.length) agents=[...new Set(matches.map(block=>block.agent || primary))];
    }
    const booked=options.confirm && state.viewingsList.find(v=>v.id===options.existing)?.agent;
    if(booked) agents=[booked];
    let failure;
    for(const agent of agents) {
      const result=planForAgent(state,rental,lead,date,time,method,agent,primary,duration,options);
      if(!result.error) return result;
      failure ??=result;
    }
    return failure;
  }

  function planForAgent(state,rental,lead,date,time,method,agent,primary,duration,{existing = '', confirm = false, now = Date.now()}) {
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
    if (!self && !state.users.some(user=>user.name===agent && user.active && user.canShow!==false)) return fail('Choose an active showing agent in Viewing settings.');
    if (!(self ? rental.viewing.selfAccess : ip.enabled)) return fail('This viewing method is off for this rental.');
    if (self && rental.viewing.requireId && !lead.idReviewed) return fail('Mark the practice ID reviewed before scheduling self-access.');
    if (!Number.isFinite(start) || start <= now) return fail('Choose a valid future showing time.');
    const notice = self ? (parseInt(limits.selfAccessAdvanceNotice,10) || 0) * (limits.selfAccessAdvanceNotice.includes('hour') ? 60 : 1) : Number(ip.advanceNoticeHours) * 60;
    if (!confirm && start - now < notice * minute) return fail(`Choose a showing with at least ${notice} minutes’ notice.`);
    if (date > shiftDate(today,Number(limits.maxDaysAdvance) || 7)) return fail('That date is outside the maximum advance booking window.');
    const day = days[(new Date(`${date}T12:00:00Z`).getUTCDay()+6)%7];
    const override = rental.availability.overrides?.filter(o => o.date === date) || [];
    if (override.some(o => o.type === 'block' && (!o.start || overlaps(start,end,epoch(date,toTime(o.start),zone),epoch(date,toTime(o.end),zone))))) return fail('This rental is blocked at that time.');
    if (availability?.blockedDates?.some(b => b.date === date && (b.allDay || overlaps(start,end,epoch(date,toTime(b.start),zone),epoch(date,toTime(b.end),zone))))) return fail('The showing agent is unavailable at that time.');
    const opens = override.filter(o => o.type === 'open');
    const weekly = rental.availability.mode === 'custom' ? rental.availability.customHours : availability?.weekly;
    const rules = weekly?.[day];
    const blocks = opens.length ? opens : self && rental.availability.mode !== 'custom' && availability
      ? [{start:availability.selfAccessStart,end:availability.selfAccessEnd}] : rules?.enabled ? rules.blocks : [];
    const block=blocks.find(b => (self || rental.availability.mode!=='custom' || opens.length || (b.agent || primary)===agent) && start >= epoch(date,toTime(b.start),zone) && end <= epoch(date,toTime(b.end),zone));
    if (!block) return fail('The showing must fit within available hours.');
    const active = state.viewingsList.filter(v => v.id !== existing && ['Confirmed','Pending Confirmation','Requested'].includes(v.status) && v.date >= today);
    const atRental = active.filter(v => v.rentalId === rental.id);
    const sameLead = atRental.filter(v => v.leadId ? v.leadId === lead.id : v.leadName === lead.name);
    if (limits.limitUpcoming && atRental.length >= Number(limits.maxUpcoming)) return fail('The rental has reached its upcoming showing limit.');
    const sameDay = atRental.filter(v => v.date === date);
    if (limits.limitPerDay && sameDay.length >= Number(limits.maxPerDay)) return fail('The rental has reached its daily showing limit.');
    if (limits.preventDuplicates && sameLead.length) return fail('This lead already has an active showing. Use Reschedule for the existing appointment.');
    if (limits.minDaysBetweenEnabled && sameLead.some(v => Math.abs(Date.parse(v.date)-Date.parse(date)) < Number(limits.minDaysBetween)*86400000)) return fail('The lead’s showings are too close together.');
    const bookingStart = v => epoch(v.date,toTime(v.time),v.zone || zone);
    const bookingEnd = v => bookingStart(v) + (v.duration || 30)*minute;
    const collisions = sameDay.filter(v => overlaps(start,end,bookingStart(v),bookingEnd(v)));
    const group = !self && ip.allowGroupShowings;
    if (collisions.length && (!group || collisions.length >= Math.min(Number(ip.maxLeadsPerSlot) || 1,Number(block.capacity) || Infinity) || collisions.some(v => v.method === 'self' || !v.type.startsWith('In-Person') || bookingStart(v) !== start))) return fail('That viewing slot is full or overlaps another showing.');
    if (!self && ip.clusterShowings) {
      const trips = sameDay.filter(v => v.type.startsWith('In-Person'));
      if (trips.length && !trips.some(v => start === bookingStart(v) || start === bookingEnd(v) || end === bookingStart(v))) return fail('Choose a slot next to another showing on this rental’s trip.');
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

  function screen(rental,answers) {
    const q=rental.qualifying;
    const reasons=[];
    const reject=(when,label)=>{ if (when) reasons.push(label); };
    reject(q.reqMoveIn && answers.moveIn > shiftDate(rental.dateAvailable,Number(q.moveInDays)), 'Move-in date is outside the allowed window.');
    reject(q.reqIncome && answers.income < rental.rent*Number(q.incomeRatio) && !(q.allowCosigner && answers.cosigner) && !(q.allowVouchers && answers.voucher), 'Income does not meet the required rent ratio.');
    reject(answers.voucher && !q.allowVouchers,'This practice rule does not allow the selected voucher.');
    reject(answers.pets && (!q.allowPets || answers.pets>q.maxPets),'The number of pets exceeds the practice limit.');
    reject(answers.pets && ((answers.petType==='cat' && !q.allowCats) || (answers.petType==='small' && !q.allowSmallDogs) || (answers.petType==='large' && !q.allowLargeDogs)),'The selected pet type does not meet the practice rule.');
    reject(q.rejectBankruptcy && answers.bankruptcy,'Bankruptcy answer requires review.');
    reject(q.rejectJudgment && answers.judgment,'Civil judgment answer requires review.');
    reject(q.rejectEviction && answers.eviction,'Prior eviction does not meet the practice rule.');
    reject(q.rejectFelony && answers.felony,'Criminal history answer requires review.');
    const minimumCredit=Math.max(Number(q.minCredit) || 0,q.qCredit700 ? 700 : 0);
    reject(minimumCredit && answers.creditScore<minimumCredit,'The sample credit answer does not meet the requirement.');
    reject(q.qNoSmoking && answers.smoking,'The sample smoking answer does not meet the requirement.');
    for (const [i,rule] of (q.questions || []).entries()) reject(answers.custom[i]!==rule.answer,`Custom question did not qualify: ${rule.label}`);
    return reasons;
  }

  return {dateOffset,toTime,plan,firstSlot,screen};
})();
