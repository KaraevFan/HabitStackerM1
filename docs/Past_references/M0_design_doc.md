# HabitStacker Design Document

## 1. Purpose

**HabitStacker** is a CLI-based Habit Designer that guides users through a consultative process to install sustainable habits. Unlike traditional habit trackers that focus on streaks and discipline, HabitStacker takes a shame-free, progressive approach where users make one decision at a time with AI-generated options tailored to their specific context.

### Core Philosophy

- **Consultative, not prescriptive**: The system proposes 2-3 options; users approve one
- **Never miss twice**: A miss triggers a Recovery Day (30-second rep), not punishment
- **No streak framing**: Uses "Reps / Last done / Continuity" language
- **Progressive disclosure**: Complexity appears only after evidence (3+ reps)
- **Time-to-first-rep**: Optimize for completing the first rep within the consult flow

### Target Outcomes

Users complete a full consult and receive a personalized 2-line habit plan:

```
Week 1: Show up.
After [anchor], [2-min action].
```

---

## 2. User Flow

### 2.1 Entry Points

Users can start HabitStacker in two modes:

```bash
# Interactive mode (default) - prompts for custom goal
python -m habitstacker consult

# Preset persona mode - for testing with predefined personas
python -m habitstacker consult --persona runner
```

### 2.2 Interactive Consult Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                       USER STARTS CONSULT                        │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 0: COLLECT USER INPUT                                       │
│                                                                  │
│ - Goal: "What habit do you want to build?"                       │
│ - Constraints: "What makes this hard for you?" (1-5 items)       │
│ - Context: "Anything about your schedule?" (optional)            │
│                                                                  │
│ Example:                                                         │
│   Goal: "become a runner"                                        │
│   Constraints: ["time-poor", "shame-prone", "mornings chaotic"]  │
│   Context: "32yo, WFH, tried Couch to 5K twice"                  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: ORIENTATION (Success Map)                                │
│                                                                  │
│ AI generates a 2-4 phase roadmap to orient the user              │
│                                                                  │
│ Output:                                                          │
│   Phase 1: "Show up" - Just put on your shoes                    │
│   Phase 2: "Build consistency" - 10-minute walks                 │
│   Phase 3: "Add challenge" - Light jogging                       │
│   Phase 4: "Graduate" - Sustainable running routine              │
│                                                                  │
│ → Auto-confirmed (no user choice required)                       │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: OUTCOME                                                  │
│                                                                  │
│ "What does success look like THIS WEEK?"                         │
│                                                                  │
│ AI presents 2-3 options:                                         │
│   [1] Show up → "Success = putting on shoes 3x"                  │
│   [2] Stay consistent → "Success = same time each day"           │
│   [3] Keep it easy → "Success = no pressure, just start"         │
│                                                                  │
│ User selects: 1, 2, 3, or writes custom response                 │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ CLASSIFICATION (Internal)                                        │
│                                                                  │
│ AI analyzes the outcome to determine flow type:                  │
│   - SETUP: One-time task (e.g., "organize closet")               │
│   - RECURRING: Daily/weekly habit (e.g., "exercise daily")       │
│   - MIXED: Requires both setup and recurring elements            │
│                                                                  │
│ → Determines which subsequent steps to run                       │
└─────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
              SETUP FLOW              RECURRING FLOW
                    │                       │
                    ▼                       ▼
┌──────────────────────────┐  ┌──────────────────────────────────┐
│ • ACTION (≤2 min)        │  │ • ANCHOR (after what routine?)   │
│ • PRIME (≤30 sec)        │  │ • CONTEXT (when & where)         │
│                          │  │ • ACTION (≤2 min)                │
│                          │  │ • PRIME (≤30 sec)                │
│                          │  │ • RECOVERY (≤30 sec)             │
└──────────────────────────┘  └──────────────────────────────────┘
                    │                       │
                    └───────────┬───────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ CONFIRM SNAPSHOT (Final Output)                                  │
