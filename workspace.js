'use strict';

window.createLeasingWorkspace = api => {
  const {read,D,byRental,byLead,text,icon,heading,section,anchor,button,chip,tabs,table,field,numberField,moneyField,
    select,area,check,searchField,dayText,modalForm,confirm,required,val,num,isChecked,uid,commit,persist,go,logLead} = api;
  const roles = ['Manager','Leasing agent','Viewer'];
  const zones = ['Eastern','Central','Mountain','Pacific'];
  let query = '';
  let folder = 'Inbox';
  const getThread = id => read().threads.find(item => item.id === id);
  const lastEntry = thread => thread.entries.at(-1);

  function threadList() {
    const q = query.trim().toLowerCase();
    const rows = read().threads.filter(thread => (folder === 'Archived') === thread.archived
      && `${thread.subject} ${byLead(thread.leadId)?.name || ''} ${lastEntry(thread)?.text || ''}`.toLowerCase().includes(q));
    if (!rows.length) return '<div class="empty"><p>No matching conversations.</p></div>';
    return `<div class="message-list">${rows.map(thread => {
      const lead = byLead(thread.leadId);
      return `<article class="message-row"><div>${anchor(['messages',thread.id],thread.subject,{classes:'text-link'})}
        <small>${text(lead?.name || 'Practice lead')} · ${text(byRental(lead?.rentalId)?.name || 'Rental')}</small><p>${text(lastEntry(thread)?.text || '')}</p></div>
        <div>${thread.unread ? chip('Unread','blue') : ''}<small>${dayText(lastEntry(thread)?.date)}</small></div></article>`;
    }).join('')}</div>`;
  }
  function messagesView(id) {
    const thread = getThread(id);
    if (thread) {
      const lead = byLead(thread.leadId);
      return `${anchor(['messages'],'All messages',{classes:'back-link',symbol:'back'})}
        ${heading(thread.subject,lead ? `${lead.name} · ${byRental(lead.rentalId)?.name || 'Rental'}` : '',
          button(thread.archived ? 'Restore to inbox' : 'Archive conversation','workspace-archive-thread',{value:thread.id,classes:'btn outline'})
          + button('Mark unread','workspace-unread',{value:thread.id,classes:'btn outline'}))}
        <section class="panel" data-cue="workspace-conversation">${section('Conversation','',lead ? anchor(['lead',lead.id],'Open lead',{classes:'btn outline small'}) : '')}
        <div class="conversation">${thread.entries.map(entry => {
          const automated = entry.from === 'automation';
          const outgoing = automated || entry.from === 'team';
          return `<article class="message-entry ${outgoing ? 'sent' : ''} ${automated ? 'automated' : ''}"><strong>${text(automated ? 'Automatic practice message' : outgoing ? 'Leasing team' : lead?.name || 'Practice lead')}</strong>
            <p>${text(entry.text)}</p>${/^https?:\/\//i.test(entry.application || '') ? `<a class="text-link" href="${text(entry.application)}" target="_blank" rel="noopener noreferrer">Open practice application</a>` : ''}<small>${dayText(entry.date)}</small></article>`;
        }).join('')}</div>
        <form class="reply-form" data-form="workspace-reply" data-id="${text(thread.id)}">${area('Reply','message','',3)}<button class="btn primary top-gap" type="submit">Save practice reply</button></form></section>`;
    }
    return `${heading('Messages','Review leasing conversations and practice replying.',button('New message','workspace-compose',{classes:'btn primary',symbol:'plus'}))}
      <section class="panel">${section('Conversations','',searchField('message-search',query,'Search conversations'))}
      <div class="message-switch" role="group" aria-label="Message folder">${['Inbox','Archived'].map(name => button(name,'workspace-folder',{value:name,classes:`btn ${folder === name ? 'primary' : 'outline'} small`,attrs:`aria-pressed="${folder === name}"`})).join('')}</div>
      <div id="message-results" data-cue="workspace-inbox">${threadList()}</div></section>`;
  }
  function usersView() {
    const rows = read().team.map(user => [text(user.name),text(user.email),text(user.role),chip(user.active ? 'Active':'Inactive',user.active ? 'green':'neutral'),button('Edit','workspace-user',{classes:'btn outline small',value:user.id})]);
    return `${heading('Users','Manage the practice leasing team.',button('Add user','workspace-user',{classes:'btn primary',symbol:'plus',cue:'workspace-add-user'}))}
      <section class="panel">${section('Team members')}${table(['Name','Practice email','Role','Status',''],rows)}</section>`;
  }
  function accountView() {
    const profile = read().workspaceProfile;
    return `${heading('Account','Manage workspace details and defaults for new practice rentals.')}
      <form class="panel" data-form="workspace-account" data-cue="workspace-account">${section('Workspace details')}
      <div class="form-body form-grid columns-3">${field('Workspace name','name',profile.name,{required:true,attrs:'maxlength="80"'})}${field('Office email','email',profile.email,{type:'email',required:true})}${select('Time zone','timezone',zones,profile.timezone)}</div>
      <div class="form-body"><div class="inside-section"><h3>New rental defaults</h3><p>These values are copied into new practice listings.</p><div class="form-grid columns-3">${numberField('Minimum income × rent','incomeRatio',profile.incomeRatio,0,20,.1)}${numberField('Scheduling notice (hours)','notice',profile.notice,0,168)}${moneyField('Application fee','applicationFee',profile.applicationFee)}</div></div></div>
      <div class="save-bar"><button type="submit" class="btn primary">Save account settings</button></div></form>
      <section class="panel">${section('Practice data','Restore the sample workspace and clear its tutorial progress.',button('Reset practice data','reset',{classes:'btn outline',symbol:'reset'}))}</section>`;
  }
  function rewardsView() {
    return `${heading('Rewards','Practice recording and tracking referrals.',button('Add referral','workspace-referral',{classes:'btn primary',symbol:'plus',cue:'workspace-add-referral'}))}
      <section class="panel">${section('Practice referrals','Entries stay in the sandbox.')}${table(['Organization','Practice email','Status','Added',''],read().referrals.map(row => [text(row.name),text(row.email),chip(row.status,row.status === 'Recorded' ? 'green':'neutral'),dayText(row.date),button('Edit','workspace-referral',{value:row.id,classes:'btn outline small'})]),'No practice referrals yet.')}</section>`;
  }
  function signOutView() {
    const signedOut = read().signedOut;
    return `<section class="panel session-panel" data-cue="workspace-sign-out"><span class="stat-icon lilac">${icon('power',24)}</span>
      ${heading(signedOut ? 'You’re signed out' : 'Sign Out',signedOut ? 'Your practice data is saved in this browser.' : 'End this practice session. You can return to the same data.')}
      ${signedOut ? button('Return to practice','workspace-resume',{classes:'btn primary'}) : button('Sign out of practice','workspace-sign-out',{classes:'btn primary'})}</section>`;
  }
  function compose(leadId) {
    const leads = read().leads;
    modalForm('New practice message',`${select('Lead','lead',leads.map(lead => [lead.id,lead.name]),leadId || leads[0]?.id)}${field('Subject','subject','',{required:true,attrs:'maxlength="100"'})}${area('Message','message','',4)}`,'Save practice message',fd => {
      const lead = byLead(val(fd,'lead'));
      if (!lead) throw new Error('Choose a lead.');
      const thread = {id:uid('thread'),leadId:lead.id,subject:required(fd,'subject','a subject'),unread:false,archived:false,entries:[{from:'team',text:required(fd,'message','a practice message'),date:D.date()}]};
      read().threads.unshift(thread);
      logLead(lead,'Practice message saved');
      persist();
      go(['messages',thread.id]);
    },'This message stays in the sandbox.');
  }
  function editUser(id) {
    const team = read().team;
    const existing = team.find(user => user.id === id);
    const row = existing || {id:uid('team'),name:'',email:'',role:'Leasing agent',active:true};
    modalForm(existing ? 'Edit practice user' : 'Add practice user',`${field('Name','name',row.name,{required:true,attrs:'maxlength="80"'})}${field('Practice email','email',row.email,{type:'email',required:true})}${select('Role','role',roles,row.role)}${check('Active user','active',row.active)}`,'Save user',fd => {
      const name = required(fd,'name','a name');
      const email = val(fd,'email');
      const active = isChecked(fd,'active');
      if (team.some(user => user.id !== row.id && user.name.toLowerCase() === name.toLowerCase())) throw new Error('That team member name is already in use.');
      if (team.some(user => user.id !== row.id && user.email.toLowerCase() === email.toLowerCase())) throw new Error('That email is already in use.');
      if (!active && !team.some(user => user.id !== row.id && user.active)) throw new Error('Keep at least one team member active.');
      if (existing && row.name !== name) api.renameAssignee(row.name,name);
      Object.assign(row,{name,email,role:val(fd,'role'),active});
      if (!existing) team.push(row);
      commit('Practice user saved.',...(!existing ? ['workspace-added-user'] : []));
    });
  }
  function editReferral(id) {
    const referrals = read().referrals;
    const existing = referrals.find(row => row.id === id);
    const row = existing || {id:uid('referral'),name:'',email:'',status:'Draft',date:D.date()};
    modalForm(existing ? 'Edit practice referral' : 'Add practice referral',`${field('Organization','name',row.name,{required:true,attrs:'maxlength="80"'})}${field('Practice email','email',row.email,{type:'email',required:true})}${select('Status','status',['Draft','Recorded'],row.status)}`,'Save referral',fd => {
      Object.assign(row,{name:required(fd,'name','an organization'),email:val(fd,'email'),status:val(fd,'status')});
      if (!existing) referrals.unshift(row);
      commit('Practice referral saved.',...(!existing ? ['workspace-added-referral'] : []));
    });
  }
  function enter(route) {
    if (route[0] !== 'messages') return;
    const thread = getThread(route[1]);
    if (thread?.unread) { thread.unread = false; persist(); }
  }
  function input(event) {
    if (event.target.id !== 'message-search') return;
    query = event.target.value;
    document.querySelector('#message-results').innerHTML = threadList();
  }
  function handle(key,value) {
    const thread = getThread(value);
    switch (key) {
      case 'workspace-compose': compose(value); break;
      case 'workspace-folder': folder = value; api.render(); break;
      case 'workspace-unread':
        if (thread) { thread.unread = true; persist(); go(['messages']); }
        break;
      case 'workspace-archive-thread':
        if (thread) { thread.archived = !thread.archived; folder = thread.archived ? 'Archived' : 'Inbox'; persist(); go(['messages']); }
        break;
      case 'workspace-user': editUser(value); break;
      case 'workspace-referral': editReferral(value); break;
      case 'workspace-sign-out': confirm('Sign out of practice?','Your changes and tutorial progress stay saved.','Sign out',() => {
        api.learn('workspace-signed-out');
        read().signedOut = true; persist(); go(['sign-out']);
      }); break;
      case 'workspace-resume': read().signedOut = false; persist(); go(['rentals']); break;
    }
  }
  function submit(form,fd) {
    if (form.dataset.form === 'workspace-account') {
      const name = val(fd,'name');
      if (!name) { api.notice('Enter a workspace name.'); return; }
      read().workspaceProfile = {name,email:val(fd,'email'),timezone:val(fd,'timezone'),incomeRatio:num(fd,'incomeRatio'),notice:num(fd,'notice'),applicationFee:num(fd,'applicationFee')};
      commit('Practice account settings saved.','workspace-saved-account');
    }
    if (form.dataset.form === 'workspace-reply') {
      const thread = getThread(form.dataset.id);
      const message = val(fd,'message');
      if (!thread || !message) { api.notice('Enter a practice reply.'); return; }
      thread.entries.push({from:'team',text:message,date:D.date()});
      const lead = byLead(thread.leadId);
      if (lead) logLead(lead,'Practice reply saved');
      commit('Practice reply saved.','workspace-replied');
    }
  }
  const views = {messages:messagesView,users:usersView,account:accountView,rewards:rewardsView,'sign-out':signOutView};
  return {view:(page,id)=>views[page]?.(id),enter,input,handle,submit,reset:()=>{folder='Inbox';query='';}};
};
