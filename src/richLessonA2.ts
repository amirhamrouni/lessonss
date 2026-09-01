import type {
  RichImageChoiceActivity,
  RichLesson,
  RichListenSelectActivity,
  RichSentenceBuildActivity,
  RichVisualWordActivity,
} from './richLesson';

const m = (Arabic:string, Dutch:string, French:string, German:string, Spanish:string, English:string) => ({ Arabic, Dutch, French, German, Spanish, English });
const word = (visualId:any, word:string, phonetic:string, meanings:Record<string,string>, example:string):RichVisualWordActivity => ({ type:'visual_word', visualId, word, phonetic, meanings, example });
const listen = (audioText:string, options:string[], answer=audioText, explanation=`You heard “${audioText}”.`):RichListenSelectActivity => ({ type:'listen_select', prompt:'Listen and choose what you hear.', audioText, options, answer, explanation });
const picture = (prompt:string, options:Array<{visualId:any;label:string}>, answer:string, explanation:string):RichImageChoiceActivity => ({ type:'image_choice', prompt, options, answer, explanation });
const build = (prompt:string, words:string[], answer:string, explanation:string):RichSentenceBuildActivity => ({ type:'sentence_build', prompt, words, answer, explanation });

export const richA2Lessons:RichLesson[] = [
  {
    id:'a2-u1-l1', unitId:'a2-u1', title:'Plans for the weekend', skill:'Vocabulary', minutes:8,
    objective:'Talk about simple future plans and free-time activities.',
    activities:[
      word('weekend','Weekend','/ˌwiːkˈend/',m('عطلة نهاية الأسبوع','Weekend','Week-end','Wochenende','Fin de semana','Weekend'),"I’m meeting friends this weekend."),
      listen("I’m visiting my sister tomorrow.",["I’m visiting my sister tomorrow.",'I visited my sister yesterday.','I visit my sister every day.']),
      picture('Choose the visual for a weekend plan.',[{visualId:'weekend',label:'Weekend plan'},{visualId:'checkout',label:'Checkout'},{visualId:'doctor',label:'Doctor'}],'Weekend plan','A weekend calendar represents a planned activity.'),
      build('Build the weekend plan.',['friends','meeting',"I’m",'Saturday','on'],"I’m meeting friends on Saturday",'Use present continuous for a fixed future arrangement.'),
    ],
  },
  {
    id:'a2-u1-l2', unitId:'a2-u1', title:'Present continuous for arrangements', skill:'Grammar', minutes:10,
    objective:'Use present continuous for future arrangements.',
    activities:[
      word('calendar','Tomorrow','/təˈmɑːroʊ/',m('غدًا','Morgen','Demain','Morgen','Mañana','Tomorrow'),"I’m working tomorrow morning."),
      listen('She is flying on Friday.',['She is flying on Friday.','She fly on Friday.','She flew every Friday.']),
      picture('Which visual best represents a fixed arrangement?',[{visualId:'calendar',label:'Calendar'},{visualId:'symptoms',label:'Symptoms'},{visualId:'price',label:'Price'}],'Calendar','A fixed arrangement belongs on a calendar.'),
      build('Build the arrangement.',['dinner','having','We','eight','at','are'],'We are having dinner at eight','Use subject + am/is/are + verb-ing + time.'),
    ],
  },
  {
    id:'a2-u1-l3', unitId:'a2-u1', title:'Invite and respond', skill:'Speaking', minutes:9,
    objective:'Invite someone and respond naturally.',
    activities:[
      word('invite','Invite','/ɪnˈvaɪt/',m('يدعو','Uitnodigen','Inviter','Einladen','Invitar','Invite'),'Would you like to have coffee?'),
      listen('Would you like to have coffee?',['Would you like to have coffee?','You coffee now?','I had coffee yesterday.']),
      picture('Choose the visual for inviting someone.',[{visualId:'invite',label:'Invitation'},{visualId:'ticket',label:'Ticket'},{visualId:'symptoms',label:'Symptoms'}],'Invitation','Two people connecting represents an invitation.'),
      build('Build a polite invitation.',['to','Would','coffee','like','have','you'],'Would you like to have coffee','Would you like to …? is a polite invitation pattern.'),
    ],
  },
  {
    id:'a2-u2-l1', unitId:'a2-u2', title:'Prices and quantities', skill:'Vocabulary', minutes:8,
    objective:'Understand common shopping language for price and quantity.',
    activities:[
      word('price','Price','/praɪs/',m('سعر','Prijs','Prix','Preis','Precio','Price'),'How much is this?'),
      word('quantity','Kilo','/ˈkiːloʊ/',m('كيلوغرام','Kilo','Kilo','Kilo','Kilo','Kilo'),'I need a kilo of apples.'),
      listen('Can I pay by card?',['Can I pay by card?','Can I take the platform?','Can I drink the receipt?']),
      picture('Choose the visual that represents price.',[{visualId:'price',label:'Price'},{visualId:'trip',label:'Trip'},{visualId:'doctor',label:'Doctor'}],'Price','The tag visual represents a price.'),
      build('Build the shopping request.',['apples','a','of','I','kilo','need'],'I need a kilo of apples','Use a kilo of + plural noun for quantity.'),
    ],
  },
  {
    id:'a2-u2-l2', unitId:'a2-u2', title:'Countable and uncountable nouns', skill:'Grammar', minutes:10,
    objective:'Choose much, many, some and any in common shopping contexts.',
    activities:[
      word('quantity','Many','/ˈmeni/',m('كثير من للأسماء المعدودة','Veel','Beaucoup de','Viele','Muchos','Many'),'How many apples do you need?'),
      listen('How much rice do you need?',['How much rice do you need?','How many rice do you need?','How much apples do you need?']),
      picture('Choose the visual for several countable items.',[{visualId:'quantity',label:'Several items'},{visualId:'price',label:'Price'},{visualId:'doctor',label:'Doctor'}],'Several items','Separate items can be counted, so many is used.'),
      build('Build the question.',['milk','you','any','Do','have'],'Do you have any milk','Any is common in questions with uncountable nouns.'),
    ],
  },
  {
    id:'a2-u2-l3', unitId:'a2-u2', title:'At the checkout', skill:'Speaking', minutes:8,
    objective:'Handle a simple checkout conversation.',
    activities:[
      word('checkout','Receipt','/rɪˈsiːt/',m('إيصال','Bonnetje','Reçu','Kassenbon','Recibo','Receipt'),'Can I have the receipt?'),
      listen('Would you like a bag?',['Would you like a bag?','Which platform do you need?','You should rest.']),
      picture('Choose the checkout visual.',[{visualId:'checkout',label:'Checkout'},{visualId:'calendar',label:'Calendar'},{visualId:'symptoms',label:'Symptoms'}],'Checkout','The payment counter represents checkout.'),
      build('Build the request.',['receipt','the','have','Can','I'],'Can I have the receipt','Can I have …? is a natural checkout request.'),
    ],
  },
  {
    id:'a2-u3-l1', unitId:'a2-u3', title:'Travel information', skill:'Vocabulary', minutes:8,
    objective:'Understand common train, bus and airport vocabulary.',
    activities:[
      word('ticket','Ticket','/ˈtɪkɪt/',m('تذكرة','Kaartje','Billet','Fahrkarte','Billete','Ticket'),'I need a return ticket.'),
      word('station','Platform','/ˈplætfɔːrm/',m('رصيف المحطة','Perron','Quai','Bahnsteig','Andén','Platform'),'Which platform does it leave from?'),
      listen('The train is delayed.',['The train is delayed.','The train is a receipt.','The doctor is delayed.']),
      picture('Choose where you wait for a train.',[{visualId:'station',label:'Platform'},{visualId:'checkout',label:'Checkout'},{visualId:'doctor',label:'Doctor'}],'Platform','Trains depart from platforms at a station.'),
      build('Build the travel request.',['ticket','return','a','need','I'],'I need a return ticket','Use I need + noun phrase for a clear request.'),
    ],
  },
  {
    id:'a2-u3-l2', unitId:'a2-u3', title:'Past simple for travel', skill:'Grammar', minutes:10,
    objective:'Describe a completed trip using past simple.',
    activities:[
      word('trip','Journey','/ˈdʒɜːrni/',m('رحلة','Reis','Voyage','Reise','Viaje','Journey'),'The journey took two hours.'),
      listen('I went to Brussels yesterday.',['I went to Brussels yesterday.','I go to Brussels yesterday.','I am going to Brussels yesterday.']),
      picture('Choose the visual for a completed trip.',[{visualId:'trip',label:'Trip'},{visualId:'calendar',label:'Calendar'},{visualId:'checkout',label:'Checkout'}],'Trip','The suitcase visual represents a completed journey.'),
      build('Build the past sentence.',['hours','The','two','journey','took'],'The journey took two hours','Use the past form took for a completed duration.'),
    ],
  },
  {
    id:'a2-u3-l3', unitId:'a2-u3', title:'Ask for travel help', skill:'Speaking', minutes:9,
    objective:'Ask staff for simple travel information and help.',
    activities:[
      word('travel-help','Help','/help/',m('مساعدة','Hulp','Aide','Hilfe','Ayuda','Help'),'Which platform do I need?'),
      listen('Do I need to change trains?',['Do I need to change trains?','Do I need to change apples?','Can I have the receipt?']),
      picture('Choose the visual for asking travel staff for help.',[{visualId:'travel-help',label:'Travel help'},{visualId:'price',label:'Price'},{visualId:'symptoms',label:'Symptoms'}],'Travel help','The traveller speaking to staff represents asking for help.'),
      build('Build the station question.',['platform','need','Which','I','do'],'Which platform do I need','Use Which + noun + do I need? for specific travel information.'),
    ],
  },
  {
    id:'a2-u4-l1', unitId:'a2-u4', title:'Symptoms and body problems', skill:'Vocabulary', minutes:8,
    objective:'Describe common minor health problems.',
    activities:[
      word('symptoms','Headache','/ˈhedeɪk/',m('صداع','Hoofdpijn','Mal de tête','Kopfschmerzen','Dolor de cabeza','Headache'),'I have a headache.'),
      listen('I feel dizzy.',['I feel dizzy.','I feel platform.','I am a ticket.']),
      picture('Choose the visual for a health symptom.',[{visualId:'symptoms',label:'Symptoms'},{visualId:'ticket',label:'Ticket'},{visualId:'price',label:'Price'}],'Symptoms','The unwell person represents symptoms.'),
      build('Build the symptom sentence.',['tired','very','I','feel'],'I feel very tired','Use I feel + adjective to describe a symptom.'),
    ],
  },
  {
    id:'a2-u4-l2', unitId:'a2-u4', title:'should / shouldn’t', skill:'Grammar', minutes:9,
    objective:'Give and understand simple advice with should and shouldn’t.',
    activities:[
      word('advice','Rest','/rest/',m('راحة','Rusten','Se reposer','Ausruhen','Descansar','Rest'),'You should rest.'),
      listen('You should drink more water.',['You should drink more water.','You should to drink more water.','You drinking more water.']),
      picture('Choose the visual that represents advice.',[{visualId:'advice',label:'Advice'},{visualId:'ticket',label:'Ticket'},{visualId:'checkout',label:'Checkout'}],'Advice','The check mark represents recommended action.'),
      build('Build the advice.',['water','drink','should','You','more'],'You should drink more water','Use should + base verb for advice.'),
    ],
  },
  {
    id:'a2-u4-l3', unitId:'a2-u4', title:'At the doctor or pharmacy', skill:'Speaking', minutes:9,
    objective:'Explain a simple problem and understand basic advice.',
    activities:[
      word('doctor','Doctor','/ˈdɑːktər/',m('طبيب','Dokter','Médecin','Arzt','Médico','Doctor'),"I’ve had a cough for three days."),
      listen("I’ve had a cough for three days.",["I’ve had a cough for three days.",'I cough three days.','I am cough yesterday.']),
      picture('Choose the visual for talking to a health professional.',[{visualId:'doctor',label:'Doctor'},{visualId:'checkout',label:'Checkout'},{visualId:'trip',label:'Trip'}],'Doctor','The doctor visual represents a health consultation.'),
      build('Build the duration sentence.',['days','cough','three','a','for',"I’ve",'had'],"I’ve had a cough for three days",'Use have had + for + duration for a continuing problem.'),
    ],
  },
];
