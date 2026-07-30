const fs = require('fs');

let content = fs.readFileSync('app/projects/[id]/schedule/page.tsx', 'utf8');

// Fix the mutation bug in handleDragEnd
content = content.replace(`        const newDisplayed = arrayMove(displayedItems, oldIndex, newIndex);
        
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
        
        return updatedSchedule;`, `        const newDisplayed = arrayMove(displayedItems, oldIndex, newIndex).map((item, index) => ({
          ...item,
          sort_order: index * 10
        }));
        
        // Update DB
        newDisplayed.forEach(async (item) => {
          await supabase.from('schedule_items').update({ sort_order: item.sort_order }).eq('id', item.id);
        });

        // Merge back into main schedule state
        return items.map(item => {
          const updated = newDisplayed.find(d => d.id === item.id);
          return updated ? updated : item;
        });`);

fs.writeFileSync('app/projects/[id]/schedule/page.tsx', content);
