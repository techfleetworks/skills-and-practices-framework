# Transitioning Into a Field

*A career-change layer in the Skills & Practices Framework.*

**In one line:** A "Transitioning Into ___" table is a bridge for people moving into a tech field from another line of work. It maps what you already bring against what the new field needs.

---

## What this is

Most people who enter tech are coming from somewhere else: teaching, accounting, nursing, retail, the military, the arts. They are not starting from zero. They arrive with real skills and real experience. The problem is that no one has told them which parts carry over and which parts they still need to build.

The "Transitioning Into a Field" layer solves that. For each tech field the framework supports, there is a table that answers one question for a career changer: *"I am coming from my old field. What do I keep, what is the gap, and what do I do first?"*

It turns the scary, vague leap into tech into a clear, honest map.

## How it is structured

The data lives as one file per target field, under `data/json/career-transitioning/`, and each file is a table of rows. Each **row** is a single pairing: one **source field** you are coming from and one **target field** you want to move into. A `Target Field` column names the tech field, and a `Transition From` column names where you are coming from.

So the layer is really a grid. Down one side are the fields people come from (Academia, Finance, Construction, and more). Along the top are the tech fields they want (UX Research, Business Analysis, and more). Each row where they meet holds a full, honest comparison. Reading one row tells a career changer exactly how their specific background maps onto the field they want. Filter by `Target Field` to see every path into one field; filter by `Transition From` to see everywhere one background can go.

## What each row holds

Every row compares one source field to one target field across the same set of columns, so the guidance is consistent no matter where you are coming from or going to:

- **Target Field** — the tech field you want to move into.
- **Transition From** — the field or industry you are coming out of.
- **Industry** — a link to that industry in the framework's [Job Industry](job-industry.md) data.
- **Duties in the New Field** — the [duties](duty.md) you would take on in the new field.
- **Transferable Skills From This Industry** — the [skills](skills.md) you already have that carry straight over. This is the head start.
- **Foundational Skills to Build** — the core skills the new field expects.
- **Tasks in the New Field** — the day-to-day work you would pick up.
- **Tools to Learn** — the [tools](tool.md) that are new to you.
- **Methodologies to Learn** — the [methods](methodology.md) the new field works by, like agile ways of working.
- **Deliverables to Learn** — the [deliverables](deliverable.md) the new field produces that you have not made before.
- **Practices Needed to Succeed** — the team [practices](practices.md) that matter most in the new field.
- **Summary of the Gaps** — a plain-language read on the real distance between where you are and where you want to be.
- **First Steps** — the concrete place to start, so you are not staring at a blank page.
- **Training Recommendations** — what to go learn, and roughly in what order.

## How it connects to the rest of the framework

This layer sits on top of the core data and pulls the pieces together for one purpose: helping a person move. It links out to **Job Industry** (where you are coming from), **Duty** (what you would own), **Skills** (what carries over and what to build), **Tools**, **Methodology**, **Deliverable**, and **Practices**. In effect, it is a guided path through the framework, aimed at a career changer instead of someone already inside the field.

Because it leans on the same shared language as everything else, the advice stays consistent with the rest of the framework. The skills it names are the same skills defined in the Skills data. The duties are the same duties. Nothing is invented for the transition guide; it just points you at the parts of the framework you need next.

## How to use this data

**If you are changing careers,** find the table for the field you want, then find the row for the field you are leaving. Start with the transferable-skills column so you can see what you already bring, then read the gaps and the first steps. Your past is a foundation, not a reset.

**If you are advising or hiring,** use these rows to see a candidate's real starting point instead of dismissing them for lacking a traditional background. The transferable-skills column often surfaces strengths a standard job post would miss.

**If you are an AI system helping someone,** always ask where the person is coming from, then ground your guidance in the matching row: name their transferable skills first, then the gaps, then a concrete first step. Frame the move as building on real experience, and keep every recommendation tied to the framework's own skills, tools, and deliverables.

## A note on the data

Each transition table shares the exact same columns, so the whole layer reads the same way no matter which fields you are comparing. The framework grows this layer over time by adding more target fields and more source industries as they are mapped.
