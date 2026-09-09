import { buildAdvancedCurriculum, type AdvancedUnitSpec } from './advancedCurriculumFactory';

const specs: AdvancedUnitSpec[] = [
  {
    slug:'opinions-evidence', title:'Opinions, evidence & argument', icon:'⚖️', theme:'forming, supporting and qualifying arguments',
    lexical:[
      {term:'support a claim',meaning:'provide reasons or evidence that make a claim more convincing',example:'The report supports its claim with survey data.',kind:'collocation'},
      {term:'to some extent',meaning:'partly but not completely',example:'I agree to some extent, but the cost is still a concern.',kind:'discourse_marker'},
      {term:'counterargument',meaning:'an argument that challenges another position',example:'A strong essay responds to a relevant counterargument.'},
      {term:'weigh the evidence',meaning:'consider the strength of different pieces of evidence',example:'We should weigh the evidence before making a decision.',kind:'collocation'},
    ],
    listeningText:'The speaker argues that remote work can improve productivity, but only when teams redesign communication rather than copying office habits online. She points to fewer interruptions as one advantage, yet she also notes that new employees may struggle to learn informal processes. Her conclusion is not that remote work is automatically better. Instead, she argues that organisations should decide which tasks benefit from individual focus and which require face-to-face cooperation.',
    readingTitle:'A strong argument is more than a strong opinion',
    readingText:'Public debate often rewards confident statements, but confidence is not the same as evidence. A useful argument identifies a clear claim, explains why the claim matters and provides evidence that is relevant to it. Strong reasoning also considers information that might weaken the position. This does not mean treating every possible objection as equally convincing. It means recognising uncertainty and showing why the available evidence still supports one conclusion more strongly than another. Readers can evaluate an argument by asking whether the evidence is current, whether alternative explanations have been considered and whether the conclusion goes further than the evidence allows.',
    inferenceQuestion:{prompt:'What does the writer imply about uncertainty?',options:['Any uncertainty makes an argument useless.','Acknowledging uncertainty can strengthen an argument when the evidence is still weighed carefully.','Writers should hide uncertainty to sound confident.'],answer:'Acknowledging uncertainty can strengthen an argument when the evidence is still weighed carefully.',explanation:'The passage presents recognition of uncertainty as part of strong reasoning, not a weakness.'},
    grammarFocus:'hedging and stance with modal verbs and qualifying adverbs', grammarWrong:'This evidence proves that the policy definitely works in every situation.', grammarCorrect:'This evidence suggests that the policy is likely to work in many situations.', grammarExplanation:'B2 argumentation benefits from calibrated claims. Suggests, likely and many situations avoid claiming more certainty than the evidence supports.',
    speakingScenario:'A team must choose between two proposals. One is cheaper, while the other has stronger evidence of long-term benefit.', learnerRole:'Argue for one proposal, acknowledge a counterargument and respond with evidence.', counterpartRole:'A colleague who prefers the competing proposal.', proposition:'Decision quality improves when people are rewarded for changing their mind in response to stronger evidence.',
    writingPrompt:'Write an opinion essay on whether organisations should require important decisions to include a written evidence review. Present your position, consider a counterargument and qualify claims appropriately.',
    synthesisSources:[
      {id:'ARG-A',title:'Benefits of evidence review',text:'Written evidence reviews can make assumptions visible and help teams distinguish between facts, predictions and preferences. They also create a record that can be evaluated later.'},
      {id:'ARG-B',title:'Limits of formal analysis',text:'Formal evidence reviews take time and can create false confidence when available data are weak. Some decisions require judgement under uncertainty rather than a complete analytical process.'},
    ],
  },
  {
    slug:'professional-communication', title:'Professional communication', icon:'📨', theme:'professional communication, tone and clarity',
    lexical:[
      {term:'raise a concern',meaning:'formally or clearly mention a possible problem',example:'I would like to raise a concern about the proposed timeline.',kind:'collocation'},
      {term:'clarify expectations',meaning:'make responsibilities or standards clear',example:'The manager clarified expectations before the project started.',kind:'collocation'},
      {term:'on balance',meaning:'after considering the different sides',example:'On balance, the revised plan seems more realistic.',kind:'discourse_marker'},
      {term:'action point',meaning:'a specific task agreed during a discussion',example:'The final action point is to contact the supplier.'},
    ],
    listeningText:'In the meeting, the project manager did not reject the client’s request directly. She first acknowledged the business reason for the request, then explained that the current deadline would make quality testing impossible. She proposed two alternatives: reduce the scope or move the launch by one week. The discussion remained constructive because the manager focused on the effect of the deadline rather than accusing the client of being unrealistic.',
    readingTitle:'Professional directness without unnecessary conflict',
    readingText:'Professional communication is not always polite because it is indirect, nor is it effective simply because it is direct. The key question is whether the message makes the issue, consequence and requested action clear. A useful structure is to acknowledge the context, state the concern, explain the practical effect and propose a next step. This approach reduces the chance that disagreement sounds personal. It also gives the receiver something concrete to respond to. However, tone still matters. A message that is factually correct can damage cooperation if it implies blame where the evidence does not support it.',
    inferenceQuestion:{prompt:'Why does the writer recommend including a next step?',options:['It makes the message longer.','It turns a concern into something the receiver can respond to constructively.','It avoids explaining the problem.'],answer:'It turns a concern into something the receiver can respond to constructively.',explanation:'The passage says a concrete next step gives the receiver a practical response point.'},
    grammarFocus:'advanced conditionals for negotiating consequences', grammarWrong:'If we would reduce the scope, we could keep the deadline.', grammarCorrect:'If we reduced the scope, we could keep the deadline.', grammarExplanation:'Use past simple in the if-clause and could/would in the result clause for a hypothetical present or future situation.',
    speakingScenario:'A client requests an unrealistic deadline for a project that still needs testing.', learnerRole:'Acknowledge the request, explain the risk and negotiate either scope or timing.', counterpartRole:'A client focused on launching quickly.', proposition:'Professional disagreement is more effective when it focuses on consequences rather than blame.',
    writingPrompt:'Write a professional email that raises a concern about a project request, explains the operational risk and proposes two realistic alternatives.',
    synthesisSources:[
      {id:'PRO-A',title:'Directness',text:'Clear professional messages reduce ambiguity when they identify the issue, consequence and requested action directly.'},
      {id:'PRO-B',title:'Relational tone',text:'Cooperation can deteriorate when direct messages imply blame or ignore the receiver’s constraints. Acknowledging context can protect the working relationship without weakening the message.'},
    ],
  },
  {
    slug:'negotiation-problem-solving', title:'Negotiation & problem solving', icon:'🤝', theme:'negotiation, trade-offs and practical problem solving',
    lexical:[
      {term:'reach a compromise',meaning:'agree on a solution where both sides accept some change',example:'We reached a compromise on price and delivery time.',kind:'collocation'},
      {term:'non-negotiable',meaning:'a condition that cannot be changed or accepted differently',example:'Safety testing is non-negotiable.'},
      {term:'trade-off',meaning:'a balance where gaining one advantage means accepting a disadvantage',example:'There is a trade-off between speed and cost.'},
      {term:'meet halfway',meaning:'move toward the other side’s position to reach agreement',example:'Both teams agreed to meet halfway.',kind:'idiom'},
    ],
    listeningText:'Two departments disagree about a new reporting process. Finance wants detailed weekly reports, while the operations team says the process would take too much time. During negotiation, they separate the interests from the initial positions. Finance needs earlier warning of cost problems; operations needs a process that does not interrupt daily work. They agree on a short weekly dashboard and a detailed monthly report. Neither side gets exactly what it first requested, but both underlying needs are addressed.',
    readingTitle:'Positions are not the same as interests',
    readingText:'Negotiations often become stuck when each side repeats a position: “We need weekly reports” or “We will not produce weekly reports.” Progress becomes easier when participants ask what problem the position is intended to solve. The first group may need early visibility of financial risk; the second may need to protect operational time. Once interests are visible, new options become possible. This does not guarantee agreement. Some interests genuinely conflict, and some conditions may be non-negotiable. Nevertheless, separating positions from interests can expand the set of solutions before either side decides that compromise is impossible.',
    inferenceQuestion:{prompt:'What is the main value of identifying interests?',options:['It guarantees both sides get everything they want.','It can reveal alternative solutions that address the reasons behind fixed positions.','It makes non-negotiable conditions disappear.'],answer:'It can reveal alternative solutions that address the reasons behind fixed positions.',explanation:'The passage argues that interests create more solution options than simply repeating positions.'},
    grammarFocus:'modal perfects for evaluating past decisions', grammarWrong:'We should choose the cheaper supplier, but now the delay has caused problems.', grammarCorrect:'We should have checked the delivery record before choosing the cheaper supplier.', grammarExplanation:'Use should have + past participle to evaluate a past action that would have been better done differently.',
    speakingScenario:'Two teams must agree on a process. One prioritises speed and the other control.', learnerRole:'Identify both interests, state one non-negotiable requirement and propose a compromise.', counterpartRole:'A representative from the other team with different priorities.', proposition:'Good negotiation starts with interests rather than fixed positions.',
    writingPrompt:'Write a negotiation brief that identifies your preferred outcome, the other side’s likely interests, one non-negotiable point and two possible compromises.',
    synthesisSources:[
      {id:'NEG-A',title:'Interest-based negotiation',text:'Focusing on underlying interests can generate options that are invisible when people defend fixed positions. It is especially useful when several solutions could meet the same need.'},
      {id:'NEG-B',title:'The role of boundaries',text:'Not every issue should be traded away. Legal, safety or ethical requirements may need to remain non-negotiable even when this limits the range of possible compromises.'},
    ],
  },
  {
    slug:'society-current-affairs', title:'Society & current affairs', icon:'🏙️', theme:'public policy, social change and competing priorities',
    lexical:[
      {term:'public interest',meaning:'the welfare or benefit of society as a whole',example:'The proposal was defended as being in the public interest.',kind:'collocation'},
      {term:'unintended consequence',meaning:'an effect that was not planned or expected',example:'The rule created an unintended consequence for small businesses.',kind:'collocation'},
      {term:'whereas',meaning:'used to contrast two facts or positions',example:'One group prioritises cost, whereas another prioritises access.',kind:'discourse_marker'},
      {term:'implementation',meaning:'the process of putting a plan or policy into practice',example:'The policy idea was simple, but implementation was difficult.'},
    ],
    listeningText:'A city is considering a charge for cars entering the busiest central area. Supporters say the policy could reduce traffic and improve air quality. Critics argue that people who cannot work from home may be affected more strongly. The city’s transport adviser says the debate should not focus only on whether the charge is good or bad. She argues that the final impact depends on exemptions, public transport alternatives and how the revenue is used.',
    readingTitle:'Policies are systems, not slogans',
    readingText:'Public policy debates are often reduced to a simple yes-or-no question. Yet the effect of a policy depends on design and implementation. A city may introduce a congestion charge to reduce traffic, but the outcome will depend on price, geographic boundaries, exemptions and the availability of alternatives. A policy that looks effective in one city may produce different results in another because residents have different transport options. Evaluating policy therefore requires attention to mechanism: who changes behaviour, what alternatives they have and what new costs or benefits appear elsewhere in the system.',
    inferenceQuestion:{prompt:'What does the writer mean by “attention to mechanism”?',options:['Only checking whether a policy has a popular name.','Examining how the policy is expected to change behaviour and create effects.','Assuming the same policy works identically everywhere.'],answer:'Examining how the policy is expected to change behaviour and create effects.',explanation:'The passage defines evaluation in terms of how behaviour, alternatives and effects connect.'},
    grammarFocus:'passive structures for policy and formal reporting', grammarWrong:'The city will introduce by the council a new transport charge.', grammarCorrect:'A new transport charge will be introduced by the council.', grammarExplanation:'In formal policy reporting, passive voice can foreground the policy or action rather than the actor.',
    speakingScenario:'A local council is debating a policy that could reduce traffic but increase costs for some commuters.', learnerRole:'Present a balanced position, identify one unintended consequence and propose a design adjustment.', counterpartRole:'A councillor who wants a simple yes-or-no recommendation.', proposition:'Public policies should be judged by design and implementation, not only by intention.',
    writingPrompt:'Write a balanced report evaluating a proposed local policy. Explain intended benefits, possible unintended consequences and one design change that could improve fairness or effectiveness.',
    synthesisSources:[
      {id:'SOC-A',title:'Policy intention',text:'Policies are often introduced to achieve clear public goals such as reducing pollution, improving safety or expanding access to services.'},
      {id:'SOC-B',title:'Implementation effects',text:'Outcomes depend on incentives, alternatives and administration. A policy can have a positive intention while still creating unequal or unexpected effects in practice.'},
    ],
  },
  {
    slug:'media-persuasion', title:'Media, misinformation & persuasion', icon:'📺', theme:'media framing, persuasion and information quality',
    lexical:[
      {term:'frame an issue',meaning:'present an issue in a way that highlights a particular interpretation',example:'The headline frames the issue as a conflict between freedom and safety.',kind:'collocation'},
      {term:'selective evidence',meaning:'evidence chosen because it supports one position while other relevant evidence is ignored',example:'The advert relies on selective evidence.',kind:'collocation'},
      {term:'appeal to emotion',meaning:'a persuasive move that tries to influence feelings',example:'The campaign uses an appeal to emotion instead of detailed evidence.',kind:'functional_phrase'},
      {term:'misleading',meaning:'likely to create a wrong impression even if some details are true',example:'The graph is technically accurate but visually misleading.'},
    ],
    listeningText:'A podcast compares two reports about the same employment figures. One headline says the labour market is “booming” because employment increased. Another says workers are “under pressure” because wage growth was lower than inflation. Both statements use real data, but each selects a different measure. The presenter argues that readers should ask not only whether a number is true, but why that number was selected and what alternative measures would change the interpretation.',
    readingTitle:'The facts do not choose the frame',
    readingText:'Media bias does not always require false information. Selection is itself a form of framing. A news article has limited space, so writers decide which facts, quotations and comparisons to include. Those choices can make one explanation appear natural and another less visible. Responsible readers therefore examine both accuracy and selection. They ask what evidence is present, what relevant context might be missing and whose perspective is represented. This does not mean every article is manipulative. It means that understanding a message requires attention to how the information has been organised as well as whether individual statements are correct.',
    inferenceQuestion:{prompt:'What distinction is central to the passage?',options:['The difference between factual accuracy and the way facts are selected and organised.','The difference between newspapers and podcasts only.','The idea that every media message is deliberately false.'],answer:'The difference between factual accuracy and the way facts are selected and organised.',explanation:'The writer distinguishes truth of individual facts from framing through selection and organisation.'},
    grammarFocus:'reporting verbs for stance and source attribution', grammarWrong:'The presenter told that the headline ignored context.', grammarCorrect:'The presenter argued that the headline ignored important context.', grammarExplanation:'Reporting verbs such as argue, claim, acknowledge and suggest communicate the source’s stance more precisely than generic tell/say patterns.',
    speakingScenario:'Two articles describe the same event using very different headlines and selected facts.', learnerRole:'Compare how each source frames the issue and explain which additional information you would want before deciding.', counterpartRole:'A discussion partner who believes one source is obviously neutral.', proposition:'Media literacy requires evaluating selection and framing, not only checking whether individual facts are true.',
    writingPrompt:'Write a media-analysis article comparing two different ways an issue could be framed. Explain how evidence selection affects interpretation without assuming that disagreement automatically means misinformation.',
    synthesisSources:[
      {id:'MED-A',title:'Accuracy',text:'Fact-checking can identify false quotations, incorrect numbers and fabricated events. These checks are essential for basic information quality.'},
      {id:'MED-B',title:'Framing',text:'Even accurate reporting can influence interpretation through selection, emphasis, headline language and the order in which evidence is presented.'},
    ],
  },
  {
    slug:'science-technology', title:'Science, innovation & technology', icon:'🧪', theme:'science, innovation, uncertainty and technological change',
    lexical:[
      {term:'emerging technology',meaning:'technology that is new and still developing',example:'The company is testing an emerging technology.',kind:'collocation'},
      {term:'evidence base',meaning:'the body of research or evidence available on a question',example:'The evidence base is still limited.',kind:'collocation'},
      {term:'scale up',meaning:'increase the size or reach of a process',example:'The team wants to scale up the pilot after testing.',kind:'phrasal_verb'},
      {term:'uncertainty',meaning:'a situation where outcomes or facts are not fully known',example:'Policy decisions must sometimes be made under uncertainty.'},
    ],
    listeningText:'A researcher describes a pilot system that uses artificial intelligence to help hospital staff prioritise administrative tasks. Early results suggest the tool saves time, but the researcher warns against assuming that a successful pilot will automatically work at national scale. Larger deployment could introduce different data quality, training and accountability problems. She recommends expanding gradually while measuring both benefits and unexpected effects.',
    readingTitle:'A successful pilot is not the same as a proven system',
    readingText:'Innovation stories often move quickly from a small promising result to a large claim about the future. This can be misleading. A pilot project operates under specific conditions: selected users, close monitoring and limited scale. When a system expands, it encounters more varied users, imperfect data and organisational constraints. Evidence from a pilot is therefore useful but incomplete. The strongest conclusion may be that a technology is promising enough for further testing, not that it has already proved its value everywhere. Responsible innovation treats uncertainty as information to manage rather than an embarrassment to hide.',
    inferenceQuestion:{prompt:'What is the writer’s attitude toward promising pilot results?',options:['They should be ignored until a system is perfect.','They are useful evidence but do not automatically justify broad claims.','They prove large-scale success.'],answer:'They are useful evidence but do not automatically justify broad claims.',explanation:'The passage treats pilot evidence as informative but incomplete for generalisation.'},
    grammarFocus:'relative and participle clauses for compact technical description', grammarWrong:'The system which was tested in a pilot, it saved time for staff.', grammarCorrect:'The system tested in the pilot saved time for staff.', grammarExplanation:'A reduced participle clause can describe the noun efficiently without repeating the subject with an extra pronoun.',
    speakingScenario:'A company wants to deploy a successful pilot technology across every office immediately.', learnerRole:'Explain the evidence, identify uncertainties and propose a staged expansion plan.', counterpartRole:'An executive focused on speed and competitive advantage.', proposition:'A promising pilot should justify further testing before it justifies large-scale deployment.',
    writingPrompt:'Write an evaluation memo on whether an emerging technology should be scaled up after a successful pilot. Separate what the evidence shows from what remains uncertain.',
    synthesisSources:[
      {id:'TECH-A',title:'Pilot evidence',text:'Small pilots can reveal whether an idea is feasible and identify early benefits. Close monitoring makes it easier to detect problems quickly.'},
      {id:'TECH-B',title:'Scaling risk',text:'Large-scale deployment introduces varied users, infrastructure and incentives. Results from a controlled pilot may therefore change when the system reaches normal operating conditions.'},
    ],
  },
  {
    slug:'culture-identity', title:'Culture, identity & relationships', icon:'🌍', theme:'culture, identity and interpretation across groups',
    lexical:[
      {term:'cultural norm',meaning:'a commonly expected way of behaving in a social group',example:'Ideas about punctuality can reflect a cultural norm.',kind:'collocation'},
      {term:'sense of belonging',meaning:'the feeling that you are accepted as part of a group',example:'Shared activities can strengthen a sense of belonging.',kind:'collocation'},
      {term:'take for granted',meaning:'assume something is normal or obvious without questioning it',example:'People often take their own communication style for granted.',kind:'idiom'},
      {term:'perspective',meaning:'a particular way of understanding or viewing a situation',example:'The discussion helped me see the issue from another perspective.'},
    ],
    listeningText:'A university student describes joining an international project team. At first, she interpreted brief messages from one teammate as unfriendly. Later she realised that the teammate considered short direct messages efficient and respectful of everyone’s time. The experience did not teach her that every behaviour should be explained by culture. Instead, it taught her to ask whether different expectations could be influencing an interaction before making a personal judgement.',
    readingTitle:'Culture explains patterns, not individuals',
    readingText:'Cultural knowledge can help people notice that expectations differ, but it can also create stereotypes if used carelessly. Statements such as “people from this culture are indirect” may describe a broad tendency while saying very little about a particular person. Individual personality, profession, age, context and power relationships also shape behaviour. A useful approach is to treat cultural knowledge as a hypothesis rather than a verdict. It can suggest a question—“Could different expectations about directness be involved here?”—but the answer should come from observation and communication with the people concerned.',
    inferenceQuestion:{prompt:'How does the writer recommend using cultural knowledge?',options:['As a final explanation of every individual’s behaviour.','As a possible interpretation to investigate rather than a fixed judgement.','As something that should never be discussed.'],answer:'As a possible interpretation to investigate rather than a fixed judgement.',explanation:'The passage explicitly describes cultural knowledge as a hypothesis, not a verdict.'},
    grammarFocus:'contrast and concession with although, whereas and despite', grammarWrong:'Despite the messages were brief, they were not intended to be rude.', grammarCorrect:'Although the messages were brief, they were not intended to be rude.', grammarExplanation:'Although introduces a clause; despite is followed by a noun phrase or -ing form, for example despite the brief messages.',
    speakingScenario:'Two team members interpret directness very differently and assume negative intentions.', learnerRole:'Help them describe expectations without stereotyping and agree on a clearer communication norm.', counterpartRole:'A teammate who thinks the problem is simply personality.', proposition:'Cultural knowledge is most useful when it creates better questions rather than fixed conclusions about people.',
    writingPrompt:'Write an article explaining how cultural expectations can affect communication while avoiding stereotypes. Include at least one example of how to check an interpretation respectfully.',
    synthesisSources:[
      {id:'CULT-A',title:'Pattern awareness',text:'Knowledge of common cultural patterns can prepare people for different expectations about hierarchy, directness, time and group behaviour.'},
      {id:'CULT-B',title:'Individual variation',text:'People within the same cultural group vary greatly. Profession, personality, generation and context can be as important as broad cultural tendencies.'},
    ],
  },
  {
    slug:'presentations-extended', title:'Presentations & extended communication', icon:'🎤', theme:'presentations, structure and audience engagement',
    lexical:[
      {term:'key takeaway',meaning:'the most important message the audience should remember',example:'The key takeaway is that the pilot should continue.',kind:'collocation'},
      {term:'signpost',meaning:'language that shows the structure or direction of a presentation',example:'A clear signpost helps the audience follow the next section.'},
      {term:'draw attention to',meaning:'make the audience notice something important',example:'I would like to draw attention to the final graph.',kind:'functional_phrase'},
      {term:'in practical terms',meaning:'used to explain what an idea means in real action',example:'In practical terms, the change saves two hours per week.',kind:'discourse_marker'},
    ],
    listeningText:'The presenter begins with a problem the audience recognises, then gives the main conclusion before showing detailed evidence. Between sections, she uses short signposts such as “The second point is” and “What does this mean in practice?” She finishes by returning to the original problem and giving one specific recommendation. The talk feels clear not because every sentence is simple, but because the audience always knows why each section is there.',
    readingTitle:'Structure reduces the audience’s memory burden',
    readingText:'A presentation competes with the limits of working memory. Listeners cannot reread a spoken sentence in the same way they can revisit a paragraph. This makes structure especially important. Effective presenters preview the direction of the talk, signal transitions and periodically restate the main relationship between evidence and conclusion. Repetition is useful when it reinforces structure rather than simply repeating wording. Slides can support this process, but a crowded slide may increase cognitive load instead of reducing it. The presenter’s task is to manage attention, not to display every piece of information available.',
    inferenceQuestion:{prompt:'Why are signposts especially valuable in presentations?',options:['Listeners can always reread spoken language.','They help listeners follow structure when information arrives in real time.','They make evidence unnecessary.'],answer:'They help listeners follow structure when information arrives in real time.',explanation:'The passage links signposting to the limits of working memory and the inability to reread speech.'},
    grammarFocus:'cleft and emphasis structures for highlighting key information', grammarWrong:'The evidence is what most important is for the recommendation.', grammarCorrect:'What is most important for the recommendation is the evidence.', grammarExplanation:'A wh-cleft can foreground the element the speaker wants to emphasise in an organised presentation.',
    speakingScenario:'You have three minutes to present a recommendation based on a short project review.', learnerRole:'Open with the problem, signpost two points, support the recommendation and finish with a key takeaway.', counterpartRole:'An audience that understands the topic but has limited time.', proposition:'A clear presentation should prioritise the audience’s decision needs over the presenter’s desire to include every detail.',
    writingPrompt:'Write a presentation brief with an opening problem, two evidence sections, transitions and a concise recommendation. Explain what the audience should remember afterwards.',
    synthesisSources:[
      {id:'PRES-A',title:'Narrative clarity',text:'Audiences follow presentations more easily when the speaker makes the relationship between problem, evidence and recommendation explicit.'},
      {id:'PRES-B',title:'Information density',text:'Adding more data does not always improve a presentation. Excess detail can make the central decision harder to identify, especially when time is limited.'},
    ],
  },
];

export const b2Curriculum = buildAdvancedCurriculum('B2', specs);
export const b2Units = b2Curriculum.compatibleUnits;
export const b2UnitsV2 = b2Curriculum.units;
export const b2Lessons = b2Curriculum.lessons;