│                                                                  │
│ 2-line personalized habit plan:                                  │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ Week 1: Show up.                                         │   │
│   │ After I pour my first coffee, I'll put on running shoes  │   │
│   │ and step outside for 2 minutes.                          │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│ CTA: "Start today (2 min)"                                       │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Step-by-Step User Decisions

| Step | Question | Example Options | Time Budget |
|------|----------|-----------------|-------------|
| **Outcome** | "What does progress mean this week?" | Show up / Stay consistent / Keep it easy | - |
| **Anchor** | "After what existing routine will you do this?" | After morning coffee / After brushing teeth | - |
| **Context** | "When and where will this happen?" | 6:30-7:00am, kitchen / Right after waking, bedroom | - |
| **Action** | "What's the ≤2-minute gateway action?" | Put on shoes and step outside / Open running app | ≤2 min |
| **Prime** | "What can you prep in ≤30 seconds?" | Set shoes by door / Lay out clothes tonight | ≤30 sec |
| **Recovery** | "If you miss, what's the ≤30-second minimum?" | Touch your running shoes / Look at running app | ≤30 sec |

### 2.4 User Input Handling

The system uses tolerant input parsing:

```
User can respond with:
  • "1", "2", "3"           → Select option by number
  • "Show up"               → Fuzzy match option title
  • "something else"        → Trigger custom input mode
  • [Enter]                 → Accept recommended option
  • "Why is this...?"       → Ask a question (answered briefly)
```

---

## 3. System Design

### 3.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLI INTERFACE                            │
│                       (__main__.py)                              │
│                                                                  │
│  Commands: consult | batch | batch-all | personas               │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CONSULT ORCHESTRATOR                          │
│                        (consult.py)                              │
│                                                                  │
│  • Manages consult flow state                                    │
│  • Determines flow type (SETUP/RECURRING/MIXED)                  │
│  • Handles user choices                                          │
│  • Generates final snapshot                                      │
└─────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
                ▼               ▼               ▼
┌───────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  STEP GENERATOR   │ │   VALIDATOR     │ │    LOGGER       │
│  (generator.py)   │ │ (validator.py)  │ │   (logger.py)   │
│                   │ │                 │ │                 │
│ • Builds prompts  │ │ • Schema check  │ │ • JSONL output  │
│ • Calls AI client │ │ • Forbidden     │ │ • Step events   │
│ • Returns options │ │   terms check   │ │ • Token usage   │
└───────────────────┘ │ • Time budgets  │ └─────────────────┘
        │             │ • Quality check │
        │             └─────────────────┘
        ▼
┌───────────────────────────────────────────────────────────────┐
│                      PROMPT SYSTEM                              │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │  base.py    │  │  steps.py   │  │     special.py          │ │
│  │             │  │             │  │                         │ │
│  │ System      │  │ Per-step    │  │ • Orientation prompt    │ │
│  │ instructions│  │ builders:   │  │ • Classification prompt │ │
│  │ + context   │  │ outcome,    │  │                         │ │
│  │             │  │ anchor,     │  │                         │ │
│  │             │  │ action...   │  │                         │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│                        AI CLIENT                                │
│                       (client.py)                               │
│                                                                 │
│  • OpenAI API wrapper (gpt-5-mini)                              │
│  • Structured JSON output mode                                  │
│  • Retry logic with exponential backoff                         │
│  • Token usage tracking                                         │
└───────────────────────────────────────────────────────────────┘
```

### 3.2 Directory Structure

```
src/habitstacker/
├── __init__.py              # Package initialization
├── __main__.py              # CLI entry point (Typer commands)
├── consult.py               # ConsultOrchestrator - main flow logic
│
├── types/
│   └── schema.py            # Pydantic models (StepResponse, Option, etc.)
│
├── ai/
│   └── client.py            # OpenAI API wrapper with retry logic
│
├── prompts/
│   ├── base.py              # Base prompt template + system instructions
│   ├── steps.py             # Step-specific prompt builders
│   └── special.py           # Orientation & classification prompts
│
├── steps/
│   └── generator.py         # StepGenerator - combines prompts + AI + validation
│
├── validators/
│   └── step_validator.py    # Schema, forbidden terms, time budget validation
│
├── personas/
│   └── personas.py          # 3 test personas (runner, home_upkeep, spend_control)
│
├── ui/
│   └── input_parser.py      # Tolerant user input parser
│
├── utils/
│   └── logger.py            # ConsultLogger - structured JSONL logging
│
└── analysis/
    └── __init__.py          # (placeholder for quality analysis)
