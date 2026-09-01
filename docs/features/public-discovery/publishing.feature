Feature: Publishing an event to the public listing
  As a Manager
  I want to choose whether my event appears publicly
  So that people who don't already follow me can find it, and nothing is exposed by accident

  Background:
    Given I am signed in as a Manager
    And the city "São Paulo" is covered

  # ─────────────────────────────────────────────────────
  # Publishing
  # ─────────────────────────────────────────────────────

  @AC-27 @BR-DISC-001 @BR-DISC-003
  Scenario: Publishing an active event
    Given I am the Manager of the active event "Noite Carioca" at a venue in "São Paulo"
    And "Noite Carioca" is unlisted
    When I publish "Noite Carioca" to the public listing
    Then "Noite Carioca" appears in the listing for "São Paulo"
    And anyone can open it without an account

  @AC-28
  Scenario: Unpublishing an event
    Given I am the Manager of the public event "Noite Carioca" in "São Paulo"
    When I unpublish "Noite Carioca"
    Then "Noite Carioca" does not appear in the listing for "São Paulo"
    And "Noite Carioca" is still visible to me and my team

  @AC-31 @BR-DISC-001 @BR-DISC-002
  Scenario: Events are private until deliberately published
    Given I am the Manager of the active event "Recém-Criado" at a venue in "São Paulo"
    When I look at whether "Recém-Criado" is public
    Then "Recém-Criado" is unlisted
    And "Recém-Criado" does not appear in the listing for "São Paulo"

  @AC-31 @BR-DISC-002
  Scenario: Events that predate the discovery feature stay private
    Given the event "Festa Antiga" was created before public listings existed
    When public listings become available
    Then "Festa Antiga" is unlisted
    And "Festa Antiga" does not appear in any city listing

  @AC-27 @BR-DISC-006
  Scenario: A published event of ours is marked as sold by us
    Given I am the Manager of the active event "Nossa Festa" at a venue in "São Paulo"
    When I publish "Nossa Festa" to the public listing
    Then "Nossa Festa" is marked as sold through Event Queue
    And getting tickets keeps people inside Event Queue

  # ─────────────────────────────────────────────────────
  # Guards
  # ─────────────────────────────────────────────────────

  @AC-29 @error @BR-DISC-009
  Scenario: An event with no city cannot be published
    Given I am the Manager of the active event "Sem Cidade" with an inline location and no city
    When I try to publish "Sem Cidade" to the public listing
    Then I see the error "Add a city before publishing."
    And "Sem Cidade" is still unlisted

  @AC-30 @error @BR-DISC-013
  Scenario: A draft event cannot be published publicly
    Given I am the Manager of the draft event "Rascunho" at a venue in "São Paulo"
    When I try to publish "Rascunho" to the public listing
    Then I see the error "Publish the event to your team before listing it publicly."
    And "Rascunho" is still unlisted

  @error
  Scenario: A non-Manager cannot publish someone else's event
    Given I am a Promoter on the active event "Noite Carioca" in "São Paulo"
    And "Noite Carioca" is unlisted
    When I try to publish "Noite Carioca" to the public listing
    Then I see the error "You don't have access to that."
    And "Noite Carioca" is still unlisted

  # ─────────────────────────────────────────────────────
  # Edge cases
  # ─────────────────────────────────────────────────────

  @edge-case @AC-28
  Scenario: EDGE-9 — an old link to an unpublished event does not resolve to something else
    Given the public event "Noite Carioca" in "São Paulo" has been shared by its link
    When I unpublish "Noite Carioca"
    And someone opens the link they were given
    Then they see the error "This event isn't available."
    And they are not shown a different event

  @edge-case @BR-DISC-012
  Scenario: EDGE-10 — cancelling a published event keeps it listed, marked cancelled
    Given I am the Manager of the public event "Cancelado" in "São Paulo" on next Friday
    When I cancel "Cancelado"
    Then "Cancelado" still appears in the listing for "São Paulo"
    And "Cancelado" is marked as cancelled
    And "Cancelado" stops appearing once next Friday has passed
