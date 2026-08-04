# Daisy.work — Simplification and Agent-Orchestrator Refactor

The current product has become too visually and operationally complex.

Your task is to simplify Daisy.work around a small number of clear user goals, then build a safe orchestration layer that uses a fast DeepSeek model to turn plain-language requests into structured Work Orders, requirements, deliverables, and next actions.

Do not add more dashboard widgets, navigation destinations, cards, filters, or configuration screens unless they remove more complexity than they introduce.

The product should feel calm, obvious, and guided.

---

# 1. Product objective

Daisy.work should make this flow easy:

```text
Describe work
→ Daisy structures it
→ User reviews the plan
→ Qualified person or agent accepts it
→ Work is completed
→ Evidence is reviewed
→ Payment is released
```

Most users should not need to understand:

- Governance levels
- Credential schemas
- Contract structures
- Verification mechanics
- Agent routing
- Milestone data models
- Internal workflow states
- Tool selection
- Provider APIs

The system should manage these details and surface them only when they affect a user decision.

---

# 2. Simplification rules

Apply these rules across the application.

## One dominant task per screen

Every screen must have:

- One clear purpose
- One primary action
- No more than two visible secondary actions
- A clear next step

Move infrequent actions into:

- `DropdownMenu`
- `Dialog`
- `Sheet`
- `Drawer`
- `Popover`
- `Accordion`

Do not display every possible action inline.

## Progressive disclosure

Only show information required for the current decision.

Examples:

- Show “License required” first.
- Reveal license type, issuer, jurisdiction, and expiration rules when expanded.
- Show total payment first.
- Reveal fees and milestones in payment details.
- Show a governance summary first.
- Reveal the audit trail and rule explanation on request.

## Prefer guided flows over dashboards

Dashboards should help users resume or start work.

They should not attempt to expose the full system.

## Prefer plain language

Use:

- `What needs to be done?`
- `Who can do this work?`
- `What proof is required?`
- `How much will it pay?`
- `Ready to post`

Avoid exposing internal language such as:

- `Governance assessment`
- `Execution graph`
- `Policy resolution`
- `Credential constraint object`
- `Tool invocation`

Internal concepts may exist in code but should be translated for users.

## Hide complexity by default

Technical, legal, financial, and agent details should appear only when:

- Required for consent
- Required for safety
- Required to resolve ambiguity
- Requested by the user
- Needed to correct an error

---

# 3. Simplified information architecture

Use only these primary destinations:

```text
Home
Work
Post
Inbox
Account
```

Do not keep Payments, Saved, Organization, Settings, and Profile as equal top-level destinations.

Place them under `Account`:

```text
Account
├── Profile
├── Organization
├── Payments
├── Saved
├── Settings
├── Help
└── Sign out
```

On desktop:

- Use a compact sidebar.
- Keep five primary destinations visible.
- Put account utilities in the footer account menu.

On mobile:

- Use five bottom-navigation destinations.
- Use a Sheet or Drawer for account utilities.

---

# 4. Simplified page model

## Home

Home should answer:

1. What needs my attention?
2. What work is active?
3. What should I do next?

Show only:

- One compact attention queue
- Active work
- One primary `Post work` action
- Optional `Browse work` secondary action

Remove:

- Separate summary column
- Large stat-card clusters
- Quick-action grids
- Redundant recent-activity cards
- Duplicate counts that already appear in lists

A compact header may show:

```text
3 items need attention
2 jobs in progress
```

Do not create a separate card for every count.

## Work

Use one unified work list.

Default controls:

- Search
- Status filter
- Sort

Move all other filters into a `Sheet` or `Drawer`.

Each Work Order card should show only:

- Title
- Status
- Payment
- Due date
- Location or remote
- Next action

Reveal category, risk, credentials, requester, and full description in the detail view.

## Post

The Post flow should begin with one large plain-language input:

> What needs to be done?

Then Daisy should prepare a draft.

Use three user-facing stages:

```text
1. Describe
2. Review
3. Post
```

Do not expose six separate steps.

The system may internally process:

