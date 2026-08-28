import { Injectable } from '@nestjs/common';
import { escapeRegex } from './utils/escape-regex';

@Injectable()
export class ExtractorService {
  extractSkill(rawText: string, dict: string[]): string[] {
    return dict.filter((skill) => {
      const pattern = new RegExp(`\\b${escapeRegex(skill)}\\b`, 'i');
      return pattern.test(rawText);
    });
  }
}
