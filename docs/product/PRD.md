# AI Planning Companion
## Product Requirements Document

**Team:** Jingyi Fu; Sihui Lyu

## 1. Problem and Product Goals

A well-organized to-do list can still be a plan that does not work for the person following it. People balancing coursework, career preparation, and personal projects need to connect long-term goals with daily actions and find ways of working that suit them. Most planning tools ask them to stop and fill in detailed forms before a plan exists, so ideas and new tasks that arrive during the day often go unrecorded. Continually explaining their priorities and rebuilding plans adds to that burden.

AI Planning Companion brings order to daily life with little effort. When a thought comes to mind or a new task arrives, the user tells the assistant in a sentence and planning begins in the conversation. The assistant remembers goals, preferences, and habits, asks questions before making assumptions, proactively checks in on progress, and uses feedback to improve future arrangements. By breaking large goals into manageable steps and making progress visible, it aims to help users get started, keep going, and spend less effort maintaining their plans.

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

Out of scope: a Windows desktop companion, native mobile apps, shared team task management, external calendar synchronization, and automatic monitoring of computer activity. Users can enter existing commitments through chat or direct editing.

Priority: **P0** identifies requirements necessary for the first release. All six user stories below are P0 because they form the agreed planning and feedback cycle, including the desktop entry. Their order does not prescribe the implementation sequence. Quick capture through the shortcut window is the most important first-use moment, since it shows that planning can start from a single sentence.

## 4. User Stories and Acceptance Criteria

### US-01 (P0): Organize scattered intentions

As someone juggling several goals, I want to talk through scattered ideas with an assistant that asks useful questions and organizes them, so I can clarify what matters and where to begin.

- A goal or task mentioned in conversation is saved right away, before any follow-up question is answered.
- The assistant identifies separate goals and tasks from a conversation and suggests editable categories.
- Tasks can be linked to a larger goal or kept independently. Long-term goals can be recorded without an immediate deadline.
- The assistant asks for missing information that affects planning and reuses information already provided. It asks a small number of questions at a time, starting with the one that most affects the plan.
- A task needs a deadline before it is scheduled. If there is no external deadline, the assistant suggests a target completion date and agrees on one with the user. It never schedules against a deadline it invented.
- If the user does not know how long something will take, the assistant helps break it down and offers an estimate for review.
- Saved items and unfinished planning conversations remain available when the user returns.

### US-02 (P0): Build a realistic personal plan

As someone managing competing commitments, I want a plan based on my deadlines, priorities, and preferences, so it fits my life and remains mine to adjust.

- Daily and weekly plans assign tasks to specific dates, start times, and end times in the user's timezone.
- Suggested time blocks respect stated availability and fixed commitments. Tasks are not double-booked.
- If the work cannot fit before a deadline, the assistant explains the conflict and discusses alternatives instead of silently changing the deadline.
- The user can edit tasks or time blocks directly or through conversation.
- An explicit request that changes one item without a conflict, such as moving tomorrow's writing session to the evening, takes effect immediately. The assistant shows what changed and the user can undo it.
- Changes the assistant proposes on its own, and requests that affect several time blocks, are shown as a list of changes and take effect only after the user confirms.
- Later suggestions use the latest saved changes and do not silently overwrite manual edits.

### US-03 (P0): Make large goals manageable

As someone working toward a large goal, I want manageable next steps and visible progress, so I can begin and recognize what I have accomplished.

- The assistant proposes concrete steps linked to the original goal. The user can edit, accept, or reject them.
- When a user feels stuck, the assistant asks about the difficulty and suggests a smaller action or a different arrangement.
- Users can report partial progress, mark steps complete, and correct completion records.
- Completed steps remain visible under their goal. Feedback refers to actual accomplishments and explains what they contribute.
- Finishing a scheduled time block does not automatically mark its task or parent goal complete.

### US-04 (P0): Receive useful reminders and follow-up

As someone whose plans can change, I want the assistant to proactively remind me and check in, so I can report progress and get help adjusting.