- Classification
- Risk assessment
- Requirements
- Deliverables
- Pricing
- Contract recommendations

Present the result as one editable review screen.

## Inbox

Use one inbox with filters:

- All
- Messages
- Requests
- Updates

Do not create complex messaging features before real conversations exist.

## Account

Use one account hub.

Show grouped links and summaries for:

- Profile
- Organization
- Payments
- Saved
- Settings
- Help

Open compact edits in Dialogs or Drawers.

---

# 5. Orchestrator purpose

Build an application-owned orchestration layer that converts user intent into safe, deterministic application actions.

The model should not directly mutate the database.

The model should:

- Interpret intent
- Ask for missing information
- Propose a structured plan
- Select from an allowlisted set of tools
- Explain important recommendations
- Return structured output
- Stop and request human confirmation when required

Application services should:

- Validate tool arguments
- Authorize the actor
- Execute mutations
- Record audit events
- Return tool results
- Enforce state transitions
- Enforce payment, credential, and safety rules

The LLM is a planner and coordinator, not the source of truth.

---

# 6. Provider abstraction

Do not hard-code business logic to one model or provider.

Create a provider-neutral interface.

```ts
export interface OrchestratorModel {
  plan(input: OrchestratorInput): Promise<OrchestratorPlan>;
  continue(input: OrchestratorContinuation): Promise<OrchestratorPlan>;
}
```

Create a DeepSeek adapter behind that interface.

```text
src/server/ai/
  model/
    orchestrator-model.ts
    deepseek-orchestrator-model.ts
    mock-orchestrator-model.ts
```

Configuration should use environment variables.

Example:

```text
DEEPSEEK_API_KEY
DEEPSEEK_BASE_URL
DEEPSEEK_MODEL
```

Do not assume the marketing name “DeepSeek Flash” is the permanent API model identifier.

Read the identifier from configuration.

Use the provider’s supported structured JSON and tool-calling behavior where available.

Keep a mock adapter for tests and local UI development.

---

# 7. Orchestrator architecture

Use this structure or the closest equivalent that matches the repository:

```text
src/server/orchestrator/
  orchestrator.service.ts
  orchestrator.types.ts
  orchestrator.schemas.ts
  orchestrator.policy.ts
  orchestrator.registry.ts
  orchestrator.audit.ts

  tools/
    work/
      create-work-draft.tool.ts
      update-work-draft.tool.ts
      classify-work.tool.ts
      suggest-requirements.tool.ts
      suggest-deliverables.tool.ts
      suggest-pricing.tool.ts
      publish-work.tool.ts

    credentials/
      list-worker-credentials.tool.ts
      request-credential.tool.ts
      check-credential-status.tool.ts

    assignments/
      search-workers.tool.ts
      invite-worker.tool.ts
      accept-work.tool.ts

    submissions/
      create-submission.tool.ts
      attach-evidence.tool.ts
      evaluate-submission.tool.ts
      request-changes.tool.ts
      approve-submission.tool.ts

    payments/
      summarize-payment.tool.ts
      authorize-payment.tool.ts
      release-payment.tool.ts

    communication/
      create-message-draft.tool.ts
      send-message.tool.ts

  prompts/
    system-prompt.ts
    work-planning-prompt.ts
    submission-review-prompt.ts
```

Do not create one giant orchestrator file.

---

# 8. Tool contract

Every tool must have:

- Stable name
- Plain-language description
- Zod input schema
- Typed output schema
- Risk classification
- Authorization requirement
- Confirmation requirement
- Idempotency behavior
- Audit behavior
- Execution timeout
- Error mapping

Use a common interface:

```ts
export type ToolRisk =
  | "read"
  | "reversible_write"
  | "consequential_write"
  | "financial"
  | "regulated";

export interface OrchestratorTool<
  TInput,
  TOutput,
> {
  name: string;
  description: string;
  inputSchema: z.ZodType<TInput>;
  outputSchema: z.ZodType<TOutput>;
  risk: ToolRisk;
  requiresConfirmation: boolean;
  execute(
    context: ToolExecutionContext,
    input: TInput,
  ): Promise<TOutput>;
}
```

