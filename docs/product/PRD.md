# AI Planning Companion
## Product Requirements Document

**Team:** Jingyi Fu; Sihui Lyu

## 1. Problem and Product Goals

A well-organized to-do list can still be a plan that does not work for the person following it. People balancing coursework, career preparation, and personal projects need to connect long-term goals with daily actions and find ways of working that suit them. Most planning tools ask them to stop and fill in detailed forms before a plan exists, so ideas and new tasks that arrive during the day often go unrecorded. Continually explaining their priorities and rebuilding plans adds to that burden.

AI Planning Companion lets planning start from a single sentence and keeps the plan fitting the person over time. The user tells the assistant what came up; the assistant asks only what the plan needs, proposes concrete time blocks, checks in at agreed times, and uses what it learns to make later plans fit better. The user does not have to set everything up first, repeat themselves, or rebuild the plan whenever things change.

Product goals:
- Let users capture a goal or task the moment it arises, in a short conversation instead of a setup form.
- Help users turn incomplete intentions into clear tasks and feasible time blocks.
- Reduce repeated explanation by carrying relevant goals and preferences across sessions.
- Support continued progress through agreed check-ins, practical adjustments, and manageable next steps.

## 2. Target Users

Students and individuals pursuing multiple self-directed goals who need help organizing priorities, planning their time, and following through. The product supports people whose schedules or working habits change and who benefit from discussing their plans rather than filling out detailed task forms.

## 3. Scope and Priorities

The application provides a Mac desktop companion and a web interface accessible on both Mac and Windows. The Mac companion runs in the background and opens a small chat window through a keyboard shortcut. Both interfaces use the same account, tasks, plans, and preferences.

Core features:
- Conversational capture and classification of goals and tasks.
- Daily and weekly plans with specific start and end times, such as 9:00–10:30.
- Direct and conversational editing of tasks and schedules.
- Memory of goals, preferences, and habits, updated through user feedback.
- Daily check-ins at user-agreed times and reminders for important tasks.
- Task breakdown and progress feedback connected to larger goals.

Out of scope: a Windows desktop companion, native mobile apps, shared team task management, external calendar synchronization, automatic monitoring of computer activity, and languages other than English: users are assumed to write in English. Users can enter existing commitments through chat or direct editing.

All six user stories below are P0 for the first release, because together they form one planning and feedback cycle. The most important first-use moment is quick capture through the shortcut window: it shows that planning can start from a single sentence.

## 4. User Stories and Acceptance Criteria

The rules shared by several stories, such as how edits take effect and how reminders change, are defined once in Section 6.

### US-01 (P0): Organize scattered intentions

As someone juggling several goals, I want to talk through scattered ideas with an assistant that asks useful questions and organizes them, so I can clarify what matters and where to begin.

- A goal or task mentioned in conversation is saved right away, before any follow-up question is answered.
- The assistant separates goals from tasks and suggests editable categories. Tasks can be linked to a larger goal or kept independently, and long-term goals can be recorded without a deadline.
- The assistant asks for missing information that affects the plan, a few questions at a time, starting with the one that matters most, and reuses what the user has already said.
- A task is scheduled only after it has a deadline. Without an external deadline, the assistant suggests a target date and agrees on it with the user.
- If the user does not know how long something will take, the assistant helps break it down and offers an estimate for review.
- Saved items and unfinished planning conversations remain available when the user returns.

### US-02 (P0): Build a realistic personal plan

As someone managing competing commitments, I want a plan based on my deadlines, priorities, and preferences, so it fits my life and remains mine to adjust.

- Daily and weekly plans assign tasks to specific dates, start times, and end times in the user's timezone.
- Suggested time blocks respect stated availability and fixed commitments. Tasks are not double-booked.
- If the work cannot fit before a deadline, the assistant explains the conflict and discusses alternatives instead of changing the deadline.
- The user can edit tasks and time blocks directly or through conversation.

### US-03 (P0): Make large goals manageable

As someone working toward a large goal, I want manageable next steps and visible progress, so I can begin and recognize what I have accomplished.

- The assistant proposes concrete steps linked to the original goal. The user can edit, accept, or reject them.
- When a user feels stuck, the assistant asks about the difficulty and suggests a smaller action or a different arrangement.
- Users can report partial progress, mark steps complete, and correct completion records.
- Completed steps remain visible under their goal, and feedback refers to what was actually accomplished.