- Users agree on daily check-in times and choose which important tasks need reminders. Follow-up after every task is not the default.
- Users can change reminder times, pause reminders, and set quiet hours.
- Check-ins refer to the current plan and invite updates on progress, difficulties, or changes.
- When feedback indicates a problem, the assistant asks relevant follow-up questions and proposes an adjustment.
- Completing, canceling, or rescheduling a task updates its pending reminders. Delivery retries do not create duplicate reminders.
- An unanswered check-in leaves progress unknown. It does not trigger an assumption of failure or repeated escalating messages.
- On Mac, reminders can appear while the companion is running in the background with its chat window hidden. If notification permission is denied, due items remain visible in the application.

### US-05 (P0): Remember and improve

As a returning user, I want the assistant to remember my goals and working habits and use my feedback, so future plans fit me better without repeated explanations.

- Relevant goals and confirmed preferences are used across sessions.
- The assistant distinguishes temporary conditions from recurring habits. For example, it clarifies whether poor sleep is occasional or ongoing before using it to change future planning.
- An inferred habit is checked with the user before becoming a standing preference. The assistant's own suggestions are not treated as user facts.
- Users can view, correct, or remove remembered preferences. Corrections apply to later plans, and removed preferences are not silently restored from old conversations.
- After a user confirms a preference for evening interview practice, the next relevant plan places it in an available evening slot. If no suitable slot exists before the deadline, the assistant explains the conflict and proposes alternatives.
- Preferences do not override fixed commitments or deadlines. Conflicts are explained to the user.

### US-06 (P0): Reach the assistant easily

As someone working on my computer, I want to bring up the assistant with a keyboard shortcut and tell it about a new task in a sentence, so planning starts without leaving my current work.

- While the Mac companion is running, the shortcut opens its chat window even when another application is in focus.
- A captured item is saved first. The assistant then asks the most important missing question, usually the deadline, and suggests a date when none is given.
- Once the item has a deadline, the assistant proposes a specific time block that the user can accept in one step.
- If the user closes the window before answering, the item stays saved and the open question returns the next time the user opens the assistant or at the next daily check-in. It does not trigger a separate notification.
- Hiding and reopening the window preserves unsent input and the current conversation.
- The web application provides access to planning, tasks, progress, and preferences on both Mac and Windows.
- Changes saved through either interface appear in the same user's account on the other interface.

## 5. Core Flow and Interface Overview

1. **Capture and organize.** Whenever something comes to mind, the user describes it in a sentence or two, often through the shortcut window. The assistant saves the items, suggests categories, and connects near-term tasks to longer-term goals.
2. **Clarify and plan.** The assistant asks about missing deadlines, priorities, effort, and availability, and agrees on a target date when no deadline exists. It uses remembered preferences to suggest a schedule with specific time blocks.
3. **Review and adjust.** The user accepts the plan or changes it through chat or direct editing. Simple explicit edits apply at once with undo; larger or assistant-initiated changes wait for confirmation.
4. **Act and check in.** The assistant sends important-task reminders and follows up at the daily times agreed with the user. The user reports progress, changes, or difficulties.
5. **Adapt and continue.** The assistant helps revise the plan or break work into smaller steps. It uses confirmed feedback in future planning and shows how completed steps contribute to larger goals.

The product has a single user role. It is organized into four distinct feature areas:

| Interface | Purpose | Related stories |
| --- | --- | --- |
| Mac companion and web chat | Capture ideas, answer clarification questions, discuss plans and respond to check-ins | US-01, US-02, US-04, US-05, US-06 |
| Today and week | View dated time blocks, edit schedules, report progress and resolve conflicts | US-02, US-04 |
| Goals and tasks | Organize categories, connect tasks to goals, review steps and completed work | US-01, US-03 |
| Preferences and reminders | Review remembered preferences, correct them and manage follow-up times | US-04, US-05 |

These areas share the same saved information. A change made in chat must also appear in the relevant task or schedule view. Empty views provide a clear way to add a first goal or task; loading and failure states keep existing information visible.

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

### State and behavior

