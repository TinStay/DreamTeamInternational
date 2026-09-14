"use client";

import type { ComponentType } from "react";
import type { Project, ProjectKey } from "@/lib/projects";
import { BoleronStory } from "./story/boleron-story";
import { EmblemaStory } from "./story/emblema-story";
import { OsmoStory } from "./story/osmo-story";
import { PlasicoStory } from "./story/plasico-story";

/**
 * The projects with a long-form case study ("story") on `/projects/[slug]` -
 * each its own brand world built from the shared kit in `./story/primitives`
 * (copy in `projects.stories.<id>`, non-copy media in `Project.story`).
 * Everything else gets the generic case study (`ProjectCaseStudyDefault`).
 */
export const PROJECT_STORIES: Partial<Record<ProjectKey, ComponentType<{ project: Project }>>> = {
  emblema: EmblemaStory,
  osmo: OsmoStory,
  boleron: BoleronStory,
  plasico: PlasicoStory,
};
