---
name: debug
description: Systematically debug issues by finding root cause before attempting fixes -- use for any bug, test failure, build error, or unexpected behavior
user-invocable: true
allowed-tools: Read, Write, Edit, Grep, Glob, Bash, Agent
argument-hint: "<description of the issue>"
---

# Systematic Debugging

**Iron Rule:** Find root cause BEFORE attempting fixes. Symptom fixes are failure.

## Phase 1: Investigate

1. Read the full error message/stack trace
2. Reproduce the issue consistently
3. Check recent changes (`git diff`, `git log`)
4. Trace data flow backward through the call stack
5. For multi-service issues, add diagnostic logging at each boundary

## Phase 2: Analyze

1. Find a working example of similar code
2. Compare working vs broken -- identify ALL differences
3. Check assumptions about dependencies and state
4. For DaryWin specifically, check:
   - Backend: route config -> route handler -> controller -> model chain
   - Frontend/Admin: component -> service -> axiosInstance -> API chain
   - Mobile: screen -> service -> axiosInstance -> API chain
   - Shared types: ensure `packages/darywin-types` is built and consistent

## Phase 3: Hypothesize and Test

1. Form ONE specific hypothesis
2. Test it minimally (change one thing)
3. Verify results before continuing
4. If 3+ fix attempts fail, question the architecture, not the patch

## Phase 4: Fix

1. Write a failing test capturing the bug (backend only -- only app with tests)
2. Implement a single root-cause fix
3. Verify the test passes
4. Check for similar issues elsewhere in the codebase

## Red Flags (stop and go back to Phase 1)

- Proposing a fix without understanding why it broke
- Changing multiple things at once
- "Try this and see if it works"
- The same fix for the third time
