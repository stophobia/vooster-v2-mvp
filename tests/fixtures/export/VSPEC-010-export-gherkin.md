---
vspec_format: 1
type: usecase
key: VSPEC-010
title: Export Gherkin
level: USER_GOAL
format: FULLY_DRESSED
status: DRAFT
priority: P1
scope: vspec
primary_actor: developer
---
# Export Gherkin

## Stakeholders and Interests

- **Vooster**: features are generated consistently. _(Protected by: Success Guarantee)_

## Preconditions

- A valid use case exists.

## Trigger

Developer requests a feature export.

## Main Success Scenario

1. **developer** requests gherkin export.
2. **system** renders the feature text.
3. **system** writes the feature file.

## Extensions

### 2a. Use case has an extension

- 2a1. **system** renders a scenario for the extension.
- (Outcome: SUCCESS — rejoins main at step 3.)

## Success Guarantee

A feature file exists.

## Minimal Guarantee

The use case file remains unchanged.