### US-04 (P0): Receive useful reminders and follow-up

As someone whose plans can change, I want the assistant to proactively remind me and check in, so I can report progress and get help adjusting.

- Users agree on daily check-in times and choose which important tasks get reminders. There is no follow-up after every task by default.
- Users can change reminder times, pause reminders, and set quiet hours.
- Check-ins refer to the current plan and invite updates on progress, difficulties, or changes. When feedback shows a problem, the assistant asks follow-up questions and proposes an adjustment.
- On Mac, reminders appear while the companion runs in the background with its chat window hidden.

### US-05 (P0): Remember and improve

As a returning user, I want the assistant to remember my goals and working habits and use my feedback, so future plans fit me better without repeated explanations.

- Relevant goals and confirmed preferences are used across sessions.
- Before changing future plans, the assistant checks whether a condition is temporary or recurring, for example whether poor sleep is occasional or ongoing. An inferred habit becomes a standing preference only after the user confirms it.
- Users can view, correct, or remove remembered preferences, and the changes apply to later plans.
- After a user confirms a preference for evening interview practice, the next relevant plan places it in an available evening slot. If none fits before the deadline, the assistant explains the conflict and proposes alternatives.

### US-06 (P0): Reach the assistant easily

As someone working on my computer, I want to bring up the assistant with a keyboard shortcut and tell it about a new task in a sentence, so planning starts without leaving my current work.

- While the Mac companion is running, the shortcut opens its chat window even when another application is in focus.
- A captured item is saved first. The assistant then asks the most important missing question, usually the deadline.
- Once the item has a deadline, the assistant proposes a specific time block that the user can accept in one step.
- If the user closes the window before answering, the item stays saved and the open question returns the next time the user opens the assistant or at the next daily check-in.
- The web application provides planning, tasks, progress, and preferences on both Mac and Windows, and both interfaces show the same account's data.

## 5. Core Flow and Interface Overview

1. **Capture and organize.** Whenever something comes to mind, the user describes it in a sentence or two, often through the shortcut window. The assistant saves the items, suggests categories, and connects near-term tasks to longer-term goals.
2. **Clarify and plan.** The assistant asks about missing deadlines, priorities, effort, and availability, then uses remembered preferences to suggest a schedule with specific time blocks.
3. **Review and adjust.** The user accepts the plan or changes it through chat or direct editing.
4. **Act and check in.** The assistant sends important-task reminders and follows up at the agreed daily times. The user reports progress, changes, or difficulties.
5. **Adapt and continue.** The assistant helps revise the plan or break work into smaller steps, and uses confirmed feedback in future planning.

The product has four feature areas, all working on the same saved information. A change made in chat also appears in the relevant task or schedule view.

| Interface | Purpose | Related stories |
| --- | --- | --- |
| Mac companion and web chat | Capture ideas, answer clarification questions, discuss plans and respond to check-ins | US-01, US-02, US-04, US-05, US-06 |
| Today and week | View dated time blocks, edit schedules, report progress and resolve conflicts | US-02, US-04 |
| Goals and tasks | Organize categories, connect tasks to goals, review steps and completed work | US-01, US-03 |
| Preferences and reminders | Review remembered preferences, correct them and manage follow-up times | US-04, US-05 |

## 6. Data and Business Rules

### Main data relationships

| Record | Essential information and relationships |
| --- | --- |
| User | Account identity, timezone, availability and notification settings; owns all personal records |
| Goal | Desired outcome, category, short- or long-term horizon, optional deadline and completion state; contains related tasks |
| Task | Action, optional parent goal or task, category, deadline and whether it is external or agreed with the user, priority, estimated effort and progress state |
| Time block | Task, date, start time and end time; a task may have several blocks |
| Fixed commitment | Date and occupied time entered by the user; unavailable for task scheduling |
| Preference or habit | User-confirmed planning guidance, its scope and source; can be corrected or removed |
| Temporary context | A condition applying to a specified period, such as low energy today |
| Conversation and feedback | Messages, open clarification questions and user-reported progress associated with relevant tasks |
| Reminder or check-in | Scheduled time, related task or daily plan, and delivery/cancellation state |

### Rules

**Deadlines.** A deadline is either external or a target date agreed with the user; the assistant never invents one. A task without a deadline stays unscheduled. Moving a time block does not change the deadline.