Add a registry:

```ts
export interface ToolRegistry {
  register(tool: OrchestratorTool<unknown, unknown>): void;
  get(name: string): OrchestratorTool<unknown, unknown> | undefined;
  listForContext(context: ToolSelectionContext): ToolDefinition[];
}
```

Only expose tools relevant to the current user, route, entity, and workflow state.

Do not send the model the entire tool registry on every request.

---

# 9. Initial orchestrator tools

Implement a minimal high-leverage tool set.

## Read tools

### `get_user_context`

Returns only context relevant to the current workflow:

- User role
- Organization
- Verification state
- Current Work Order
- Allowed actions

Do not expose unrelated personal data.

### `get_work_draft`

Returns the current draft in a concise structured format.

### `get_work_order`

Returns the user-visible Work Order state and allowed actions.

### `list_matching_workers`

Returns a limited set of qualified candidates.

Filter server-side before returning results.

### `get_submission_summary`

Returns deliverables, evidence, checks, and unresolved concerns.

## Planning tools

### `classify_work`

Input:

- Plain-language description
- Work location
- Optional category

Output:

- Work mode
- Suggested category
- Complexity
- Risk band
- Missing information
- Confidence
- Explanation

This tool should not mutate data.

### `suggest_requirements`

Output may include:

- Identity
- Skill
- License
- Insurance
- Location
- Equipment
- Background check
- Human review

Each recommendation must include:

- Reason
- Whether it is required or optional
- Confidence
- Whether human confirmation is required

### `suggest_deliverables`

Proposes the smallest set of evidence needed to verify completion.

Avoid unnecessary surveillance or data collection.

### `suggest_pricing`

Returns a recommendation, range, basis, and uncertainty.

Do not present generated pricing as authoritative market data unless connected to real data.

## Draft tools

### `create_work_draft`

Creates a draft only.

It must never publish work.

### `update_work_draft`

Applies validated changes to a draft.

It should support partial updates.

### `prepare_work_review`

Returns a user-facing summary:

- What will be done
- Who may perform it
- Required proof
- Payment
- Deadline
- Important conditions
- Missing decisions

## Consequential tools

### `publish_work`

Requires explicit user confirmation.

### `invite_worker`

Requires explicit user confirmation.

### `approve_submission`

Requires explicit user confirmation and explains the payment consequence.

### `release_payment`

Requires explicit user confirmation, server-side authorization, and idempotency.

### `request_changes`

Requires the reason to be visible to the worker.

The model must not autonomously perform these actions.

---

# 10. Orchestration flow

Use a bounded loop.

```text
1. Receive user intent
2. Load minimal authorized context
3. Ask model for structured plan or tool call
4. Validate output
5. Check tool allowlist
6. Check tool risk
7. Ask user for confirmation when required
8. Execute tool server-side
9. Record audit event
10. Return concise result to model
11. Repeat until:
    - user input is required
    - confirmation is required
    - task is complete
    - step limit is reached
```

Set a strict maximum number of model/tool iterations per request.

Suggested default:

```text
Maximum orchestration steps: 6
```

Do not allow unbounded autonomous loops.

---

# 11. Structured model output

Require the model to return one of these states:

```ts
type OrchestratorDecision =
  | {
      type: "ask_user";
      question: string;
      fields?: RequestedField[];
    }
  | {
      type: "call_tool";
      toolName: string;
      arguments: unknown;
      explanation: string;
    }
  | {
      type: "request_confirmation";
      action: ProposedAction;
      summary: string;
      consequences: string[];
    }
  | {
      type: "complete";
      summary: string;
      nextActions: SuggestedAction[];
    }
  | {
      type: "escalate";
      reason: string;
      destination: "support" | "human_review" | "requester";
    };
```

Validate every response with Zod.

If parsing fails:

1. Retry once with a repair prompt.
2. If it still fails, stop safely.
3. Display a recoverable error.
4. Do not infer or execute a tool call from malformed output.

---

# 12. User-facing orchestrator UI

Do not build a generic chatbot as the primary interface.