```

### 3.3 Core Components

#### 3.3.1 Type System (`types/schema.py`)

All data flows through strongly-typed Pydantic models:

```python
# AI output for each consult step
class StepResponse:
    step: StepType              # OUTCOME | ANCHOR | CONTEXT | ACTION | PRIME | RECOVERY
    question: str               # Question presented to user
    options: List[Option]       # 2-3 options (validated)
    recommended_id: str         # AI's recommended choice
    needs_free_text: bool       # Whether custom input is expected
    free_text_prompt: str       # Prompt for custom input

# Single option presented to user
class Option:
    id: str                     # Unique identifier
    title: str                  # ≤6 words
    description: str            # ≤120 characters
    why: str                    # ≤200 characters

# Accumulated state across consult
class ConsultState:
    persona_name: str
    choices: List[UserChoice]   # All user decisions so far

    def get_context_summary() -> str  # For AI context
```

#### 3.3.2 AI Integration (`ai/client.py`)

```python
class AIClient:
    model: str = "gpt-5-mini"

    def generate_structured(
        prompt: str,
        response_format: Dict,      # JSON schema
        temperature: float = 0.7
    ) -> Dict:
        """
        Calls OpenAI with structured output mode.
        Guarantees response matches JSON schema.
        Includes retry logic with exponential backoff.
        """
```

#### 3.3.3 Prompt Engineering (`prompts/`)

**Base Prompt** (`base.py`):
- System instructions (product laws, tone, forbidden terms)
- Persona context injection
- Emotional constraint detection
- Current state summary

**Step Prompts** (`steps.py`):
- Each step has specialized prompt builder
- Includes examples of good/bad options
- Enforces time budgets in descriptions

```python
def build_action_prompt(persona, state) -> str:
    """
    Builds prompt for ACTION step.
    - Context: outcome, anchor, context choices
    - Constraint: Must be ≤2 minutes
    - Must mention time budget in description
    """
```

#### 3.3.4 Validation Pipeline (`validators/step_validator.py`)

```
AI Response
    │
    ▼
┌─────────────────────┐
│ 1. Schema Validation │ ← Pydantic parsing
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│ 2. Step Type Match   │ ← Response step = expected step
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│ 3. Forbidden Terms   │ ← "streak", "failure", "discipline", "lazy", "shame"
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│ 4. Time Budgets      │ ← ACTION ≤2min, PRIME ≤30sec, RECOVERY ≤30sec
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│ 5. Quality Checks    │ ← Generic language, duplicates (warnings)
└─────────────────────┘
    │
    ▼
Validated StepResponse
```

#### 3.3.5 Consult Orchestrator (`consult.py`)

The central coordinator that manages the entire flow:

```python
class ConsultOrchestrator:
    def run_consult(persona, mode, on_step_complete) -> Dict:
        """
        1. Generate orientation (auto-confirm)
        2. Generate outcome → user choice
        3. Classify outcome → determine flow
        4. Run flow steps:
           SETUP:     [ACTION, PRIME]
           RECURRING: [ANCHOR, CONTEXT, ACTION, PRIME, RECOVERY]
           MIXED:     SETUP + RECURRING
        5. Generate snapshot
        6. Return complete results
        """
```

Flow determination:

```python
SETUP_FLOW = [StepType.ACTION, StepType.PRIME]
RECURRING_FLOW = [StepType.ANCHOR, StepType.CONTEXT,
                  StepType.ACTION, StepType.PRIME, StepType.RECOVERY]
