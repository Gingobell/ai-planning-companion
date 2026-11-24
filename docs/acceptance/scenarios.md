# Acceptance scenarios (#35)

First draft, Sprint 1. Scenarios come from PRD Section 8 and each story's acceptance criteria. Round 1 runs on the preview deploy in Sprint 2 (December 7 to 8); the final round runs in release week (December 11 to 12). Results go in `docs/acceptance/round-<n>.md`, and each failure becomes a GitHub Issue labeled `acceptance`, assigned to the owner of that area ([p3-work-split.md](../plans/p3-work-split.md)).

**How each scenario runs.** "Agent" scenarios are run by the simulated-user sub-agent through Playwright MCP against the deployed web app. "Manual" scenarios need the Mac companion or system notifications and are run by hand on a Mac. Every scenario starts from a fresh test account unless it says otherwise. Times are in the test account's time zone, America/Los_Angeles.

**Pass rule.** A scenario passes only when every expected result holds. Assistant wording may differ; what is checked is the saved data and what the views show.

## Core flow

### A1. Capture a task from one sentence (US-01, US-06) · Agent
1. Sign in. In chat, send: "Lab 5 for CS6983 is due Thursday at 11:59 pm."
2. Before answering anything else, open Goals & tasks.

Expected: the task "Lab 5" is listed with deadline Thursday 23:59, marked as an external deadline. It was saved before any follow-up question was answered.

### A2. Describe several goals and tasks at once (US-01) · Agent
1. Send: "I want to land a summer internship, finish my thesis draft by December 20, and go to the gym more."
2. Open Goals & tasks.

Expected: three items are saved. Goals and tasks are told apart, each has an editable category, the thesis draft has deadline December 20, and the long-term goals have no deadline.

### A3. Clarify the most important missing information first (US-01, US-06) · Agent
1. Send: "Prepare slides for the team meeting."

Expected: the item is saved first. The assistant then asks for the deadline before anything else and asks only a few questions at a time. Nothing is scheduled yet.

### A4. Accept a proposed time block in one step (US-02, US-06) · Agent
1. Continue A3 and answer: "The meeting is Friday at 10 am."
2. Accept the proposed block with one click.
3. Open Today or Week.

Expected: the block has a specific date, start and end time, respects stated availability, ends before the deadline and does not overlap anything. It shows in Today or Week right after accepting.

### A5. Daily check-in at the agreed time (US-04) · Agent
1. Agree on a daily check-in time a few minutes ahead.
2. Wait until that time with the app open.

Expected: one check-in arrives at the agreed time, refers to the current plan, and invites updates on progress, difficulties or changes.

### A6. Report progress after a check-in (US-03, US-04) · Agent
1. Reply to the check-in: "I finished half of Lab 5."
2. Open Goals & tasks.

Expected: Lab 5 is in progress, not completed. The reply refers to what was actually done.

### A7. Confirmed feedback improves a later plan (US-05) · Agent
1. Tell the assistant: "I do interview practice best in the evening." Confirm when asked whether this is a standing preference.
2. Sign out, sign back in, and ask for a plan that includes interview practice.

Expected: the preference shows under Preferences as confirmed, and the new plan places interview practice in an available evening slot.

## Edge cases from PRD Section 8

### E1. Missing deadline is never invented (US-01) · Agent
1. Send: "Read the new systems paper." Do not give a deadline; say "I'm not sure" when asked.

Expected: the task stays unscheduled. The assistant suggests a target date and asks for agreement; no deadline is saved until the user agrees.

### E2. Work does not fit before a deadline (US-02) · Agent
1. Add fixed commitments that fill every available slot until Thursday.
2. Add a 3-hour task due Thursday.

Expected: no block is created. The assistant explains the conflict and offers alternatives. The deadline is unchanged.

### E3. Conflicting commitments are not double-booked (US-02) · Agent
1. Add a fixed commitment Tuesday 14:00 to 16:00.
2. Ask to schedule a 1-hour task on Tuesday afternoon.

Expected: the proposed block does not overlap 14:00 to 16:00.

### E4. Finishing a time block does not complete the task (US-03) · Agent
1. Let an accepted block's end time pass without reporting anything.

Expected: the task keeps its state. The assistant asks about progress instead of marking it done.

### E5. Correct a completion record (US-03) · Agent
1. Mark a task completed, then say: "Actually I'm not done with that."

Expected: the task returns to in progress, and Goals & tasks shows the corrected state.

### E6. Correct and remove a preference (US-05) · Agent
1. With the evening preference from A7, change it under Preferences to "mornings".
2. Ask for a new plan with interview practice.
3. Remove the preference, then ask again.

Expected: step 2 places it in the morning; step 3 uses no time-of-day preference. The old evening preference never returns, even when earlier chats mention it.

### E7. Temporary condition is not made permanent (US-05) · Agent
1. Say: "I slept badly, keep today light."

Expected: the assistant asks whether this is occasional or ongoing. If occasional, only today's plan changes and no standing preference is saved.

### E8. Undo a direct edit (US-02) · Agent
1. Move tomorrow's writing block to the evening on the Week view.
2. Undo the change.

Expected: the move takes effect immediately and shows what changed. After undo the block is back at its original time.

### E9. Failed save keeps the input (PRD Section 7) · Agent
1. With network requests to the save endpoint blocked, send a new task in chat.
2. Unblock and retry.

Expected: the app says the save failed and keeps the typed text. After retry exactly one task exists.

### E10. Change, pause and quiet reminder settings (US-04) · Agent
1. Turn on reminders for one task. Change the check-in time, then set quiet hours that cover it, then pause reminders until tomorrow.

Expected: no check-in or reminder arrives during quiet hours or the pause. Only the chosen task gets a reminder.

### E11. Completed task loses its reminders (US-04) · Agent
1. Complete a task that has a pending reminder.

Expected: the pending reminder is removed and never delivered.

### E12. Unanswered check-in sends no follow-ups (US-04) · Agent
1. Ignore a check-in for the rest of the day.

Expected: no repeated or escalating messages. Task progress stays as it was.

### E13. Accounts are isolated (PRD Section 7) · Agent
1. With account A, create a task. Sign out.
2. Sign in as account B. Open every page, and request account A's task URL directly.

Expected: account B sees none of account A's data, and the direct request returns nothing.

### E14. Open question carries into the next day (US-06, one chat per day) · Agent
1. Capture a task and close the window without answering the deadline question.
2. Return the next day.

Expected: yesterday's chat is read-only, and the open deadline question appears in today's chat.

## Mac companion

### M1. Shortcut opens the chat over another app (US-06) · Manual
1. With the companion running and another app in focus, press the shortcut and capture a task.

Expected: the small chat window opens over the other app, and the task is saved.

### M2. Reminder with the window hidden (US-04) · Manual
1. Hide the companion window and wait for a reminder.

Expected: a Mac notification appears. If notification permission is denied, the app says so and the due item is visible in the app.

### M3. Hiding keeps unsent input (PRD Section 7) · Manual
1. Type a message without sending, hide the window, then reopen it.

Expected: the unsent text and the conversation are still there.
