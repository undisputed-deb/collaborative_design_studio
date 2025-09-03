export type TemplateInfo = { slug: string; title: string; description: string };

export const TEMPLATE_LIST: TemplateInfo[] = [
  { slug: 'brainstorm', title: 'Brainstorming', description: 'Sticky-notes style idea clusters' },
  { slug: 'flowchart', title: 'Flowchart', description: 'Simple process flow' },
  { slug: 'weekly-plan', title: 'Weekly Planning', description: 'Plan your week in columns' },
  { slug: 'kanban', title: 'Kanban', description: 'To Do / Doing / Done' },
  { slug: 'mind-map', title: 'Mind Map', description: 'Central idea with branches' },
  { slug: 'roadmap', title: 'Roadmap', description: 'Quarterly timeline lanes' },
  { slug: 'retrospective', title: 'Retrospective', description: 'Keep / Stop / Start' },
  { slug: 'sprint-plan', title: 'Sprint Planning', description: 'Scope your sprint' },
  { slug: 'journey', title: 'User Journey', description: 'Stages and touchpoints' },
];

// Minimal starter shapes for each template.
// NOTE: Shapes schema mirrors StudioCanvas expectations but kept as unknown for server.
export function getTemplatePreset(slug: string): { title: string; shapes: unknown[] } | null {
  const find = TEMPLATE_LIST.find((t) => t.slug === slug);
  const title = find?.title || 'Board';

  const box = (x: number, y: number, w: number, h: number, color = '#ffffff') => ({ id: `${Math.random().toString(36).slice(2,9)}`, type: 'rect', x, y, w, h, color });
  const text = (x: number, y: number, textStr: string, color = '#ffffff') => ({ id: `${Math.random().toString(36).slice(2,9)}`, type: 'text', x, y, text: textStr, fontSize: 18, color });

  switch (slug) {
    case 'brainstorm': {
      const shapes = [
        text(1400, 200, 'Brainstorm') ,
        box(1200, 260, 200, 120, '#91f2ff'), text(1220, 330, 'Idea 1'),
        box(1450, 420, 220, 120, '#ffd18c'), text(1470, 490, 'Idea 2'),
        box(1000, 540, 220, 120, '#b0ffa6'), text(1020, 610, 'Idea 3'),
      ];
      return { title, shapes };
    }
    case 'flowchart': {
      const shapes = [
        text(1200, 180, 'Flowchart'),
        box(1160, 240, 220, 100, '#91f2ff'), text(1180, 300, 'Start'),
        box(1160, 380, 220, 100, '#ffd18c'), text(1180, 440, 'Step 1'),
        box(1160, 520, 220, 100, '#ffd18c'), text(1180, 580, 'Step 2'),
        box(1160, 660, 220, 100, '#b0ffa6'), text(1180, 720, 'End'),
      ];
      return { title, shapes };
    }
    case 'weekly-plan': {
      const shapes: unknown[] = [text(1100, 160, 'Weekly Plan')];
      const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
      days.forEach((d, i) => {
        shapes.push(box(800 + i*180, 220, 160, 520, '#ffffff'));
        shapes.push(text(810 + i*180, 240, d));
      });
      return { title, shapes };
    }
    case 'kanban': {
      const shapes: unknown[] = [text(1000, 160, 'Kanban')];
      const cols = ['To Do','Doing','Done'];
      cols.forEach((c, i) => {
        shapes.push(box(900 + i*360, 220, 320, 520, '#ffffff'));
        shapes.push(text(920 + i*360, 240, c));
      });
      return { title, shapes };
    }
    case 'mind-map': {
      const shapes = [
        box(1300, 400, 260, 120, '#91f2ff'), text(1340, 470, 'Central Idea'),
        box(980, 260, 220, 100, '#ffd18c'), text(1000, 320, 'Branch A'),
        box(980, 600, 220, 100, '#ffd18c'), text(1000, 660, 'Branch B'),
        box(1650, 260, 220, 100, '#ffd18c'), text(1670, 320, 'Branch C'),
        box(1650, 600, 220, 100, '#ffd18c'), text(1670, 660, 'Branch D'),
      ];
      return { title, shapes };
    }
    case 'roadmap': {
      const shapes: unknown[] = [text(1120, 160, 'Roadmap')];
      const quarters = ['Q1','Q2','Q3','Q4'];
      quarters.forEach((q, i) => {
        shapes.push(text(900, 240 + i*140, q));
        shapes.push(box(960, 220 + i*140, 800, 60, ['#91f2ff','#ffd18c','#b0ffa6','#ff9ecd'][i % 4]));
      });
      return { title, shapes };
    }
    case 'retrospective': {
      const shapes = [
        text(1040, 160, 'Retro'),
        box(900, 220, 360, 520, '#ffffff'), text(920, 240, 'Keep') ,
        box(1280, 220, 360, 520, '#ffffff'), text(1300, 240, 'Stop'),
        box(1660, 220, 360, 520, '#ffffff'), text(1680, 240, 'Start'),
      ];
      return { title, shapes };
    }
    case 'sprint-plan': {
      const shapes = [
        text(1040, 160, 'Sprint Planning'),
        box(880, 220, 520, 240, '#91f2ff'), text(900, 240, 'Backlog'),
        box(880, 480, 520, 260, '#ffd18c'), text(900, 500, 'Scope'),
        box(1420, 220, 520, 520, '#b0ffa6'), text(1440, 240, 'Tasks'),
      ];
      return { title, shapes };
    }
    case 'journey': {
      const shapes: unknown[] = [text(1080, 160, 'User Journey')];
      const stages = ['Awareness','Consideration','Decision','Retention'];
      stages.forEach((s, i) => {
        shapes.push(box(860 + i*320, 220, 300, 520, '#ffffff'));
        shapes.push(text(880 + i*320, 240, s));
      });
      return { title, shapes };
    }
    default:
      return null;
  }
}
