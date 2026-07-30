const fs = require('fs');

let content = fs.readFileSync('app/projects/[id]/schedule/page.tsx', 'utf8');

// Replace imports
content = content.replace("import React, { useState, useEffect, use } from 'react';", `import React, { useState, useEffect, use } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  DragOverlay
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';`);

// Add sort_order to interface
content = content.replace("status: 'PENDING' | 'IN_PROGRESS' | 'DONE';", "status: 'PENDING' | 'IN_PROGRESS' | 'DONE';\n  sort_order: number;");

// Create SortableRow component at the bottom of the file
const sortableRowCode = `
// --- Subcomponents for Drag & Drop ---
function DroppableDayButton({ dateString, isSelected, hasTasks, allDone, day, onClick }: any) {
  const { isOver, setNodeRef } = useDroppable({ id: dateString });
  return (
    <button
      ref={setNodeRef}
      onClick={onClick}
      className={\`h-10 rounded-xl flex flex-col items-center justify-center relative transition-all active:scale-95 \${
        isOver
          ? 'bg-emerald-500/20 ring-2 ring-emerald-500 text-emerald-400'
          : isSelected
          ? 'bg-[#0056B3] text-white shadow-[0_0_15px_rgba(0,86,179,0.5)]'
          : 'hover:bg-white/5 text-zinc-400 hover:text-white'
      }\`}
    >
      <span className="text-sm font-black font-['Urbanist'] tabular-nums">{day}</span>
      {hasTasks && (
        <div className={\`absolute bottom-1.5 w-1 h-1 rounded-full \${isSelected ? 'bg-white' : allDone ? 'bg-emerald-500' : 'bg-[#4da3ff]'}\`}></div>
      )}
    </button>
  );
}

function SortableScheduleRow({ item, editMode, handleFieldChange, removeItem, cycleStatus, getStatusLabel }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 10 : 1,
    position: isDragging ? 'relative' : 'static',
  };

  return (
    <div
      ref={setNodeRef}
      style={style as any}
      className={\`group flex px-4 py-3 items-center transition-all hover:bg-white/[0.03] border-b border-white/[0.04] last:border-b-0 \${item.status === 'DONE' && !editMode ? 'opacity-40' : ''}\`}
    >
      {editMode && (
        <div {...attributes} {...listeners} className="shrink-0 w-6 h-6 mr-3 flex items-center justify-center text-zinc-600 hover:text-white cursor-grab active:cursor-grabbing rounded">
          <i className="fa-solid fa-grip-vertical"></i>
        </div>
      )}
      <div className="flex-1 grid grid-cols-[130px_1.5fr_1fr_100px_100px_110px] gap-0 items-center">
        {/* Time */}
        <div className="shrink-0">
          {editMode ? (
            <input type="text" defaultValue={item.time} onBlur={e => handleFieldChange(item.id, 'time', e.target.value)}
              className="bg-transparent border-b border-white/10 text-xs font-black text-[#4da3ff] outline-none py-0.5 focus:border-[#0056B3] w-full" placeholder="09:00 - 10:00" />
          ) : (
            <span className="text-sm font-black text-[#4da3ff] font-['Urbanist'] tabular-nums tracking-tight whitespace-nowrap">{item.time || '—'}</span>
          )}
        </div>

        {/* Task */}
        <div className="min-w-0 pr-3">
          {editMode ? (
            <input type="text" defaultValue={item.title} onBlur={e => handleFieldChange(item.id, 'title', e.target.value)}
              className="bg-transparent border-b border-white/10 text-xs font-black text-white outline-none py-0.5 focus:border-[#0056B3] w-full" placeholder="Task Name" />
          ) : (
            <span className="text-xs font-black text-white tracking-tight truncate block">{item.title || '—'}</span>
          )}
        </div>

        {/* Note */}
        <div className="min-w-0 pr-3">
          {editMode ? (
            <input type="text" defaultValue={item.note} onBlur={e => handleFieldChange(item.id, 'note', e.target.value)}
              className="bg-transparent border-b border-white/10 text-xs text-zinc-400 outline-none py-0.5 focus:border-[#0056B3] w-full" placeholder="Remarks..." />
          ) : (
            <span className="text-xs text-zinc-500 truncate block">{item.note || '—'}</span>
          )}
        </div>

        {/* Assignee */}
        <div className="shrink-0">
          {editMode ? (
            <input type="text" defaultValue={item.assignee} onBlur={e => handleFieldChange(item.id, 'assignee', e.target.value)}
              className="bg-transparent border-b border-white/10 text-[10px] font-black text-zinc-300 uppercase outline-none py-0.5 focus:border-[#0056B3] w-full" placeholder="Assignee" />
          ) : (
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider truncate block">{item.assignee || '—'}</span>
          )}
        </div>

        {/* Transport */}
        <div className="shrink-0">
          {editMode ? (
            <input type="text" defaultValue={item.transport} onBlur={e => handleFieldChange(item.id, 'transport', e.target.value)}
              className="bg-transparent border-b border-white/10 text-[10px] font-black text-zinc-300 uppercase outline-none py-0.5 focus:border-[#0056B3] w-full" placeholder="Transport" />
          ) : (
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider truncate block">{item.transport || '—'}</span>
          )}
        </div>

        {/* Status + Delete */}
        <div className="flex items-center justify-end gap-2">
          {editMode && (
            <button onClick={() => removeItem(item.id)} className="w-6 h-6 rounded bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
              <i className="fa-solid fa-trash text-[8px]" />
            </button>
          )}
          <button
            onClick={() => cycleStatus(item.id, item.status)}
            className={\`h-7 px-3 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all active:scale-95 whitespace-nowrap \${
              item.status === 'DONE'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : item.status === 'IN_PROGRESS'
                ? 'bg-[#0056B3]/20 text-[#4da3ff] border-[#0056B3]/30'
                : 'bg-zinc-800/50 text-zinc-500 border-zinc-700/50'
            }\`}
          >
            {getStatusLabel(item.status)}
          </button>
        </div>
      </div>
    </div>
  );
}
`;

