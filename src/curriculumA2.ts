export const a2Units = [
  { id: 'a2-u1', title: 'A2 · Daily Plans & Free Time', icon: '🗓️', lessons: ['a2-u1-l1', 'a2-u1-l2', 'a2-u1-l3'] },
  { id: 'a2-u2', title: 'A2 · Shopping & Money', icon: '🛍️', lessons: ['a2-u2-l1', 'a2-u2-l2', 'a2-u2-l3'] },
  { id: 'a2-u3', title: 'A2 · Travel & Transport', icon: '🚆', lessons: ['a2-u3-l1', 'a2-u3-l2', 'a2-u3-l3'] },
  { id: 'a2-u4', title: 'A2 · Health & Problems', icon: '🩺', lessons: ['a2-u4-l1', 'a2-u4-l2', 'a2-u4-l3'] },
];

export const a2Lessons = [
  {
    id: 'a2-u1-l1', unitId: 'a2-u1', title: 'Plans for the weekend', skill: 'Vocabulary', minutes: 8,
    objective: 'Talk about simple future plans and free-time activities.',
    activities: [
      { type: 'explain', title: 'Talking about plans', body: 'Use phrases such as this weekend, tomorrow, later, go out, stay home, meet friends and visit family.', examples: ['I’m meeting friends on Saturday.', 'We’re staying home tonight.', 'I’m visiting my sister tomorrow.'] },
      { type: 'choice', prompt: 'Which sentence describes a planned activity?', options: ['I met my friend yesterday.', 'I’m meeting my friend on Saturday.', 'I meet my friend every Saturday.'], answer: 'I’m meeting my friend on Saturday.', explanation: 'Present continuous can describe a fixed future arrangement.' },
      { type: 'fill', prompt: 'Complete: I’m ___ my family on Sunday.', answer: 'visiting', hint: 'v_______', explanation: '“I’m visiting …” describes a planned visit.' },
    ],
  },
  {
    id: 'a2-u1-l2', unitId: 'a2-u1', title: 'Present continuous for arrangements', skill: 'Grammar', minutes: 10,
    objective: 'Use present continuous for future arrangements.',
    activities: [
      { type: 'explain', title: 'Fixed arrangements', body: 'Use am/is/are + verb-ing when a future plan is already arranged.', examples: ['I’m working tomorrow morning.', 'She’s flying on Friday.', 'They’re having dinner at eight.'] },
      { type: 'choice', prompt: 'Choose the natural sentence.', options: ['She is fly on Friday.', 'She flying on Friday.', 'She is flying on Friday.'], answer: 'She is flying on Friday.', explanation: 'Use is + verb-ing.' },
      { type: 'fill', prompt: 'Complete: We are ___ dinner at eight.', answer: 'having', explanation: '“We are having dinner …” is the correct arrangement form.' },
    ],
  },
  {
    id: 'a2-u1-l3', unitId: 'a2-u1', title: 'Invite and respond', skill: 'Speaking', minutes: 9,
    objective: 'Invite someone and respond naturally.',
    activities: [
      { type: 'explain', title: 'Making invitations', body: 'Use “Would you like to …?”, “Do you want to …?” and natural responses such as “Sure, I’d love to” or “Sorry, I can’t.”', examples: ['Would you like to have coffee?', 'Sure, I’d love to.', 'Sorry, I can’t this evening.'] },
      { type: 'choice', prompt: 'Choose the most natural invitation.', options: ['You coffee?', 'Would you like to have coffee?', 'Coffee now yes?'], answer: 'Would you like to have coffee?', explanation: 'This is a polite and natural invitation.' },
      { type: 'fill', prompt: 'Complete: Sorry, I ___ tonight.', answer: 'can’t', explanation: '“Sorry, I can’t” is a natural refusal.' },
    ],
  },
  {
    id: 'a2-u2-l1', unitId: 'a2-u2', title: 'Prices and quantities', skill: 'Vocabulary', minutes: 8,
    objective: 'Understand common shopping language for price and quantity.',
    activities: [
      { type: 'explain', title: 'Shopping basics', body: 'Useful expressions include how much, how many, a kilo of, a bottle of, cheap, expensive, cash and card.', examples: ['How much is this?', 'I need a kilo of apples.', 'Can I pay by card?'] },
      { type: 'choice', prompt: 'Which question asks about price?', options: ['How many is this?', 'How much is this?', 'How often is this?'], answer: 'How much is this?', explanation: '“How much” asks for price.' },
      { type: 'fill', prompt: 'Complete: Can I pay by ___?', answer: 'card', explanation: '“Pay by card” is a common phrase.' },
    ],
  },
  {
    id: 'a2-u2-l2', unitId: 'a2-u2', title: 'Countable and uncountable nouns', skill: 'Grammar', minutes: 10,
    objective: 'Choose much, many, some and any in common shopping contexts.',
    activities: [
      { type: 'explain', title: 'Much or many?', body: 'Use many with countable plural nouns and much with uncountable nouns. Some is common in positive sentences; any is common in questions and negatives.', examples: ['How many apples?', 'How much rice?', 'Do you have any milk?'] },
      { type: 'choice', prompt: 'Choose the correct question.', options: ['How much apples do you need?', 'How many apples do you need?', 'How many rice do you need?'], answer: 'How many apples do you need?', explanation: 'Apples are countable, so use “many”.' },
      { type: 'fill', prompt: 'Complete: Do you have ___ milk?', answer: 'any', explanation: '“Any” is common in questions.' },
    ],
  },
  {
    id: 'a2-u2-l3', unitId: 'a2-u2', title: 'At the checkout', skill: 'Speaking', minutes: 8,
    objective: 'Handle a simple checkout conversation.',
    activities: [
      { type: 'explain', title: 'Paying', body: 'Practice short checkout exchanges about bags, receipts and payment.', examples: ['Would you like a bag?', 'Yes, please.', 'Can I have the receipt?'] },
      { type: 'choice', prompt: 'The cashier asks “Would you like a bag?” What is a natural answer?', options: ['Yes, please.', 'I am bag.', 'Bag costs.'], answer: 'Yes, please.', explanation: '“Yes, please” is polite and natural.' },
      { type: 'fill', prompt: 'Complete: Can I have the ___?', answer: 'receipt', explanation: 'A receipt is the record of your purchase.' },
    ],
  },
  {
    id: 'a2-u3-l1', unitId: 'a2-u3', title: 'Travel information', skill: 'Vocabulary', minutes: 8,
    objective: 'Understand common train, bus and airport vocabulary.',
    activities: [
      { type: 'explain', title: 'Getting around', body: 'Useful words include platform, ticket, return, single, delay, gate, departure and arrival.', examples: ['Which platform does it leave from?', 'The train is delayed.', 'I need a return ticket.'] },
      { type: 'choice', prompt: 'Where do you wait for a train?', options: ['platform', 'receipt', 'pharmacy'], answer: 'platform', explanation: 'Trains depart from platforms.' },
      { type: 'fill', prompt: 'Complete: The train is ___ by ten minutes.', answer: 'delayed', explanation: 'A late train is “delayed”.' },
    ],
  },
  {
    id: 'a2-u3-l2', unitId: 'a2-u3', title: 'Past simple for travel', skill: 'Grammar', minutes: 10,
    objective: 'Describe a completed trip using past simple.',
    activities: [
      { type: 'explain', title: 'Completed events', body: 'Use past simple for finished events in the past. Regular verbs often end in -ed; common irregular verbs include went, had, took and came.', examples: ['We travelled by train.', 'I went to Paris last year.', 'The journey took two hours.'] },
      { type: 'choice', prompt: 'Choose the correct sentence.', options: ['I go to Brussels yesterday.', 'I went to Brussels yesterday.', 'I am going to Brussels yesterday.'], answer: 'I went to Brussels yesterday.', explanation: '“Went” is the past form of “go”.' },
      { type: 'fill', prompt: 'Complete: The journey ___ two hours.', answer: 'took', explanation: '“Took” is the past form of “take”.' },
    ],
  },
  {
    id: 'a2-u3-l3', unitId: 'a2-u3', title: 'Ask for travel help', skill: 'Speaking', minutes: 9,
    objective: 'Ask staff for simple travel information and help.',
    activities: [
      { type: 'explain', title: 'Useful travel questions', body: 'Ask clear questions about platforms, times, delays and transfers.', examples: ['What time does the train leave?', 'Which platform do I need?', 'Do I need to change trains?'] },
      { type: 'choice', prompt: 'Which question asks about changing trains?', options: ['Do I need to change trains?', 'How much apples?', 'Where you working?'], answer: 'Do I need to change trains?', explanation: 'This is the natural question for a transfer.' },
      { type: 'fill', prompt: 'Complete: Which ___ do I need?', answer: 'platform', explanation: '“Which platform do I need?” is a common station question.' },
    ],
  },
  {
    id: 'a2-u4-l1', unitId: 'a2-u4', title: 'Symptoms and body problems', skill: 'Vocabulary', minutes: 8,
    objective: 'Describe common minor health problems.',
    activities: [
      { type: 'explain', title: 'Common symptoms', body: 'Useful words include headache, stomach ache, cough, fever, sore throat, dizzy and tired.', examples: ['I have a headache.', 'I feel dizzy.', 'I’ve got a sore throat.'] },
      { type: 'choice', prompt: 'Which sentence describes pain in your head?', options: ['I have a headache.', 'I have a ticket.', 'I feel platform.'], answer: 'I have a headache.', explanation: 'A headache is pain in the head.' },
      { type: 'fill', prompt: 'Complete: I feel very ___.', answer: 'tired', explanation: '“I feel tired” is a common symptom description.' },
    ],
  },
  {
    id: 'a2-u4-l2', unitId: 'a2-u4', title: 'should / shouldn’t', skill: 'Grammar', minutes: 9,
    objective: 'Give and understand simple advice with should and shouldn’t.',
    activities: [
      { type: 'explain', title: 'Giving advice', body: 'Use should + base verb for advice and shouldn’t + base verb for negative advice.', examples: ['You should rest.', 'You should drink water.', 'You shouldn’t drive if you feel dizzy.'] },
      { type: 'choice', prompt: 'Choose the correct advice.', options: ['You should to rest.', 'You should rest.', 'You should resting.'], answer: 'You should rest.', explanation: 'After “should”, use the base verb.' },
      { type: 'fill', prompt: 'Complete: You ___ drink more water.', answer: 'should', explanation: '“Should” introduces advice.' },
    ],
  },
  {
    id: 'a2-u4-l3', unitId: 'a2-u4', title: 'At the doctor or pharmacy', skill: 'Speaking', minutes: 9,
    objective: 'Explain a simple problem and understand basic advice.',
    activities: [
      { type: 'explain', title: 'Explain the problem', body: 'Say what hurts, how long you have had the problem and whether symptoms are getting better or worse.', examples: ['I’ve had a cough for three days.', 'My throat hurts.', 'It started yesterday.'] },
      { type: 'choice', prompt: 'Which sentence clearly explains duration?', options: ['I cough three days.', 'I’ve had a cough for three days.', 'I am cough yesterday.'], answer: 'I’ve had a cough for three days.', explanation: 'This is a natural way to describe a continuing problem.' },
      { type: 'fill', prompt: 'Complete: It ___ yesterday.', answer: 'started', explanation: '“It started yesterday” gives the beginning of the problem.' },
    ],
  },
];
