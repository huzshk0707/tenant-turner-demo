'use strict';

(() => {
  const D = window.LeasingData;
  const lessons = window.LeasingLessons;
  const references = window.LeasingLessonReferences;
  const KEY = 'leasing-lab-v1';
  const $ = (selector, root = document) => root.querySelector(selector);
  const content = $('#content');
  const coach = $('#coach');
  const modal = $('#modal');
  const iconPaths = {
    home: 'm3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z M9 21v-7h6v7',
    users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M16 3a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-4 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
    calendar: 'M8 3v4m8-4v4M3 10h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z M8 15h2m4 0h2',
    chart: 'M3 3v18h18 M8 16v-4m5 4V7m5 9v-6',
    lock: 'M7 11V7a5 5 0 0 1 10 0v4M5 11h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2z M12 15v2',
    help: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M9 9a3 3 0 1 1 5 2c-1 1-2 1-2 3m0 3h.01',
    reset: 'M3 12a9 9 0 1 1 3 7M3 4v8h8',
    plus: 'M12 5v14M5 12h14', search: 'M10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14zm5-2 6 6',
    arrow: 'M5 12h14m-7-7 7 7-7 7', chevron: 'm9 6 6 6-6 6', back: 'm12 5-7 7 7 7M5 12h14',
    edit: 'm13 6 5 5M4 20l5-1 12-12-5-5L4 14z', check: 'm5 12 5 5L20 7',
    alert: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 7v5m0 5h.01',
    close: 'm6 6 12 12M18 6 6 18', bed: 'M3 18V8m18 10v-5a2 2 0 0 0-2-2H3m0 5h18M7 11V8h4v3',
    bath: 'M3 12h18v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z M6 12V6a2 2 0 0 1 4 0m-3 13-1 2m11-2 1 2',
    size: 'M4 9V4h5m6 0h5v5m0 6v5h-5m-6 0H4v-5',
    sliders: 'M5 3v18m7-18v18m7-18v18M2 8h6m1 8h6m1-6h6',
    download: 'M12 3v12m-4-4 4 4 4-4M4 16v4h16v-4', spark: 'm12 2 2.5 6.5L21 11l-6.5 2.5L12 20l-2.5-6.5L3 11l6.5-2.5z',
    mail: 'M3 5h18v14H3z M3 6l9 7 9-7', clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 6v6l4 2',
    more: 'M5 12h.01M12 12h.01M19 12h.01',
  };
  function icon(name, size = 20) {
    return `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><path d="${iconPaths[name] || iconPaths.help}"/></svg>`;
  }
  const nav = [['rentals','Rentals','home'],['leads','Leads','users'],['showings','Showings','calendar'],['reports','Reports','chart'],['access','Access','lock'],['help','Help','help']];
  const text = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
  const cash = value => new Intl.NumberFormat('en-US', { style:'currency', currency:'USD', maximumFractionDigits:0 }).format(Number(value || 0));
  const dayText = date => date ? new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { month:'short', day:'numeric' }) : '—';
  const timeText = time => time ? new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit' }) : '—';
  const uid = kind => `${kind}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
  const byRental = id => state.rentals.find(row => row.id === id);
  const byLead = id => state.leads.find(row => row.id === id);
  const atRental = id => state.leads.filter(row => row.rentalId === id);
  const timeBlocks = rental => [...state.teamAvailability, ...rental.availability];
  const showingDevice = r => state.devices.find(d => d.rentalId === r.id && (r.showingDeviceId === undefined || d.id === r.showingDeviceId));
  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY));
      if (saved?.version === 1 && Array.isArray(saved.teamAvailability)) return saved;
    } catch { /* Start with the training data if storage is unavailable. */ }
    return D.seed();
  }
  let state = load();
  let route = ['rentals'];
  let coachList = !state.lesson;
  let mobileMenu = false;
  let modalSave;
  let modalOpener;
  let toastTimer;
  const rentalFilters = { search:'', assignee:'', inactive:false, status:'All rentals' };
  const leadFilters = { search:'', archived:false, sort:'Newest', stage:'' };
  let showingFilter = 'Upcoming';
  let accessSearch = '';
  let accessUnassigned = false;
  const reportFilters = {};

  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch { notice('Browser storage is unavailable. Your changes will last until this tab is closed.'); }
  }
  function notice(message) {
    const el = $('#notice');
    el.innerHTML = `${icon('check', 18)}<span>${text(message)}</span>`;
    el.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('visible'), 3900);
  }
  function href(parts) { return `#${parts.map(item => encodeURIComponent(item)).join('/')}`; }
  function anchor(parts, label, options = {}) {
    const { classes = '', cue = '', symbol = '' } = options;
    return `<a class="${classes}" href="${href(parts)}" data-nav="${href(parts).slice(1)}" ${cue ? `data-cue="${cue}"` : ''}>${symbol ? icon(symbol, 17) : ''}${text(label)}</a>`;
  }
  function button(label, action, options = {}) {
    const { classes = 'btn', value = '', cue = '', symbol = '', attrs = '' } = options;
    return `<button type="button" class="${classes}" data-action="${action}" data-value="${text(value)}" ${cue ? `data-cue="${cue}"` : ''} ${attrs}>${symbol ? icon(symbol, 17) : ''}${text(label)}</button>`;
  }
  function opts(items, chosen) {
    return items.map(item => {
      const [value, label] = Array.isArray(item) ? item : [item, item];
      return `<option value="${text(value)}" ${String(value) === String(chosen) ? 'selected' : ''}>${text(label)}</option>`;
    }).join('');
  }
  function field(label, name, value, { type = 'text', span = false, required = false, attrs = '' } = {}) {
    return `<label class="field${span ? ' span' : ''}"><span>${text(label)}</span><input name="${name}" type="${type}" value="${text(value)}" ${required ? 'required' : ''} ${attrs}></label>`;
  }
  function select(label, name, items, chosen, attrs = '') {
    return `<label class="field"><span>${text(label)}</span><select name="${name}" ${attrs}>${opts(items, chosen)}</select></label>`;
  }
  function area(label, name, value, rows = 3) {
    return `<label class="field span"><span>${text(label)}</span><textarea name="${name}" rows="${rows}">${text(value)}</textarea></label>`;
  }
  function check(label, name, checked, hint = '') {
    return `<label class="switch-row"><input type="checkbox" class="switch" name="${name}" ${checked ? 'checked' : ''}><span>${text(label)}${hint ? `<small>${text(hint)}</small>` : ''}</span></label>`;
  }
  function chip(label, color = 'neutral', dot = true) {
    return `<span class="chip ${color}">${dot ? '<i></i>' : ''}${text(label)}</span>`;
  }
  function stageChip(stage) {
    const color = { 'New inquiry':'blue', 'Waitlisted':'amber', Qualified:'green', 'Showing requested':'amber', 'Showing scheduled':'purple', 'Viewing completed':'green', Applied:'green', 'Needs review':'amber' }[stage] || 'neutral';
    return chip(stage, color);
  }
  function heading(title, description = '', actions = '', kicker = '') {
    return `<div class="page-heading"><div>${kicker ? `<p class="eyebrow">${text(kicker)}</p>` : ''}<h1>${text(title)}</h1>${description ? `<p>${text(description)}</p>` : ''}</div>${actions ? `<div class="header-actions">${actions}</div>` : ''}</div>`;
  }
  function section(title, sub = '', right = '') {
    return `<div class="section-heading"><div><h2>${text(title)}</h2>${sub ? `<p>${text(sub)}</p>` : ''}</div>${right}</div>`;
  }
  function tabs(items, active) {
    return `<nav class="tabs" aria-label="Section">${items.map(([value, label, parts, cue]) => `<a class="tab ${value === active ? 'active' : ''}" ${value === active ? 'aria-current="page"' : ''} href="${href(parts)}" data-nav="${href(parts).slice(1)}" ${cue ? `data-cue="${cue}"` : ''}>${text(label)}</a>`).join('')}</nav>`;
  }
  function table(headers, rows, emptyLabel = 'No results match these filters.') {
    if (!rows.length) return `<div class="empty">${icon('search',24)}<p>${text(emptyLabel)}</p></div>`;
    return `<div class="table-scroll"><table><thead><tr>${headers.map(h => `<th scope="col">${text(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  function saveBar(label = 'Save settings') { return `<div class="save-bar"><button class="btn primary" type="submit">${icon('check',17)}${label}</button></div>`; }
  function empty(label, iconName = 'home') { return `<div class="empty">${icon(iconName,28)}<p>${text(label)}</p></div>`; }
  function searchField(id, value, placeholder) {
    return `<label class="search-field">${icon('search',18)}<input id="${id}" value="${text(value)}" type="search" autocomplete="off" aria-label="${text(placeholder)}" placeholder="${text(placeholder)}"></label>`;
  }

  function parseRoute(raw) {
    try {
      const parts = raw.replace(/^#/, '').split('/').map(decodeURIComponent);
      if ([...nav.map(item => item[0]),'rental','lead','report'].includes(parts[0])) return parts;
    } catch { /* Use the landing page for an invalid URL. */ }
    return ['rentals'];
  }
  function currentSection() {
    return { rental:'rentals', lead:'leads', report:'reports' }[route[0]] || route[0];
  }
  function go(parts, { focus = true, historyEntry = true } = {}) {
    route = parts;
    mobileMenu = false;
    if (historyEntry && location.hash !== href(parts)) history.pushState(null, '', href(parts));
    render();
    window.scrollTo(0, 0);
    if (focus) content.focus({ preventScroll:true });
    if (parts[0] === 'rental' && parts[1] === 'r1') learn('view-r1');
    if (parts[0] === 'lead') learn('view-lead');
    if (parts[0] === 'rental' && parts[2] === 'owner') learn('view-owner-report');
    if (parts[0] === 'report' && parts[1] === 'source') learn('view-source');
    if (parts[0] === 'access' && parts[2] === 'log') learn('view-access-log');
    if (parts[0] === 'showings') learn('view-showings');
    if (parts[3]) scrollToCue(parts[3], false);
  }

  function stat(label, value, symbol, tone, sub = '') {
    return `<div class="stat-card"><span class="stat-icon ${tone}">${icon(symbol,21)}</span><div><p>${text(label)}</p><strong>${value}</strong>${sub ? `<small>${text(sub)}</small>` : ''}</div></div>`;
  }
  function rentalCard(r) {
    const badge = !r.active ? chip('Inactive','neutral') : r.waitlist ? chip('Wait list','amber') : chip('Active','green');
    const img = D.photos.includes(r.photo) ? r.photo : D.photos[0];
    return `<article class="rental-card" data-rental="${text(r.id)}">
      <a href="${href(['rental',r.id,'leads'])}" data-nav="${href(['rental',r.id,'leads']).slice(1)}" data-cue="rental-${text(r.id)}" aria-label="Open ${text(r.name)}" class="rental-photo">
        <img src="assets/${img}.jpg" alt="" width="850" height="480"><span class="photo-badges">${badge}${r.alert ? chip('Review lead','rose',false) : ''}</span>
      </a>
      <div class="rental-info"><div class="rental-row"><div class="rental-name"><h3>${anchor(['rental',r.id,'leads'],r.name)}</h3><p>${text(r.address)}</p></div><p class="rent-price">${cash(r.rent)}<small>/mo</small></p></div>
        <div class="amenities"><span>${icon('bed',17)}${text(r.beds)} beds</span><span>${icon('bath',17)}${text(r.baths)} baths</span><span>${icon('size',15)}${Number(r.sqft).toLocaleString('en-US')} sqft</span></div>
        <div class="card-footer">${anchor(['rental',r.id,'leads'],'Leads',{classes:'btn subtle',symbol:'users'})}${anchor(['rental',r.id,'settings'],'Settings',{classes:'btn subtle',symbol:'sliders'})}<span class="assignee" title="Assigned to ${text(r.assignee)}">${text(initials(r.assignee))}</span></div>
      </div>
    </article>`;
  }
  function initials(name) { return String(name).trim().split(/\s+/).slice(0,2).map(word => word[0]).join('').toUpperCase(); }
  function filteredRentals() {
    const f = rentalFilters;
    const q = f.search.trim().toLowerCase();
    return state.rentals.filter(r => (f.inactive || r.active) && (!f.assignee || r.assignee === f.assignee)
      && (!q || `${r.name} ${r.address}`.toLowerCase().includes(q))
      && (f.status === 'All rentals' || (f.status === 'Wait list' && r.waitlist) || (f.status === 'Review needed' && r.alert)));
  }
  function refreshRentalGrid() {
    const list = filteredRentals();
    $('#rental-grid').innerHTML = list.length ? list.map(rentalCard).join('') : empty('No rentals match these filters.');
    $('#rental-count').textContent = `${list.length} ${list.length === 1 ? 'listing' : 'listings'}`;
  }
  function rentalsView() {
    const active = state.rentals.filter(r => r.active);
    const newLeads = state.leads.filter(l => l.stage === 'New inquiry').length;
    const scheduled = state.leads.filter(l => l.stage === 'Showing scheduled').length;
    return `${heading('Rentals','Manage listings, prospects, and showings from one workspace.',button('Add rental','add-rental',{classes:'btn primary',symbol:'plus',cue:'add-rental'}),'PORTFOLIO')}
      <div class="stats-grid">
        ${stat('Active rentals',active.length,'home','lilac',`${state.rentals.length} in portfolio`)}
        ${stat('New inquiries',newLeads,'users','sky','Awaiting review')}
        ${stat('Scheduled showings',scheduled,'calendar','mint','Across all rentals')}
        ${stat('Needs attention',active.filter(r => r.alert).length,'alert','peach','Rentals flagged')}
      </div>
      <div class="portfolio-heading"><h2>All rentals</h2><span id="rental-count" class="muted" aria-live="polite"></span></div>
      <div class="toolbar rental-toolbar"><div data-cue="rental-search">${searchField('rental-search',rentalFilters.search,'Search rentals')}</div>
        <label class="compact-field"><span class="sr-only">Status</span><select id="rental-status">${opts(['All rentals','Wait list','Review needed'],rentalFilters.status)}</select></label>
        <label class="compact-field"><span class="sr-only">Assignee</span><select id="rental-assignee">${opts([['','All assignees'],...D.people],rentalFilters.assignee)}</select></label>
        <label class="inline-check"><input id="rental-inactive" type="checkbox" ${rentalFilters.inactive ? 'checked' : ''}>Show inactive</label>
      </div><div class="rental-grid" id="rental-grid"></div>`;
  }

  function leadRows(rentalId) {
    const f = leadFilters;
    const q = f.search.trim().toLowerCase();
    return state.leads.filter(l => (!rentalId || l.rentalId === rentalId) && (f.archived || l.stage !== 'Archived')
      && (!f.stage || l.stage === f.stage) && (!q || `${l.name} ${l.email} ${l.source}`.toLowerCase().includes(q)))
      .sort((a,b) => f.sort === 'Name' ? a.name.localeCompare(b.name) : b.created.localeCompare(a.created));
  }
  function refreshLeads() {
    const id = route[0] === 'rental' ? route[1] : '';
    const columns = ['Qualified','Lead',...(id ? [] : ['Rental']),'Stage','Last activity','Actions'];
    const rows = leadRows(id).map(l => {
      const reviewed = l.qualified === null ? chip('Pending') : l.qualified ? chip('Yes','green') : chip('No','amber');
      const activity = l.timeline.at(-1);
      return [reviewed,
        `<div class="person-cell"><span class="avatar light">${text(initials(l.name))}</span><div>${anchor(['lead',l.id],l.name,{classes:'text-link'})}<small>${text(l.source)}</small></div></div>`,
        ...(id ? [] : [text(byRental(l.rentalId)?.name || '—')]), stageChip(l.stage),
        `<div class="activity-cell">${text(activity?.text || 'Inquiry received')}<small>${dayText(activity?.date || l.created)}</small></div>`,
        `<details class="row-actions"><summary aria-label="Actions for ${text(l.name)}">${icon('more',18)}</summary>
          ${anchor(['lead',l.id],'Open lead',{classes:'btn text small'})}${button(l.stage === 'Archived' ? 'Restore inquiry' : 'Archive lead','lead-row-stage',{classes:'btn text small',value:l.id})}</details>`,
      ];
    });
    $('#leads-result').innerHTML = table(columns,rows);
  }
  function leadsView(rentalId = '') {
    return `<section class="panel leads-panel" data-cue="lead-table">${section(rentalId ? 'Rental leads' : 'Lead queue','',button('New inquiry','add-lead',{value:rentalId,classes:'btn primary',symbol:'plus',cue:'add-lead'}))}
      <div class="toolbar hold-in-panel">${searchField('lead-search',leadFilters.search,'Search leads')}
        <label class="compact-field"><span class="sr-only">Lead stage</span><select id="lead-stage">${opts([['','All stages'],...D.stages],leadFilters.stage)}</select></label>
        <label class="compact-field"><span class="sr-only">Sort leads</span><select id="lead-sort">${opts(['Newest','Name'],leadFilters.sort)}</select></label>
        <label class="inline-check"><input id="lead-archived" type="checkbox" ${leadFilters.archived ? 'checked' : ''}>Show archived</label>
      </div><div id="leads-result"></div></section>`;
  }
  function rentalDetail(r, tab) {
    const current = ['leads','settings','availability','owner'].includes(tab) ? tab : 'leads';
    const items = [['leads','Leads'],['owner','Owner report'],['availability','Availability'],['settings','Settings']];
    return `${anchor(['rentals'],'All rentals',{classes:'back-link',symbol:'back'})}
      ${heading(r.name,r.address,chip(!r.active ? 'Inactive' : r.waitlist ? 'Wait list' : 'Active', r.active && !r.waitlist ? 'green' : 'neutral'))}
      ${tabs(items.map(([value,label]) => [value,label,['rental',r.id,value]]),current)}
      ${current === 'settings' ? settingsView(r) : current === 'availability' ? availabilityView(r) : current === 'owner' ? ownerView(r) : leadsView(r.id)}`;
  }

  const moneyField = (label,name,value) => field(label,name,value,{type:'number',required:true,attrs:'min="0" step="1"'});
  const numberField = (label,name,value,min=0,max=9999,step=1) => field(label,name,value,{type:'number',required:true,attrs:`min="${min}" max="${max}" step="${step}"`});
  function questionRow(q = { prompt:'', answer:'None' }) {
    return `<div class="question-row">${field('Question','question',q.prompt,{required:true,attrs:'maxlength="160"'})}
      ${select('Required answer','answer',['None','Yes','No'],q.answer)}${button('Remove','remove-question',{classes:'btn outline small'})}</div>`;
  }
  function settingsView(r) {
    const assigned = showingDevice(r);
    const deviceOptions = [['','No device assigned'], ...state.devices.filter(d => !d.rentalId || d.rentalId === r.id).map(d => [d.id,`${d.model} · ${d.serial}`])];
    return `<div class="settings-layout"><nav class="local-nav" aria-label="Rental settings sections">
      ${[['status','Status'],['marketing','Marketing'],['qualifying','Qualifying'],['viewing','Viewing'],['availability','Availability'],['application','Application & fees']].map(([key,label]) => button(label,'jump',{value:key,classes:'local-nav-link'})).join('')}
      </nav><form id="settings-form" data-form="rental-settings">
      <section class="panel settings-section" data-cue="status">${section('Rental status','Make the listing active and select who manages it.')}
        <div class="form-body form-grid">${check('Active rental','active',r.active)}${select('Assigned to','assignee',D.people,r.assignee)}</div>
      </section>
      <section class="panel settings-section" data-cue="marketing">${section('Marketing','Edit the listing details prospects would see.')}
        <div class="form-body form-grid columns-3">${field('Listing name','name',r.name,{required:true,attrs:'maxlength="70"'})}${field('Address','address',r.address,{required:true,attrs:'maxlength="120"'})}${select('Property type','type',['House','Apartment','Condo','Townhouse'],r.type)}
        ${moneyField('Monthly rent','rent',r.rent)}${moneyField('Security deposit','deposit',r.deposit)}${numberField('Lease term (months)','term',r.term,1,60)}
        ${numberField('Bedrooms','beds',r.beds,0,20)}${numberField('Bathrooms','baths',r.baths,0,20,0.5)}${numberField('Square feet','sqft',r.sqft,0,100000)}
        ${field('Available on','available',r.available,{type:'date',required:true})}${field('Virtual tour URL','tourUrl',r.tourUrl,{type:'url'})}${select('Practice photo','photo',D.photos.map(p => [p,p[0].toUpperCase()+p.slice(1)]),r.photo)}
        ${area('Description','description',r.description)}${field('Amenities','amenities',r.amenities)}${field('Included utilities','utilities',r.utilities)}
        <div class="span media-preview"><img src="assets/${D.photos.includes(r.photo) ? r.photo : D.photos[0]}.jpg" width="850" height="480" alt="Practice listing photo"><p>Listing photo</p></div>
        <div class="span inside-section" data-cue="syndication"><h3>Syndication</h3><p>Choose the channels for this rental.</p><div class="switch-grid">${D.sites.map(site => check(site,'site',r.syndication.includes(site)).replace('name="site"',`name="site" value="${text(site)}"`)).join('')}</div></div></div>
      </section>
      <section class="panel settings-section" data-cue="qualifying">${section('Qualifying','Set the rules the practice inquiry form uses.')}
        <div class="form-body form-grid">${numberField('Minimum income × rent','incomeRatio',r.incomeRatio,0,20,0.1)}${numberField('Move in within (days)','moveDays',r.moveDays,1,365)}
        ${check('Allow pets','pets',r.pets)}${numberField('Maximum pets','petMax',r.petMax,0,20)}${check('Allow a co-signer','coSigner',r.coSigner)}
        <div class="span inside-section"><div class="section-inline"><div><h3>Custom questions</h3><p>Choose Yes or No to require an answer.</p></div>${button('Add question','add-question',{classes:'btn outline small',symbol:'plus',cue:'add-question'})}</div><div id="question-list">${r.questions.map(questionRow).join('')}</div></div></div>
      </section>
      <section class="panel settings-section" data-cue="viewing">${section('Viewing methods','Control when and how prospects can tour the property.')}
        <div class="form-body">
          <div class="inside-section" data-cue="waitlist"><h3>Wait list</h3><div class="form-grid">${check('Collect interest before booking','waitlist',r.waitlist)}${area('Wait list message','waitMessage',r.waitMessage,2)}</div></div>
          <div class="inside-section" data-cue="self-access"><h3>Self-access</h3><div class="form-grid">${check('Offer self-access viewings','selfAccess',r.selfAccess)}${check('Require a practice ID review','requireId',r.requireId)}
          ${select('Viewing type','viewingType',['Electronic lockbox','Instructions only','Combination lockbox','Remote access'],r.viewingType)}${select('Booking approval','appointmentType',['Set appointments','Take requests'],r.appointmentType)}${select('Assigned viewing device','deviceId',deviceOptions,assigned?.id || '')}${area('Viewing instructions','instructions',r.instructions,2)}
          <p class="span muted">Open ${anchor(['access'],'Access',{classes:'text-link'})} to manage device inventory.</p></div></div>
          <div class="inside-section" data-cue="in-person"><h3>In-person showings</h3><div class="form-grid columns-3">${check('Offer in-person tours','inPerson',r.inPerson)}${numberField('Tours per slot','maxShowings',r.maxShowings,1,50)}${numberField('Duration (minutes)','duration',r.duration,5,240,5)}${numberField('Scheduling notice (hours)','notice',r.notice,0,168)}${numberField('Travel buffer (minutes)','buffer',r.buffer,0,180)}${select('Trip limit','limit',['No limit','One showing per day','Group trips'],r.limit)}${check('Notify occupants in practice','notifyOccupants',r.notifyOccupants)}</div></div>
        </div>
      </section>
      ${availabilityView(r)}
      <section class="panel settings-section" data-cue="application">${section('Application & fees','Set the link and fees on this listing.')}
        <div class="form-body form-grid columns-3">${field('Application URL','application',r.application,{type:'url'})}${moneyField('Application fee','applicationFee',r.applicationFee)}${moneyField('Admin fee','adminFee',r.adminFee)}</div>
      </section>${saveBar()}</form></div>`;
  }
  function availabilityView(r) {
    const groups = [
      {scope:'General', title:'General availability', description:'Team hours shared across rentals.', label:'Add general hours', cue:'add-general-hours', rows:state.teamAvailability},
      {scope:'Rental', title:'Rental-specific availability', description:'Time blocks that apply only to this rental.', label:'Add rental hours', cue:'add-rental-hours', rows:r.availability},
    ];
    return `<div id="availability-panel" data-cue="availability"><div data-cue="availability-table">${groups.map(group =>
      `<section class="panel">${section(group.title,group.description,button(group.label,'schedule-slot',{classes:'btn outline',symbol:'plus',cue:group.cue,attrs:`data-scope="${group.scope}"`}))}
      ${table(['Day','Time','Agent','Repeats',''],group.rows.map(slot => [text(slot.day),`${timeText(slot.start)} – ${timeText(slot.end)}`,text(slot.agent),slot.repeat ? 'Weekly':'Once',`<div class="cell-actions">${button('Edit','schedule-slot',{value:slot.id,classes:'btn outline small'})}${button('Remove','remove-slot',{value:slot.id,classes:'btn text small'})}</div>`]),'No time blocks yet.')}</section>`).join('')}</div></div>`;
  }
  function ownerView(r) {
    const leads = atRental(r.id);
    const report = r.ownerReport;
    const metrics = [
      ['Inquiries',leads],['Prequalified',leads.filter(l => l.qualified)],['Scheduled',leads.filter(l => l.showingDate)],['Completed',leads.filter(l => ['Viewing completed','Applied'].includes(l.stage))],
    ];
    return `<div class="two-col wide-left">
      <div><section class="panel" data-cue="owner-metrics">${section('Leasing funnel','Latest activity for this rental.')}
        ${table(['Metric','Last 7 days','Total'],metrics.map(([label,rows]) => [text(label),rows.filter(l => (label === 'Scheduled' || label === 'Completed' ? l.showingDate : l.created) >= D.date(-7)).length,rows.length]))}
      </section><section class="panel" data-cue="owner-feedback">${section('Viewing feedback',report.feedback ? 'Choose which entries appear in the owner report.':'Feedback is turned off in the delivery preferences.')}
        ${table(['Date','Rating','Feedback','Visibility'],leads.filter(l => l.feedback).map(l => [anchor(['lead',l.id,'showing','owner-feedback-controls'],dayText(l.showingDate || l.created),{classes:'text-link',cue:'feedback-entry'}),`${l.rating || '—'} / 5`,text(l.feedback),chip(l.feedbackHidden ? 'Hidden':'Included',l.feedbackHidden ? 'neutral':'green')]),'No viewing feedback yet.')}
      </section></div>
      <form class="panel" data-cue="owner-schedule" data-form="owner-schedule">${section('Delivery schedule','Practice a weekly email report.')}
        <div class="form-body form-grid single">${check('Enable weekly delivery','enabled',report.enabled)}${check('Include viewing feedback','feedback',report.feedback)}
          ${select('Delivery day','day',D.days,report.day)}${field('Delivery time','time',report.time,{type:'time',required:true})}${field('Recipient email','email',report.email,{type:'email',required:true})}
          <p class="muted">This schedule stays in the sandbox. It sends no email.</p></div>${saveBar('Save schedule')}
      </form>
    </div>`;
  }
  function leadDetail(l) {
    const r = byRental(l.rentalId);
    const showing = l.showingDate ? `${dayText(l.showingDate)} at ${timeText(l.showingTime)}${l.showingMethod ? ` · ${text(l.showingMethod)}` : ''}` : 'No showing scheduled';
    return `${anchor(r ? ['rental',r.id,'leads'] : ['leads'],r ? `${r.name} leads` : 'All leads',{classes:'back-link',symbol:'back'})}
      ${heading(l.name,`${r?.name || 'Rental'} · Received ${dayText(l.created)}`,stageChip(l.stage))}
      <div class="two-col wide-left">
        <div><section class="panel">${section('Lead profile')}
          <div class="form-body form-grid"><div class="read-field"><span>Email</span><strong>${text(l.email)}</strong></div><div class="read-field"><span>Phone</span><strong>${text(l.phone)}</strong></div>
          <div class="read-field"><span>Source</span><strong>${text(l.source)} · ${text(l.channel)}</strong></div><div class="read-field"><span>Identity check</span><strong>${l.verified ? 'Practice ID reviewed':'Awaiting review'}</strong></div>
          <div class="span action-row" data-cue="lead-review">${button('Mark qualified','lead-stage',{value:'Qualified',classes:'btn outline',symbol:'check'})}${button('Needs review','lead-stage',{value:'Needs review',classes:'btn outline'})}${button(l.verified ? 'Reset ID review':'Mark practice ID reviewed','verify-id',{classes:'btn outline'})}${button(l.stage === 'Archived' ? 'Restore inquiry':'Archive lead','lead-stage',{value:l.stage === 'Archived' ? 'New inquiry':'Archived',classes:'btn text'})}</div></div>
        </section>
        <section class="panel" data-cue="book-showing">${section('Showing',showing,button(l.showingDate ? 'Reschedule showing':'Schedule showing','book-showing',{classes:'btn primary',symbol:'calendar'}))}
          <div class="form-body"><div class="action-row" data-cue="finish-showing">${button('Complete showing','finish-showing',{classes:'btn outline',attrs:l.showingDate && l.stage !== 'Showing requested' ? '' : 'disabled'})}${l.stage === 'Showing requested' ? button('Confirm request','confirm-showing',{classes:'btn primary'}) : ''}${l.showingDate && ['Showing scheduled','Showing requested'].includes(l.stage) ? button('Cancel showing','cancel-showing',{classes:'btn text'}) : ''}${l.stage === 'Viewing completed' ? button('Mark applied','lead-stage',{value:'Applied',classes:'btn outline'}) : ''}</div>
            ${l.feedback ? `<div class="feedback" data-cue="owner-feedback-controls"><strong>${text(l.rating ? `${l.rating} / 5` : 'Feedback')}</strong><p>${text(l.feedback)}</p><div class="action-row">${button(l.feedbackHidden ? 'Show on owner report' : 'Hide from owner report','toggle-feedback',{value:l.id,classes:'btn outline small'})}${r ? anchor(['rental',r.id,'owner'],'Back to owner report',{classes:'btn text small'}) : ''}</div></div>` : ''}
          </div></section>
        <section class="panel">${section('Prequalification')}
          <div class="form-body form-grid columns-3"><div class="read-field"><span>Move-in date</span><strong>${dayText(l.moveIn)}</strong></div><div class="read-field"><span>Monthly income</span><strong>${cash(l.income)}</strong></div><div class="read-field"><span>Pets</span><strong>${text(l.pets)}</strong></div>
          <div class="read-field"><span>Result</span>${l.qualified === null ? chip('Not reviewed') : l.qualified ? chip('Qualified','green') : chip('Review required','amber')}</div>${l.coSigner ? '<div class="read-field"><span>Co-signer</span><strong>Yes</strong></div>' : ''}
          ${(l.screening || []).map(item => `<div class="read-field"><span>${text(item.prompt)}</span><strong>${text(item.answer)}</strong></div>`).join('')}
          ${(l.reasons || []).length ? `<div class="span"><h3>Practice screening notes</h3><ul class="reason-list">${l.reasons.map(item => `<li>${text(item)}</li>`).join('')}</ul></div>` : ''}</div>
        </section></div>
        <div><form class="panel" data-form="lead-note" data-cue="lead-note">${section('Internal notes')}<div class="form-body">${area('New note','note','',3)}<button class="btn primary top-gap" type="submit">Add note</button></div>
          <div class="timeline">${l.notes.length ? l.notes.slice().reverse().map(n => `<div class="timeline-item"><p>${text(n.text)}</p><small>${dayText(n.date)}</small></div>`).join(''):'<p class="muted">No notes yet.</p>'}</div>
        </form><section class="panel">${section('Activity')}<div class="timeline">${l.timeline.slice().reverse().map(item => `<div class="timeline-item"><p>${text(item.text)}</p><small>${dayText(item.date)}</small></div>`).join('')}</div></section></div>
      </div>`;
  }
  function showingsView() {
    const rows = state.leads.filter(l => l.showingDate && (showingFilter === 'All' || (showingFilter === 'Upcoming' ? ['Showing scheduled','Showing requested'].includes(l.stage) && l.showingDate >= D.date() : !['Showing scheduled','Showing requested'].includes(l.stage) || l.showingDate < D.date())))
      .sort((a,b) => `${a.showingDate}${a.showingTime}`.localeCompare(`${b.showingDate}${b.showingTime}`));
    return `${heading('Showings','Review the practice calendar and open a lead to update a tour.')}
      <section class="panel" data-cue="showing-list">${section('Viewing calendar','',`<label class="compact-field"><span class="sr-only">Showing date filter</span><select id="showing-filter">${opts(['Upcoming','Past','All'],showingFilter)}</select></label>`)}
      ${table(['Date','Time','Rental','Lead','Method','Stage'],rows.map(l => [dayText(l.showingDate),timeText(l.showingTime),text(byRental(l.rentalId)?.name || '—'),anchor(['lead',l.id],l.name,{classes:'text-link'}),text(l.showingMethod),stageChip(l.stage)]),'No showings match this view.')}</section>`;
  }

  const reports = [
    ['activity','Rental activity','Track inquiries, qualification and showings by rental.','home'],
    ['source','Lead source','See how prospects found each rental.','users'],
    ['days','Days on market','Review when each listing started and how long it has run.','clock'],
    ['leads','Lead activity','Review lead stages, sources and recent activity.','users'],
    ['syndication','Listing syndication','See the selected advertising channels for each rental.','arrow'],
    ['viewings','Viewing activity','Compare scheduled and completed tours.','calendar'],
    ['availability','Viewing availability','Review weekly availability by agent and rental.','calendar'],
    ['notifications','Notifications','Review practice scheduling and contact events.','mail'],
    ['inventory','Device inventory','Find assigned and unassigned access devices.','lock'],
    ['device-access','Device access','Review generated practice access codes.','lock'],
    ['staff','User activity','Compare assigned listings and tours across the team.','users'],
    ['account','Account overview','Summarize portfolio, inquiries and viewing activity.','chart'],
  ];
  const reportTitle = id => reports.find(r => r[0] === id)?.[1] || 'Report';
  const filterOptions = () => [['','All rentals'], ...state.rentals.map(r => [r.id,r.name])];
  function rowsForReport(id, f) {
    const rentals = state.rentals.filter(r => (!f.rental || r.id === f.rental) && (!f.active || r.active));
    const renting = new Set(rentals.map(r => r.id));
    const inRange = date => (!f.start || date >= f.start) && (!f.end || date <= f.end);
    const leads = state.leads.filter(l => renting.has(l.rentalId) && (!f.source || l.source === f.source) && inRange(l.created));
    const name = id => byRental(id)?.name || 'Unassigned';
    const devices = state.devices.filter(d => d.rentalId ? renting.has(d.rentalId) : !f.rental && !f.active);
    const result = (columns, data) => ({ columns, data });
    const stats = rows => [rows.length,rows.filter(l => l.qualified).length,rows.filter(l => l.showingDate).length,rows.filter(l => ['Viewing completed','Applied'].includes(l.stage)).length];
    switch (id) {
      case 'activity': return result(['Rental','Assignee','Active','Inquiries','Qualified','Scheduled','Completed'],rentals.map(r => [r.name,r.assignee,r.active ? 'Yes':'No',...stats(leads.filter(l => l.rentalId === r.id))]));
      case 'source': return result(['Lead','Rental','Received','Stage','Channel','Source'],leads.map(l => [l.name,name(l.rentalId),l.created,l.stage,l.channel,l.source]));
      case 'days': return result(['Rental','Listed','Days on market','Available','Status'],rentals.map(r => [r.name,r.listingSince,Math.max(0,Math.round((new Date(D.date())-new Date(r.listingSince))/86400000)),r.available,r.active ? 'Active':'Inactive']));
      case 'leads': return result(['Lead','Rental','Stage','Received','Latest activity'],leads.map(l => [l.name,name(l.rentalId),l.stage,l.created,l.timeline.at(-1)?.text || '—']));
      case 'syndication': return result(['Rental','Active','Selected channels'],rentals.map(r => [r.name,r.active ? 'Yes':'No',r.syndication.join(', ') || 'None']));
      case 'viewings': return result(['Rental','Lead','Date','Time','Method','Stage'],leads.filter(l => l.showingDate).map(l => [name(l.rentalId),l.name,l.showingDate,l.showingTime,l.showingMethod,l.stage]));
      case 'availability': return result(['Rental','Scope','Agent','Day','Start','End'],rentals.flatMap(r => timeBlocks(r).map(a => [r.name,a.scope,a.agent,a.day,a.start,a.end])));
      case 'notifications': return result(['Lead','Rental','Date','Activity'],leads.flatMap(l => l.timeline.filter(e => inRange(e.date)).map(e => [l.name,name(l.rentalId),e.date,e.text])));
      case 'inventory': return result(['Device','Type','Rental','Status'],devices.map(d => [d.serial,d.model,name(d.rentalId),d.state]));
      case 'device-access': return result(['Date','Device','Recipient','Type','Practice code'],state.accesses.filter(a => devices.some(d => d.serial === a.serial) && inRange(a.date)).map(a => [a.date,a.serial,a.name,a.type,a.code]));
      case 'staff': return result(['Team member','Rentals','Inquiries','Qualified','Scheduled','Completed'],D.people.map(p => [p,rentals.filter(r => r.assignee === p).length,...stats(leads.filter(l => byRental(l.rentalId)?.assignee === p))]));
      default: return result(['Active rentals','Total rentals','Inquiries','Qualified','Scheduled','Completed'],[[rentals.filter(r => r.active).length,rentals.length,...stats(leads)]]);
    }
  }
  function reportsView(tab) {
    const scheduled = tab === 'scheduled';
    const groups = [
      ['Rentals','home',['activity','days','leads','source','syndication']],
      ['Viewings','calendar',['viewings','availability','notifications']],
      ['Access devices','lock',['device-access','inventory']],
      ['Team and account','users',['staff','account']],
    ];
    return `${heading('Reports','Explore leasing performance and manage report schedules.')}
      ${tabs([['standard','Standard reports',['reports']],['scheduled','Scheduled reports',['reports','','scheduled']]],scheduled ? 'scheduled':'standard')}
      ${scheduled ? `<section class="panel">${section('Report schedules','Schedules are saved for practice.',button('Add schedule','report-schedule',{classes:'btn primary',symbol:'plus',cue:'add-schedule'}))}
        ${table(['Report','Frequency','Recipient','Time',''],state.schedules.map(s => [text(reportTitle(s.report)),text(s.frequency),text(s.email),timeText(s.time),`<div class="cell-actions">${button('Edit','report-schedule',{value:s.id,classes:'btn outline small'})}${button('Remove','remove-report-schedule',{value:s.id,classes:'btn text small'})}</div>`]),'No practice report schedules yet.')}</section>` :
      `<div class="report-grid report-groups">${groups.map(([title,symbol,ids]) => `<article class="panel report-card"><span class="stat-icon lilac">${icon(symbol,21)}</span><h2>${text(title)}</h2><ul class="report-list">${ids.map(key => {
        const [id,name,description] = reports.find(report => report[0] === key);
        return `<li>${anchor(['report',id],name,{classes:'text-link report-link',cue:`report-${id}`,symbol:'arrow'})}<p>${text(description)}</p></li>`;
      }).join('')}</ul></article>`).join('')}</div>`}`;
  }
  function reportView(id) {
    const f = reportFilters[id] || {};
    const data = rowsForReport(id,f);
    const hasSource = ['activity','source','leads','viewings','notifications','staff','account'].includes(id);
    const hasRange = hasSource || id === 'device-access';
    return `${anchor(['reports'],'All reports',{classes:'back-link',symbol:'back'})}
      ${heading(reportTitle(id),`${data.data.length} ${data.data.length === 1 ? 'result' : 'results'}`,button('Download CSV','csv',{classes:'btn primary',symbol:'download',cue:'report-export'}))}
      <form class="panel" data-form="report-filters" data-cue="report-filter">${section('Filters')}
        <div class="form-body form-grid columns-3">${select('Rental','rental',filterOptions(),f.rental || '')}
        ${hasSource ? select('Source','source',[['','All sources'],...new Set(state.leads.map(l => l.source))],f.source || '') : ''}
        ${hasRange ? field('From date','start',f.start || '',{type:'date'})+field('Through date','end',f.end || '',{type:'date'}) : ''}${check('Show active rentals only','active',f.active)}</div>${saveBar('Apply filters')}</form>
      <section class="panel">${section('Results')}${table(data.columns,data.data.map(row => row.map(text)))}</section>`;
  }
  function accessView(tab) {
    const active = [...D.devices,'contacts','log'].includes(tab) ? tab : D.devices[0];
    const all = [...D.devices.map(model => [model,model]),['contacts','Authorized contacts'],['log','Access log']];
    const devices = state.devices.filter(d => d.model === active && (!accessUnassigned || !d.rentalId)
      && `${d.serial} ${byRental(d.rentalId)?.name || ''}`.toLowerCase().includes(accessSearch.trim().toLowerCase()));
    return `${heading('Access','Manage practice devices, access requests and authorized contacts.')}
      ${tabs(all.map(([id,label]) => [id,label,['access','',id],id === 'log' ? 'access-log':'']),active)}
      ${active === 'contacts' ? `<section class="panel">${section('Authorized contacts','',button('Add contact','contact',{classes:'btn primary',symbol:'plus',cue:'add-contact'}))}
        ${table(['Contact','Company','Access','Email',''],state.contacts.map(c => [text(c.name),text(c.company),chip(c.access,c.access === 'Recurring' ? 'purple':'neutral'),text(c.email),`<div class="cell-actions">${button('Edit','contact',{value:c.id,classes:'btn outline small'})}${button('Remove','remove-contact',{value:c.id,classes:'btn text small'})}</div>`]),'No authorized contacts yet.')}</section>` :
      active === 'log' ? `<section class="panel" data-cue="access-log">${section('Access log','Generated practice codes and intended recipients.')}
        ${table(['Date','Device','Recipient','Type','Practice code'],state.accesses.slice().reverse().map(a => [dayText(a.date),text(a.serial),text(a.name),text(a.type),`<code>${text(a.code)}</code>`]),'No practice access requests yet.')}</section>` :
      `<div class="toolbar">${searchField('access-search',accessSearch,'Search devices')}
        <label class="inline-check"><input id="unassigned" type="checkbox" ${accessUnassigned ? 'checked':''}>Show unassigned only</label>
        ${button('Add device','device-add',{value:active,classes:'btn outline',symbol:'plus'})}</div><div class="device-grid">
        ${devices.map(d => `<article class="panel device-card"><div class="device-head"><span class="stat-icon lilac">${icon('lock',21)}</span>${chip(d.state,d.state === 'Ready' ? 'green':'amber')}</div>
          <h2>${text(d.serial)}</h2><p>${text(byRental(d.rentalId)?.name || 'Unassigned')}</p><div class="action-row">
          ${button('Send code','send-code',{value:d.id,classes:'btn text small',attrs:d.state === 'Ready' ? '' : 'disabled'})}${button('Get code','get-code',{value:d.id,cue:'access-code',classes:'btn primary small',attrs:d.state === 'Ready' ? '' : 'disabled'})}
          ${button('Settings','device-settings',{value:d.id,cue:'device-settings',classes:'btn outline small'})}</div></article>`).join('') || empty('No devices match these filters.','lock')}</div>`}`;
  }
  const faq = [
    ['How do I publish a listing?','Open Rentals, choose Settings for a property, and use Status, Marketing and Syndication to configure it. Save settings to keep your changes in the browser.'],
    ['How do I practice a showing?','Open Leads and select a prospect. Choose Schedule showing and enter a date, time and method. Use Complete showing to record a rating or comment.'],
    ['How are inquiries screened?','Each rental has practice income, move-in, pet, co-signer and custom question rules. New inquiry evaluates these rules and records the reasons for a review.'],
    ['How do I practice a one-time access code?','Open Access, choose a practice device and select Get code. The generated code is a sandbox value you can look up in the Access log.'],
    ['Where are reports and exports?','Open Reports to find standard and scheduled reports. Choose a standard report, apply filters and use Download CSV. A rental’s Owner report tab contains its funnel and feedback.'],
    ['How do I start over?','Reset practice data restores the fictional portfolio and clears tutorial progress in this browser.'],
  ];
  function helpView() {
    return `${heading('Help','Answers for common tasks in the practice workspace.')}
      <section class="panel" data-cue="help-list">${section('Practice help center','',searchField('faq-search','','Search questions'))}
        <div id="faq-list" class="faq-list">${faq.map(([q,a]) => `<details data-faq="${text(`${q} ${a}`.toLowerCase())}"><summary>${text(q)}</summary><p>${text(a)}</p></details>`).join('')}</div></section>`;
  }

  function activeLesson() { return lessons.find(l => l.id === state.lesson); }
  function stepNumber(lesson) { return state.course[lesson.id] || 0; }
  function activeStep() { const lesson = activeLesson(); return lesson?.steps[stepNumber(lesson)]; }
  function drawCoach() {
    coach.hidden = state.mode !== 'guided';
    document.body.classList.toggle('guided',!coach.hidden);
    document.querySelectorAll('[data-highlight]').forEach(e => e.removeAttribute('data-highlight'));
    document.querySelectorAll('[data-action="mode"]').forEach(el => el.setAttribute('aria-pressed',String(el.dataset.value === state.mode)));
    if (coach.hidden) { coach.innerHTML = ''; return; }
    const completed = lessons.filter(l => stepNumber(l) === l.steps.length).length;
    const lesson = activeLesson();
    const count = lesson ? stepNumber(lesson) : 0;
    const step = lesson?.steps[count];
    const reference = step ? references[lesson.id]?.[count] : '';
    const referenceLink = reference ? `<a class="step-reference text-link" href="https://github.com/huzshk0707/tenant-turner-demo/blob/main/screenshots/${reference}.jpg" target="_blank" rel="noopener noreferrer">See demo screenshot at ${reference.slice(0,2)}:${reference.slice(2,4)} ${icon('arrow',14)}</a>` : '';
    const header = `${button('Tutorial step','open-coach',{classes:'btn primary coach-dock',symbol:'spark'})}<div class="coach-head"><span class="coach-symbol">${icon('spark',19)}</span><div><strong>Tutorial</strong><small>${completed} of ${lessons.length} lessons complete</small></div></div>`;
    if (coachList || !lesson) {
      coach.innerHTML = `${header}<div class="coach-body"><h2>Choose a lesson</h2><p>Work through one workflow at a time.</p><div class="lesson-list">${lessons.map(l => {
        const n = stepNumber(l);
        return `<button class="lesson-card" data-action="start-lesson" data-value="${l.id}" type="button"><span class="lesson-icon">${icon(n === l.steps.length ? 'check' : l.icon,19)}</span><span><strong>${text(l.name)}</strong><small>${n === l.steps.length ? 'Completed' : n ? `${n} of ${l.steps.length} steps` : l.duration}</small></span>${icon('chevron',15)}</button>`;
      }).join('')}</div></div>`;
      return;
    }
    coach.innerHTML = `${header}<div class="coach-body">${button('All lessons','lesson-list',{classes:'btn text small',symbol:'back'})}
      <h2>${text(lesson.name)}</h2><p>${text(lesson.description)}</p>
      <progress value="${count}" max="${lesson.steps.length}" aria-label="Lesson progress"></progress>
      <ol class="step-list">${lesson.steps.map(([label],i) => `<li class="${i < count ? 'done' : i === count ? 'current' : ''}" ${i === count ? 'aria-current="step"' : ''}><span>${i < count ? icon('check',14) : i+1}</span>${text(label)}</li>`).join('')}</ol>
      ${step ? `<div class="step-instruction"><h3>${text(step[0])}</h3><p>${text(step[1])}</p>${button('Show me where','follow-lesson',{classes:'btn primary',symbol:'arrow'})}${referenceLink}</div>` :
      `<div class="step-instruction"><h3>Lesson complete</h3><p>Choose another lesson or try the workflow again.</p><div class="action-row">${button('Next lesson','next-lesson',{classes:'btn primary'})}${button('Restart lesson','restart-lesson',{classes:'btn text small'})}</div></div>`}</div>`;
    if (step) locateCue(step[2])?.setAttribute('data-highlight','true');
  }
  function learn(...events) {
    if (state.mode !== 'guided' || coachList) return;
    const lesson = activeLesson();
    const step = activeStep();
    if (!step || !events.includes(step[3])) return;
    state.course[lesson.id] = stepNumber(lesson) + 1;
    persist();
    drawCoach();
    if (stepNumber(lesson) === lesson.steps.length) notice(`Lesson complete: ${lesson.name}`);
  }
  function locateCue(cue) {
    return [...document.querySelectorAll('[data-cue]')].find(el => el.dataset.cue === cue && !el.hidden);
  }
  function scrollToCue(cue, focus = true) {
    const target = locateCue(cue);
    if (!target) return;
    if (focus && document.activeElement?.closest('#coach') && window.innerWidth < 1200) coach.classList.add('docked');
    target.scrollIntoView({ block:'nearest', behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    if (!focus) return;
    const ctrl = target.matches('a,button,input,select,textarea') ? target : target.querySelector('a,button,input,select,textarea');
    ctrl?.focus({ preventScroll:true });
  }
  function render() {
    const [page,id,tab] = route;
    const areaName = currentSection();
    $('.rail').classList.toggle('is-open',mobileMenu);
    $('#primary').innerHTML = nav.map(([key,label,symbol]) => `<a href="${href([key])}" data-nav="${key}" class="rail-link ${areaName === key ? 'selected' : ''}" ${areaName === key ? 'aria-current="page"' : ''}>${icon(symbol)}<span>${label}</span></a>`).join('');
    $('#reset-icon').innerHTML = icon('reset',19);
    const label = nav.find(item => item[0] === areaName)?.[1] || 'Rentals';
    const name = page === 'rental' ? byRental(id)?.name : page === 'lead' ? byLead(id)?.name : page === 'report' ? reportTitle(id) : '';
    $('#breadcrumb').innerHTML = `<span class="workspace-name">Workspace</span>${icon('chevron',14)}${name ? `${anchor([areaName],label)}${icon('chevron',14)}<strong>${text(name)}</strong>`:`<strong>${label}</strong>`}`;
    switch (page) {
      case 'rental': content.innerHTML = byRental(id) ? rentalDetail(byRental(id),tab) : heading('Rental unavailable') + anchor(['rentals'],'Back to rentals',{classes:'btn outline'}); break;
      case 'leads': content.innerHTML = heading('Leads','Review inquiries and move prospects through the leasing pipeline.') + leadsView(); break;
      case 'lead': content.innerHTML = byLead(id) ? leadDetail(byLead(id)) : heading('Lead unavailable') + anchor(['leads'],'Back to leads',{classes:'btn outline'}); break;
      case 'showings': content.innerHTML = showingsView(); break;
      case 'reports': content.innerHTML = reportsView(tab); break;
      case 'report': content.innerHTML = reportView(id); break;
      case 'access': content.innerHTML = accessView(tab); break;
      case 'help': content.innerHTML = helpView(); break;
      default: content.innerHTML = rentalsView(); refreshRentalGrid();
    }
    if ($('#leads-result')) refreshLeads();
    drawCoach();
  }
  function commit(message, ...events) {
    persist();
    render();
    if (message) notice(message);
    learn(...events);
  }
  function modalForm(title, body, submit, fn, hint = '') {
    modalOpener = document.activeElement;
    modalSave = fn;
    modal.innerHTML = `<form id="dialog-form"><div class="dialog-head"><div><h2 id="modal-title">${text(title)}</h2>${hint ? `<p>${text(hint)}</p>`:''}</div>${button('', 'close-modal',{symbol:'close',classes:'icon-button',attrs:'aria-label="Close dialog"'})}</div><div class="dialog-body form-grid">${body}</div><p class="dialog-error" role="alert" hidden></p><div class="dialog-footer">${button('Cancel','close-modal',{classes:'btn outline'})}<button type="submit" class="btn primary">${text(submit)}</button></div></form>`;
    if (!modal.open) modal.showModal();
  }
  function modalInfo(title, body) {
    modalSave = null;
    modal.innerHTML = `<div class="dialog-head"><h2 id="modal-title">${text(title)}</h2>${button('', 'close-modal',{symbol:'close',classes:'icon-button',attrs:'aria-label="Close dialog"'})}</div><div class="dialog-body">${body}</div><div class="dialog-footer">${button('Done','close-modal',{classes:'btn primary'})}</div>`;
    if (!modal.open) modal.showModal();
  }
  function confirm(title, description, label, fn) {
    modalForm(title,`<p class="span">${text(description)}</p>`,label,fn);
  }
  function val(fd,key) { return String(fd.get(key) || '').trim(); }
  function num(fd,key) { return Number(fd.get(key)); }
  const isChecked = (fd,key) => fd.has(key);
  function required(fd,key,label) {
    const result = val(fd,key);
    if (!result) throw new Error(`Enter ${label}.`);
    return result;
  }
  function error(message) { notice(message); }

  const settingGroups = {
    'save-marketing':['name','address','type','rent','deposit','term','beds','baths','sqft','available','tourUrl','photo','description','amenities','utilities'],
    'save-syndication':['syndication'], 'save-application':['application','applicationFee','adminFee'],
    'save-rules':['incomeRatio','moveDays','pets','petMax','coSigner'], 'save-question':['questions'],
    'save-waitlist':['waitlist','waitMessage'], 'save-self-access':['selfAccess','viewingType','appointmentType','requireId','instructions'],
    'save-in-person':['inPerson','duration','notice','buffer','maxShowings','limit','notifyOccupants'],
  };
  function saveSettings(fd) {
    const r = byRental(route[1]);
    if (!r) return;
    const updated = { ...r };
    const boolean = ['active','pets','coSigner','waitlist','selfAccess','requireId','inPerson','notifyOccupants'];
    const numeric = ['rent','deposit','term','beds','baths','sqft','incomeRatio','moveDays','petMax','duration','notice','buffer','maxShowings','applicationFee','adminFee'];
    for (const key of boolean) updated[key] = isChecked(fd,key);
    for (const key of numeric) updated[key] = num(fd,key);
    for (const key of ['name','address','type','assignee','available','tourUrl','photo','description','amenities','utilities','waitMessage','viewingType','appointmentType','instructions','limit','application']) updated[key] = val(fd,key);
    if (!updated.name || !updated.address) { error('Enter a listing name and address.'); return; }
    updated.syndication = fd.getAll('site').filter(site => D.sites.includes(site));
    const answers = fd.getAll('answer');
    updated.questions = fd.getAll('question').map((q,i) => ({prompt:String(q).trim(),answer:answers[i]})).filter(q => q.prompt);
    const events = Object.entries(settingGroups).filter(([,keys]) => keys.some(key => JSON.stringify(r[key]) !== JSON.stringify(updated[key]))).map(([event]) => event);
    const assigned = showingDevice(r);
    const chosen = state.devices.find(d => d.id === val(fd,'deviceId') && (!d.rentalId || d.rentalId === r.id));
    updated.showingDeviceId = chosen?.id || '';
    if (assigned?.id !== chosen?.id) {
      if (assigned) assigned.rentalId = '';
      if (chosen) chosen.rentalId = r.id;
      events.push('save-self-access');
    }
    Object.assign(r,updated);
    commit('Rental settings saved.',...(r.id === 'r1' ? events : []));
  }
  function addRental() {
    modalForm('Add rental',`${field('Listing name','name','',{required:true,attrs:'maxlength="70"'})}${field('Address','address','',{required:true,attrs:'maxlength="120"'})}${moneyField('Monthly rent','rent',2100)}${select('Assigned to','assignee',D.people,D.people[0])}${field('Available on','available',D.date(7),{type:'date',required:true})}${select('Property type','type',['House','Apartment','Condo','Townhouse'],'House')}`,'Add rental',fd => {
      const rent = num(fd,'rent');
      state.rentals.unshift(D.rental(uid('r'),required(fd,'name','a listing name'),required(fd,'address','an address'),D.photos[state.rentals.length % D.photos.length],{rent,deposit:rent,assignee:val(fd,'assignee'),available:val(fd,'available'),type:val(fd,'type'),listingSince:D.date()}));
      rentalFilters.search = '';
      rentalFilters.assignee = '';
      rentalFilters.status = 'All rentals';
      commit('Rental added.','add-rental');
    });
  }
  function inquiryQuestions(r) {
    return r?.questions.map((q,i) => select(q.prompt,`screen-${i}`,['Yes','No'],'Yes')).join('') || '';
  }
  function addLead(id) {
    const chosen = byRental(id) || state.rentals.find(r => r.active) || state.rentals[0];
    modalForm('New inquiry',`${select('Rental','rental',state.rentals.map(r => [r.id,r.name]),chosen.id,'id="inquiry-rental"')}${field('Lead name','name','',{required:true,attrs:'maxlength="80"'})}${field('Practice email','email','',{type:'email',required:true})}${field('Practice phone','phone','(202) 555-0140',{type:'tel'})}${select('Lead source','source',[...D.sites,'Website','Referral','Other'],'Website')}${select('Channel','channel',['Web','Phone','Email'],'Web')}${field('Move-in date','moveIn',D.date(15),{type:'date',required:true})}${moneyField('Monthly income','income',7200)}${numberField('Pets','pets',0,0,20)}${check('Has a co-signer','coSigner',false)}<div class="span form-grid" id="inquiry-custom">${inquiryQuestions(chosen)}</div>`,'Save inquiry',fd => {
      const r = byRental(val(fd,'rental'));
      const l = D.lead(uid('l'),r.id,required(fd,'name','a lead name'),{email:val(fd,'email'),phone:val(fd,'phone'),source:val(fd,'source'),channel:val(fd,'channel'),moveIn:val(fd,'moveIn'),income:num(fd,'income'),pets:num(fd,'pets'),coSigner:isChecked(fd,'coSigner'),created:D.date(),timeline:[{date:D.date(),text:'Practice inquiry received'}]});
      const maxDate = D.date(r.moveDays);
      const reasons = [];
      if (l.income < r.rent*r.incomeRatio && !(r.coSigner && l.coSigner)) reasons.push(`Monthly income is below ${r.incomeRatio} × the listed rent.`);
      if (l.moveIn > maxDate) reasons.push(`Move-in falls outside the ${r.moveDays}-day practice window.`);
      if (l.pets && (!r.pets || l.pets > r.petMax)) reasons.push('Pet count exceeds this rental’s practice limit.');
      l.screening = r.questions.map((q,i) => ({ prompt:q.prompt,answer:val(fd,`screen-${i}`) }));
      r.questions.forEach((q,i) => { if (q.answer !== 'None' && q.answer !== l.screening[i].answer) reasons.push(`Review custom response: ${q.prompt}`); });
      l.reasons = reasons;
      l.qualified = !reasons.length;
      l.stage = reasons.length ? 'Needs review' : r.waitlist ? 'Waitlisted' : 'Qualified';
      l.timeline.push({date:D.date(),text:`Practice screening: ${l.stage}`});
      if (reasons.length) r.alert = true;
      state.leads.unshift(l);
      leadFilters.search = '';
      leadFilters.stage = '';
      commit(`Inquiry saved. ${l.stage}.`,'add-lead');
    },'Enter sample answers to see how this rental’s qualification rules route the lead.');
  }
  function logLead(l,text) { l.timeline.push({date:D.date(),text}); }
  function leadStage(stage, id = route[1]) {
    const l = byLead(id);
    if (!l || !D.stages.includes(stage)) return;
    l.stage = stage;
    if (stage === 'Qualified') l.qualified = true;
    if (stage === 'Needs review') l.qualified = false;
    if (stage === 'New inquiry') l.qualified = null;
    logLead(l,`Stage changed to ${stage}`);
    const r = byRental(l.rentalId);
    r.alert = atRental(r.id).some(row => ['Needs review','New inquiry'].includes(row.stage));
    commit('Lead stage updated.',...(['Qualified','Needs review'].includes(stage) && l.id === 'l1' ? ['review-lead'] : []));
  }
  function bookShowing() {
    const l = byLead(route[1]);
    const r = byRental(l.rentalId);
    const methods = [r.inPerson && 'In person',r.selfAccess && 'Self access'].filter(Boolean);
    if (!methods.length) { notice('Enable a viewing method in rental settings first.'); return; }
    modalForm(l.showingDate ? 'Reschedule showing' : 'Schedule showing',`${field('Date','date',l.showingDate >= D.date() ? l.showingDate : D.date(Math.max(2,Math.ceil(r.notice/24)+1)),{type:'date',required:true,attrs:`min="${D.date()}"`})}${field('Time','time',l.showingTime || '11:00',{type:'time',required:true})}${select('Viewing method','method',methods,l.showingMethod || methods[0])}`,'Save showing',fd => {
      const method = val(fd,'method');
      if (method === 'Self access' && r.requireId && !l.verified) throw new Error('Mark the practice ID as reviewed first, or choose an in-person tour.');
      const date = val(fd,'date'); const time = val(fd,'time');
      const start = new Date(`${date}T${time}`).getTime();
      const length = r.duration * 60000;
      if (start < Date.now() + r.notice * 3600000) throw new Error(`Choose a time at least ${r.notice} hours from now.`);
      const sameDay = atRental(r.id).filter(other => other.id !== l.id && other.stage === 'Showing scheduled' && other.showingDate === date);
      const overlaps = sameDay.filter(other => Math.abs(new Date(`${date}T${other.showingTime}`).getTime() - start) < length);
      if (r.limit === 'One showing per day' && sameDay.length) throw new Error('This rental allows one showing per day. Choose another day.');
      if (overlaps.length >= r.maxShowings) throw new Error('The practice slot is full. Choose another time.');
      l.showingDate = date; l.showingTime = time; l.showingMethod = method;
      const request = method === 'Self access' && r.appointmentType === 'Take requests';
      l.stage = request ? 'Showing requested' : 'Showing scheduled';
      logLead(l,`${l.stage} for ${dayText(l.showingDate)} at ${timeText(l.showingTime)}`);
      if (!request && r.notifyOccupants) logLead(l,'Practice viewing notice recorded for occupants');
      commit(request ? 'Showing request saved.' : 'Showing saved.',...(l.id === 'l1' ? ['book-showing'] : []));
    });
  }
  function finishShowing() {
    const l = byLead(route[1]);
    if (!l?.showingDate || l.stage === 'Showing requested') return;
    modalForm('Complete showing',`${select('Rating','rating',[['0','No rating'],'1','2','3','4','5'],String(l.rating))}${area('Feedback','feedback',l.feedback,3)}`,'Record completion',fd => {
      l.rating = num(fd,'rating'); l.feedback = val(fd,'feedback'); l.stage = 'Viewing completed';
      logLead(l,'Showing completed');
      commit('Showing marked complete.',...(l.id === 'l1' ? ['finish-showing'] : []));
    });
  }
  function saveAvailability(message,...events) {
    if (route[2] !== 'settings') { commit(message,...events); return; }
    persist();
    $('#availability-panel').outerHTML = availabilityView(byRental(route[1]));
    drawCoach();
    notice(message);
    learn(...events);
  }
  function scheduleSlot(id, scope = 'General') {
    const r = byRental(route[1]);
    const existing = timeBlocks(r).find(a => a.id === id);
    const row = existing || {id:uid('slot'),scope,agent:r.assignee,day:'Saturday',start:'10:00',end:'13:00',repeat:true};
    modalForm(existing ? 'Edit time block':'Add time block',`${select('Scope','scope',['General','Rental'],row.scope)}${select('Team member','agent',D.people,row.agent)}${select('Day','day',D.days,row.day)}${field('Start','start',row.start,{type:'time',required:true})}${field('End','end',row.end,{type:'time',required:true})}${check('Repeat weekly','repeat',row.repeat)}`,'Save time block',fd => {
      const start = val(fd,'start'); const end = val(fd,'end');
      if (start >= end) throw new Error('End time must be later than start time.');
      const newRow = {...row,scope:val(fd,'scope'),agent:val(fd,'agent'),day:val(fd,'day'),start,end,repeat:isChecked(fd,'repeat')};
      if (existing) {
        const oldRows = existing.scope === 'General' ? state.teamAvailability : r.availability;
        oldRows.splice(oldRows.indexOf(existing),1);
      }
      const targetRows = newRow.scope === 'General' ? state.teamAvailability : r.availability;
      targetRows.push(newRow);
      const event = existing ? 'edit-slot' : newRow.scope === 'General' ? 'add-general-slot' : 'add-rental-slot';
      saveAvailability('Availability saved.',...(r.id === 'r1' ? [event] : []));
    });
  }
  function scheduleReport(id) {
    const existing = state.schedules.find(s => s.id === id);
    const row = existing || {id:uid('report'),report:'activity',frequency:'Weekly',email:'analytics@example.com',time:'09:00'};
    modalForm(existing ? 'Edit report schedule':'Add report schedule',`${select('Report','report',reports.map(([id,title]) => [id,title]),row.report)}${select('Frequency','frequency',['Daily','Weekly','Monthly'],row.frequency)}${field('Recipient email','email',row.email,{type:'email',required:true})}${field('Delivery time','time',row.time,{type:'time',required:true})}`,'Save schedule',fd => {
      Object.assign(row,{report:val(fd,'report'),frequency:val(fd,'frequency'),email:val(fd,'email'),time:val(fd,'time')});
      if (!existing) state.schedules.push(row);
      commit('Practice report schedule saved.',...(!existing ? ['add-schedule'] : []));
    },'Schedules are stored in this browser for practice.');
  }
  function csvDownload() {
    const id = route[1];
    const {columns,data} = rowsForReport(id,reportFilters[id] || {});
    const escapeCell = cell => {
      const value = String(cell ?? '');
      const safe = /^[\s]*[=+@-]/.test(value) ? `'${value}` : value;
      return `"${safe.replace(/"/g,'""')}"`;
    };
    const csv = [columns,...data].map(row => row.map(escapeCell).join(',')).join('\r\n');
    const objectUrl = URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
    const a = document.createElement('a'); a.href = objectUrl; a.download = `leasing-lab-${reports.some(r => r[0] === id) ? id : 'report'}.csv`; a.click();
    setTimeout(() => URL.revokeObjectURL(objectUrl),1000);
    notice('Practice report downloaded.');
    learn('export-report');
  }

  function editDevice(id, model) {
    const existing = state.devices.find(d => d.id === id);
    const row = existing || {id:uid('device'),serial:'',model,rentalId:'',state:'Ready'};
    modalForm(existing ? 'Device settings':'Add device',`${field('Device label','serial',row.serial,{required:true,attrs:'maxlength="40"'})}${select('Device type','model',D.devices,row.model)}${select('Assigned rental','rental',[['','Unassigned'],...state.rentals.map(r => [r.id,r.name])],row.rentalId)}${select('Status','state',['Ready','Needs service'],row.state)}`,'Save device',fd => {
      const serial = required(fd,'serial','a practice device label');
      if (state.devices.some(d => d.id !== row.id && d.serial.toLowerCase() === serial.toLowerCase())) throw new Error('That device label is already in use.');
      const assigned = row.rentalId !== val(fd,'rental') && Boolean(val(fd,'rental'));
      Object.assign(row,{serial,model:val(fd,'model'),rentalId:val(fd,'rental'),state:val(fd,'state')});
      if (!existing) state.devices.push(row);
      commit('Practice device saved.',...(assigned ? ['assign-device'] : []));
    });
  }
  function createCode(id, simulateSend) {
    const d = state.devices.find(row => row.id === id);
    if (!d || d.state !== 'Ready') return;
    modalForm(simulateSend ? 'Simulate sending a code':'Generate practice code',`${field('Intended recipient','name','Practice vendor',{required:true,attrs:'maxlength="80"'})}${field('Practice email','email',simulateSend ? 'vendor@example.com':'',{type:'email',required:simulateSend})}${field('Access date','date',D.date(1),{type:'date',required:true,attrs:`min="${D.date()}"`})}${select('Code type','type',['One-time','Day access'],'One-time')}`,simulateSend ? 'Simulate send':'Generate code',fd => {
      const id = uid('access');
      const code = `SIM-${id.split('-').slice(1).join('').slice(0,8).toUpperCase()}`;
      const row = {id,serial:d.serial,name:required(fd,'name','a recipient name'),date:val(fd,'date'),type:val(fd,'type'),code};
      state.accesses.push(row);
      commit(simulateSend ? 'Simulated access request recorded.':'Practice code added to the access log.','create-code');
      modalInfo('Practice code generated',`<p>For ${text(row.name)} on ${dayText(row.date)}.</p><code class="large-code">${text(code)}</code><p class="muted">This code works only in the practice log.</p>`);
    },'Codes and simulated sends stay in this browser.');
  }
  function editContact(id) {
    const existing = state.contacts.find(c => c.id === id);
    const row = existing || {id:uid('contact'),name:'',company:'',email:'',phone:'',access:'Recurring'};
    modalForm(existing ? 'Edit contact':'Add authorized contact',`${field('Name','name',row.name,{required:true,attrs:'maxlength="80"'})}${field('Company','company',row.company)}${field('Practice email','email',row.email,{type:'email',required:true})}${field('Practice phone','phone',row.phone,{type:'tel'})}${select('Access','access',['Recurring','By request'],row.access)}`,'Save contact',fd => {
      Object.assign(row,{name:required(fd,'name','a contact name'),company:val(fd,'company'),email:val(fd,'email'),phone:val(fd,'phone'),access:val(fd,'access')});
      if (!existing) state.contacts.push(row);
      commit('Authorized contact saved.',...(!existing ? ['add-contact'] : []));
    });
  }
  function removeItem(collection,id,title,message,onRemove = commit) {
    confirm(title,message,'Remove',() => {
      const i = collection.findIndex(item => item.id === id);
      if (i !== -1) collection.splice(i,1);
      onRemove('Removed from the practice workspace.');
    });
  }
  function setMode(mode) {
    if (!['free','guided'].includes(mode)) return;
    state.mode = mode;
    if (!state.lesson) coachList = true;
    coach.classList.remove('docked');
    persist();
    drawCoach();
  }
  function setLesson(id) {
    if (!lessons.some(l => l.id === id)) return;
    state.lesson = id;
    coachList = false;
    coach.classList.remove('docked');
    persist();
    drawCoach();
  }
  function action(key,value,element) {
    switch (key) {
      case 'mobile-nav': mobileMenu = !mobileMenu; $('.rail').classList.toggle('is-open',mobileMenu); break;
      case 'mode': setMode(value); break;
      case 'start-lesson': setLesson(value); break;
      case 'open-coach': coach.classList.remove('docked'); $('.coach-body h2',coach)?.scrollIntoView({block:'nearest'}); break;
      case 'lesson-list': coachList = true; drawCoach(); break;
      case 'follow-lesson': {
        const step = activeStep();
        if (!step) break;
        go(step[4],{focus:false});
        scrollToCue(step[2]);
        if (window.innerWidth < 1200) coach.classList.add('docked');
        break;
      }
      case 'restart-lesson': state.course[state.lesson] = 0; persist(); drawCoach(); break;
      case 'next-lesson': {
        const next = lessons.findIndex(l => l.id === state.lesson) + 1;
        if (lessons[next]) setLesson(lessons[next].id);
        else { coachList = true; drawCoach(); }
        break;
      }
      case 'close-modal': modal.close(); break;
      case 'reset': confirm('Reset practice data?','This restores the sample portfolio and clears your tutorial progress in this browser.','Reset workspace',() => {
        state = D.seed(); coachList = true;
        Object.assign(rentalFilters,{search:'',assignee:'',inactive:false,status:'All rentals'});
        Object.assign(leadFilters,{search:'',archived:false,sort:'Newest',stage:''});
        for (const id of Object.keys(reportFilters)) delete reportFilters[id];
        accessSearch = ''; accessUnassigned = false; showingFilter = 'Upcoming';
        go(['rentals']); commit('Practice data reset.');
      }); break;
      case 'jump': scrollToCue(value); break;
      case 'add-rental': addRental(); break;
      case 'add-lead': addLead(value); break;
      case 'add-question': $('#question-list').insertAdjacentHTML('beforeend',questionRow()); $('#question-list .question-row:last-child input')?.focus(); break;
      case 'remove-question': element.closest('.question-row')?.remove(); break;
      case 'schedule-slot': scheduleSlot(value,element.dataset.scope); break;
      case 'remove-slot': {
        const r = byRental(route[1]);
        const slot = timeBlocks(r).find(item => item.id === value);
        if (slot) removeItem(slot.scope === 'General' ? state.teamAvailability : r.availability,value,'Remove time block?',slot.scope === 'General' ? 'Remove this team time block from every rental.' : 'Remove this showing availability from the rental.',saveAvailability);
        break;
      }
      case 'lead-stage': leadStage(value); break;
      case 'lead-row-stage': {
        const l = byLead(value);
        if (l) leadStage(l.stage === 'Archived' ? 'New inquiry' : 'Archived',l.id);
        break;
      }
      case 'verify-id': {
        const l = byLead(route[1]);
        l.verified = !l.verified;
        logLead(l,l.verified ? 'Practice ID marked reviewed':'Practice ID review cleared');
        commit('Identity check updated.'); break;
      }
      case 'book-showing': bookShowing(); break;
      case 'finish-showing': finishShowing(); break;
      case 'confirm-showing': {
        const l = byLead(route[1]);
        if (l.stage !== 'Showing requested') break;
        l.stage = 'Showing scheduled';
        logLead(l,'Practice showing request confirmed');
        if (byRental(l.rentalId).notifyOccupants) logLead(l,'Practice viewing notice recorded for occupants');
        commit('Showing request confirmed.');
        break;
      }
      case 'cancel-showing': confirm('Cancel showing?','Return this inquiry to the lead queue for rescheduling.','Cancel showing',() => {
        const l = byLead(route[1]);
        l.showingDate = ''; l.showingTime = ''; l.showingMethod = ''; l.stage = l.qualified ? 'Qualified' : 'Needs review';
        logLead(l,'Practice showing canceled'); commit('Showing canceled.');
      }); break;
      case 'toggle-feedback': {
        const l = byLead(value);
        l.feedbackHidden = !l.feedbackHidden;
        commit(l.feedbackHidden ? 'Feedback hidden from the owner report.':'Feedback included in the owner report.','toggle-feedback');
        break;
      }
      case 'report-schedule': scheduleReport(value); break;
      case 'remove-report-schedule': removeItem(state.schedules,value,'Remove schedule?','Remove this practice delivery schedule.'); break;
      case 'csv': csvDownload(); break;
      case 'device-settings': editDevice(value); break;
      case 'device-add': editDevice('',value); break;
      case 'get-code': createCode(value,false); break;
      case 'send-code': createCode(value,true); break;
      case 'contact': editContact(value); break;
      case 'remove-contact': removeItem(state.contacts,value,'Remove authorized contact?','Remove this person from the practice access list.'); break;
    }
  }
  document.addEventListener('click',event => {
    const navLink = event.target.closest('[data-nav]');
    if (navLink && !(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) {
      event.preventDefault(); go(parseRoute(navLink.dataset.nav)); return;
    }
    const trigger = event.target.closest('[data-action]');
    if (trigger && !trigger.disabled) action(trigger.dataset.action,trigger.dataset.value,trigger);
  });
  document.addEventListener('submit',event => {
    const form = event.target;
    if (form.id !== 'dialog-form' && !form.dataset.form) return;
    event.preventDefault();
    const fd = new FormData(form);
    if (form.id === 'dialog-form' && modalSave) {
      const save = modalSave;
      try { save(fd); if (modalSave === save) modal.close(); }
      catch (err) { const msg = $('.dialog-error',modal); if (msg) { msg.hidden = false; msg.textContent = err.message; } }
      return;
    }
    switch (form.dataset.form) {
      case 'rental-settings': saveSettings(fd); break;
      case 'lead-note': {
        const note = val(fd,'note');
        if (!note) { error('Enter a note first.'); break; }
        const l = byLead(route[1]); l.notes.push({date:D.date(),text:note}); logLead(l,'Internal note added');
        commit('Note added.',...(l.id === 'l1' ? ['add-note'] : [])); break;
      }
      case 'owner-schedule': {
        const r = byRental(route[1]);
        r.ownerReport = {enabled:isChecked(fd,'enabled'),feedback:isChecked(fd,'feedback'),day:val(fd,'day'),time:val(fd,'time'),email:val(fd,'email')};
        commit('Practice delivery preferences saved.',...(r.ownerReport.enabled ? ['schedule-owner'] : [])); break;
      }
      case 'report-filters': {
        const start = val(fd,'start'); const end = val(fd,'end');
        if (start && end && start > end) { error('Through date must be on or after the from date.'); break; }
        reportFilters[route[1]] = {rental:val(fd,'rental'),source:val(fd,'source'),start,end,active:isChecked(fd,'active')};
        render(); notice('Report filters applied.'); learn('filter-report'); break;
      }
    }
  });
  modal.addEventListener('close',() => {
    if (modal.open) return;
    modalSave = null;
    modal.replaceChildren();
    if (modalOpener?.isConnected) modalOpener.focus();
    else content.focus({preventScroll:true});
  });
  document.addEventListener('input',event => {
    const {id,value} = event.target;
    if (id === 'rental-search') {
      rentalFilters.search = value; refreshRentalGrid();
      if (value.toLowerCase().includes('rosewood')) learn('search-rental');
      if (state.mode === 'guided' && !coachList && activeStep()) locateCue(activeStep()[2])?.setAttribute('data-highlight','true');
    }
    if (id === 'lead-search') { leadFilters.search = value; refreshLeads(); }
    if (id === 'access-search') {
      accessSearch = value;
      const cursor = event.target.selectionStart;
      render(); const next = $('#access-search'); next?.focus(); next?.setSelectionRange(cursor,cursor);
    }
    if (id === 'faq-search') document.querySelectorAll('[data-faq]').forEach(row => { row.hidden = !row.dataset.faq.includes(value.toLowerCase()); });
  });
  document.addEventListener('change',event => {
    const {id,value,checked} = event.target;
    const rentalMap = { 'rental-status':['status',value], 'rental-assignee':['assignee',value], 'rental-inactive':['inactive',checked] };
    const leadMap = { 'lead-stage':['stage',value], 'lead-sort':['sort',value], 'lead-archived':['archived',checked] };
    if (rentalMap[id]) { const [key,val] = rentalMap[id]; rentalFilters[key] = val; refreshRentalGrid(); drawCoach(); }
    if (leadMap[id]) { const [key,val] = leadMap[id]; leadFilters[key] = val; refreshLeads(); }
    if (id === 'showing-filter') { showingFilter = value; render(); $('#showing-filter')?.focus(); }
    if (id === 'unassigned') { accessUnassigned = checked; render(); $('#unassigned')?.focus(); }
    if (id === 'inquiry-rental') $('#inquiry-custom').innerHTML = inquiryQuestions(byRental(value));
  });
  content.addEventListener('toggle',event => { if (event.target.matches?.('details[data-faq]') && event.target.open) learn('open-answer'); },true);
  window.addEventListener('popstate',() => go(parseRoute(location.hash),{historyEntry:false}));
  window.addEventListener('hashchange',() => { if (location.hash !== '#content') go(parseRoute(location.hash),{historyEntry:false}); });
  go(parseRoute(location.hash),{focus:false,historyEntry:false});
})();