- A task can be not started, in progress, blocked, completed or canceled. Users can correct its state. Partial work remains in progress unless the user reports a blocker.
- Scheduled time and task completion are separate. Several work sessions may be needed to finish one task.
- A proposed plan becomes active after the user accepts it. An explicit single-item edit without a conflict updates the active plan immediately and can be undone. Assistant-initiated changes and edits affecting several time blocks require confirmation. The assistant explains any conflict instead of applying the change.
- A task deadline specifies when work must be finished. It is either an external deadline or a target date agreed with the user. A task without a deadline stays unscheduled. Moving a time block does not change that deadline.
- Canceling or completing a task removes its pending task reminders. Rescheduling updates reminders associated with that time block.
- A longer-term goal is marked complete when the user confirms that its intended outcome has been reached.
- Temporary conditions expire at the end of their stated period. Possible patterns remain tentative until clarified with the user.
- Preference corrections take effect in subsequent plans. A corrected or removed preference must not be restored from older conversation history.
- Saving a plan and its associated changes must not leave partially updated records. If another edit has occurred, the assistant uses the latest state before applying its proposal.

## 7. Non-functional Requirements and Technical Approach

Users sign in to access their own conversations, tasks, plans, and preferences. Personal records remain private even though the web application is available through a public URL.

The assistant must distinguish facts supplied by the user, estimates, and suggestions. Important information such as deadlines and availability cannot be invented to complete a plan. Users can correct the assistant's understanding and see the resulting changes.

If an AI request or save fails, the application preserves the user's input and existing plan, explains the failure, and allows retry. It reports success only after saving. Retrying an operation must not create duplicate tasks.

Daily check-ins and reminders follow the user's timezone and notification settings. The application must clearly show when notification delivery is unavailable.

### Quality requirements

- **Security:** Enforce account ownership on the server for every read and change. Keep credentials out of source control and private conversation content out of public logs. AI-generated actions follow the same permission checks as direct user actions.
- **Accessibility:** Provide labeled controls, keyboard navigation, visible focus and readable contrast. Status and errors must not rely on color alone.
- **Compatibility:** Verify the Mac companion and web planning flow on both Mac and Windows. Desktop reminders require the companion to be running and notification permission to be enabled; a hidden window is different from a fully quit application.
- **Responsiveness:** Show when an AI response or save is in progress, preserve input during waits, and provide a retry after a failure.
- **Testing:** Use unit and integration tests for business rules and stored changes, plus Playwright end-to-end tests for the core user flow. Maintain at least 70% test coverage.

### Technical approach

| Component | Planned approach |
| --- | --- |
| Web application | Next.js and TypeScript |
| Persistence | PostgreSQL for accounts, goals, tasks, plans, preferences and feedback |
| Authentication | Managed authentication; provider to be selected |
| AI | LLM API for clarification, task breakdown and planning suggestions; provider to be selected |
| Mac companion | Desktop integration for the global shortcut, small window and notifications; framework to be selected |
| Reminders | Scheduled processing connected to saved plans and user settings; delivery service to be selected |
| Testing and delivery | Vitest, Playwright, GitHub Actions and Vercel |

The Mac companion and web application use a shared backend. The assistant receives relevant saved context and proposes changes; the application checks permissions, times and conflicts before saving them. Stored preferences and feedback support continuity without making the conversation history the source of truth for current task status.

The web application is deployed over HTTPS with preview deployments for review. CI checks formatting, lint, types, unit/integration tests, end-to-end tests, dependencies and AI PR review. Production deployment follows a merge to main after required checks pass. Desktop packaging is handled separately from web hosting.

## 8. Completion Criteria

The core experience is complete when a user can capture a new task in a sentence, describe several goals, clarify missing information, accept a feasible time-blocked plan, receive a scheduled check-in, report progress, and use that feedback to improve a later plan.

Acceptance testing will cover this flow alongside missing deadlines, conflicting schedules, partial completion, preference corrections, undoing an edit, failed saves, reminder changes, and isolation between user accounts. The Mac shortcut and the web experience on Mac and Windows must also be verified.

The release must demonstrate:
- All six P0 stories working through the public web application and supported Mac companion, as applicable.
- A cross-session scenario in which confirmed feedback changes a later plan, and a corrected preference is no longer used.
- Passing unit, integration and end-to-end tests, at least 70% coverage, and passing required CI checks.
- TDD history for at least three features and the required development evidence maintained with the project.
