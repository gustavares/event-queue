Feature: Curating third-party events
  As a curator
  I want to list events we don't sell tickets for, starting from a link
  So that the city listing is complete enough to be worth reading

  Background:
    Given I am signed in as a curator
    And the city "São Paulo" is covered

  # ─────────────────────────────────────────────────────
  # Ingesting from a source link
  # ─────────────────────────────────────────────────────

  @AC-19 @BR-CUR-002 @BR-CUR-003
  Scenario: Extracted details are shown for review before anything is saved
    Given the page "https://example.com/festa" describes an event on next Friday at "Club Rooftop"
    When I submit "https://example.com/festa" for curation
    Then I see the extracted name, date, time, venue, address, lineup and price
    And nothing has been saved yet

  @AC-20 @BR-CUR-003
  Scenario: Correcting an extracted field before confirming
    Given I have submitted "https://example.com/festa" for curation
    And the extracted venue reads "Club Roof top"
    When I correct the venue to "Club Rooftop"
    And I confirm the listing
    Then the listed event's venue is "Club Rooftop"

  @AC-21 @BR-CUR-005 @BR-DISC-006 @BR-DISC-007
  Scenario: Confirming creates a curated listing that links out for tickets
    Given I have submitted "https://example.com/festa" for curation
    When I confirm the listing
    Then the event is listed in "São Paulo"
    And the event is marked as curated rather than sold by us
    And the event records the source "https://example.com/festa"
    And getting tickets sends people to "https://example.com/festa"

  @AC-22 @error @BR-CUR-009
  Scenario: A source that was already ingested is not listed twice
    Given the event "Festa de Terceiro" was curated from "https://example.com/festa"
    When I submit "https://example.com/festa" for curation
    Then I see the error "That event is already listed."
    And I am shown the existing listing for "Festa de Terceiro"
    And no second listing is created

  @AC-23 @error @BR-CUR-008
  Scenario: An incomplete extraction becomes a draft, never a guess
    Given the page "https://example.com/vago" does not state a start time
    When I submit "https://example.com/vago" for curation
    Then I see the error "We couldn't read everything — fill in the highlighted fields."
    And the start time is highlighted as missing
    And the event is saved as a draft
    And the event is not listed publicly

  @error @BR-CUR-002
  Scenario: A source that cannot be read falls through to manual entry
    Given the page "https://example.com/offline" cannot be reached
    When I submit "https://example.com/offline" for curation
    Then I see the error "We couldn't read that page. Enter the details manually."
    And I am given a blank form to fill in myself

  @BR-CUR-004
  Scenario: Only facts are taken from the source, never its writing or pictures
    Given the page "https://example.com/festa" has its own description and photos
    When I submit "https://example.com/festa" for curation
    Then the extracted fields contain the name, date, time, venue, address, lineup and price
    And the description is empty for me to write myself
    And no image is taken from the source

  # ─────────────────────────────────────────────────────
  # Editorial
  # ─────────────────────────────────────────────────────

  @AC-24 @BR-CUR-006
  Scenario: Writing a curator note
    Given the public event "Festa de Terceiro" is listed in "São Paulo"
    When I write the curator note "Worth the trip out to Barra Funda for the Bunker crew alone."
    Then people reading "Festa de Terceiro" see "Worth the trip out to Barra Funda for the Bunker crew alone."

  @AC-24
  Scenario: Editing a curator note
    Given the public event "Festa de Terceiro" has the curator note "First take."
    When I change the curator note to "Second take, with the lineup confirmed."
    Then people reading "Festa de Terceiro" see "Second take, with the lineup confirmed."
    And they do not see "First take."

  @AC-25 @BR-CUR-007
  Scenario: Featuring an event for a window
    Given the public event "Destaque" is on in "São Paulo" next Friday
    When I feature "Destaque" from today until next Friday
    Then "Destaque" appears in the featured section for "São Paulo"

  @AC-25 @BR-CUR-007
  Scenario: A feature window that has ended stops featuring the event
    Given the public event "Já Foi" was featured until yesterday
    When someone opens the listing for "São Paulo"
    Then "Já Foi" does not appear in the featured section

  @BR-ART-002
  Scenario: Adding a lineup reuses artists that already exist
    Given the artist "Ana Vega" already exists
    And I have submitted "https://example.com/festa" for curation
    When I set the lineup to "ana vega, Dux"
    And I confirm the listing
    Then the lineup uses the existing artist "Ana Vega"
    And a new artist "Dux" is created
    And there is still exactly one artist named "Ana Vega"

  # ─────────────────────────────────────────────────────
  # Access
  # ─────────────────────────────────────────────────────

  @AC-26 @error @BR-CUR-001
  Scenario: A signed-in user without curator access cannot curate
    Given I am signed in as a Manager without curator access
    When I submit "https://example.com/festa" for curation
    Then I see the error "You don't have access to that."
    And no event is created

  @AC-26 @error @BR-CUR-001
  Scenario: A signed-in user without curator access cannot edit a curated event
    Given I am signed in as a Manager without curator access
    And the public event "Festa de Terceiro" was curated by someone else
    When I try to change the curator note on "Festa de Terceiro"
    Then I see the error "You don't have access to that."
    And the curator note is unchanged

  @error @BR-CUR-001
  Scenario: A visitor with no account cannot curate
    Given I am not signed in
    When I submit "https://example.com/festa" for curation
    Then I see the error "You don't have access to that."
    And no event is created

  # ─────────────────────────────────────────────────────
  # Edge cases
  # ─────────────────────────────────────────────────────

  @edge-case
  Scenario: EDGE-6 — a source page listing several events lists only the confirmed one
    Given the page "https://example.com/agenda" describes 3 different events
    When I submit "https://example.com/agenda" for curation
    Then I am asked which event to list
    And when I confirm one of them, only that event is listed

  @edge-case @BR-CUR-008
  Scenario: EDGE-7 — a start date read as being in the past must be corrected by hand
    Given the page "https://example.com/antigo" states a start date in the past
    When I submit "https://example.com/antigo" for curation
    Then I see the error "We couldn't read everything — fill in the highlighted fields."
    And the start date is highlighted as missing
    And the event is saved as a draft

  @edge-case @BR-CUR-007
  Scenario: EDGE-8 — featuring with a window already in the past changes nothing
    Given the public event "Destaque" is on in "São Paulo" next Friday
    When I feature "Destaque" for a window that ended last week
    Then "Destaque" does not appear in the featured section
    And "Destaque" still appears in the main listing
