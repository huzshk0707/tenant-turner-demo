'use strict';

window.LeasingData = (() => {
  const people = ['Jamie Taylor', 'Casey Nguyen', 'Morgan Ellis'];
  const sites = ['ApartmentAdvisor', 'Apartment List', 'Apartments.com', 'Homes.com', 'Realtor.com', 'Rentals.com', 'RentalSource', 'Zillow, Trulia, & HotPads'];
  const leadSources = [...sites.slice(0, -1), 'Zillow', 'Trulia', 'HotPads', 'Rent.com', 'Zumper', 'Website', 'Referral', 'Other'];
  const stages = ['New inquiry', 'Waitlisted', 'Qualified', 'Showing requested', 'Showing scheduled', 'Viewing completed', 'Applied', 'Needs review', 'Archived'];
  const devices = ['CodeBox', 'SentriLock', 'PointCentral'];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const photos = ['rosewood', 'juniper', 'birch', 'waterline', 'westhaven', 'alder'];
  const photoLabels = Object.fromEntries([...photos.map(photo => [photo, photo[0].toUpperCase() + photo.slice(1) + ' exterior']), ['living-sample','Sample living room'], ['kitchen-sample','Sample kitchen']]);
  const galleryPhotos = Object.keys(photoLabels);
  const importedFields = ['name','address','type','rent','deposit','term','beds','baths','sqft','available','description'];
  const screening = [
    ['coSigner','Allow leads with a co-signer','Has a co-signer','Co-signers are turned off for this rental.'],
    ['voucher','Allow leads with government housing vouchers','Uses a housing voucher','Housing vouchers are turned off in this practice scenario.'],
    ['bankruptcy','Allow leads with a bankruptcy','Reports a bankruptcy','The practice bankruptcy criterion was not met.'],
    ['judgment','Allow leads with a filed civil judgment','Reports a filed civil judgment','The practice civil judgment criterion was not met.'],
    ['eviction','Allow leads with an eviction','Reports an eviction','The practice eviction criterion was not met.'],
    ['conviction','Allow leads with a felony conviction against people or property','Reports a felony conviction against people or property','The practice conviction criterion was not met.'],
  ];
  const petTypes = [['cats','Cats'],['smallDogs','Small dogs (under 20 lbs)'],['largeDogs','Large dogs']];
  const approvals = ['Take requests', 'Set appointments'];
  const screeningDefaults = Object.fromEntries([...screening.map(([key]) => key), ...petTypes.map(([key]) => key)].map(key => [key,true]));
  const ownerDelivery = { day:'Tuesday', time:'09:00' };
  const date = (offset = 0) => {
    const day = new Date();
    day.setDate(day.getDate() + offset);
    return [day.getFullYear(), String(day.getMonth() + 1).padStart(2, '0'), String(day.getDate()).padStart(2, '0')].join('-');
  };

  function rental(id, name, address, photo, overrides = {}) {
    return {
      id, name, address, photo, gallery:[photo,'living-sample','kitchen-sample'], origin:'Manual',
      active: true, alert: false, assignee: people[0],
      rent: 2350, deposit: 2350, term: 12, beds: 3, baths: 2, sqft: 1560,
      available: date(3), listingSince: date(-18), type: 'House', tourUrl: '',
      description: 'A light-filled rental with modern finishes, generous storage, and convenient access to neighborhood shops.',
      amenities: 'In-unit laundry, off-street parking', utilities: 'Water included',
      syndication: ['Zillow, Trulia, & HotPads', 'Apartments.com'], incomeRatio: 2.5, moveDays: 60,
      requireIncome:true, requireMoveIn:true, pets: true, petMax: 2, ...screeningDefaults, questions: [],
      waitlist: false, waitMessage: 'Thanks for your interest. We’ll let you know when tours open.',
      selfAccess: true, inPerson: true, viewingType: 'Electronic lockbox',
      appointmentType: 'Set appointments', requireId: true,
      instructions: 'Meet at the front entrance. Please close the door when you leave.',
      duration: 20, notice: 24, buffer: 15, maxShowings: 2, limit: 'Group trips', notifyOccupants: false,
      useGeneral:true, useRental:true, availability: [
        { id: `${id}-open-2`, scope: 'Rental', agent: people[1], day: 'Saturday', start: '11:00', end: '14:00', repeat: true, approval:'Set appointments', capacity:2 },
      ],
      application: 'https://example.com/apply', applicationFee: 45, adminFee: 0,
      ownerReport: { enabled: false, feedback: true, email: 'owner@example.com' },
      ...overrides,
    };
  }

  function lead(id, rentalId, name, overrides = {}) {
    return {
      id, rentalId, name, email: `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@example.com`,
      phone: '(202) 555-0148', source: 'Zillow', channel: 'Web', stage: 'Qualified',
      qualified: true, created: date(-2), moveIn: date(15), income: 7200, pets: 0,
      verified: false, showingDate: '', showingTime: '', showingMethod: '',
      feedback: '', rating: 0, feedbackHidden: false, notes: [],
      timeline: [{ date: date(-2), text: 'Inquiry received' }], ...overrides,
    };
  }

  function workspaceSeed() {
    return {
      signedOut: false,
      ownerDelivery: {...ownerDelivery}, followUps: [], supportMessages: [],
      team: people.map((name, i) => ({id:`team-${i+1}`,name,email:`${name.toLowerCase().replace(/ /g,'.')}@example.com`,role:i === 0 ? 'Manager' : 'Leasing agent',active:true})),
      workspaceProfile: {name:'Brookfield Leasing',email:'office@example.com',timezone:'Eastern',incomeRatio:2.5,notice:24,applicationFee:45},
      threads: [
        {id:'thread-1',leadId:'l1',subject:'Weekend tour',unread:true,archived:false,entries:[{from:'lead',text:'Hi, are weekend tours available for Rosewood House?',date:date()}]},
        {id:'thread-2',leadId:'l2',subject:'Showing confirmation',unread:false,archived:false,entries:[{from:'team',text:'Your practice viewing is booked. Please let us know if the time changes.',date:date(-2)},{from:'lead',text:'Thanks, I’ll be there.',date:date(-1)}]},
      ],
      referrals: [{id:'referral-1',name:'Harbor Keys Property Group',email:'harbor@example.com',status:'Draft',date:date(-4)}],
    };
  }

  function seed() {
    return {
      version: 1, mode: 'free', course: {}, lesson: '',
      ...workspaceSeed(),
      teamAvailability: people.map((agent, index) => ({ id: `general-${index+1}`, scope: 'General', agent, day: days[index+1], start: '10:00', end: '16:00', repeat: true, approval:'Set appointments', capacity:2 })),
      rentals: [
        rental('r1', 'Rosewood House', '24 Wren Lane, Brookfield', 'rosewood', { alert: true, origin:'Imported' }),
        rental('r2', 'Juniper Modern', '81 Juniper Court, Brookfield', 'juniper', { rent: 2950, deposit: 2950, beds: 4, baths: 3, sqft: 2180, assignee: people[1], listingSince: date(-12), origin:'Imported' }),
        rental('r3', 'Birch & Co.', '16 Silver Birch Road, Cedar Park', 'birch', { rent: 1950, deposit: 1950, beds: 2, baths: 1, sqft: 1120, available: date(14), waitlist: true, selfAccess: false, assignee: people[2] }),
        rental('r4', 'Waterline Apartments', '208 Harbor Walk, Unit 4B', 'waterline', { rent: 1825, deposit: 1825, beds: 2, baths: 2, sqft: 980, type: 'Apartment', selfAccess: false, listingSince: date(-33), assignee: people[1] }),
        rental('r5', 'Westhaven Cottage', '52 Westhaven Drive, Cedar Park', 'westhaven', { rent: 2140, deposit: 2140, beds: 3, baths: 1.5, sqft: 1315, selfAccess: false, assignee: people[2] }),
        rental('r6', 'Alder Loft', '309 Alder Avenue, Unit 8', 'alder', { rent: 1675, deposit: 1675, beds: 1, baths: 1, sqft: 780, type: 'Apartment', active: false, listingSince: date(-50) }),
      ],
      leads: [
        lead('l1','r1','Avery Reed',{stage:'New inquiry',qualified:null,created:date(0),source:'Apartments.com',notes:[{date:date(0),text:'Asked about a weekend tour.'}]}),
        lead('l2','r1','River James',{stage:'Showing scheduled',showingDate:date(2),showingTime:'11:00',showingMethod:'In person',verified:true,source:'Referral'}),
        lead('l3','r1','Samira Lane',{stage:'Viewing completed',showingDate:date(-1),showingTime:'14:00',showingMethod:'Self access',feedback:'Loved the daylight. Asked about parking for a second car.',rating:5,verified:true}),
        lead('l4','r1','Devon Brooks',{stage:'Archived',qualified:false,income:3100,source:'Zumper'}),
        lead('l5','r2','Emery Wilson',{stage:'New inquiry',qualified:null,created:date(0),source:'Zillow'}),
        lead('l6','r2','Alex Quinn',{stage:'Showing scheduled',showingDate:date(3),showingTime:'13:30',showingMethod:'Self access',verified:true,income:9500}),
        lead('l7','r3','Cameron Park',{stage:'Waitlisted',qualified:true,source:'Website'}),
        lead('l8','r4','Jordan Bell',{stage:'Applied',showingDate:date(-4),showingTime:'10:30',showingMethod:'In person',feedback:'The floor plan works well.',rating:4,source:'Apartment List'}),
        lead('l9','r5','Reese Walker',{stage:'Qualified',source:'Realtor.com'}),
      ],
      devices: [
        { id:'d1', serial:'LAB-CB-142', model:'CodeBox', rentalId:'r1', state:'Ready' },
        { id:'d2', serial:'LAB-CB-209', model:'CodeBox', rentalId:'', state:'Ready' },
        { id:'d3', serial:'LAB-CB-288', model:'CodeBox', rentalId:'r2', state:'Needs service' },
        { id:'d4', serial:'LAB-SL-316', model:'SentriLock', rentalId:'r2', state:'Ready' },
        { id:'d5', serial:'LAB-PC-516', model:'PointCentral', rentalId:'r4', state:'Ready' },
      ],
      contacts: [
        { id:'c1', name:'Parker Mills', company:'Brightline Repairs', email:'parker@example.com', phone:'(202) 555-0151', access:'Recurring' },
        { id:'c2', name:'Harper Stone', company:'Willow Turnovers', email:'harper@example.com', phone:'(202) 555-0163', access:'By request' },
      ],
      accesses: [{ id:'a1', serial:'LAB-CB-142', name:'Practice vendor', date:date(-1), type:'One-time', code:'SIM-100001' }],
      schedules: [],
    };
  }

  return { people, sites, leadSources, stages, devices, days, photos, photoLabels, galleryPhotos, importedFields, screening, screeningDefaults, petTypes, approvals, date, rental, lead, workspaceSeed, seed };
})();
