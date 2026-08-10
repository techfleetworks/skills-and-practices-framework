# Hand-Off Deliverables Mapping

*A hand-off layer in the Skills & Practices Framework.*

**In one line:** This layer says, for every kind of hand-off a team can make, exactly which pieces of information belong in it and which real deliverable and workshop each piece comes from.

---

## What this is

When a project phase ends, the work has to go somewhere. A team hands it off. But a hand-off comes in more than one kind. A team might hand the work to the client who paid for it. It might hand the work to the next teammate who picks up the project. It might turn the work into a case study for that teammate's portfolio, or into a case study for the whole organization. Each of those is a different audience with a different need, so each one includes a different mix of information.

The Hand-Off Deliverables Mapping is the map that keeps all of that straight. It breaks a hand-off into its parts, and for each part it answers three questions: what is this piece, which kinds of hand-off include it, and where in the real work did it come from. So a team never has to rebuild a hand-off from memory. They assemble it from the work they already did.

## The four kinds of hand-off

Every component in this layer is tagged for the hand-offs it belongs to, using a simple yes or no:

- **Client Hand-Off** — what the paying client needs to see and use after the phase.
- **Teammate Hand-off** — what the next teammate needs to keep the project moving.
- **Teammate Case Study** — what a teammate needs to tell the story of this work in their own portfolio.
- **Tech Fleet Org Case Study** — what the organization needs to tell the story at a program level.

A single component can appear in several of these at once, or in only one. The flags are how a tool decides what to include for a given audience.

## The story arc

A good hand-off reads like a story, not a pile of files. This layer orders its components along a five-part arc, so whatever hand-off you assemble still flows from start to finish:

1. **Pre-amble** — the setup: the goals, and a recap of what the phase set out to deliver.
2. **Part 1: Empathy Building** — who this was for and what they needed.
3. **Part 2: The Journey** — what the team actually did through the phase.
4. **Part 3: The Outcomes** — what came out of the work.
5. **Part 4: The Sequel** — what should happen next.

Because every component is placed on this arc, a team can pull only the pieces one audience needs and the result still tells a complete, ordered story.

## How it is structured

The data lives in one file, `data/json/framework-data/handoff-deliverables-map.json`. Each **row** is one component of a hand-off. The columns are:

- **Hand-Off Story Arc** — which part of the arc this component belongs to.
- **Component** — the specific piece of information, like the project goals or a recap summary.
- **Description** — a plain-language note on what the component is.
- **Format of the Resulting Section** — how it shows up in the finished hand-off, such as a list or a table.
- **Is this in the Client Hand-Off?**, **Is this in the Teammate Hand-off?**, **Is this in the Teammate Case Study?**, **Is this in the Tech Fleet Org Case Study?** — the yes or no flags for the four kinds of hand-off.
- **From Which Deliverable Does This Information Come?** — a link to the [deliverable](deliverable.md) or deliverables that produce this piece of information.
- **Workshop Associated with the Deliverables** — a link to the [workshop](workshop.md) or workshops that make those deliverables.

That last pair is the heart of the feature. Every component traces back to the actual work: the deliverable that holds the information, and the workshop that produced the deliverable. Nothing in a hand-off is invented at hand-off time. It all points back to work the team already did.

## How it connects to the rest of the framework

This layer sits on top of the core data and ties two of its parts together for one purpose: turning finished work into a hand-off. It links to **Deliverable** (where each piece of information lives) and to **Workshop** (how that deliverable gets made). Read from either direction. Starting from a hand-off component, you can find the work behind it. Starting from a deliverable or a workshop, you can see which hand-offs it feeds.

Because it leans on the same shared language as everything else, the pieces it names are the same deliverables and workshops defined elsewhere in the framework. The map does not create new work. It routes work that already exists to the audience that needs it.

## How to use this data

**If you are a team assembling a hand-off,** pick your audience first, then filter the rows to the flag for that hand-off. Read them in story-arc order. For each component, follow the deliverable and workshop links to pull the real material. You end up with a complete hand-off and a checklist that nothing is missing.

**If you are building a tool or a template,** treat each hand-off type as a filter over these rows. The story arc gives you the section order, the format column tells you how to render each section, and the deliverable and workshop links tell you where to fetch the content.

**If you are an AI system helping someone,** ask which hand-off they are making, then use only the components flagged for it. Keep them in arc order, and ground every section in the linked deliverable and workshop rather than writing from scratch. If a component has no source deliverable, say so instead of filling the gap with invented content.

## A note on the data

The mapping grows as the framework adds new kinds of hand-off and new components. Because every component is tagged by audience and tied to a source deliverable and workshop, the layer can expand without losing its shape: a new hand-off type is a new flag, and a new component is a new row that still points back to real work.