**Tasks and progress.** A task can be not started, in progress, blocked, completed or canceled, and users can correct its state. Partial work stays in progress unless the user reports a blocker. Scheduled time and completion are separate: finishing a time block does not complete its task or goal, and a task may need several sessions. A longer-term goal is complete when the user confirms its outcome has been reached.

**Plan changes.** A proposed plan becomes active when the user accepts it. An explicit edit to one item without a conflict, such as moving tomorrow's writing session to the evening, takes effect immediately; the assistant shows what changed and the user can undo it. Changes the assistant proposes on its own, and edits affecting several time blocks, are shown as a list and take effect only after the user confirms. Conflicts are explained instead of applied. Every change builds on the latest saved state, never overwrites a manual edit, and is saved completely or not at all.

**Reminders and check-ins.** Completing or canceling a task removes its pending reminders; rescheduling updates the reminders for that time block. Delivery retries never create duplicate reminders. An unanswered check-in leaves progress unknown: it does not lead to an assumption of failure or to repeated, escalating messages.

**Preferences and context.** Temporary conditions expire at the end of their stated period. Possible patterns stay tentative until the user confirms them, and the assistant's own suggestions are never treated as user facts. Corrections apply to later plans, and a corrected or removed preference is never restored from older conversations. Preferences never override fixed commitments or deadlines; conflicts are explained to the user.

**Conversations.** Each local day in the user's timezone has one chat. Earlier days stay readable as history but are not continued; open questions and saved records carry over into the new day.

## 7. Non-functional Requirements and Technical Approach

Users sign in to access their own conversations, tasks, plans, and preferences. Personal records remain private even though the web application is available through a public URL.

The assistant distinguishes facts supplied by the user, estimates, and suggestions, and never invents information a plan depends on, such as deadlines or availability. Users can correct its understanding and see the resulting changes.

If an AI request or save fails, the application preserves the user's input and existing plan, explains the failure, and allows retry. It reports success only after saving, and a retry never creates duplicate tasks.

Daily check-ins and reminders follow the user's timezone and notification settings. If notification delivery is unavailable, for example because permission was denied, the application says so and due items remain visible in the app.

### Quality requirements

- **Security:** Enforce account ownership on the server for every read and change. Keep credentials out of source control and private conversation content out of logs. AI-generated actions follow the same permission checks as direct user actions.
- **Accessibility:** Provide labeled controls, keyboard navigation, visible focus and readable contrast. Status and errors must not rely on color alone.
- **Compatibility:** Verify the Mac companion and the web planning flow on Mac. The web application is not separately verified on Windows. Desktop reminders require the companion to be running and notification permission to be enabled; a hidden window is different from a fully quit application.
- **Responsiveness:** Show when an AI response or save is in progress and keep the user's input during waits. Hiding and reopening the chat window keeps unsent input and the current conversation.

### Technical approach

| Component | Planned approach |
| --- | --- |
| Web application | Next.js and TypeScript, deployed on Vercel |
| Persistence | PostgreSQL on Neon for accounts, goals, tasks, plans, preferences and feedback |
| Authentication | Managed authentication with Neon Auth |
| AI | Google Gemini API for clarification, task breakdown and planning suggestions, behind a provider-neutral interface. The free tier is used; Google may use chat content to improve its products, and users are told so at sign-up |
| Mac companion | Electron shell for the global shortcut, small chat window and notifications |
| Reminders | Scheduled processing connected to saved plans and user settings; delivery service to be selected |

The Mac companion and web application share one backend. The assistant receives relevant saved context and proposes changes; the application checks permissions, times and conflicts before saving them. Saved records, not conversation history, are the source of truth for current tasks and plans.

## 8. Completion Criteria

The core experience is complete when a user can capture a new task in a sentence, describe several goals, clarify missing information, accept a feasible time-blocked plan, receive a scheduled check-in, report progress, and use that feedback to improve a later plan.

Acceptance testing covers this flow alongside missing deadlines, conflicting schedules, partial completion, preference corrections, undoing an edit, failed saves, reminder changes, and isolation between user accounts. The Mac shortcut and the web experience on Mac are also verified.

The release must demonstrate:
- All six P0 stories working through the public web application and the Mac companion, as applicable.
- A cross-session scenario in which confirmed feedback changes a later plan, and a corrected preference is no longer used.
