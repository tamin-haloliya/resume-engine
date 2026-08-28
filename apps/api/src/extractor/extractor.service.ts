import { Injectable } from '@nestjs/common';
import { escapeRegex } from './utils/escape-regex';
import { SKILL_DICTIONARY } from './skills-dictionary';

@Injectable()
export class ExtractorService {
  extractSkill(rawText: string): string[] {
    return SKILL_DICTIONARY.filter((skill) => {
      const pattern = new RegExp(`\\b${escapeRegex(skill)}\\b`, 'i');
      return pattern.test(rawText);
    });
  }
}
