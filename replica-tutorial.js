'use strict';

(() => {
  const step = (title,text,route,target,event,reference,expect) => ({title,text,route,target,event,reference,expect});
  const setting = (section='status',rentalId='r1') => ({section:'settings',rentalId,jump:section});
  const waitList = setting('viewing','r2');
  const route = section => ({section});
  const includes = key => data => data.changed?.includes(key);
  const chapters = [
    {id:'rentals',title:'Find a rental and open Settings', time:'00:00–01:24',steps:[
      step('Find a rental','From Rentals, set User to anyone and type Wren in Search. Look for the practice listing at 24 Wren Lane.',route('rentals'),'#searchInput','rental-search','0000-rentals',data=>/wren/i.test(data.query || '')),
      step('Open its Settings','Choose SETTINGS on the 24 Wren Lane card. Check the four rental tabs in the header.',route('rentals'),'button[data-open-settings="r1"]','rental-settings','0125-rental-settings',data=>data.rentalId==='r1'),
    ]},
    {id:'marketing',title:'Status, marketing and syndication',time:'01:24–02:23',steps:[
      step('Review Status','Change the rental’s assigned user to another practice agent. Scroll to the bottom and choose Save Rental Settings.',setting(),'#stAssignee','settings','0125-rental-settings',includes('assignee')),
      step('Review imported fields and photos','Marketing shows locked rent and property fields on an imported rental. Expand Visuals to review the virtual tour field and listing photos. Then expand Amenities.',setting('marketing'),'#sec-marketing .accordion-btn','amenities','0200-photos'),
      step('Set a syndication channel','Change a listing channel, then save the rental. Compare with the combined Zillow, Trulia, & HotPads switch in the recording.',setting('marketing'),'.syn-toggle','settings','0215-syndication',includes('syndication')),
    ]},
    {id:'qualifying',title:'Qualifying rules and custom questions',time:'02:23–03:04',steps:[
      step('Change a restriction','In Qualifying, change a practice income, move-in or pet rule. Save Rental Settings.',setting('qualifying'),'#qIncomeRatio','settings','0232-qualifying',data=>data.changed?.includes('qualifying') && !data.changed.includes('questions')),
      step('Set a knockout answer','Add a fictional custom question, mark one answer as Knockout, and save. Try that answer when you practice qualifying a lead.',setting('qualifying'),'#add-custom-question','settings','0253-custom-questions',includes('questions')),
    ]},
    {id:'waitlist',title:'Wait list and reopening viewings',time:'03:04–03:28',steps:[
      step('Set a wait-list message','Open Viewing for the unit at 16 Juniper Way. Turn on Wait List if needed, change the practice message, and save.',waitList,'#vwWaitlist','settings','0314-wait-list',data=>data.rentalId==='r2' && data.waitlist && data.changed?.includes('waitlistMessage')),
      step('Open viewings again','Turn off Wait List and save. Any qualified practice leads waiting on this rental receive a simulated reopening message.',waitList,'#vwWaitlist','settings','0314-wait-list',data=>data.rentalId==='r2' && data.waitlist===false && data.changed?.includes('waitlist')),
    ]},
    {id:'methods',title:'Self-access, devices and in-person showings',time:'03:28–06:28',steps:[
      step('Set self-access controls','Under Viewing, change Viewing Approval or the practice ID requirement, then save the settings.',setting('viewing'),'#vwApproval','settings','0337-self-access',includes('self-access')),
      step('Assign a practice device','Use the device selector to pick a different practice box, then save. Keep any real access details out of the practice record.',setting('viewing'),'#vwAssignedDevice','settings','0548-device-assignment',includes('device')),
      step('Configure in-person showings','Change a setting such as capacity, duration, travel buffer or scheduling notice. Save Rental Settings.',setting('viewing'),'#vwInPerson','settings','0605-in-person',includes('in-person')),
      step('Set a showing limit','Choose an option under Limit Showings and save. The daily trip option keeps the same showing agent at the rental for overlapping or back-to-back tours.',setting('viewing'),'#ipVisitLimit','settings','0620-showing-limit',includes('limits')),
    ]},
    {id:'self-access-practice',title:'Self-viewings, scams and automatic replies',time:'03:28–06:00 · guided practice',steps:[
      {title:'Choose the viewing method',text:'The manager enables self-access on a suitable vacancy, assigns its lockbox and sets available hours and ID requirements. A listing inquiry triggers a scheduling invitation. When does the prospect get to choose a time?',route:setting('viewing'),target:'#vwSelfAccess',reference:'0337-self-access',
        choices:['Immediately after sending an inquiry','After meeting the criteria and clearing any required review'],answer:1,hint:'An invitation starts screening. It does not grant property access.'},
      {title:'Recognize the scam',text:'Someone copies a rental listing, claims to be the owner and asks a visitor to send a deposit after a self-tour. The visitor sees a warning at the door. What should they do?',route:setting('viewing'),target:'.blue-subpanel .availability-note',reference:'0337-self-access',
        choices:['Verify the listing through the management office before paying','Treat access to the home as proof of ownership'],answer:0,hint:'A successful tour does not establish who owns the listing or is entitled to payment.'},
      {title:'Handle a flagged identity',text:'The presenter describes identity checks and an optional government ID. A possible fraud match holds scheduling and alerts staff. On the lead profile you can request a new ID when the supplied one needs review. What should staff do with a flag?',route:{section:'practice-prospect',id:'lead_r1_2'},target:'#ldRequestId',timestamp:'07m27s',
        choices:['Send a code while the review is pending','Hold access and review the flag'],answer:1,hint:'A flag calls for staff review. Keep the access request on hold.'},
      {title:'Check in for a self-viewing',text:'In the recorded CodeBox example, a cleared prospect confirms and arrives at the assigned home. The official showing instructions tell them how to identify the box. In this example the code is good for the visit date and for 90 minutes after activation. What should they receive at check-in?',route:route('practice-prospect'),target:'.prospect-visit',timestamp:'05m38s',
        choices:['A unique, time-limited code for that visit','A reusable code to pass to the next visitor'],answer:0,hint:'The demo describes a code valid for that date and a 90-minute window after activation. Other devices can work differently.'},
      step('Reply to the prospect','In Messages, read the automated showing confirmation and the prospect’s follow-up. The recorded workflow sends invitations, reminders and post-tour feedback/application links. A question left for staff needs a reply. Type a practice answer and choose Send.',route('practice-conversation'),'#msgReplyInput','reply',null,data=>data.threadId==='msg1'),
    ]},
    {id:'availability',title:'Availability and application fees',time:'06:28–06:58',steps:[
      step('Set General Availability','In Rental Settings → Viewing, turn on General Availability and open Edit Availability on a showing agent’s card. Change their weekly hours and choose Save Rental Settings.',setting('viewing'),'#inline-general-enabled','settings','0633-general-availability',includes('general-availability')),
      step('Set rental-specific availability','Turn on Rental-Specific Availability. Set hours, manager, approval and capacity. Choose whether the block repeats weekly and save. The rental block takes priority when it overlaps general hours.',setting('viewing'),'#inline-custom-enabled','settings','0648-rental-availability',includes('rental-availability')),
      step('Set application fees','Return to Settings → Application & Fees. Update a sample application or admin fee, then click Save Rental Settings.',setting('fees'),'#appFee','settings','0655-application',includes('fees')),
    ]},
    {id:'lead-journey',title:'Lead review, booking and follow-up',time:'06:58–07:42',steps:[
      step('Open the lead queue','Use the rental’s LEADS tab. Turn on Show archived to reveal the practice lead that failed qualification.',route('leads'),'#show-archived-leads','show-archived','0712-lead-queue',data=>data.enabled),
      step('Inspect a lead profile','Select a lead’s name or open the three-dot menu and choose Open profile. Compare Archive, Decline, Edit and Send Message. Scroll through Viewing, Notes, and the Pre-Qualification cards, then use the back arrow to return.',route('leads'),'[data-lead-view]','open-lead','0712-lead-queue',data=>data.rentalId==='r1'),
      step('Send a practice invitation','Choose Add Lead and invite a fictional prospect to pre-qualify. The invitation stays in the local Messages thread.',route('leads'),'#addLeadBtn','lead-invite','0712-lead-queue'),
      step('Practice a qualification decision','Choose Add Lead → Pre-qualify and schedule lead myself. To continue with this lead, enter fictional income that meets the rental’s rule and the required answers to any custom questions. A failed inquiry goes to Show archived.',route('leads'),'#addLeadBtn','lead-screen','0712-lead-queue'),
      step('Book a viewing','Use a qualified lead and an available appointment. Viewings → Upcoming Viewings can select a qualified lead from the practice rental.',route('upcoming'),'#scheduleShowingBtn','showing','0605-in-person'),
      step('Record a viewing outcome','Find a practice viewing, confirm it if required, and record its completion and sample feedback. Open Messages to see the simulated follow-up.',route('upcoming'),'[data-show-action="complete"],[data-show-action="confirm"]','complete','0818-owner-metrics'),
    ]},
    {id:'owners',title:'Owner report and feedback',time:'07:42–08:35',steps:[
      step('Set the recipient','On a rental’s Owner Report, turn on practice delivery and update the recipient email with an example.com address.',route('owner'),'#orEmails','owner-recipient','0745-owner-schedule'),
      step('Review dated feedback','Open a feedback date to review the comment. Choose Hide from owner report or Show on owner report and check the resulting visibility.',route('owner'),'[data-feedback-detail]','owner','0818-owner-metrics'),
    ]},
    {id:'reports',title:'Reports, delivery and exports',time:'08:35–09:33',steps:[
      step('Browse Standard reports','Open Reports → Standard. Find the Rental Activity and Lead Source reports in the catalog.',route('reports'),'[data-report-tab="standard"]','report-tab','0836-report-catalog',data=>data.tab==='standard'),
      step('Schedule a report','Open Scheduled. Set the owner report day/time or enable a standard report with a fictional recipient, then save the schedules.',route('scheduled'),'#owner-day','schedule-report','0842-scheduled-reports'),
      step('Filter Rental Activity','Open Rental Activity Report, pick a user, rental, or date range, and select Filter.',{section:'report',id:'rental_activity'},'#practice-report-filters','filter-report','0853-rental-activity',data=>data.id==='rental_activity'),
      step('Filter Lead Source','Open Lead Source Report, adjust the start date, and select Filter. Inspect the status, channel, source, and partner columns.',{section:'report',id:'lead_source'},'#practice-report-filters','filter-report','0926-lead-source',data=>data.id==='lead_source'),
      step('Export Lead Source','Open the Lead Source Report and compare its source, channel and partner columns. Use Copy, CSV, Excel, PDF or Print.',{section:'report',id:'lead_source'},'#report-export-tools','export','0926-lead-source',data=>data.id==='lead_source'),
    ]},
    {id:'access',title:'CodeBox and authorized contacts',time:'09:33–10:21',steps:[
      step('Find a device','Open Access → CodeBox. Use Show unassigned to compare the assigned and unassigned cards.',route('access'),'#access-unassigned','access-filter','0938-access'),
      step('Send a practice code','Select Send on a CodeBox. Enter a fictional recipient or choose Use sample recipient. Review the date and code type, then select Send Code.',route('access'),'[data-code-send]','code','0950-send-code',data=>data.method==='Send'),
      step('Manage a contact','Switch to Authorized Contacts. Add or edit a fictional vendor, set their access hours and code type, and save.',route('contacts'),'#add-contact','contact','1005-authorized-contacts'),
      step('Simulate a vendor’s arrival','Choose Practice check-in for a recurring contact. Enter the sample Box serial and pick an arrival within the contact’s access hours. Review the staff alert in Messages.',route('contacts'),'[data-vendor-contact]','vendor-arrival','1018-edit-contact'),
    ]},
    {id:'support',title:'Open support and return to Rentals',time:'10:21–11:25',steps:[
      step('Open the support widget','From Rentals, select Help in the bottom-right corner. Search the help topics or send a fictional support question.',route('rentals'),'#chatFab','open-support','1112-support'),
      step('Return to the rental grid','Close the support widget. You should be back on the same Rentals screen.',route('rentals'),'#closeChatBtn','close-support','1125-closing'),
    ]},
    {id:'workspace',title:'Extra practice with the supplied workspace screens',time:'Extra practice',steps:[
      step('Create or edit a user','Open Users. Create or edit a fictional team member, check their role and save.',route('users'),'#addUserBtn','workspace-user'),
      step('Change an account default','Open Account → Default Qualifying. Change a practice income or move-in default to see it save.',{section:'account',jump:'qualifying'},'#accMinIncome','workspace-account',null,data=>['defaultMinIncomeRatio','defaultMaxMoveInDays'].includes(data.key)),
      step('Record a support ticket','Open Help. Enter a fictional subject and message, then submit a practice ticket.',route('help'),'#htSubmitBtn','workspace-ticket'),
      step('Record a practice referral','Open Rewards. Add a sample name, company, and example email and save the referral.',route('rewards'),'#sendRefInviteBtn','workspace-referral'),
      step('Pause practice','Use Sign Out, confirm, and choose Return to practice. Data and tutorial progress stay in this browser.',route('signout'),'[data-nav="signout"]','workspace-signout'),
    ]},
  ];

  function initialize(guide) {
    if (guide?.schema===2) return guide;
    return {schema:2,mode:'free',chapter:'',progress:{},previousTopics:guide?.completed || []};
  }
  function create(api) {
    const {get,el,save,esc,navigate,open,close}=api;
    const guide=()=>get().guide;
    const active=()=>chapters.find(c=>c.id===guide().chapter);
    const progress=c=>Math.min(c.steps.length,guide().progress[c.id] || 0);
    const current=()=>{const c=active();return c?.steps[progress(c)];};
    const by=id=>el(id);
    const next=c=>chapters[chapters.indexOf(c)+1];
    const button=(id,label,style='btn-outline')=>`<button class="${style}" id="${id}" type="button">${esc(label)}</button>`;

    function setMode(mode) {
      guide().mode=mode;save();draw();
      if(mode==='tutorial' && !active()) catalog();
    }
    function mount() {
      const old=by('practice-mode-control');old?.remove();
      const header=document.querySelector('#topHeader .top-header-inner');
      if(!header || get().signedOut) return;
      const node=document.createElement('div'); node.id='practice-mode-control';node.setAttribute('role','group');node.setAttribute('aria-label','Practice mode');
      node.innerHTML=`<button type="button" data-practice-mode="free">Free Practice</button><button type="button" data-practice-mode="tutorial">Tutorial</button>`;
      node.querySelectorAll('[data-practice-mode]').forEach(b=>b.onclick=()=>setMode(b.dataset.practiceMode));
      header.append(node);
      syncMode();
    }
    function syncMode() {
      document.querySelectorAll('[data-practice-mode]').forEach(b=>b.setAttribute('aria-pressed',String(guide().mode===b.dataset.practiceMode)));
    }
    function choose(id) {
      guide().mode='tutorial';guide().chapter=id;save();close();draw();follow();
    }
    function catalog() {
      by('chatPopover').classList.remove('open');
      by('chatFab').setAttribute('aria-expanded','false');
      guide().mode='tutorial';save();draw();
      open('Tutorial · follow the recording',`<div class="practice-lessons">${chapters.map(c=>`<button class="btn-outline tutorial-chapter" type="button" data-lesson="${c.id}"><strong>${esc(c.title)}</strong><small>${esc(c.time)} · ${progress(c)} of ${c.steps.length}</small></button>`).join('')}</div>`,button('tutorial-free','Free Practice','btn-ghost')+button('tutorial-close','Close','btn-blue'));
      by('ttModalBody').querySelectorAll('[data-lesson]').forEach(b=>b.onclick=()=>choose(b.dataset.lesson));
      by('tutorial-close').onclick=close;
      by('tutorial-free').onclick=()=>{close();setMode('free');};
    }
    function visibleTarget(selector) {
      const candidates=[...document.querySelectorAll(selector)];
      return candidates.find(target=>target.getClientRects().length && getComputedStyle(target).visibility!=='hidden') || null;
    }
    function highlight(scroll=false) {
      document.querySelectorAll('.practice-highlight').forEach(e=>e.classList.remove('practice-highlight'));
      const step=current();
      if(guide().mode!=='tutorial' || !step || get().signedOut) return;
      const node=visibleTarget(step.target);
      if(!node) return;
      const display=node.matches('input[type="checkbox"]') ? node.closest('label') || node : node;
      display.classList.add('practice-highlight');
      if(scroll) display.scrollIntoView({block:'center',behavior:'auto'});
    }
    function follow() {
      const step=current();
      if(!step) return;
      navigate(step.route);highlight(true);
    }
    function record(key,details={}) {
      const c=active();const step=current();
      if(guide().mode!=='tutorial' || get().signedOut || !step || step.event!==key || (step.expect&&!step.expect(details))) return;
      guide().progress[c.id]=progress(c)+1;
      save();draw();
    }
    function draw() {
      const panel=by('practice-guide');
      syncMode();
      const c=active();
      panel.hidden=guide().mode!=='tutorial'||get().signedOut;
      if(panel.hidden){panel.replaceChildren();highlight();return;}
      if(!c) {
        panel.innerHTML=`<div class="row-inline practice-between"><strong>Tutorial</strong>${button('tutorial-lessons','Choose a chapter','btn-blue')}</div>`;
        by('tutorial-lessons').onclick=catalog;return;
      }
      const at=progress(c);const task=c.steps[at];
      const stamp=task?.reference?.slice(0,4);
      const videoStart=stamp ? `${stamp.slice(0,2)}m${stamp.slice(2)}s` : null;
      const ref=task?.timestamp ? `<a target="_blank" rel="noopener noreferrer" href="https://vimeo.com/688083346#t=${task.timestamp}">Watch this point</a>` : stamp ? `<a target="_blank" rel="noopener noreferrer" href="https://github.com/huzshk0707/tenant-turner-demo/blob/main/screenshots/${task.reference}.jpg">Screenshot ${stamp.slice(0,2)}:${stamp.slice(2)}</a><a target="_blank" rel="noopener noreferrer" href="https://vimeo.com/688083346#t=${videoStart}">Watch this point</a>` : '';
      panel.innerHTML=`<div class="row-inline practice-between"><strong>${esc(c.title)}</strong>${button('tutorial-lessons','All chapters')}</div>
        <progress max="${c.steps.length}" value="${at}" aria-label="Chapter progress"></progress>
        <ol class="tutorial-checklist">${c.steps.map((task,i)=>`<li ${i===at?'aria-current="step"':''} class="${i<at?'complete':''}">${esc(task.title)}</li>`).join('')}</ol>
        <p>${task?esc(task.text):'Chapter complete. Your steps are saved.'}</p>
        ${task?.choices?`<div class="practice-actions">${task.choices.map((choice,i)=>`<button class="btn-outline" data-tutorial-answer="${i}">${esc(choice)}</button>`).join('')}</div><p id="tutorial-hint" role="status"></p>`:''}
        <div class="practice-actions">${task?button('tutorial-follow','Show me where','btn-blue'):next(c)?button('tutorial-next','Next chapter','btn-blue'):''}${ref}${button('tutorial-restart','Restart chapter','btn-flat')}</div>`;
      panel.querySelectorAll('[data-tutorial-answer]').forEach(b=>b.onclick=()=>{
        if(Number(b.dataset.tutorialAnswer)!==task.answer) {by('tutorial-hint').textContent=task.hint;return;}
        guide().progress[c.id]=at+1;save();draw();follow();
      });
      by('tutorial-lessons').onclick=catalog;
      if(by('tutorial-follow')) by('tutorial-follow').onclick=follow;
      if(by('tutorial-next')) by('tutorial-next').onclick=()=>choose(next(c).id);
      by('tutorial-restart').onclick=()=>{guide().progress[c.id]=0;save();draw();follow();};
      highlight();
    }
    return {mount,draw,catalog,record};
  }
  window.ReplicaTutorial={initialize,create};
})();