Use the orchestrator inside task-focused flows.

## Post Work

The user enters:

> Replace an electrical outlet in my kitchen.

Daisy responds with a structured draft:

```text
Residential electrical work
On-site
Licensed electrician recommended
Proof of active license
Before-and-after photos
Suggested fixed-price range
```

Then ask only the missing questions:

- Where will the work happen?
- When should it be completed?
- What budget do you have?

Use editable cards and form fields, not a long chat transcript.

## Work Order

Show a small `Ask Daisy` or `Help me with this` action.

Open a Sheet or Drawer with context-aware suggestions:

- Add missing requirement
- Find a qualified worker
- Summarize submissions
- Draft a request for changes
- Explain why a credential is required

## Submission review

The orchestrator may prepare:

- Evidence summary
- Acceptance checklist
- Detected inconsistencies
- Recommended next action

The requester remains responsible for approval.

## Inbox

The orchestrator may:

- Summarize a thread
- Draft a response
- Identify unresolved questions

Sending remains a confirmed action.

---

# 13. Simplified Post flow

Replace the complex form with this experience.

## Stage 1: Describe

Show:

- One large textarea
- Optional location
- Optional deadline
- Optional budget
- Example prompts
- Primary action: `Create draft`

The orchestrator calls planning tools.

## Stage 2: Review

Show five concise editable sections:

```text
Work
Worker
Requirements
Proof
Payment
```

Each section has:

- Summary
- Edit action
- Warning only when necessary

Use Dialogs or Drawers for editing each section.

Do not show a huge page containing every field.

## Stage 3: Post

Show:

- Final summary
- Important terms
- Required confirmations
- Fee/payment summary
- Primary action: `Post work`

Publishing requires explicit confirmation.

---

# 14. Simplified Work Order detail

The default page should show:

```text
Title and status
Next action
Payment and due date
Work summary
Requirements
Submission or progress
```

Move these into secondary views:

- Full audit trail
- Contract text
- Raw evidence metadata
- Credential details
- Payment history
- Agent reasoning details

Use:

- Tabs on desktop
- Accordion on mobile
- Drawers or Sheets for details

Do not show all workflow internals simultaneously.

---

# 15. Policy and safety layer

Create deterministic policy checks outside the model.

```text
src/server/orchestrator/policies/
  tool-access.policy.ts
  confirmation.policy.ts
  payment.policy.ts
  credential.policy.ts
  regulated-work.policy.ts
  data-minimization.policy.ts
```

The policy layer decides:

- Which tools are available
- Which actions require confirmation
- Whether the actor is authorized
- Whether a credential requirement can be removed
- Whether payment can be authorized or released
- Whether human review is mandatory
- What data may be sent to the model

The model may recommend.

The policy layer decides what is permitted.

---

# 16. Data minimization

Before sending context to the model:

- Remove secrets
- Remove raw identity documents
- Remove payment credentials
- Remove unnecessary addresses
- Remove unrelated messages
- Remove internal database metadata
- Limit evidence to summaries unless inspection is required
- Use signed, expiring references when files must be accessed
- Log what context class was provided, not the sensitive payload itself

Create a context builder:

```ts
export interface OrchestratorContextBuilder {
  build(
    actor: ActorContext,
    request: OrchestratorRequest,
  ): Promise<SafeOrchestratorContext>;
}
```

---

# 17. Confirmation model

Use three action levels.

## No confirmation

- Search
- Summarize
- Classify
- Suggest
- Read current state
- Prepare a draft

## Lightweight confirmation

- Update a draft
- Save a recommendation
- Add a non-sensitive requirement
- Draft a message

## Explicit confirmation

- Publish work
- Invite a worker
- Send a message
- Approve or reject work
- Request changes
- Accept a contract
- Authorize payment
- Release payment
- Delete or cancel work
- Share credential information

Explicit confirmation UI must state:

- Action
- Target
- Financial consequence
- Data shared
- Whether it can be undone

---

# 18. Auditability

Record orchestration events separately from ordinary application logs.

