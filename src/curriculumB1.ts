import { buildAdvancedCurriculum, type AdvancedUnitSpec } from './advancedCurriculumFactory';

const specs: AdvancedUnitSpec[] = [
  {
    slug:'experiences-storytelling', title:'Experiences & storytelling', icon:'🧭', theme:'personal experiences and storytelling',
    lexical:[
      {term:'memorable experience',meaning:'an event you remember clearly because it was important or unusual',example:'Moving to a new city was a memorable experience.',kind:'collocation'},
      {term:'at first',meaning:'at the beginning of a situation',example:'At first, I felt nervous, but later I relaxed.',kind:'discourse_marker'},
      {term:'turn out',meaning:'to develop or end in a particular way',example:'The trip turned out better than we expected.',kind:'phrasal_verb'},
      {term:'in the end',meaning:'finally, after considering what happened',example:'In the end, we decided to stay another day.',kind:'discourse_marker'},
    ],
    listeningText:'Last year I joined a weekend cycling trip with people I did not know. At first I was worried that I would be too slow, but the group was patient and friendly. On the second day it started raining heavily, so we changed our route and stopped in a small village. The change of plan turned out to be the best part of the trip because we met local people and learned about the area. In the end, I came home tired but much more confident.',
    readingTitle:'A story that changed direction',
    readingText:'Mina planned to spend a quiet weekend at home, but a friend invited her to help at a community event. She agreed even though she knew almost nobody there. During the first hour, she mainly followed instructions and tried not to make mistakes. Later, when more visitors arrived than expected, the organisers asked Mina to welcome people and explain where different activities were taking place. She was nervous, yet she discovered that she could speak clearly when she focused on helping one person at a time. By the end of the day, Mina had exchanged phone numbers with two volunteers and had agreed to join the next event. She later said the day taught her that confidence often appears after action, not before it.',
    inferenceQuestion:{prompt:'What can we infer about Mina by the end of the event?',options:['She still wanted to avoid all social situations.','She became more willing to take part in similar activities.','She decided volunteering was always stressful.'],answer:'She became more willing to take part in similar activities.',explanation:'She exchanged contacts and agreed to join the next event, showing increased confidence and willingness.'},
    grammarFocus:'past simple and past continuous for narrative background and events', grammarWrong:'I walked home when I saw that it was raining.', grammarCorrect:'I was walking home when I saw that it was raining.', grammarExplanation:'Use past continuous for the background action in progress and past simple for the event that happened during it.',
    speakingScenario:'You are telling a colleague about a time when a plan changed unexpectedly. The colleague asks follow-up questions.', learnerRole:'Tell the story clearly and explain how you felt.', counterpartRole:'A colleague who wants to understand what happened and why it mattered.', proposition:'Unexpected changes can lead to useful experiences.',
    writingPrompt:'Write about an experience that did not go according to plan. Explain what happened, how you reacted and what you learned from it.',
    synthesisSources:[
      {id:'EXP-A',title:'Learning through action',text:'People often wait to feel confident before trying something difficult. In practice, confidence can grow after a person takes a small risk, completes a task and sees that the result is manageable.'},
      {id:'EXP-B',title:'The value of reflection',text:'Experience alone does not always lead to learning. People benefit more when they reflect on what happened, identify what they would repeat or change and connect the experience to future decisions.'},
    ],
  },
  {
    slug:'workplace-communication', title:'Work & workplace communication', icon:'💼', theme:'workplace communication and cooperation',
    lexical:[
      {term:'meet a deadline',meaning:'finish work by the required time',example:'We need to meet the deadline on Friday.',kind:'collocation'},
      {term:'take responsibility',meaning:'accept that a task or result is yours to manage',example:'She took responsibility for contacting the client.',kind:'collocation'},
      {term:'follow up',meaning:'contact someone again to continue or check progress',example:'I will follow up by email tomorrow.',kind:'phrasal_verb'},
      {term:'workload',meaning:'the amount of work a person has to do',example:'My workload is heavier this week.'},
    ],
    listeningText:'Our team missed a deadline last month, not because anyone was lazy, but because tasks were not clearly assigned. This week we changed the process. At the start of each project, one person writes down who is responsible for each task and when it should be completed. We also have a short progress meeting on Wednesday. The new system takes ten minutes, but it has reduced confusion and made it easier to follow up when something is delayed.',
    readingTitle:'A small change in the team',
    readingText:'A design company noticed that employees were spending too much time asking each other for updates. Managers first thought the solution was to hold more meetings, but staff said that frequent meetings would reduce the time available for focused work. Instead, the team created a shared project board. Each task now has one owner, a deadline and a short status note. The board does not replace conversation, but it means meetings can focus on problems that actually need discussion. After six weeks, employees reported fewer repeated questions and said responsibilities were clearer. The company kept the system but agreed to review it every three months so that it would not become another administrative burden.',
    inferenceQuestion:{prompt:'Why did the company choose a shared project board instead of more meetings?',options:['Employees wanted less information.','The board could provide routine updates without using more meeting time.','Managers refused to discuss problems.'],answer:'The board could provide routine updates without using more meeting time.',explanation:'The text says the board handles routine status information so meetings can focus on real problems.'},
    grammarFocus:'present perfect for recent changes with current relevance', grammarWrong:'We changed the process and now it works better since six weeks.', grammarCorrect:'We have changed the process, and it has worked better for six weeks.', grammarExplanation:'Use present perfect for a change or situation that began in the past and remains relevant now; use for with a period of time.',
    speakingScenario:'A teammate says the current workload is too high and asks you to discuss priorities.', learnerRole:'Explain your priorities, ask what can be delayed and agree on a practical next step.', counterpartRole:'A teammate who also has urgent tasks.', proposition:'Clear responsibility is more useful than having more meetings.',
    writingPrompt:'Write a professional message to your team suggesting one practical change that could improve communication or workload management. Explain the problem and the expected benefit.',
    synthesisSources:[
      {id:'WORK-A',title:'Short meetings',text:'Short regular meetings can help teams identify blockers early and make quick decisions together. They are most useful when participants prepare and keep discussion focused.'},
      {id:'WORK-B',title:'Asynchronous updates',text:'Written project updates reduce interruptions and give people time to focus. However, complex disagreements are often easier to solve in direct conversation than through long message threads.'},
    ],
  },
  {
    slug:'travel-problem-solving', title:'Travel & problem solving', icon:'🚆', theme:'travel problems and practical solutions',
    lexical:[
      {term:'miss a connection',meaning:'arrive too late to catch the next part of a journey',example:'We missed our connection because the first train was delayed.',kind:'collocation'},
      {term:'alternative route',meaning:'another way to reach a destination',example:'The app suggested an alternative route.',kind:'collocation'},
      {term:'sort out',meaning:'solve or organise a problem',example:'The station staff helped us sort out the ticket problem.',kind:'phrasal_verb'},
      {term:'refund',meaning:'money returned after a cancelled or unsatisfactory service',example:'The airline offered a refund.'},
    ],
    listeningText:'My train to Cologne was cancelled, so I went to the information desk. The first alternative arrived too late for my connection, but the employee found another route through Utrecht. It took forty minutes longer, yet I still reached my destination that evening. I also learned that I could use the same ticket because the cancellation was caused by the railway company. The situation was frustrating, but asking specific questions made it much easier to solve.',
    readingTitle:'When the direct route disappears',
    readingText:'Travel problems often feel worse when people do not know what information they need. A passenger whose train is cancelled may immediately ask for a refund, even when an alternative route would still get them to the destination. Transport staff recommend first checking three things: the expected arrival time of the alternative, whether the original ticket remains valid and whether a reservation is required on the new service. If the delay becomes very long, passengers can then ask about compensation or a refund. This order of questions helps travellers make a decision based on the whole journey rather than reacting only to the first problem.',
    inferenceQuestion:{prompt:'What is the writer’s main advice?',options:['Always cancel the journey immediately.','Collect practical information before deciding what to do.','Never ask about compensation.'],answer:'Collect practical information before deciding what to do.',explanation:'The passage recommends checking arrival time, ticket validity and reservations before choosing a solution.'},
    grammarFocus:'first conditional for likely travel consequences', grammarWrong:'If the next train will be late, I miss my connection.', grammarCorrect:'If the next train is late, I will miss my connection.', grammarExplanation:'Use present simple in the if-clause and will in the result clause for a likely future consequence.',
    speakingScenario:'Your train has been cancelled and you need to reach another city for an important appointment.', learnerRole:'Ask station staff for alternatives, ticket information and expected arrival time.', counterpartRole:'A station employee who can offer two possible routes.', proposition:'Good travel decisions depend more on clear information than on speed.',
    writingPrompt:'Write a message to a transport company describing a disrupted journey. Explain what happened, what solution you accepted and what compensation or information you are requesting.',
    synthesisSources:[
      {id:'TRAVEL-A',title:'Fastest route',text:'When journeys are disrupted, the fastest alternative is not always the most reliable. A route with several short connections may create new risks if one service is delayed.'},
      {id:'TRAVEL-B',title:'Flexible tickets',text:'Flexible travel conditions can reduce stress during disruption because passengers can change route or departure time without buying a new ticket. The conditions should be checked before travel.'},
    ],
  },
  {
    slug:'relationships-social', title:'Relationships & social situations', icon:'🤝', theme:'social relationships, boundaries and misunderstandings',
    lexical:[
      {term:'clear up a misunderstanding',meaning:'explain a situation so people understand each other correctly',example:'We talked after work and cleared up the misunderstanding.',kind:'collocation'},
      {term:'set a boundary',meaning:'state what behaviour or limit is acceptable to you',example:'It is reasonable to set a boundary when you need quiet time.',kind:'collocation'},
      {term:'get along with',meaning:'have a friendly relationship with someone',example:'I get along with my neighbours.',kind:'phrasal_verb'},
      {term:'considerate',meaning:'careful about how your actions affect other people',example:'It was considerate of her to call first.'},
    ],
    listeningText:'Two friends stopped speaking for several days after one of them cancelled dinner at the last minute. One friend thought the cancellation meant the relationship was not important. The other had cancelled because of a family problem but had not explained it clearly. When they finally talked, they realised that the conflict was based on different assumptions rather than bad intentions. They agreed to give a little more information in similar situations instead of expecting the other person to guess.',
    readingTitle:'What people do not say',
    readingText:'Many small conflicts begin with missing information. A short message such as “I can’t come tonight” may be perfectly clear about the plan, but unclear about the reason or the relationship. The receiver may fill the gap with an assumption: perhaps the other person is not interested, is angry or does not respect their time. Communication specialists often suggest checking an interpretation before reacting strongly. A question such as “Is everything okay?” can create space for explanation without immediately accusing anyone. This does not mean people must explain every private detail, but it can prevent a temporary problem from becoming a larger conflict.',
    inferenceQuestion:{prompt:'What does the writer suggest about assumptions?',options:['They can turn missing information into unnecessary conflict.','They are always more accurate than questions.','People should explain every private detail.'],answer:'They can turn missing information into unnecessary conflict.',explanation:'The passage shows how people may fill gaps with negative interpretations that create conflict.'},
    grammarFocus:'modal verbs for advice, obligation and possibility', grammarWrong:'You must to explain everything to your friend.', grammarCorrect:'You do not have to explain everything, but you should clarify what matters.', grammarExplanation:'Use should for advice and do not have to for lack of obligation; modal patterns do not take to before the base verb except have to.',
    speakingScenario:'A friend has repeatedly changed plans without telling you until the last minute.', learnerRole:'Explain how this affects you, ask for a change and keep the conversation respectful.', counterpartRole:'A friend who did not realise the changes were causing a problem.', proposition:'Checking an assumption is usually better than reacting to it immediately.',
    writingPrompt:'Write a message that clears up a misunderstanding with a friend, neighbour or colleague. Explain your perspective, acknowledge the other person and suggest a practical way forward.',
    synthesisSources:[
      {id:'REL-A',title:'Direct communication',text:'Direct communication reduces guessing and can make expectations clearer. It works best when people describe the effect of a behaviour rather than attacking the other person’s character.'},
      {id:'REL-B',title:'Privacy and boundaries',text:'Healthy communication does not require sharing every personal detail. People can give enough context to prevent misunderstanding while still keeping private information private.'},
    ],
  },
  {
    slug:'health-wellbeing', title:'Health & wellbeing', icon:'🌿', theme:'health habits, stress and wellbeing',
    lexical:[
      {term:'build a habit',meaning:'develop a behaviour through regular repetition',example:'I am trying to build a habit of walking after lunch.',kind:'collocation'},
      {term:'cut down on',meaning:'reduce the amount of something',example:'I am cutting down on late-night screen time.',kind:'phrasal_verb'},
      {term:'sleep routine',meaning:'a regular pattern of behaviour around sleeping',example:'A consistent sleep routine helps me feel better.',kind:'collocation'},
      {term:'manageable',meaning:'possible to deal with without too much difficulty',example:'A ten-minute walk feels manageable on busy days.'},
    ],
    listeningText:'I used to make big health plans and stop after a few days. This year I changed my approach. Instead of promising to exercise for an hour every day, I started with a ten-minute walk after lunch. Once that became automatic, I added a longer walk at the weekend. The small routine did not feel impressive at first, but it was easy to repeat. After two months, I was moving much more than when I had tried the more ambitious plan.',
    readingTitle:'Small changes that survive busy weeks',
    readingText:'Health advice often sounds simple until normal life becomes busy. A plan that requires perfect conditions may disappear as soon as someone works late, travels or sleeps badly. Behaviour researchers therefore recommend making the first version of a habit easy to repeat. Someone who wants to read more might begin with five pages before bed. Someone who wants to move more could walk for ten minutes after lunch. The goal is not to stay at the smallest version forever. The goal is to create a reliable starting point that can be expanded when time and energy allow.',
    inferenceQuestion:{prompt:'Why does the writer recommend starting with an easy version of a habit?',options:['Because difficult goals are never useful.','Because a repeatable starting point is more likely to continue during busy periods.','Because habits should never become more challenging.'],answer:'Because a repeatable starting point is more likely to continue during busy periods.',explanation:'The passage emphasises reliability during imperfect conditions, with expansion later.'},
    grammarFocus:'used to and present habits for change over time', grammarWrong:'I use to sleep late, but now I go to bed earlier.', grammarCorrect:'I used to sleep late, but now I go to bed earlier.', grammarExplanation:'Use used to + base verb for a past habit that is no longer true.',
    speakingScenario:'A friend wants to improve sleep, exercise and diet all at once but feels overwhelmed.', learnerRole:'Suggest one manageable first step, explain why and ask what feels realistic.', counterpartRole:'A friend who wants change but has limited time.', proposition:'Small consistent health changes are more effective than ambitious short-term plans.',
    writingPrompt:'Write a short wellbeing plan for a busy person. Choose one habit, explain the first manageable step and describe how the plan could grow over time.',
    synthesisSources:[
      {id:'HEALTH-A',title:'Consistency',text:'A modest action repeated regularly can become automatic and may be easier to maintain than a demanding routine that depends on motivation every day.'},
      {id:'HEALTH-B',title:'Progressive challenge',text:'Once a routine is stable, increasing difficulty gradually can create further improvement. If the increase is too large, people may stop doing the behaviour altogether.'},
    ],
  },
  {
    slug:'news-opinions', title:'News, media & opinions', icon:'📰', theme:'news, opinions and checking information',
    lexical:[
      {term:'reliable source',meaning:'a source that can generally be trusted to provide accurate information',example:'I looked for a reliable source before sharing the story.',kind:'collocation'},
      {term:'claim',meaning:'a statement that someone says is true',example:'The article makes a strong claim but gives little evidence.'},
      {term:'check out',meaning:'investigate or examine something',example:'I checked out the original report before reposting the message.',kind:'phrasal_verb'},
      {term:'according to',meaning:'used to identify the source of information',example:'According to the report, prices fell slightly.',kind:'discourse_marker'},
    ],
    listeningText:'A dramatic headline appeared in several group chats this morning. Instead of sharing it immediately, one person searched for the original source. The headline was based on a real report, but it had removed an important condition from the findings. The report said the effect appeared only in a small group, while the headline made it sound universal. The story was not completely false, but it was misleading because it left out context.',
    readingTitle:'A true fact can still mislead',
    readingText:'Misinformation is not always invented from nothing. Sometimes a true number, quotation or event is presented without enough context. For example, a website may say that a product “doubled the chance” of a result, while failing to mention that the original chance was extremely small. A reader can protect themselves by asking where the information came from, what was measured and what comparison is being made. These questions do not guarantee perfect understanding, but they make it harder for a dramatic claim to succeed simply because it sounds confident.',
    inferenceQuestion:{prompt:'What does the passage imply about factual information?',options:['A factual detail can be misleading if important context is missing.','Every number in the news is false.','Readers should ignore all confident claims.'],answer:'A factual detail can be misleading if important context is missing.',explanation:'The writer explains that true numbers or quotations may still mislead when context is removed.'},
    grammarFocus:'reported speech for relaying claims', grammarWrong:'The article said the effect is universal yesterday.', grammarCorrect:'The article said that the effect was universal.', grammarExplanation:'When reporting a past statement, the tense commonly shifts back, especially when the original claim is being reported rather than accepted as current fact.',
    speakingScenario:'A friend wants to share a surprising online story that you think needs checking.', learnerRole:'Explain why you want to verify it, ask about the source and suggest a simple check.', counterpartRole:'A friend who believes the headline because many people shared it.', proposition:'A story can be technically true and still be misleading.',
    writingPrompt:'Write a short opinion post explaining three questions people should ask before sharing a surprising news story online.',
    synthesisSources:[
      {id:'NEWS-A',title:'Speed of sharing',text:'Online platforms reward quick reactions. People often share information before reading the full source, especially when the headline creates strong emotion.'},
      {id:'NEWS-B',title:'Source checking',text:'Simple verification habits—opening the original source, checking the date and comparing another reputable source—can identify many misleading stories without specialist knowledge.'},
    ],
  },
  {
    slug:'digital-life', title:'Digital life & technology', icon:'📱', theme:'technology, attention and digital habits',
    lexical:[
      {term:'screen time',meaning:'time spent using devices with screens',example:'I am trying to reduce my screen time in the evening.',kind:'collocation'},
      {term:'turn off notifications',meaning:'stop a device or app from sending alerts',example:'I turned off notifications while studying.',kind:'functional_phrase'},
      {term:'scroll through',meaning:'move through digital content on a screen',example:'I scrolled through the news feed for twenty minutes.',kind:'phrasal_verb'},
      {term:'distracting',meaning:'making it difficult to concentrate',example:'Constant alerts are distracting.'},
    ],
    listeningText:'I thought my phone was interrupting me because I lacked self-control, but I noticed that many interruptions started with notifications. I changed the settings so only messages from family and work contacts appeared immediately. I still use the same apps, but now I choose when to open them instead of responding to every alert. The change did not remove distraction completely, but it gave me more control over when I switch attention.',
    readingTitle:'Designing the environment, not just willpower',
    readingText:'Digital distraction is often described as a personal discipline problem. That explanation ignores the way devices are designed to attract attention. Notifications, badges and automatic recommendations all create invitations to switch tasks. One practical response is to redesign the digital environment: remove unnecessary alerts, keep distracting apps off the first screen and create periods when the phone is out of reach. These changes do not make technology harmful or useless. They simply make intentional use easier by reducing the number of decisions a person must make every hour.',
    inferenceQuestion:{prompt:'What is the writer’s view of digital distraction?',options:['It is caused only by weak personal discipline.','Device design can influence distraction, so changing the environment can help.','Technology should be completely avoided.'],answer:'Device design can influence distraction, so changing the environment can help.',explanation:'The passage explicitly challenges a willpower-only explanation and recommends environmental changes.'},
    grammarFocus:'comparatives for evaluating options and habits', grammarWrong:'Turning off alerts is more easier than ignoring them all day.', grammarCorrect:'Turning off alerts is easier than ignoring them all day.', grammarExplanation:'Do not use both more and an -er comparative with short adjectives such as easy.',
    speakingScenario:'You and a classmate are planning a focused study session, but both of you get distracted by phones.', learnerRole:'Suggest two practical rules and agree on a realistic plan.', counterpartRole:'A classmate who needs the phone for some useful study tools.', proposition:'Changing device settings is more effective than relying only on willpower.',
    writingPrompt:'Write a short article suggesting practical ways to use a smartphone more intentionally without giving up useful digital tools.',
    synthesisSources:[
      {id:'DIG-A',title:'Useful connection',text:'Smartphones make communication, navigation and access to information easier. Strict rules that remove all phone use can also remove genuinely useful tools.'},
      {id:'DIG-B',title:'Attention cost',text:'Frequent alerts and task switching can reduce concentration. Changing notification settings and creating device-free periods can protect focused work.'},
    ],
  },
  {
    slug:'goals-decisions', title:'Goals, decisions & future plans', icon:'🎯', theme:'goals, decisions and future planning',
    lexical:[
      {term:'weigh up options',meaning:'consider advantages and disadvantages before deciding',example:'We weighed up the options before accepting the offer.',kind:'collocation'},
      {term:'long-term goal',meaning:'an objective intended to be achieved over a longer period',example:'Improving my English is a long-term goal.',kind:'collocation'},
      {term:'work towards',meaning:'make progress in the direction of a goal',example:'I am working towards a professional qualification.',kind:'phrasal_verb'},
      {term:'realistic',meaning:'possible and sensible in the actual situation',example:'The schedule is realistic for my current workload.'},
    ],
    listeningText:'When I decided to change jobs, I first wrote down what I wanted to improve: working hours, learning opportunities and salary. No single job offered the best result in every area, so I had to decide what mattered most. I accepted an offer with slightly lower pay because the training was much stronger and the commute was shorter. Six months later, the decision still feels right because it matched my longer-term goals rather than only the highest immediate number.',
    readingTitle:'A good decision is not always the perfect option',
    readingText:'People often delay decisions because they are searching for an option with no disadvantages. In reality, many important choices involve trade-offs. A new job may pay more but require a longer journey. A course may be excellent but expensive. One useful method is to identify the criteria that matter, rank them and then compare options using the same criteria. This does not remove uncertainty, but it makes the reason for a choice clearer. It also helps people review the decision later without pretending they had perfect information at the time.',
    inferenceQuestion:{prompt:'What does the writer suggest about important decisions?',options:['The best choice has no disadvantages.','Using clear criteria can improve decisions even when uncertainty remains.','People should always choose the cheapest option.'],answer:'Using clear criteria can improve decisions even when uncertainty remains.',explanation:'The passage recommends ranking criteria and comparing trade-offs rather than waiting for a perfect option.'},
    grammarFocus:'future forms for plans, intentions and predictions', grammarWrong:'I will meeting the adviser next Monday because the appointment is fixed.', grammarCorrect:'I am meeting the adviser next Monday because the appointment is fixed.', grammarExplanation:'Use present continuous for a fixed future arrangement; will is more typical for decisions, offers or predictions depending on context.',
    speakingScenario:'You are choosing between two training courses with different costs, schedules and benefits.', learnerRole:'Explain your priorities, compare the options and reach a decision.', counterpartRole:'A friend who challenges one of your priorities and asks you to justify it.', proposition:'A realistic plan is more valuable than an ambitious plan that cannot be maintained.',
    writingPrompt:'Write about a decision you need to make in the next six months. Explain your criteria, compare at least two options and describe the next practical step.',
    synthesisSources:[
      {id:'GOAL-A',title:'Specific goals',text:'Goals become easier to act on when people define a concrete next behaviour and a realistic time. Vague intentions can be motivating but do not always guide action.'},
      {id:'GOAL-B',title:'Flexible planning',text:'Plans need room for adjustment because circumstances change. Reviewing progress regularly allows people to modify the route without abandoning the overall goal.'},
    ],
  },
];

export const b1Curriculum = buildAdvancedCurriculum('B1', specs);
export const b1Units = b1Curriculum.compatibleUnits;
export const b1UnitsV2 = b1Curriculum.units;
export const b1Lessons = b1Curriculum.lessons;
