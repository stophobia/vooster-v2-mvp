Feature: Export Gherkin

  Background:
    Given the use case is in scope vspec

  Scenario: Main success
    When developer requests gherkin export
    When system renders the feature text
    When system writes the feature file

  Scenario: 2a Use case has an extension
    Given main success reaches step 2
    When system renders a scenario for the extension
    Then outcome is SUCCESS
