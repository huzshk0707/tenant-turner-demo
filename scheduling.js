'use strict';

window.LeasingSchedule = (() => {
  const { days } = window.LeasingData;
  const zones = { Eastern:'America/New_York', Central:'America/Chicago', Mountain:'America/Denver', Pacific:'America/Los_Angeles' };
  const formatters = new Map();
  const minute = 60_000;
  const minutes = time => Number(time.slice(0,2)) * 60 + Number(time.slice(3,5));
  const clock = value => [Math.floor(value / 60), value % 60].map(n => String(n).padStart(2,'0')).join(':');
  const shiftDate = (date, offset) => new Date(Date.parse(`${date}T00:00:00Z`) + offset * 86_400_000).toISOString().slice(0,10);

  function localParts(timestamp, zone) {
    if (!formatters.has(zone)) {
      formatters.set(zone,new Intl.DateTimeFormat('en-US',{
        timeZone:zones[zone] || zones.Eastern, year:'numeric', month:'2-digit', day:'2-digit',
        hour:'2-digit', minute:'2-digit', hourCycle:'h23',
      }));
    }
    const {year,month,day,hour,minute} = Object.fromEntries(formatters.get(zone).formatToParts(timestamp).map(({type,value}) => [type,value]));
    return { date:`${year}-${month}-${day}`, time:`${hour}:${minute}` };
  }

  function epoch(date,time,zone) {
    const requested = Date.parse(`${date}T${time}:00Z`);
    if (!Number.isFinite(requested)) return NaN;
    let instant = requested;
    // Resolve the workspace offset for this appointment, including daylight saving changes.
    for (let i = 0; i < 4; i++) {
      const local = localParts(instant,zone);
      if (local.date === date && local.time === time) return instant;
      instant += requested - Date.parse(`${local.date}T${local.time}:00Z`);
    }
    return NaN;
  }

  function appliesOn(block,date) {
    return block.repeat
      ? block.day === days[(new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7]
      : block.date === date;
  }

  function blocksOn(state,rental,date) {
    const activeAgents = new Set(state.team.filter(user => user.active).map(user => user.name));
    const available = block => activeAgents.has(block.agent) && appliesOn(block,date);
    const rentalBlocks = rental.useRental ? rental.availability.filter(available) : [];
    const generalBlocks = rental.useGeneral ? state.teamAvailability.filter(block => block.agent === rental.assignee && available(block)) : [];
    const blocks = rentalBlocks.length ? rentalBlocks : generalBlocks;
    const oneTimeAgents = new Set(blocks.filter(block => !block.repeat).map(block => block.agent));
    return blocks.filter(block => !block.repeat || !oneTimeAgents.has(block.agent));
  }

  function eligibility(rental,lead,method) {
    if (!rental.active) return 'Activate this rental before booking a showing.';
    if (rental.waitlist) return 'Turn off the rental’s wait list to open booking.';
    if (!lead.qualified || lead.stage === 'Archived') return 'Qualify the lead before booking a showing.';
    if ((method === 'In person' && !rental.inPerson) || (method === 'Self access' && !rental.selfAccess)) return 'This viewing method is turned off.';
    if (method === 'Self access' && rental.requireId && !lead.verified) return 'Review the practice ID first, or choose an in-person tour.';
    return '';
  }

  function createPlanner(state,rental,lead,now = Date.now()) {
    const zone = state.workspaceProfile.timezone;
    const today = localParts(now,zone).date;
    const duration = rental.duration * minute;
    const reserved = state.leads.filter(other => other.id !== lead.id && other.stage === 'Showing scheduled' && other.showingDate && other.showingTime)
      .map(other => {
        const property = state.rentals.find(row => row.id === other.rentalId);
        const start = epoch(other.showingDate,other.showingTime,zone);
        return {
          rentalId:other.rentalId, date:other.showingDate, start,
          end:start + (other.showingDuration ?? property?.duration ?? 20) * minute,
          agent:other.showingAgent || property?.assignee, buffer:other.showingBuffer ?? property?.buffer ?? 0,
          method:other.showingMethod,
        };
      });

    function validate(date,time,method,{confirm = false, agent = ''} = {}) {
      const unavailable = eligibility(rental,lead,method);
      if (unavailable) return { error:unavailable };
      const start = epoch(date,time,zone);
      if (!Number.isFinite(start) || start <= now) return { error:'Choose a valid future date and time.' };
      if (!confirm && start < now + rental.notice * 60 * minute) return { error:`Choose a time at least ${rental.notice} hours from now.` };
      const end = start + duration;
      const localStart = minutes(time);
      const blocks = blocksOn(state,rental,date).filter(block => (!agent || block.agent === agent)
        && minutes(block.start) <= localStart && localStart + rental.duration <= minutes(block.end)
        && end <= epoch(date,block.end,zone));
      if (!blocks.length) return { error:'The full showing must fit inside an available time block.' };

      const inPerson = method === 'In person';
      const sameRental = reserved.filter(booking => booking.rentalId === rental.id);
      const toursToday = sameRental.filter(booking => booking.date === date && booking.method === 'In person');
      if (inPerson && rental.limit === 'One showing per day' && toursToday.length) return { error:'This rental allows one in-person showing per day.' };
      const overlaps = sameRental.filter(booking => start < booking.end && end > booking.start);
      let conflict;
      for (const block of blocks) {
        const capacity = inPerson ? Math.min(rental.maxShowings,block.capacity) : 1;
        if (overlaps.length >= capacity || overlaps.some(booking => booking.start !== start || booking.method !== method || booking.agent !== block.agent)) {
          conflict = 'This slot is full or overlaps another tour. Choose another time.';
          continue;
        }
        if (inPerson && rental.limit === 'Group trips' && toursToday.length &&
          (!toursToday.every(booking => booking.agent === block.agent) || !toursToday.some(booking => start === booking.start || start === booking.end || end === booking.start))) {
          conflict = 'Group this tour with an existing appointment at the rental on the same trip.';
          continue;
        }
        if (inPerson && reserved.some(booking => {
          if (booking.method !== 'In person' || booking.agent !== block.agent || booking.rentalId === rental.id) return false;
          const buffer = Math.max(rental.buffer,booking.buffer) * minute;
          return start < booking.end + buffer && end + buffer > booking.start;
        })) {
          conflict = 'This time conflicts with another rental or the agent’s travel buffer.';
          continue;
        }
        return { agent:block.agent, approval:inPerson ? block.approval : rental.appointmentType, capacity, start, end };
      }
      return { error:conflict };
    }

    function firstSlot(method) {
      if (eligibility(rental,lead,method)) return null;
      const earliest = localParts(now + rental.notice * 60 * minute,zone).date;
      const dates = new Set(Array.from({length:28},(_,i) => shiftDate(earliest,i)));
      for (const block of [...rental.availability,...state.teamAvailability]) {
        if (!block.repeat && block.date >= earliest) dates.add(block.date);
      }
      for (const date of [...dates].sort()) {
        const times = new Set();
        for (const block of blocksOn(state,rental,date)) {
          for (let start = minutes(block.start); start + rental.duration <= minutes(block.end); start += 5) times.add(clock(start));
        }
        for (const booking of reserved.filter(entry => entry.rentalId === rental.id && entry.date === date)) {
          times.add(localParts(booking.start,zone).time);
          times.add(localParts(booking.end,zone).time);
        }
        for (const time of [...times].sort()) {
          if (!validate(date,time,method).error) return { date,time };
        }
      }
      return null;
    }

    return { today,zone,validate,firstSlot };
  }

  return { createPlanner, localParts, shiftDate, epoch };
})();
