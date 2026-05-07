Feature: Check-in (Host)
  As a Host working the door of an event
  I want to check guests in by QR scan or name search
  So that the door moves quickly and each guest is credited to the right list

  Background:
    Given I am signed in as a Host
    And I am a Host on event "Birthday Bash"
    And event "Birthday Bash" has status ACTIVE

  # ─────────────────────────────────────────────────────
  # Method 1 — QR scan
  # ─────────────────────────────────────────────────────

  @AC-1 @BR-CHK-001 @BR-CHK-002 @BR-CHK-008
  Scenario: Host scans a QR code for a guest with a document on file
    Given guest "João Silva" is on list "VIP"
    And guest "João Silva" has CPF "12345678900" on file
    When I scan the QR code for "João Silva"
    Then I see the check-in confirmation for "João Silva" on list "VIP"
    When I confirm check-in
    Then "João Silva" is checked in to list "VIP" at <timestamp>
    And the check-in is credited to me as the acting host

  @AC-2 @BR-CHK-002 @BR-GST-005 @BR-GST-006
  Scenario: Host scans a QR code for a guest missing a document and captures CPF
    Given guest "Mariana Costa" is on list "Promoter Bruno"
    And guest "Mariana Costa" has no document on file
    When I scan the QR code for "Mariana Costa"
    Then I am prompted to capture a document
    When I enter document type "CPF" and number "98765432100"
    And I confirm check-in
    Then "Mariana Costa" is checked in to list "Promoter Bruno" at <timestamp>
    And guest "Mariana Costa" now has CPF "98765432100" on file

  @AC-2 @BR-GST-006
  Scenario: Host scans a QR code for a guest missing a document and captures Passport
    Given guest "Sophie Laurent" is on list "VIP"
    And guest "Sophie Laurent" has no document on file
    When I scan the QR code for "Sophie Laurent"
    Then I am prompted to capture a document
    When I enter document type "Passport" and number "FR9912345"
    And I confirm check-in
    Then "Sophie Laurent" is checked in to list "VIP" at <timestamp>
    And guest "Sophie Laurent" now has Passport "FR9912345" on file

  @AC-5
  Scenario: Confirmation screen shows guest, list, and promoter for a PROMOTER list
    Given guest "Pedro Alves" is on list "Promoter Bruno"
    And list "Promoter Bruno" is owned by promoter "Bruno Rocha"
    And guest "Pedro Alves" has CPF "11122233344" on file
    When I scan the QR code for "Pedro Alves"
    Then I see the check-in confirmation for "Pedro Alves" on list "Promoter Bruno"
    And I see the promoter name "Bruno Rocha"
    And I see the current status "Pending"

  @AC-5
  Scenario: Confirmation screen omits promoter for an OFFICIAL list
    Given guest "Carla Mendes" is on list "VIP"
    And list "VIP" is an OFFICIAL list
    And guest "Carla Mendes" has CPF "22233344455" on file
    When I scan the QR code for "Carla Mendes"
    Then I see the check-in confirmation for "Carla Mendes" on list "VIP"
    And no promoter name is shown
    And I see the current status "Pending"

  @error
  Scenario: QR code that is not on this event is rejected
    When I scan an unrecognised QR code
    Then I see the error "This QR code is not recognized for this event."
    And I remain on the scanner
    And no entry is checked in

  # ─────────────────────────────────────────────────────
  # Method 2 — Name search
  # ─────────────────────────────────────────────────────

  @AC-3 @BR-CHK-003 @BR-CHK-009 @edge-case @EDGE-4
  Scenario: Name search shows every matching ListEntry across every list on the event
    Given guest "João Silva" is on list "VIP"
    And guest "João Silva" is on list "Promoter Bruno"
    And list "VIP" is an OFFICIAL list
    And list "Promoter Bruno" is owned by promoter "Bruno Rocha"
    When I search for "João"
    Then I see a search result row for "João Silva" on list "VIP"
    And I see a search result row for "João Silva" on list "Promoter Bruno" with promoter "Bruno Rocha"
    And each row shows the current status

  @AC-4 @BR-CHK-003 @BR-GST-003 @edge-case @EDGE-4
  Scenario: Selecting a search result credits only that ListEntry
    Given guest "João Silva" is on list "VIP"
    And guest "João Silva" is on list "Promoter Bruno"
    And guest "João Silva" has CPF "12345678900" on file
    When I search for "João"
    And I select the search result for "João Silva" on list "Promoter Bruno"
    And I confirm check-in
    Then "João Silva" is checked in to list "Promoter Bruno" at <timestamp>
    And "João Silva" remains Pending on list "VIP"

  @AC-3 @AC-4 @BR-CHK-003 @BR-GST-005
  Scenario: Name-search check-in captures a missing document
    Given guest "Tatiana Reis" is on list "VIP"
    And guest "Tatiana Reis" has no document on file
    When I search for "Tatiana"
    And I select the search result for "Tatiana Reis" on list "VIP"
    Then I am prompted to capture a document
    When I enter document type "CPF" and number "33344455566"
    And I confirm check-in
    Then "Tatiana Reis" is checked in to list "VIP" at <timestamp>
    And guest "Tatiana Reis" now has CPF "33344455566" on file

  # ─────────────────────────────────────────────────────
  # Already checked in
  # ─────────────────────────────────────────────────────

  @AC-6 @BR-CHK-007 @edge-case @EDGE-1
  Scenario: Re-scanning a guest who is already checked in shows a notice
    Given guest "João Silva" is on list "VIP"
    And "João Silva" was already checked in to list "VIP" at "23:14" by host "Lucia"
    When I scan the QR code for "João Silva"
    Then I see the notice "Already checked in at 23:14"
    And the entry is unchanged
    And the original check-in timestamp and acting host are preserved

  @AC-6 @edge-case @EDGE-1
  Scenario: Re-selecting an already-checked-in result from name search shows a notice
    Given guest "João Silva" is on list "VIP"
    And "João Silva" was already checked in to list "VIP" at "23:14" by host "Lucia"
    When I search for "João"
    And I select the search result for "João Silva" on list "VIP"
    Then I see the notice "Already checked in at 23:14"
    And the entry is unchanged

  # ─────────────────────────────────────────────────────
  # Event status gating
  # ─────────────────────────────────────────────────────

  @AC-7 @BR-CHK-006 @error @edge-case @EDGE-2
  Scenario: Check-in is rejected on a CANCELLED event
    Given event "Birthday Bash" has status CANCELLED
    And guest "João Silva" is on list "VIP"
    And guest "João Silva" has CPF "12345678900" on file
    When I scan the QR code for "João Silva"
    Then I see the error "This event has been cancelled. Check-in is not allowed."
    And no entry is checked in
    And I remain on the scanner

  @AC-8 @BR-CHK-006 @edge-case @EDGE-3
  Scenario: Check-in on a FINISHED event is allowed with a notice
    Given event "Birthday Bash" has status FINISHED
    And guest "João Silva" is on list "VIP"
    And guest "João Silva" has CPF "12345678900" on file
    When I scan the QR code for "João Silva"
    Then I see the check-in confirmation for "João Silva" on list "VIP"
    And I see the notice "This event has finished. Late check-in will still be recorded."
    When I confirm check-in
    Then "João Silva" is checked in to list "VIP" at <timestamp>

  # ─────────────────────────────────────────────────────
  # Authorization
  # ─────────────────────────────────────────────────────

  @AC-9 @BR-CHK-005 @error
  Scenario: A user not on the event's team cannot check anyone in
    Given I am signed in as a user
    And I am not on the team for event "Birthday Bash"
    And guest "João Silva" is on list "VIP" for event "Birthday Bash"
    When I attempt to open the check-in flow for event "Birthday Bash"
    Then I see the error "You are not on this event's team."
    And the scanner is not shown
    And no entry is checked in

  @AC-9 @BR-CHK-005
  Scenario: A Manager on the event can also perform check-in
    Given I am signed in as a Manager
    And I am the Manager of event "Birthday Bash"
    And guest "João Silva" is on list "VIP"
    And guest "João Silva" has CPF "12345678900" on file
    When I scan the QR code for "João Silva"
    And I confirm check-in
    Then "João Silva" is checked in to list "VIP" at <timestamp>
    And the check-in is credited to me as the acting host

  # ─────────────────────────────────────────────────────
  # Document capture validation
  # ─────────────────────────────────────────────────────

  @AC-10 @BR-GST-016 @error @edge-case @EDGE-5
  Scenario Outline: Invalid CPF format is rejected
    Given guest "Mariana Costa" is on list "VIP"
    And guest "Mariana Costa" has no document on file
    When I scan the QR code for "Mariana Costa"
    And I enter document type "CPF" and number "<value>"
    And I attempt to confirm check-in
    Then I see the error "Please enter a valid CPF or passport number"
    And I remain on the document capture step
    And no entry is checked in

    Examples:
      | value          |
      | 123            |
      | 1234567890     |
      | abcdefghijk    |
      | 1234567890a    |

  @AC-11 @error
  Scenario: Empty document is rejected
    Given guest "Mariana Costa" is on list "VIP"
    And guest "Mariana Costa" has no document on file
    When I scan the QR code for "Mariana Costa"
    And I leave the document number empty
    And I attempt to confirm check-in
    Then I see the error "Please enter a valid CPF or passport number"
    And I remain on the document capture step
    And no entry is checked in

  @BR-GST-006 @BR-GST-016 @edge-case @EDGE-6
  Scenario: Passport with a single character is accepted
    Given guest "Sophie Laurent" is on list "VIP"
    And guest "Sophie Laurent" has no document on file
    When I scan the QR code for "Sophie Laurent"
    And I enter document type "Passport" and number "X"
    And I confirm check-in
    Then "Sophie Laurent" is checked in to list "VIP" at <timestamp>
    And guest "Sophie Laurent" now has Passport "X" on file

  # ─────────────────────────────────────────────────────
  # Network errors
  # ─────────────────────────────────────────────────────

  @AC-12 @error @edge-case @EDGE-7
  Scenario: Network error during confirm keeps host on the confirmation screen
    Given guest "João Silva" is on list "VIP"
    And guest "João Silva" has CPF "12345678900" on file
    And the network is unavailable
    When I scan the QR code for "João Silva"
    And I confirm check-in
    Then I see the error "Something went wrong. Please try again."
    And I remain on the check-in confirmation for "João Silva"
    And no entry is checked in

  # ─────────────────────────────────────────────────────
  # Un-check-in is deferred (MVP)
  # ─────────────────────────────────────────────────────

  @AC-13 @BR-CHK-010
  Scenario: Reversing a check-in is not exposed in the MVP UI
    Given guest "João Silva" is on list "VIP"
    And "João Silva" was already checked in to list "VIP" at "23:14" by host "Lucia"
    When I scan the QR code for "João Silva"
    Then I see the notice "Already checked in at 23:14"
    And no option to reverse the check-in is shown
