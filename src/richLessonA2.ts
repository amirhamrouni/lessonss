import type { RichLesson, RichVisualWordActivity, RichListenSelectActivity, RichImageChoiceActivity, RichSentenceBuildActivity } from './richLesson';

const m=(Arabic:string,Dutch:string,French:string,German:string,Spanish:string,English:string)=>({Arabic,Dutch,French,German,Spanish,English});
const word=(visualId:any,word:string,phonetic:string,meanings:Record<string,string>,example:string):RichVisualWordActivity=>({type:'visual_word',visualId,word,phonetic,meanings,example});
const listen=(audioText:string,options:string[],answer=audioText,explanation=`You heard “${audioText}”.`):RichListenSelectActivity=>({type:'listen_select',prompt:'Listen and choose what you hear.',audioText,options,answer,explanation});
const picture=(prompt:string,options:Array<{visualId:any;label:string}>,answer:string,explanation:string):RichImageChoiceActivity=>({type:'image_choice',prompt,options,answer,explanation});
const build=(prompt:string,words:string[],answer:string,explanation:string):RichSentenceBuildActivity=>({type:'sentence_build',prompt,words,answer,explanation});

export const richA2Lessons:RichLesson[]=[
  {id:'a2-u1-l1',unitId:'a2-u1',title:'Plans for the weekend',skill:'Vocabulary',minutes:8,objective:'Talk about simple future plans and free-time activities.',activities:[
    word('weekend','Weekend','/ˌwiːkˈend/',m('عطلة نهاية الأسبوع','Weekend','Week-end','Wochenende','Fin de semana','Weekend'),'I’m meeting friends this weekend.'),
    listen('I’m visiting my sister tomorrow.',['I’m visiting my sister tomorrow.','I visited my sister yesterday.','I visit my sister every day.']),
    picture('Choose the visual for a weekend plan.',[{visualId:'weekend',label:'Weekend plan'},{visualId:'checkout',label:'Checkout'},{visualId:'doctor',label:'Doctor'}],'Weekend plan','The calendar-style visual represents a planned weekend activity.'),
    {type:'choice',prompt:'Which sentence describes a planned activity?',options:['I met my friend yesterday.','I’m meeting my friend on Saturday.','I meet my friend every Saturday.'],answer:'I’m meeting my friend on Saturday.',explanation:'Present continuous can describe a fixed future arrangement.'},
    build('Build the weekend plan.',['friends','meeting','I’m','Saturday','on'],'I’m meeting friends on Saturday','Use I’m + verb-ing + object + time for a fixed arrangement.'),
    {type:'fill',prompt:'Complete: I’m ___ my family on Sunday.',answer:'visiting',hint:'v_______',explanation:'“I’m visiting …” describes a planned visit.'}
  ]},

  {id:'a2-u1-l2',unitId:'a2-u1',title:'Present continuous for arrangements',skill:'Grammar',minutes:10,objective:'Use present continuous for future arrangements.',activities:[
    word('calendar','Tomorrow','/təˈmɑːroʊ/',m('غدًا','Morgen','Demain','Morgen','Mañana','Tomorrow'),'I’m working tomorrow morning.'),
    listen('She is flying on Friday.',['She is flying on Friday.','She fly on Friday.','She flew every Friday.']),
    picture('Which visual best represents a fixed arrangement?',[{visualId:'calendar',label:'Calendar'},{visualId:'symptoms',label:'Symptoms'},{visualId:'price',label:'Price'}],'Calendar','A fixed future arrangement belongs on a calendar.'),
    {type:'choice',prompt:'Choose the natural sentence.',options:['She is fly on Friday.','She flying on Friday.','She is flying on Friday.'],answer:'She is flying on Friday.',explanation:'Use is + verb-ing.'},
    build('Build the arrangement.',['dinner','having','We','eight','at','are'],'We are having dinner at eight','Use subject + am/is/are + verb-ing + time.'),
    {type:'fill',prompt:'Complete: We are ___ dinner at eight.',answer:'having',explanation:'“We are having dinner …” is the correct arrangement form.'}
  ]},

  {id:'a2-u1-l3',unitId:'a2-u1',title:'Invite and respond',skill:'Speaking',minutes:9,objective:'Invite someone and respond naturally.',activities:[
    word('invite','Invite','/ɪnˈvaɪt/',m('يدعو','Uitnodigen','Inviter','Einladen','Invitar','Invite'),'Would you like to have coffee?'),
    listen('Would you like to have coffee?',['Would you like to have coffee?','You coffee now?','I had coffee yesterday.']),
    picture('Choose the visual for inviting someone.',[{visualId:'invite',label:'Invitation'},{visualId:'ticket',label:'Ticket'},{visualId:'symptoms',label:'Symptoms'}],'Invitation','Two people connecting represents an invitation.'),
    {type:'choice',prompt:'Choose the most natural invitation.',options:['You coffee?','Would you like to have coffee?','Coffee now yes?'],answer:'Would you like to have coffee?',explanation:'This is a polite and natural invitation.'},
    build('Build a polite invitation.',['to','Would','coffee','like','have','you'],'Would you like to have coffee','Would you like to …? is a polite invitation pattern.'),
    {type:'fill',prompt:'Complete: Sorry, I ___ tonight.',answer:'can’t',explanation:'“Sorry, I can’t” is a natural refusal.'}
  ]},

  {id:'a2-u2-l1',unitId:'a2-u2',title:'Prices and quantities',skill:'Vocabulary',minutes:8,objective:'Understand common shopping language for price and quantity.',activities:[
    word('price','Price','/praɪs/',m('سعر','Prijs','Prix','Preis','Precio','Price'),'How much is this?'),
    word('quantity','Kilo','/ˈkiːloʊ/',m('كيلوغرام','Kilo','Kilo','Kilo','Kilo','Kilo'),'I need a kilo of apples.'),
    listen('Can I pay by card?',['Can I pay by card?','Can I take the platform?','Can I drink the receipt?']),
    picture('Choose the visual that represents price.',[{visualId:'price',label:'Price'},{visualId:'trip',label:'Trip'},{visualId:'doctor',label:'Doctor'}],'Price','The tag visual represents a price.'),
    {type:'choice',prompt:'Which question asks about price?',options:['How many is this?','How much is this?','How often is this?'],answer:'How much is this?',explanation:'“How much” asks for price.'},
    build('Build the shopping request.',['apples','a','of','I','kilo','need'],'I need a kilo of apples','Quantity phrase: a kilo of + plural noun.'}
  ]},

  {id:'a2-u2-l2',unitId:'a2-u2',title:'Countable and uncountable nouns',skill:'Grammar',minutes:10,objective:'Choose much, many, some and any in common shopping contexts.',activities:[
    word('quantity','Many','/ˈmeni/',m('كثير من للأسماء المعدودة','Veel','Beaucoup de','Viele','Muchos','Many'),'How many apples do you need?'),
    listen('How much rice do you need?',['How much rice do you need?','How many rice do you need?','How much apples do you need?']),
    picture('Choose the visual for several countable items.',[{visualId:'quantity',label:'Several items'},{visualId:'price',label:'Price'},{visualId:'doctor',label:'Doctor'}],'Several items','Separate items can be counted, so many is used.'),
    {type:'choice',prompt:'Choose the correct question.',options:['How much apples do you need?','How many apples do you need?','How many rice do you need?'],answer:'How many apples do you need?',explanation:'Apples are countable, so use “many”.'},
    build('Build the question.',['milk','you','any','Do','have'],'Do you have any milk','Any is common in questions with uncountable nouns.'),
    {type:'fill',prompt:'Complete: Do you have ___ milk?',answer:'any',explanation:'“Any” is common in questions.'}
  ]},

  {id:'a2-u2-l3',unitId:'a2-u2',title:'At the checkout',skill:'Speaking',minutes:8,objective:'Handle a simple checkout conversation.',activities:[
    word('checkout','Receipt','/rɪˈsiːt/',m('إيصال','Bonnetje','Reçu','Kassenbon','Recibo','Receipt'),'Can I have the receipt?'),
    listen('Would you like a bag?',['Would you like a bag?','Which platform do you need?','You should rest.']),
    picture('Choose the checkout visual.',[{visualId:'checkout',label:'Checkout'},{visualId:'calendar',label:'Calendar'},{visualId:'symptoms',label:'Symptoms'}],'Checkout','The payment counter represents checkout.'),
    {type:'choice',prompt:'The cashier asks “Would you like a bag?” What is a natural answer?',options:['Yes, please.','I am bag.','Bag costs.'],answer:'Yes, please.',explanation:'“Yes, please” is polite and natural.'},
    build('Build the request.',['receipt','the','have','Can','I'],'Can I have the receipt','Can I have …? is a natural checkout request.'),
    {type:'fill',prompt:'Complete: Can I have the ___?',answer:'receipt',explanation:'A receipt is the record of your purchase.'}
  ]},

  {id:'a2-u3-l1',unitId:'a2-u3',title:'Travel information',skill:'Vocabulary',minutes:8,objective:'Understand common train, bus and airport vocabulary.',activities:[
    word('ticket','Ticket','/ˈtɪkɪt/',m('تذكرة','Kaartje','Billet','Fahrkarte','Billete','Ticket'),'I need a return ticket.'),
    word('station','Platform','/ˈplætfɔːrm/',m('رصيف المحطة','Perron','Quai','Bahnsteig','Andén','Platform'),'Which platform does it leave from?'),
    listen('The train is delayed.',['The train is delayed.','The train is a receipt.','The doctor is delayed.']),
    picture('Choose where you wait for a train.',[{visualId:'station',label:'Platform'},{visualId:'checkout',label:'Checkout'},{visualId:'doctor',label:'Doctor'}],'Platform','Trains depart from platforms at a station.'),
    {type:'choice',prompt:'Where do you wait for a train?',options:['platform','receipt','pharmacy'],answer:'platform',explanation:'Trains depart from platforms.'},
    build('Build the travel request.',['ticket','return','a','need','I'],'I need a return ticket','Use I need + noun phrase for a clear request.'}
  ]},

  {id:'a2-u3-l2',unitId:'a2-u3',title:'Past simple for travel',skill:'Grammar',minutes:10,objective:'Describe a completed trip using past simple.',activities:[
    word('trip','Journey','/ˈdʒɜːrni/',m('رحلة','Reis','Voyage','Reise','Viaje','Journey'),'The journey took two hours.'),
    listen('I went to Brussels yesterday.',['I went to Brussels yesterday.','I go to Brussels yesterday.','I am going to Brussels yesterday.']),
    picture('Choose the visual for a completed trip.',[{visualId:'trip',label:'Trip'},{visualId:'calendar',label:'Calendar'},{visualId:'checkout',label:'Checkout'}],'Trip','The suitcase visual represents a completed journey.'),
    {type:'choice',prompt:'Choose the correct sentence.',options:['I go to Brussels yesterday.','I went to Brussels yesterday.','I am going to Brussels yesterday.'],answer:'I went to Brussels yesterday.',explanation:'“Went” is the past form of “go”.'},
    build('Build the past sentence.',['hours','The','two','journey','took'],'The journey took two hours','Use the past form took for a completed duration.'),
    {type:'fill',prompt:'Complete: The journey ___ two hours.',answer:'took',explanation:'“Took” is the past form of “take”.'}
  ]},

  {id:'a2-u3-l3',unitId:'a2-u3',title:'Ask for travel help',skill:'Speaking',minutes:9,objective:'Ask staff for simple travel information and help.',activities:[
    word('travel-help','Help','/help/',m('مساعدة','Hulp','Aide','Hilfe','Ayuda','Help'),'Which platform do I need?'),
    listen('Do I need to change trains?',['Do I need to change trains?','Do I need to change apples?','Can I have the receipt?']),
    picture('Choose the visual for asking travel staff for help.',[{visualId:'travel-help',label:'Travel help'},{visualId:'price',label:'Price'},{visualId:'symptoms',label:'Symptoms'}],'Travel help','The traveller speaking to staff represents asking for help.'),
    {type:'choice',prompt:'Which question asks about changing trains?',options:['Do I need to change trains?','How much apples?','Where you working?'],answer:'Do I need to change trains?',explanation:'This is the natural question for a transfer.'},
    build('Build the station question.',['platform','need','Which','I','do'],'Which platform do I need','Use Which + noun + do I need? to ask for specific travel information.'),
    {type:'fill',prompt:'Complete: Which ___ do I need?',answer:'platform',explanation:'“Which platform do I need?” is a common station question.'}
  ]},

  {id:'a2-u4-l1',unitId:'a2-u4',title:'Symptoms and body problems',skill:'Vocabulary',minutes:8,objective:'Describe common minor health problems.',activities:[
    word('symptoms','Headache','/ˈhedeɪk/',m('صداع','Hoofdpijn','Mal de tête','Kopfschmerzen','Dolor de cabeza','Headache'),'I have a headache.'),
    listen('I feel dizzy.',['I feel dizzy.','I feel platform.','I am a ticket.']),
    picture('Choose the visual for a health symptom.',[{visualId:'symptoms',label:'Symptoms'},{visualId:'ticket',label:'Ticket'},{visualId:'price',label:'Price'}],'Symptoms','The unwell person represents symptoms.'),
    {type:'choice',prompt:'Which sentence describes pain in your head?',options:['I have a headache.','I have a ticket.','I feel platform.'],answer:'I have a headache.',explanation:'A headache is pain in the head.'},
    build('Build the symptom sentence.',['tired','very','I','feel'],'I feel very tired','Use I feel + adjective to describe a symptom.'),
    {type:'fill',prompt:'Complete: I feel very ___.',answer:'tired',explanation:'“I feel tired” is a common symptom description.'}
  ]},

  {id:'a2-u4-l2',unitId:'a2-u4',title:'should / shouldn’t',skill:'Grammar',minutes:9,objective:'Give and understand simple advice with should and shouldn’t.',activities:[
    word('advice','Rest','/rest/',m('راحة','Rusten','Se reposer','Ausruhen','Descansar','Rest'),'You should rest.'),
    listen('You should drink more water.',['You should drink more water.','You should to drink more water.','You drinking more water.']),
    picture('Choose the visual that represents advice.',[{visualId:'advice',label:'Advice'},{visualId:'ticket',label:'Ticket'},{visualId:'checkout',label:'Checkout'}],'Advice','The check mark represents recommended action.'),
    {type:'choice',prompt:'Choose the correct advice.',options:['You should to rest.','You should rest.','You should resting.'],answer:'You should rest.',explanation:'After “should”, use the base verb.'},
    build('Build the advice.',['water','drink','should','You','more'],'You should drink more water','Use should + base verb for advice.'),
    {type:'fill',prompt:'Complete: You ___ drink more water.',answer:'should',explanation:'“Should” introduces advice.'}
  ]},

  {id:'a2-u4-l3',unitId:'a2-u4',title:'At the doctor or pharmacy',skill:'Speaking',minutes:9,objective:'Explain a simple problem and understand basic advice.',activities:[
    word('doctor','Doctor','/ˈdɑːktər/',m('طبيب','Dokter','Médecin','Arzt','Médico','Doctor'),'I’ve had a cough for three days.'),
    listen('It started yesterday.',['It started yesterday.','It starts tomorrow.','It is a platform.']),
    picture('Choose the visual for talking to a doctor.',[{visualId:'doctor',label:'Doctor'},{visualId:'checkout',label:'Checkout'},{visualId:'weekend',label:'Weekend'}],'Doctor','The medical professional represents a doctor visit.'),
    {type:'choice',prompt:'Which sentence clearly explains duration?',options:['I cough three days.','I’ve had a cough for three days.','I am cough yesterday.'],answer:'I’ve had a cough for three days.',explanation:'This is a natural way to describe a continuing problem.'},
    build('Build the sentence about when it began.',['yesterday','started','It'],'It started yesterday','Use past simple to say when a problem began.'),
    {type:'fill',prompt:'Complete: It ___ yesterday.',answer:'started',explanation:'“It started yesterday” gives the beginning of the problem.'}
  ]},
];
