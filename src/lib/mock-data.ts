import { MessageAnalysis } from "./types";

export const DEMO_CHAT_TEXT = `12/10/2026, 09:30 - Priya CR: Good morning everyone! Please note that Project Phase 1 submission is due this Thursday 15th Oct by 5:00 PM on the portal.
12/10/2026, 09:32 - Rahul: Thanks Priya. Does the submission need group member IDs on the title page?
12/10/2026, 09:35 - Priya CR: Yes, include full names, roll numbers, and git repo link.
12/10/2026, 10:15 - Lab Admin: Notice: The Advanced Database lab scheduled for today at 2 PM is shifted to Lab 3, Block C.
12/10/2026, 11:00 - Amit Roommate: Guys, mess and water bill for October has arrived. Everyone please pay ₹450 to amit.kumar@okhdfcbank by 18th Oct.
12/10/2026, 11:02 - Sneha: Paid mine already Amit!
12/10/2026, 12:45 - Rohan: Haha anyone having extra notes for compiler design? Prof went too fast today.
12/10/2026, 13:10 - Priya CR: Update regarding Project Phase 1: Due to the college symposium, submission deadline is moved from Thursday 15th to Sunday 18th Oct 11:59 PM.
12/10/2026, 14:00 - Unknown Seller: Flat 70% discount on Semester Project Code! Click here to download ready-made zip: https://projects-easy-download.xyz/cs-final
12/10/2026, 14:30 - Sneha: Guys don't click that link above, looks fake.
12/10/2026, 15:20 - +91 99887 76655: DEAR CUSTOMER YOUR SBI NETBANKING BLOCKED TODAY! IMMEDIATELY UPDATE KYC BY CLICKING http://bit.ly/sbi-yono-secure-kyc OR YOUR ACCOUNT TERMINATED.
12/10/2026, 15:45 - Vikram: We also need to form seminar groups soon before Friday.
12/10/2026, 16:30 - Amit Roommate: Reminder: Wifi recharge bill is ₹350 each. Pay to broadband@okaxis by tomorrow.`;

export const MOCK_ANALYSIS_ITEMS: MessageAnalysis[] = [
  {
    message_id: "m_001",
    category: "task",
    task: {
      title: "Project Phase 1 submission",
      date_phrase: "Thursday 15th Oct by 5:00 PM",
      assignee: null
    },
    updates_task_hint: null,
    bill: null,
    info: null,
    fraud_signals: [],
    source_quote: "Project Phase 1 submission is due this Thursday 15th Oct by 5:00 PM on the portal.",
    confidence: "high"
  },
  {
    message_id: "m_002",
    category: "noise",
    task: null,
    updates_task_hint: null,
    bill: null,
    info: null,
    fraud_signals: [],
    source_quote: "Does the submission need group member IDs on the title page?",
    confidence: "high"
  },
  {
    message_id: "m_003",
    category: "info",
    task: null,
    updates_task_hint: null,
    bill: null,
    info: {
      label: "Project Submission Requirements",
      value: "Include full names, roll numbers, and git repo link."
    },
    fraud_signals: [],
    source_quote: "include full names, roll numbers, and git repo link.",
    confidence: "high"
  },
  {
    message_id: "m_004",
    category: "info",
    task: null,
    updates_task_hint: null,
    bill: null,
    info: {
      label: "Lab Venue Shift",
      value: "Advanced Database lab scheduled for today at 2 PM is shifted to Lab 3, Block C."
    },
    fraud_signals: [],
    source_quote: "The Advanced Database lab scheduled for today at 2 PM is shifted to Lab 3, Block C.",
    confidence: "high"
  },
  {
    message_id: "m_005",
    category: "bill",
    task: null,
    updates_task_hint: null,
    bill: {
      payee: "amit.kumar@okhdfcbank",
      amount: 450,
      currency: "INR",
      due_phrase: "by 18th Oct"
    },
    info: null,
    fraud_signals: [],
    source_quote: "mess and water bill for October has arrived. Everyone please pay ₹450 to amit.kumar@okhdfcbank by 18th Oct.",
    confidence: "high"
  },
  {
    message_id: "m_006",
    category: "noise",
    task: null,
    updates_task_hint: null,
    bill: null,
    info: null,
    fraud_signals: [],
    source_quote: "Paid mine already Amit!",
    confidence: "high"
  },
  {
    message_id: "m_007",
    category: "noise",
    task: null,
    updates_task_hint: null,
    bill: null,
    info: null,
    fraud_signals: [],
    source_quote: "anyone having extra notes for compiler design?",
    confidence: "high"
  },
  {
    message_id: "m_008",
    category: "change",
    task: null,
    updates_task_hint: "Project Phase 1 submission deadline moved from Thursday 15th to Sunday 18th Oct 11:59 PM.",
    bill: null,
    info: null,
    fraud_signals: [],
    source_quote: "submission deadline is moved from Thursday 15th to Sunday 18th Oct 11:59 PM.",
    confidence: "high"
  },
  {
    message_id: "m_009",
    category: "suspicious",
    task: null,
    updates_task_hint: null,
    bill: null,
    info: null,
    fraud_signals: ["prize_lure"],
    source_quote: "Flat 70% discount on Semester Project Code! Click here to download ready-made zip: https://projects-easy-download.xyz/cs-final",
    confidence: "high"
  },
  {
    message_id: "m_010",
    category: "noise",
    task: null,
    updates_task_hint: null,
    bill: null,
    info: null,
    fraud_signals: [],
    source_quote: "Guys don't click that link above, looks fake.",
    confidence: "high"
  },
  {
    message_id: "m_011",
    category: "suspicious",
    task: null,
    updates_task_hint: null,
    bill: null,
    info: null,
    fraud_signals: ["urgency", "kyc_threat", "fake_authority"],
    source_quote: "DEAR CUSTOMER YOUR SBI NETBANKING BLOCKED TODAY! IMMEDIATELY UPDATE KYC BY CLICKING http://bit.ly/sbi-yono-secure-kyc",
    confidence: "high"
  },
  {
    message_id: "m_012",
    category: "task",
    task: {
      title: "Form seminar groups",
      date_phrase: "soon before Friday",
      assignee: null
    },
    updates_task_hint: null,
    bill: null,
    info: null,
    fraud_signals: [],
    source_quote: "We also need to form seminar groups soon before Friday.",
    confidence: "medium"
  },
  {
    message_id: "m_013",
    category: "bill",
    task: null,
    updates_task_hint: null,
    bill: {
      payee: "broadband@okaxis",
      amount: 350,
      currency: "INR",
      due_phrase: "by tomorrow"
    },
    info: null,
    fraud_signals: [],
    source_quote: "Wifi recharge bill is ₹350 each. Pay to broadband@okaxis by tomorrow.",
    confidence: "high"
  }
];
