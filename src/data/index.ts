import type {
  AptitudeSet,
  TechnicalMcqSet,
  CodingSet,
  SqlSet,
  FullMockSet,
  InterviewQA,
  VersantDrill,
  ConceptDiagram,
  ResourceLink,
} from '../types/prep';

import apt1 from './aptitude/set-1.json';
import apt2 from './aptitude/set-2.json';
import apt3 from './aptitude/set-3.json';
import apt4 from './aptitude/set-4.json';
import apt5 from './aptitude/set-5.json';
import apt6 from './aptitude/set-6.json';
import apt7 from './aptitude/set-7.json';
import apt8 from './aptitude/set-8.json';

import tech1 from './technical/set-1.json';
import tech2 from './technical/set-2.json';
import tech3 from './technical/set-3.json';
import tech4 from './technical/set-4.json';
import tech5 from './technical/set-5.json';
import tech6 from './technical/set-6.json';
import tech7 from './technical/set-7.json';
import tech8 from './technical/set-8.json';

import code1 from './coding/set-1.json';
import code2 from './coding/set-2.json';
import code3 from './coding/set-3.json';
import code4 from './coding/set-4.json';
import code5 from './coding/set-5.json';
import code6 from './coding/set-6.json';
import code7 from './coding/set-7.json';
import code8 from './coding/set-8.json';
import code9 from './coding/set-9.json';
import code10 from './coding/set-10.json';
import code11 from './coding/set-11.json';
import code12 from './coding/set-12.json';

import sql1 from './sql/set-1.json';
import sql2 from './sql/set-2.json';
import sql3 from './sql/set-3.json';
import sql4 from './sql/set-4.json';
import sql5 from './sql/set-5.json';
import sql6 from './sql/set-6.json';
import sql7 from './sql/set-7.json';
import sql8 from './sql/set-8.json';

import mock1 from './mocks/mock-1.json';
import mock2 from './mocks/mock-2.json';
import mock3 from './mocks/mock-3.json';
import mock4 from './mocks/mock-4.json';
import mock5 from './mocks/mock-5.json';

import technicalQA from './interview/technical.json';
import hrQA from './interview/hr.json';
import versantDrills from './versant/drills.json';
import conceptDiagrams from './concepts/diagrams.json';
import resourcesData from './resources.json';

export const APTITUDE_SETS: AptitudeSet[] = [
  apt1,
  apt2,
  apt3,
  apt4,
  apt5,
  apt6,
  apt7,
  apt8,
] as AptitudeSet[];

export const TECHNICAL_SETS: TechnicalMcqSet[] = [
  tech1,
  tech2,
  tech3,
  tech4,
  tech5,
  tech6,
  tech7,
  tech8,
] as TechnicalMcqSet[];

export const CODING_SETS: CodingSet[] = [
  code1,
  code2,
  code3,
  code4,
  code5,
  code6,
  code7,
  code8,
  code9,
  code10,
  code11,
  code12,
] as CodingSet[];

export const SQL_SETS: SqlSet[] = [
  sql1,
  sql2,
  sql3,
  sql4,
  sql5,
  sql6,
  sql7,
  sql8,
] as SqlSet[];

export const FULL_MOCKS: FullMockSet[] = [
  mock1,
  mock2,
  mock3,
  mock4,
  mock5,
] as FullMockSet[];

export const TECHNICAL_INTERVIEW_QA: InterviewQA[] = technicalQA as InterviewQA[];
export const HR_INTERVIEW_QA: InterviewQA[] = hrQA as InterviewQA[];
export const VERSANT_DRILLS: VersantDrill[] = versantDrills as VersantDrill[];
export const CONCEPT_DIAGRAMS: ConceptDiagram[] = conceptDiagrams as ConceptDiagram[];
export const RESOURCE_LINKS: ResourceLink[] = resourcesData as ResourceLink[];
