import { z } from 'zod'
import profileData from './profile.json'
import projectData from './projects.json'
import experienceData from './experience.json'
import educationData from './education.json'
import skillData from './skills.json'
import leadershipData from './leadership.json'
import relationshipData from './relationships.json'
import siteData from './site.json'
import layoutData from './layout.json'
import {
  profileSchema,
  projectSchema,
  experienceSchema,
  educationSchema,
  skillSchema,
  leadershipSchema,
  relationshipSchema,
  siteSchema,
  positionSchema,
} from './schema'

function validate<T>(file: string, schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success)
    throw new Error(
      `Invalid content in ${file}:\n${result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n')}`,
    )
  return result.data
}

export const content = {
  profile: validate('profile.json', profileSchema, profileData),
  projects: validate('projects.json', z.array(projectSchema), projectData),
  experience: validate('experience.json', z.array(experienceSchema), experienceData),
  education: validate('education.json', z.array(educationSchema), educationData),
  skills: validate('skills.json', z.array(skillSchema), skillData),
  leadership: validate('leadership.json', z.array(leadershipSchema), leadershipData),
  relationships: validate(
    'relationships.json',
    z.array(relationshipSchema),
    relationshipData,
  ),
  site: validate('site.json', siteSchema, siteData),
  layout: validate('layout.json', z.record(z.string(), positionSchema), layoutData),
}