content = content.replace("export default function EventSchedulePage", `
${sortableRowCode}

export default function EventSchedulePage`);

// Add sensors to main component
content = content.replace("  const [project, setProject] = useState<any>(null);", `  const [project, setProject] = useState<any>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const [activeId, setActiveId] = useState<string | null>(null);
`);

// Add onDrag logic
content = content.replace("  const addItem = async () => {", `  const handleDragStart = (event: any) => {
    if (!editMode) return;
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event: any) => {
    setActiveId(null);
    if (!editMode) return;
    const { active, over } = event;
    if (!over) return;

    if (over.id.toString().length === 10) {
      // Dragged onto a calendar date
      const targetDate = over.id as string;
      if (active.id !== over.id) {
        const itemToMove = schedule.find(s => s.id === active.id);
        if (itemToMove && itemToMove.date !== targetDate) {
          const targetItems = schedule.filter(s => s.date === targetDate);
          const nextOrder = targetItems.length > 0 ? Math.max(...targetItems.map(t => t.sort_order)) + 10 : 0;
          setSchedule(prev => prev.map(item => item.id === active.id ? { ...item, date: targetDate, sort_order: nextOrder } : item));
          await supabase.from('schedule_items').update({ date: targetDate, sort_order: nextOrder }).eq('id', active.id);
        }
      }
      return;
    }

    if (active.id !== over.id) {
      setSchedule((items) => {
        const displayedItems = items.filter(s => s.date === selectedDate).sort((a, b) => a.sort_order - b.sort_order);
        const oldIndex = displayedItems.findIndex(i => i.id === active.id);
        const newIndex = displayedItems.findIndex(i => i.id === over.id);
        
        const newDisplayed = arrayMove(displayedItems, oldIndex, newIndex);
        
        // Re-assign sort_orders
        newDisplayed.forEach((item, index) => {
          item.sort_order = index * 10;
        });

        // Update DB
        newDisplayed.forEach(async (item) => {
          await supabase.from('schedule_items').update({ sort_order: item.sort_order }).eq('id', item.id);
        });

        // Merge back into main schedule state
        const updatedSchedule = items.map(item => {
          const updated = newDisplayed.find(d => d.id === item.id);
          return updated ? updated : item;
        });
        
        return updatedSchedule;
      });
    }
  };

  const addItem = async () => {`);

// Wrap with DndContext
content = content.replace("        {/* ── Main content: Calendar + Day View ── */}", `        {/* ── Main content: Calendar + Day View ── */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>`);
content = content.replace("      </div>\n\n      <style jsx global>", `      </DndContext>\n      </div>\n\n      <style jsx global>`);

// Replace calendar days mapping
content = content.replace(/<button[\s\S]*?onClick=\{\(\) => setSelectedDate\(dateString\)\}[\s\S]*?className=\{`h-10 rounded-xl[\s\S]*?<\/button>/g, `
                    <DroppableDayButton
                      key={dateString}
                      dateString={dateString}
                      isSelected={isSelected}
                      hasTasks={hasTasks}
                      allDone={allDone}
                      day={day}
                      onClick={() => setSelectedDate(dateString)}
                    />`);

// Wrap displayedSchedule.map with SortableContext
const mapRegex = /<div\s+key=\{item\.id\}[\s\S]*?className=\{`group grid grid-cols-\[130px_1\.5fr_1fr_100px_100px_110px\][\s\S]*?<\/div>\s*<\/div>\s*\)\)/g;
content = content.replace(mapRegex, `<SortableContext items={displayedSchedule.map(s => s.id)} strategy={verticalListSortingStrategy}>
                  {displayedSchedule.map((item) => (
                    <SortableScheduleRow
                      key={item.id}
                      item={item}
                      editMode={editMode}
                      handleFieldChange={handleFieldChange}
                      removeItem={removeItem}
                      cycleStatus={cycleStatus}
                      getStatusLabel={getStatusLabel}
                    />
                  ))}
                </SortableContext>
                <DragOverlay>
                  {activeId ? (
                    <div className="bg-zinc-900 border border-[#0056B3] rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] opacity-90 scale-105" style={{ padding: '0' }}>
                      <SortableScheduleRow
                        item={schedule.find(s => s.id === activeId)}
                        editMode={editMode}
                        handleFieldChange={() => {}}
                        removeItem={() => {}}
                        cycleStatus={() => {}}
                        getStatusLabel={getStatusLabel}
                      />
                    </div>
                  ) : null}
                </DragOverlay>`);

// Also change table header to accommodate the grab handle if editMode
content = content.replace(/<div className="grid grid-cols-\[130px_1\.5fr_1fr_100px_100px_110px\]/g, `<div className={\`flex px-4 py-2.5 text-[9px] font-black text-zinc-500 uppercase tracking-widest border-b border-white/5 bg-zinc-900\`}>
                  {editMode && <div className="w-6 mr-3 shrink-0"></div>}
                  <div className="flex-1 grid grid-cols-[130px_1.5fr_1fr_100px_100px_110px] gap-0">`);

content = content.replace(/<div>Status<\/div>\s*<\/div>/g, `  <div className="text-right">Status</div>
                  </div>
                </div>`);

fs.writeFileSync('app/projects/[id]/schedule/page.tsx', content);
