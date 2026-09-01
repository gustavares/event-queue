Feature: Public event discovery
  As someone looking for a night out
  I want to browse curated events in my city without an account
  So that I can decide where to go

  Background:
    Given the city "São Paulo" is covered
    And the city "Rio de Janeiro" is covered
    And I am not signed in

  # ─────────────────────────────────────────────────────
  # Browsing a city
  # ─────────────────────────────────────────────────────

  @AC-1 @BR-DISC-003 @BR-DISC-004
  Scenario: Anyone can browse a city listing without an account
    Given the public event "Noite Carioca" is on in "São Paulo" next Friday
    When I open the listing for "São Paulo"
    Then I see "Noite Carioca"
    And I am not asked to sign in

  @AC-2 @BR-DISC-011
  Scenario: Events are grouped by date and ordered by start time
    Given the public event "Abertura" starts in "São Paulo" next Friday at 22:00
    And the public event "Depois" starts in "São Paulo" next Friday at 23:30
    And the public event "Sábado" starts in "São Paulo" next Saturday at 22:00
    When I open the listing for "São Paulo"
    Then "Abertura" and "Depois" appear under next Friday
    And "Abertura" appears before "Depois"
    And "Sábado" appears under next Saturday

  @AC-3
  Scenario: Filtering a city listing by genre
    Given the public event "Techno Bunker" in "São Paulo" has the genre "techno"
    And the public event "Baile do Zé" in "São Paulo" has the genre "funk"
    When I open the listing for "São Paulo"
    And I filter by the genre "techno"
    Then I see "Techno Bunker"
    And I do not see "Baile do Zé"

  @AC-4
  Scenario: Filtering a city listing by date range
    Given the public event "Esta Semana" is on in "São Paulo" in 2 days
    And the public event "Mês Que Vem" is on in "São Paulo" in 40 days
    When I open the listing for "São Paulo"
    And I filter to the next 7 days
    Then I see "Esta Semana"
    And I do not see "Mês Que Vem"

  @AC-10
  Scenario: Seeing which cities are covered
    When I open the discovery home
    Then I see "São Paulo" among the covered cities
    And I see "Rio de Janeiro" among the covered cities

  @AC-7 @BR-DISC-010
  Scenario: Past events are not listed
    Given the public event "Semana Passada" was on in "São Paulo" 7 days ago
    When I open the listing for "São Paulo"
    Then I do not see "Semana Passada"

  @AC-8 @BR-DISC-012
  Scenario: A cancelled event stays listed with a marker until it starts
    Given the public event "Cancelado" is on in "São Paulo" next Friday
    And "Cancelado" has been cancelled
    When I open the listing for "São Paulo"
    Then I see "Cancelado"
    And "Cancelado" is marked as cancelled

  @AC-9 @BR-CUR-007
  Scenario: Featured events surface above the listing
    Given the public event "Destaque" in "São Paulo" is featured for this week
    And the public event "Comum" is on in "São Paulo" next Friday
    When I open the listing for "São Paulo"
    Then "Destaque" appears in the featured section
    And "Comum" appears in the main listing

  # ─────────────────────────────────────────────────────
  # A single event
  # ─────────────────────────────────────────────────────

  @AC-5 @AC-6 @BR-DISC-008
  Scenario: Opening a public event page
    Given the public event "Noite Carioca" is on in "São Paulo" next Friday
    And "Noite Carioca" has the curator note "The rooftop finally has a sound system worth the trip."
    And "Noite Carioca" has the genre "house"
    When I open the event "Noite Carioca" by its link
    Then I see the name "Noite Carioca"
    And I see the curator note "The rooftop finally has a sound system worth the trip."
    And I see its date and start time
    And I see its venue name and address
    And I see the genre "house"
    And I see its price range

  @AC-13 @BR-DISC-007
  Scenario: A first-party event sends me to our own ticket flow
    Given the public event "Nossa Festa" in "São Paulo" is sold through Event Queue
    When I open the event "Nossa Festa" by its link
    And I choose to get tickets
    Then I continue inside Event Queue

  @AC-14 @BR-DISC-007
  Scenario: A curated event sends me to where tickets are actually sold
    Given the curated event "Festa de Terceiro" in "São Paulo" sells tickets at "https://example.com/festa"
    When I open the event "Festa de Terceiro" by its link
    And I choose to get tickets
    Then I am taken to "https://example.com/festa"

  # ─────────────────────────────────────────────────────
  # The public surface must not leak anything
  # ─────────────────────────────────────────────────────

  @AC-11 @BR-DISC-001 @BR-DISC-003
  Scenario: An unlisted event is invisible to the public
    Given the event "Particular" is on in "São Paulo" next Friday
    And "Particular" is unlisted
    When I open the listing for "São Paulo"
    Then I do not see "Particular"

  @AC-11 @error @BR-DISC-003
  Scenario: An unlisted event cannot be reached by its link
    Given the event "Particular" is on in "São Paulo" next Friday
    And "Particular" is unlisted
    When I open the event "Particular" by its link
    Then I see the error "This event isn't available."
    And I am taken to the listing for "São Paulo"

  @AC-12 @BR-DISC-005
  Scenario: The public event page exposes no operational data
    Given the public event "Noite Carioca" is on in "São Paulo" next Friday
    And "Noite Carioca" has a team, guest lists, and recorded door sales
    When I open the event "Noite Carioca" by its link
    Then I do not see any team member
    And I do not see any guest list
    And I do not see any guest
    And I do not see any check-in
    And I do not see any door sale record
    And I do not see any promoter
    And I do not see who created the event

  # ─────────────────────────────────────────────────────
  # Lineup
  # ─────────────────────────────────────────────────────

  @AC-15 @BR-ART-003
  Scenario: Lineup is shown in the curator's order
    Given the public event "Techno Bunker" in "São Paulo" has the lineup "Ana Vega, Dux, Marcela R"
    When I open the event "Techno Bunker" by its link
    Then I see the lineup in the order "Ana Vega, Dux, Marcela R"

  @AC-16 @BR-ART-004
  Scenario: The headliner is distinguished
    Given the public event "Techno Bunker" in "São Paulo" has the lineup "Ana Vega, Dux"
    And "Ana Vega" is the headliner
    When I open the event "Techno Bunker" by its link
    Then "Ana Vega" is shown as the headliner
    And "Dux" is shown as a supporting act

  @AC-17 @BR-ART-005
  Scenario: An event without a lineup omits the section
    Given the public event "Sem Line-up" in "São Paulo" has no lineup
    When I open the event "Sem Line-up" by its link
    Then no lineup section is shown

  @AC-18 @BR-ART-001
  Scenario: An artist page lists their other upcoming events
    Given the artist "Ana Vega" plays the public event "Techno Bunker" in "São Paulo" next Friday
    And the artist "Ana Vega" plays the public event "Depois do Bunker" in "Rio de Janeiro" in 20 days
    When I open the artist "Ana Vega"
    Then I see "Techno Bunker"
    And I see "Depois do Bunker"

  # ─────────────────────────────────────────────────────
  # Newsletter capture
  # ─────────────────────────────────────────────────────

  @AC-32 @AC-34 @BR-SUB-001 @BR-SUB-005
  Scenario: Subscribing to a city list without an account
    When I open the listing for "São Paulo"
    And I subscribe with "leitor@example.com" and accept to receive the list
    Then "leitor@example.com" is subscribed to "São Paulo"
    And my consent is recorded with the time I gave it

  @AC-33 @BR-SUB-002
  Scenario: Subscribing twice is harmless
    Given "leitor@example.com" is already subscribed to "São Paulo"
    When I subscribe with "leitor@example.com" to "São Paulo" again
    Then I am told I am subscribed
    And "São Paulo" has exactly one subscription for "leitor@example.com"

  @error
  Scenario: Subscribing with an invalid email
    When I open the listing for "São Paulo"
    And I subscribe with "nao-e-email"
    Then I see the error "Enter a valid email address."
    And the email I typed is still in the field

  # ─────────────────────────────────────────────────────
  # Errors and edge cases
  # ─────────────────────────────────────────────────────

  @error
  Scenario: Opening a city we don't cover
    When I open the listing for "Manaus"
    Then I see the error "We don't cover that city yet."
    And I see the list of cities we do cover

  @error @AC-5
  Scenario: Opening an event that does not exist
    When I open an event link that does not exist
    Then I see the error "This event isn't available."

  @error
  Scenario: No events match the chosen filters
    Given the public event "Techno Bunker" in "São Paulo" has the genre "techno"
    When I open the listing for "São Paulo"
    And I filter by the genre "sertanejo"
    Then I see the error "Nothing on for those dates."
    And the genre filter "sertanejo" is still selected

  @edge-case
  Scenario: EDGE-1 — an event that started earlier today is no longer upcoming
    Given the public event "Começou Cedo" started in "São Paulo" today at 14:00
    And the current time is today at 18:00
    When I open the listing for "São Paulo"
    Then I do not see "Começou Cedo"

  @edge-case @BR-DISC-011
  Scenario: EDGE-2 — an event across midnight is listed under its start date
    Given the public event "Vira a Noite" starts in "São Paulo" next Friday at 23:00
    And "Vira a Noite" ends next Saturday at 06:00
    When I open the listing for "São Paulo"
    Then "Vira a Noite" appears under next Friday
    And "Vira a Noite" does not appear under next Saturday

  @edge-case @BR-DISC-009
  Scenario: EDGE-3 — an event whose venue has no city is not listed anywhere
    Given the public event "Sem Cidade" is at a venue with no city
    When I open the listing for "São Paulo"
    Then I do not see "Sem Cidade"
    And "Sem Cidade" does not appear in any city listing

  @edge-case
  Scenario: EDGE-4 — a covered city with nothing on
    Given "Rio de Janeiro" has no upcoming public events
    When I open the listing for "Rio de Janeiro"
    Then I see the error "Nothing on for those dates."
    And I am not shown an error page

  @edge-case
  Scenario: EDGE-5 — a genre with nothing on keeps the filter visible
    Given "São Paulo" has no upcoming public events with the genre "drum and bass"
    When I open the listing for "São Paulo"
    And I filter by the genre "drum and bass"
    Then I see the error "Nothing on for those dates."
    And the genre filter "drum and bass" is still selected