```

#### 3.3.6 Logging System (`utils/logger.py`)

Structured JSONL output for analysis:

```json
{"event": "run_start", "timestamp": "...", "persona": "runner"}
{"event": "step_complete", "step": "OUTCOME", "response": {...}, "choice": {...}}
{"event": "step_complete", "step": "ANCHOR", "response": {...}, "choice": {...}}
{"event": "classification", "classification": "recurring", "confidence": 0.95}
{"event": "snapshot_generated", "snapshot": "Week 1: Show up.\nAfter..."}
{"event": "run_end", "duration_seconds": 45, "token_usage": {...}, "success": true}
```

### 3.4 Data Flow

```
User Input (goal, constraints, context)
         │
         ▼
    ┌─────────┐
    │ Persona │ ← Built from user input or loaded from presets
    └─────────┘
         │
         ▼
    ┌─────────────────┐
    │ StepGenerator   │
    │                 │
    │ build_prompt()  │ ← Combines base + step-specific + persona
    │       │         │
    │       ▼         │
    │ AIClient.call() │ ← OpenAI structured output
    │       │         │
    │       ▼         │
    │ Validator()     │ ← Schema + rules + quality
    └─────────────────┘
         │
         ▼
    ┌─────────────┐
    │StepResponse │ ← 2-3 options with recommended_id
    └─────────────┘
         │
         ▼
    ┌─────────────┐
    │ User Choice │ ← Interactive selection or auto-recommend
    └─────────────┘
         │
         ▼
    ┌──────────────┐
    │ ConsultState │ ← Accumulates all choices
    └──────────────┘
         │
         ▼ (repeat for each step)
         │
         ▼
    ┌──────────────┐
    │   Snapshot   │ ← 2-line habit plan
    └──────────────┘
         │
         ▼
    ┌──────────────┐
    │  JSONL Log   │ ← All events logged for analysis
    └──────────────┘
```

### 3.5 Product Constraints (Enforced in Code)

| Constraint | Enforcement Location |
|------------|---------------------|
| 2-3 options per step | `StepResponse` Pydantic validator |
| Title ≤6 words | `Option` Pydantic validator |
| Description ≤120 chars | `Option` Pydantic validator |
| Forbidden terms | `StepValidator._check_forbidden_terms()` |
| ACTION ≤2 min | `StepValidator._check_time_budgets()` |
| PRIME ≤30 sec | `StepValidator._check_time_budgets()` |
| RECOVERY ≤30 sec | `StepValidator._check_time_budgets()` |
| Emotional safety | `has_emotional_constraints()` → softer prompts |

### 3.6 Extension Points

The architecture supports future phases:

1. **Quality Analysis** (`analysis/`) - Evaluate AI output quality metrics
2. **Prompt Tuning** - Iterate on prompt templates based on logged results
3. **Multi-habit Support** - Extend `ConsultState` to track multiple habits
4. **Weekly Review** - Add new flow after habit installation
5. **Persistence Layer** - Replace in-memory state with database

---

## 4. Test Personas

Three pre-built personas for testing AI quality:

| Persona | Goal | Key Constraints |
|---------|------|-----------------|
| **runner** | "become a runner" | time-poor, shame-prone, morning unreliable |
| **home_upkeep** | "keep apartment tidy" | hates big cleaning, needs 2-min resets |
| **spend_control** | "stop impulse buys" | needs cue interruption, one-click danger |

---

## 5. Current Status

**Completed:**
- Phases 1-4 (Foundation, AI Integration, Personas, CLI)
- Interactive input mode
- Preset persona testing
- Structured logging

**Next Steps:**
- Phase 5: Quality evaluation (analyzer, human checklist, acceptance tests)
- Phase 6: Prompt tuning based on logged results
- Phase 7: Final validation and packaging

---

## Appendix: Key Files Reference

| File | Purpose |
|------|---------|
| `__main__.py:1-200` | CLI commands (consult, batch, personas) |
| `consult.py:1-300` | Flow orchestration logic |
| `types/schema.py:1-150` | All Pydantic models |
| `ai/client.py:1-100` | OpenAI wrapper with retries |
| `prompts/steps.py:1-200` | Per-step prompt builders |
| `validators/step_validator.py:1-150` | Validation pipeline |
| `ui/input_parser.py:1-100` | Tolerant input handling |
