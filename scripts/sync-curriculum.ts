import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const FILES = [
  { lang: 'fr', file: 'curriculum_french.md' },
  { lang: 'en', file: 'curriculum_english.md' },
];

function sync() {
  for (const item of FILES) {
    const filePath = path.join(ROOT, item.file);
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${item.file}`);
      continue;
    }

    const md = fs.readFileSync(filePath, 'utf-8');
    const lines = md.split('\n');
    
    let currentLevel = 'A1';
    let currentTheme = '';
    const lessons: any[] = [];

    for (let line of lines) {
      line = line.trimEnd();
      // Extract Level from Headings (e.g., ## Módulo A1: ...)
      const levelMatch = line.match(/## Módulo (A1|A2|B1|B2|C1|C2)/i);
      if (levelMatch) {
        currentLevel = levelMatch[1].toUpperCase();
        continue;
      }

      // Extract Theme from h3 Headings (e.g., ### Fonética e Sons)
      const themeMatch = line.match(/^###\s+(.+)$/);
      if (themeMatch) {
        currentTheme = themeMatch[1].trim();
        continue;
      }

      // Extract Lesson from numbered lines (e.g., 1. [TAG] Title)
      // Updated regex to handle IDs correctly
      const lessonMatch = line.match(/^(\d+)\.\s*\[(GRAM|VOC|DIAL|MISS|PRON|VERB|EXPR|CULT)\]\s*(.+)/i);
      if (lessonMatch) {
        const num = lessonMatch[1];
        const tag = lessonMatch[2].toUpperCase();
        const rawTitle = lessonMatch[3].trim();
        
        let uiTitle = undefined;
        let grammarFocus = rawTitle;
        
        if (rawTitle.includes(' | Contexto IA: ')) {
          const parts = rawTitle.split(' | Contexto IA: ');
          uiTitle = parts[0].trim();
          grammarFocus = parts[1].trim();
        }
        
        // Generate unique ID based on language, level and number
        const id = `${item.lang}-${currentLevel.toLowerCase()}-${num.padStart(3, '0')}`;
        
        lessons.push({
          id,
          language: item.lang,
          level: currentLevel,
          tag,
          ...(uiTitle && { uiTitle }),
          grammarFocus,
          theme: currentTheme,
        });
      }
    }

    const tsContent = `import type { LessonDefinition } from "@/types";

export const ${item.lang === 'fr' ? 'FRENCH_LESSONS' : 'ENGLISH_LESSONS'}: LessonDefinition[] = ${JSON.stringify(lessons, null, 2)};
`;

    const outPath = path.join(ROOT, 'lib', 'curriculum', `${item.lang === 'fr' ? 'french' : 'english'}.ts`);
    fs.writeFileSync(outPath, tsContent);
    console.log(`Synced ${lessons.length} lessons for ${item.lang} -> ${outPath}`);
  }
}

sync();
