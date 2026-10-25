const fs = require('fs');

try {
  let content = fs.readFileSync('src/pages/prescripteur/Dashboard.tsx', 'utf-8');

  const pieChartMatch = content.match(/(\s*\{\/\* ── LEFT COLUMN: PieChart Split-Card ── \*\/\}[\s\S]*?)(?=\s*\{\/\* ── RIGHT COLUMN: Timeline ── \*\/})/);
  const timelineMatch = content.match(/(\s*\{\/\* ── RIGHT COLUMN: Timeline ── \*\/\}[\s\S]*?)(?=\s*<\/div>\s*\{\/\* Success Modal \*\/})/);
  const tableMatch = content.match(/(\s*\{\/\* ── LEFT COLUMN: Table ── \*\/\}[\s\S]*?)(?=\s*\{\/\* ── RIGHT COLUMN: Objectif du mois ── \*\/})/);
  const objectifMatch = content.match(/(\s*\{\/\* ── RIGHT COLUMN: Objectif du mois ── \*\/\}[\s\S]*?)(?=\s*<\/div>\s*\{\/\* ═══════════ ROW 3: PIECHART & TIMELINE ═══════════ \*\/})/);

  if (!pieChartMatch || !timelineMatch || !tableMatch || !objectifMatch) {
    console.error('Regex failed to match one of the blocks.');
    process.exit(1);
  }

  let tableBlock = tableMatch[1].replace('xl:col-span-2 flex flex-col', 'flex flex-col');
  let pieChartBlock = pieChartMatch[1].replace('xl:col-span-2 flex flex-col h-full min-h-[380px]', 'flex flex-col flex-1 min-h-[380px]');
  let objectifBlock = objectifMatch[1].replace('flex flex-col h-full min-h-0', 'flex flex-col h-fit');
  let timelineBlock = timelineMatch[1].replace('flex flex-col h-full min-h-[380px]', 'flex flex-col flex-1 min-h-[380px]');

  const newLayout = `      {/* ═══════════ MAIN CONTENT GRID ═══════════ */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1">

        {/* ── LEFT COLUMN (col-span-2) ── */}
        <div className="xl:col-span-2 flex flex-col gap-6">
${tableBlock}${pieChartBlock}        </div>

        {/* ── RIGHT COLUMN (col-span-1) ── */}
        <div className="flex flex-col gap-6">
${objectifBlock}${timelineBlock}        </div>
      </div>`;

  const fullReplaceMatch = content.match(/(\s*\{\/\* ═══════════ ROW 2: TABLES & OBJECTIF ═══════════ \*\/\}[\s\S]*?)(?=\s*\{\/\* Success Modal \*\/})/);

  if (!fullReplaceMatch) {
    console.error('Full replace match failed.');
    process.exit(1);
  }

  const newContent = content.replace(fullReplaceMatch[1], '\n' + newLayout + '\n');
  fs.writeFileSync('src/pages/prescripteur/Dashboard.tsx', newContent, 'utf-8');
  console.log('Success!');
} catch (error) {
  console.error(error);
  process.exit(1);
}