```ts
type OrchestratorAuditEvent = {
  id: string;
  requestId: string;
  actorId: string;
  organizationId?: string;
  workOrderId?: string;
  modelProvider: string;
  modelName: string;
  eventType:
    | "plan_created"
    | "tool_requested"
    | "tool_denied"
    | "confirmation_requested"
    | "confirmation_accepted"
    | "confirmation_rejected"
    | "tool_executed"
    | "tool_failed"
    | "orchestration_completed"
    | "orchestration_escalated";
  toolName?: string;
  risk?: ToolRisk;
  createdAt: Date;
};
```

Do not store hidden chain-of-thought.

Store:

- Tool requested
- User-visible explanation
- Policy decision
- Result category
- Error category
- Timing
- Token usage where available

---

# 19. Reliability

Implement:

- Timeouts
- Abort signals
- Maximum iterations
- Input/output validation
- Tool allowlists
- Idempotency
- Retry only for transient failures
- Circuit-breaker-ready provider abstraction
- Mock provider
- Structured error categories
- Graceful fallback to manual forms

If the model is unavailable:

- Preserve the user’s draft.
- Let the user continue manually.
- Do not block core Work Order functionality.

The platform must remain usable without the model.

---

# 20. Performance and cost

Use the fast model for:

- Intent classification
- Missing-field detection
- Requirement suggestions
- Tool selection
- Summaries
- Draft generation

Do not call the model for:

- Simple formatting
- Status mapping
- Authorization
- Arithmetic
- Database filtering
- Deterministic validation
- Permission checks
- Payment-state decisions

Cache only safe, reusable, non-user-sensitive planning results.

Track:

- Latency
- Input tokens
- Output tokens
- Tool calls
- Parse failures
- Retry count
- Completion rate
- Human correction rate

---

# 21. Testing

Add unit tests for:

- Tool schemas
- Tool registry
- Risk classification
- Confirmation policy
- Allowed/denied tool access
- Structured response parsing
- Malformed output handling
- Maximum-step enforcement
- Context redaction
- Idempotency
- Provider timeout fallback

Add integration tests for:

- Plain-language request → draft
- Missing information → user question
- Draft update
- Publish confirmation
- Payment action denial without confirmation
- Regulated-work escalation
- Model unavailable → manual fallback
- Cross-tenant tool denial

Use the mock provider in deterministic tests.

Do not make test success depend on a live LLM API.

---

# 22. Implementation order

1. Simplify navigation to five primary destinations.
2. Remove redundant dashboard sections.
3. Reduce Post Work to Describe → Review → Post.
4. Create provider-neutral model interface.
5. Create DeepSeek adapter and mock adapter.
6. Create tool interface and registry.
7. Implement read and planning tools.
8. Implement draft tools.
9. Add policy and confirmation layer.
10. Add consequential tools behind explicit confirmation.
11. Add task-focused orchestrator UI.
12. Add audit events and observability.
13. Add manual fallback.
14. Add unit and integration tests.
15. Remove obsolete UI and workflow code.

Do not implement autonomous multi-agent behavior.

Start with one orchestrator, a small allowlisted tool set, and deterministic application services.

---

# 23. Completion criteria

The refactor is complete when:

- Primary navigation contains only Home, Work, Post, Inbox, and Account.
- Home no longer contains redundant summary and quick-action panels.
- Post Work uses three user-facing stages.
- A user can create a structured Work Order draft from plain language.
- The model cannot directly mutate the database.
- Every tool call is validated and authorized server-side.
- Consequential actions require confirmation.
- Core workflows remain usable when the model is unavailable.
- Orchestration events are auditable.
- No hidden chain-of-thought is stored or displayed.
- Tests do not require a live provider.
- Typecheck, lint, tests, and production build pass.

Run:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Use the repository’s actual script names if they differ.

At completion, report:

1. UI complexity removed
2. Navigation changes
3. Post flow changes
4. Orchestrator architecture
5. Tools implemented
6. Confirmation and policy rules
7. DeepSeek adapter configuration
8. Manual fallback behavior
9. Tests added
10. Known limitations
11. Recommended next tool to implement
