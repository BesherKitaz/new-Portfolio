import { z } from 'zod'
const id = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use a lowercase, hyphenated stable ID')
const url = z.string().url()
const strings = z.array(z.string())
const dates = {
  start: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  end: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
    .nullable(),
}

export const projectSchema = z.object({
  id,
  title: z.string().min(1),
  summary: z.string(),
  description: z.string(),
  featured: z.boolean(),
  technologies: z.array(id),
  highlights: strings,
  screenshots: z.array(z.object({ src: z.string(), alt: z.string().min(1) })),
  thumbnail: z.string().nullable(),
  githubUrl: url.nullable(),
  liveUrl: url.nullable(),
  status: z.enum(['completed', 'in-progress', 'archived']),
  caseStudy: z.object({
    problem: z.string(),
    solution: z.string(),
    decisions: strings,
    contributions: strings,
    impact: strings,
  }),
})

export const experienceSchema = z.object({
  id,
  title: z.string().min(1),
  organization: z.string().min(1),
  kind: z.enum(['professional', 'internship', 'research', 'teaching']),
  ...dates,
  summary: z.string(),
  highlights: strings,
  technologies: z.array(id),
  projectIds: z.array(id),
  url: url.nullable(),
})

export const educationSchema = z.object({
  id,
  institution: z.string().min(1),
  degree: z.string(),
  ...dates,
  summary: z.string(),
  achievements: strings,
  coursework: strings,
})

export const leadershipSchema = z.object({
  id,
  title: z.string().min(1),
  organization: z.string().nullable(),
  ...dates,
  summary: z.string(),
  highlights: strings,
  technologies: z.array(id),
  url: url.nullable(),
})

export const skillSchema = z.object({
  id,
  name: z.string().min(1),
  group: z.string().min(1),
  description: z.string(),
})
const extra = z.object({
  id,
  title: z.string().min(1),
  summary: z.string(),
  url: url.nullable(),
})

export const profileSchema = z.object({
  id,
  name: z.string().min(1),
  role: z.string(),
  motto: z.string(),
  intro: z.string(),
  bio: z.string(),
  email: z.string().email(),
  photo: z.string().nullable(),
  resumeUrl: z.string().startsWith('/assets/resume/'),
  socials: z.array(z.object({ label: z.string(), url })),
  researchInterests: strings,
  publications: z.array(extra),
  testimonials: z.array(extra),
  writing: z.array(extra),
})

export const positionSchema = z.tuple([z.number(), z.number(), z.number()])

export const siteSchema = z.object({
  title: z.string(),
  description: z.string(),
  eyebrow: z.string(),
  categoryLabel: z.string(),
  categories: z.array(
    z.object({
      id,
      label: z.string(),
      color: z.string().regex(/^#[0-9a-f]{6}$/i),
      position: positionSchema,
    }),
  ),
  motionDuration: z.number().min(0).max(5),
  featuredLabel: z.string(),
  footer: z.string(),
  events: z.array(extra),
})

export const relationshipSchema = z.object({
  source: z.string(),
  target: z.string(),
  type: z.string(),
  weight: z.number().positive().optional(),
})

export interface Project extends z.infer<typeof projectSchema> {}

export interface Experience extends z.infer<typeof experienceSchema> {}

export interface Education extends z.infer<typeof educationSchema> {}

export interface Leadership extends z.infer<typeof leadershipSchema> {}

export interface Skill extends z.infer<typeof skillSchema> {}

export interface Profile extends z.infer<typeof profileSchema> {}

export type Position = z.infer<typeof positionSchema>
