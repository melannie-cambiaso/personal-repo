# Delta for Mobile Navigation

## ADDED Requirements

### Requirement: Drawer navigation lists all features

The system MUST provide a drawer (hamburger-triggered) navigation component that lists all 6 content features: finance, home-improvements, savings, shopping-list, todo, wishlist. `login` MUST NOT appear in the drawer — it is an auth route, not a content feature, consistent with the existing home-page grid.

#### Scenario: Drawer lists every feature

- GIVEN the drawer is open
- WHEN the user inspects its contents
- THEN it MUST show exactly one navigation entry per feature (finance, home-improvements, savings, shopping-list, todo, wishlist)
- AND each entry MUST link to that feature's route
- AND no entry for `login` MUST be present

### Requirement: Drawer reachable from every screen

At mobile viewports (~375-430px), the system MUST expose a drawer trigger (hamburger icon) on every screen: the home page (`/`) and inside every one of the 6 content-feature routes. The trigger MUST be hidden at desktop breakpoints (`lg:hidden`) so existing desktop appearance is unchanged — this is mobile-only scope, not a desktop navigation change.

#### Scenario: Trigger present on home (mobile)

- GIVEN the user is on `/` at a mobile viewport
- WHEN the page renders
- THEN a drawer trigger MUST be visible

#### Scenario: Trigger present inside a feature (mobile)

- GIVEN the user is on any feature route (e.g. `/finance`, `/shopping-list`) at a mobile viewport
- WHEN the page renders
- THEN a drawer trigger MUST be visible without requiring the user to navigate back to `/` first

#### Scenario: Trigger hidden at desktop breakpoints

- GIVEN the user is at an existing desktop breakpoint
- WHEN any screen renders
- THEN the drawer trigger MUST NOT be visible, preserving current desktop appearance

### Requirement: Drawer open and close behavior

The system MUST let the user open the drawer via the trigger and close it via an explicit close action, an overlay/backdrop click, or the Escape key.

#### Scenario: Open via trigger

- GIVEN the drawer is closed
- WHEN the user activates the drawer trigger
- THEN the drawer MUST open and display the feature list

#### Scenario: Close via explicit action

- GIVEN the drawer is open
- WHEN the user activates the close control
- THEN the drawer MUST close and return focus to the trigger

#### Scenario: Close via backdrop or Escape

- GIVEN the drawer is open
- WHEN the user clicks the backdrop or presses Escape
- THEN the drawer MUST close

### Requirement: Active route indication

The system MUST visually indicate which feature entry corresponds to the current route when the drawer is open.

#### Scenario: Current feature highlighted

- GIVEN the user is on a feature route (e.g. `/todo`)
- WHEN the drawer is open
- THEN the entry for that feature MUST be visually distinguished from the other entries

#### Scenario: No highlight on home

- GIVEN the user is on `/` (no single feature active)
- WHEN the drawer is open
- THEN no feature entry MUST be shown as active

### Requirement: Drawer nav is independent of the back-link

The system MUST NOT require the existing "← Inicio" back-link as the mechanism for cross-feature navigation. The drawer MUST provide a complete, self-sufficient path between any two features without passing through `/`.

#### Scenario: Cross-feature jump without the back-link

- GIVEN the user is inside one feature (e.g. `/wishlist`)
- WHEN the user opens the drawer and selects a different feature (e.g. `/savings`)
- THEN the user MUST land on the selected feature's route directly
- AND this MUST succeed even if the back-link were removed from the page

#### Scenario: Back-link may remain alongside the drawer

- GIVEN a feature page renders both the "← Inicio" back-link and the drawer trigger
- WHEN the user activates the back-link
- THEN it MAY still navigate to `/` as before, since the drawer's presence does not require removing the back-link
